import {
  isEmpty,
  isFunctionModule,
  isMetaClassModule,
  isMetaFactoryModule,
  isMetaFunctionModule
} from './utils'
import {
  MetaPipe,
  Pipeline,
  MixedPipe,
  isClassPipe,
  isAliasPipe,
  PipeInstance,
  isConstructor,
  isFactoryPipe,
  PipelineOptions
} from '@stone-js/pipeline'
import {
  IBlueprint,
  IErrorHandler,
  IEventHandler,
  KernelHookType,
  IConfiguration,
  KernelHookName,
  IServiceProvider,
  ResponseResolver,
  MetaErrorHandler,
  MixedEventHandler,
  EventHandlerClass,
  ConfigurationClass,
  IErrorHandlerClass,
  MixedConfiguration,
  FactoryEventHandler,
  FactoryErrorHandler,
  MixedServiceProvider,
  IServiceProviderClass,
  FunctionalEventHandler,
  FunctionalErrorHandler,
  FactoryServiceProvider,
  ResponseResolverOptions,
  FunctionalConfiguration,
  ILifecycleAdapterEventHandler
} from './declarations'
import { Logger } from './Logger'
import { Config } from '@stone-js/config'
import { EventEmitter } from './events/EventEmitter'
import { IncomingEvent } from './events/IncomingEvent'
import { Container } from '@stone-js/service-container'
import { OutgoingResponse } from './events/OutgoingResponse'
import { InitializationError } from './errors/InitializationError'

/**
 * KernelOptions.
 */
export interface KernelOptions {
  container: Container
  blueprint: IBlueprint
  eventEmitter: EventEmitter
}

/**
 * Class representing a Kernel.
 *
 * The Kernel class is responsible for managing the main lifecycle of the application, including middleware
 * registration and provider management. It manages the initialization, registration, and booting of the
 * components required for a fully functional application.
 *
 * @author Mr. Stone <evensstone@gmail.com>
 */
export class Kernel<
  IncomingEventType extends IncomingEvent,
  OutgoingResponseType extends OutgoingResponse
> implements ILifecycleAdapterEventHandler<IncomingEventType, OutgoingResponseType> {
  private readonly container: Container
  private readonly blueprint: IBlueprint
  private readonly eventEmitter: EventEmitter
  private readonly providers: Set<IServiceProvider>
  private readonly registeredProviders: Set<string>
  private readonly hooks: KernelHookType<IncomingEventType, OutgoingResponseType>
  private readonly middleware: Array<MixedPipe<IncomingEventType, OutgoingResponseType>>
  private readonly resolvedErrorHandlers: Record<string, IErrorHandler<IncomingEventType, OutgoingResponseType>>

  private resolvedEventHandler?: IEventHandler<IncomingEventType, OutgoingResponseType>

  /**
   * Create a Kernel.
   *
   * @param options - Kernel configuration options.
   * @returns A new Kernel instance.
   */
  public static create<
    IncomingEventType extends IncomingEvent,
    OutgoingResponseType extends OutgoingResponse
  >(options: KernelOptions): Kernel<IncomingEventType, OutgoingResponseType> {
    return new this(options)
  }

  /**
   * Create a Kernel.
   *
   * @param options - Kernel configuration options.
   */
  private constructor ({ blueprint, container, eventEmitter }: KernelOptions) {
    this.validateOptions({ blueprint, container, eventEmitter })

    this.providers = new Set()
    this.blueprint = blueprint
    this.container = container
    this.resolvedErrorHandlers = {}
    this.eventEmitter = eventEmitter
    this.registeredProviders = new Set()
    this.hooks = blueprint.get('stone.lifecycleHooks', {})
    this.middleware = blueprint.get('stone.kernel.skipMiddleware', false) ? [] : blueprint.get('stone.kernel.middleware', [])
  }

  /**
   * Populate the context with the given bindings.
   * The context here is the service container.
   * Invoke subsequent hooks.
   * Note: Execution order is important here, never change it.
   */
  public async onInit (): Promise<void> {
    this.registerBaseBindings()

    await this.runLiveConfigurations()
    await this.resolveProviders()
    await this.registerProviders()
    await this.executeHooks('onInit')
  }

  /**
   * Boot the providers.
   * Invoke subsequent hooks.
   * Note: Execution order is important here, never change it.
   */
  public async onHandlingEvent (): Promise<void> {
    await this.bootProviders()
    await this.executeHooks('onHandlingEvent')
  }

  /**
   * Handle Stone IncomingEvent.
   *
   * @param event - The Stone incoming event to handle.
   * @returns The Stone outgoing response.
   */
  public async handle (event: IncomingEventType): Promise<OutgoingResponseType> {
    return await this.sendEventThroughDestination(event)
  }

  /**
   * Invoke subsequent hooks after handling the event.
   */
  public async onEventHandled (): Promise<void> {
    await this.executeHooks('onEventHandled')
  }

  /**
   * Invoke subsequent hooks on termination.
   */
  public async onTerminate (): Promise<void> {
    await this.executeHooks('onTerminate')
  }

  /**
   * Send event to the destination.
   *
   * @param event - The incoming event.
   * @returns The prepared response.
   * @throws InitializationError if no IncomingEvent is provided.
   */
  private async sendEventThroughDestination (event: IncomingEventType): Promise<OutgoingResponseType> {
    if (isEmpty(event)) { throw new InitializationError('No IncomingEvent provided.') }
    if (isFunctionModule(event.clone)) { this.container.instance('originalEvent', event.clone()) }

    this.container.instance('event', event).instance('request', event)

    try {
      const response = await Pipeline
        .create(this.makePipelineOptions())
        .send(event)
        .through(...this.middleware)
        .then(async (ev) => await this.handleEvent(ev))
      // We also need to prepare the response here
      // because the middleware might return a non-prepared response.
      return await this.prepareResponse(event, response)
    } catch (error: any) {
      return await this.handleError(error, event)
    }
  }

  /**
   * Handle the event.
   *
   * @param event - The incoming event.
   * @returns The outgoing response.
   */
  private async handleEvent (event: IncomingEventType): Promise<OutgoingResponseType> {
    await this.executeHooks('onExecutingEventHandler')

    try {
      const response = await this.resolveEventHandler().handle(event)
      // We need to prepare the response here
      // because the response middleware might need a prepared response.
      return await this.prepareResponse(event, response)
    } catch (error: any) {
      return await this.handleError(error, event)
    }
  }

  /**
   * Handle error.
   *
   * @param error - The error to handle.
   * @param event - The incoming event.
   * @returns The outgoing response.
   */
  private async handleError (error: Error, event: IncomingEventType): Promise<OutgoingResponseType> {
    this.container.instance('error', error)

    await this.executeHooks('onExecutingErrorHandler')

    const response = await this.resolveErrorHandler(error).handle(error, event)

    return await this.prepareResponse(event, response)
  }

  /**
   * Prepare response before sending
   *
   * @param event - The Kernel event.
   * @param response - The response to prepare.
   * @returns The prepared response.
   */
  private async prepareResponse (event: IncomingEventType, response: unknown): Promise<OutgoingResponseType> {
    const validatedResponse = await this.validateAndResolveResponse(response)

    if (validatedResponse.isPrepared) { return validatedResponse }

    this.container.instance('response', validatedResponse)

    await this.executeHooks('onPreparingResponse')

    const preparedResponse = await validatedResponse.prepare(event, this.container)

    await this.executeHooks('onResponsePrepared')

    this.container.instance('response', preparedResponse)

    return preparedResponse
  }

  /**
   * Creates pipeline options for the Kernel.
   *
   * @returns The pipeline options for configuring middleware.
   */
  private makePipelineOptions (): PipelineOptions<IncomingEventType, OutgoingResponseType> {
    return {
      hooks: {
        onPipeProcessed: this.hooks.onKernelMiddlewareProcessed ?? [],
        onProcessingPipe: this.hooks.onProcessingKernelMiddleware ?? []
      },
      resolver: (metaPipe: MetaPipe<IncomingEventType, OutgoingResponseType>) => {
        if (isClassPipe(metaPipe) || isAliasPipe(metaPipe)) {
          return this.container.resolve<PipeInstance<IncomingEventType, OutgoingResponseType>>(metaPipe.module, true)
        } else if (isFactoryPipe(metaPipe)) {
          return metaPipe.module(this.container)
        }
      }
    }
  }

  /**
   * Registers the base bindings into the container.
   *
   * @private
   * @returns The Kernel instance.
   */
  private registerBaseBindings (): this {
    this.container
      .instance(Config, this.blueprint)
      .instance(Container, this.container)
      .instance(Logger, Logger.getInstance())
      .instance(EventEmitter, this.eventEmitter)
      .alias(Config, 'config')
      .alias(Logger, 'logger')
      .alias(Config, 'blueprint')
      .alias(Container, 'container')
      .alias(EventEmitter, 'events')
      .alias(EventEmitter, 'eventEmitter')

    return this
  }

  /**
   * Resolves the app event handler from the container.
   *
   * @returns The resolved event handler or undefined if not found.
   * @throws InitializationError if no event handler is found.
   */
  private resolveEventHandler (): IEventHandler<IncomingEventType, OutgoingResponseType> {
    if (isEmpty(this.resolvedEventHandler)) {
      const mixedEventHandler = this.blueprint.get<MixedEventHandler<IncomingEventType, OutgoingResponseType>>(
        'stone.kernel.eventHandler'
      )

      if (isMetaClassModule<EventHandlerClass<IncomingEventType, OutgoingResponseType>>(mixedEventHandler)) {
        this.resolvedEventHandler = this.container.resolve(mixedEventHandler.module, true)
      } else if (isMetaFactoryModule<FactoryEventHandler<IncomingEventType, OutgoingResponseType>>(mixedEventHandler)) {
        this.resolvedEventHandler = { handle: mixedEventHandler.module(this.container) }
      } else if (isMetaFunctionModule<FunctionalEventHandler<IncomingEventType, OutgoingResponseType>>(mixedEventHandler)) {
        this.resolvedEventHandler = { handle: mixedEventHandler.module }
      } else if (isFunctionModule<FunctionalEventHandler<IncomingEventType, OutgoingResponseType>>(mixedEventHandler)) {
        this.resolvedEventHandler = { handle: mixedEventHandler }
      } else {
        throw new InitializationError('No event handler has been provided.')
      }
    }

    return this.resolvedEventHandler
  }

  /**
   * Get the error handler for the given error.
   *
   * @param error - The error to get the handler for.
   * @returns The error handler.
   * @throws Error if no error handler is found.
   */
  private resolveErrorHandler (error: Error): IErrorHandler<IncomingEventType, OutgoingResponseType> {
    if (isEmpty(this.resolvedErrorHandlers[error.name])) {
      const metaErrorHandler = this.blueprint.get<MetaErrorHandler<IncomingEventType, OutgoingResponseType>>(
        `stone.kernel.errorHandlers.${error.name}`,
        this.blueprint.get<MetaErrorHandler<IncomingEventType, OutgoingResponseType>>(
          'stone.kernel.errorHandlers.default',
          {} as any
        )
      )

      if (isMetaClassModule<IErrorHandlerClass>(metaErrorHandler)) {
        this.resolvedErrorHandlers[error.name] = this.container.resolve<
        IErrorHandler<IncomingEventType, OutgoingResponseType>
        >(metaErrorHandler.module, true)
      } else if (isMetaFactoryModule<FactoryErrorHandler<IncomingEventType, OutgoingResponseType>>(metaErrorHandler)) {
        this.resolvedErrorHandlers[error.name] = { handle: metaErrorHandler.module(this.container) }
      } else if (isMetaFunctionModule<FunctionalErrorHandler<IncomingEventType, OutgoingResponseType>>(metaErrorHandler)) {
        this.resolvedErrorHandlers[error.name] = { handle: metaErrorHandler.module }
      } else {
        throw error
      }
    }

    return this.resolvedErrorHandlers[error.name]
  }

  /**
   * Resolves all providers defined in the blueprint.
   *
   * @private
   * @returns The Kernel instance.
   */
  private async resolveProviders (): Promise<void> {
    const providers = this.blueprint.get<MixedServiceProvider[]>('stone.providers', [])

    for (const provider of providers) {
      let resolvedProvider: IServiceProvider | undefined

      if (isMetaClassModule<IServiceProviderClass>(provider)) {
        resolvedProvider = this.container.resolve<IServiceProvider>(provider.module, true)
      } else if (isMetaFactoryModule<FactoryServiceProvider>(provider)) {
        resolvedProvider = provider.module(this.container)
      } else if (isConstructor<IServiceProviderClass>(provider)) {
        resolvedProvider = this.container.resolve<IServiceProvider>(provider, true)
      }

      if (resolvedProvider !== undefined && (isEmpty(resolvedProvider.mustSkip) || !(await resolvedProvider.mustSkip()))) {
        this.providers.add(resolvedProvider)
      }
    }
  }

  /**
   * Registers the providers.
   *
   * @private
   * @returns A promise that resolves when all providers are registered.
   */
  private async registerProviders (): Promise<void> {
    for (const provider of this.providers) {
      if (isEmpty(provider.register) || this.registeredProviders.has(provider.constructor.name)) { continue }
      await provider.register()
      this.registeredProviders.add(provider.constructor.name)
    }
  }

  /**
   * Boots the providers.
   *
   * @private
   * @returns A promise that resolves when all providers have been booted.
   */
  private async bootProviders (): Promise<void> {
    for (const provider of this.providers) {
      await provider.boot?.()
    }
  }

  /**
   * Validate and resolve the response.
   *
   * @param returnedValue - The returned value that might be a response.
   * @returns The validated and resolved response.
   * @throws InitializationError if the response is invalid or undefined.
   */
  private async validateAndResolveResponse (returnedValue: unknown): Promise<OutgoingResponseType> {
    const responseResolver = this.blueprint.get<ResponseResolver<OutgoingResponseType>>('stone.kernel.responseResolver')

    if (isEmpty(returnedValue)) {
      if (isEmpty(responseResolver)) {
        throw new InitializationError('No response was returned')
      }
      return await responseResolver({})
    }

    if (!(returnedValue instanceof OutgoingResponse)) {
      if (isEmpty(responseResolver)) {
        throw new InitializationError('Returned response must be an instance of `OutgoingResponse` or a subclass of it.')
      }
      const valueOptions = returnedValue as ResponseResolverOptions
      const options = (
        isEmpty(valueOptions?.statusCode)
          ? { content: returnedValue, statusCode: 200 }
          : returnedValue
      ) as ResponseResolverOptions
      return await responseResolver(options)
    }

    return returnedValue as OutgoingResponseType
  }

  /**
   * Run live configurations.
   * Live configurations are loaded at each request.
   */
  private async runLiveConfigurations (): Promise<void> {
    const liveConfigurations = this.blueprint.get<MixedConfiguration[]>('stone.liveConfigurations', [])

    for (const configuration of liveConfigurations) {
      if (isMetaClassModule<ConfigurationClass>(configuration)) {
        await this.container.resolve<IConfiguration>(configuration.module).configure?.(this.blueprint)
      } else if (isFunctionModule<FunctionalConfiguration>(configuration)) {
        await configuration(this.blueprint)
      }
    }
  }

  /**
   * Execute lifecycle hooks.
   *
   * @param name - The hook's name.
   */
  private async executeHooks (name: KernelHookName): Promise<void> {
    if (
      Array.isArray(this.hooks[name]) &&
      name !== 'onKernelMiddlewareProcessed' &&
      name !== 'onProcessingKernelMiddleware'
    ) {
      for (const listener of this.hooks[name]) {
        await listener(this.container)
      }
    }
  }

  /**
   * Validate the Kernel options.
   *
   * @param options - The Kernel options to validate.
   * @throws InitializationError if the options are invalid.
   */
  private validateOptions (options: KernelOptions): void {
    if (!(options.blueprint instanceof Config)) { throw new InitializationError('Blueprint is required to create a Kernel instance.') }
    if (!(options.container instanceof Container)) { throw new InitializationError('Container is required to create a Kernel instance.') }
    if (!(options.eventEmitter instanceof EventEmitter)) { throw new InitializationError('EventEmitter is required to create a Kernel instance.') }
  }
}
