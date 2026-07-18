import {
  ListenerHandler,
  WildcardEventName,
  MixedListenerHandler,
  WildcardListenerHandler
} from '../declarations'
import { Event } from './Event'
import { isNotEmpty } from '../utils'

/**
 * EVENT_EMITTER_ALIAS.
 */
export const EVENT_EMITTER_ALIAS = 'eventEmitter'

/**
 * Class representing an EventEmitter.
 */
export class EventEmitter {
  private readonly listeners: Map<string | symbol, Array<MixedListenerHandler<any, WildcardEventName>>>

  /**
   * Create an EventEmitter.
   *
   * @returns A new EventEmitter instance.
   */
  static create (): EventEmitter {
    return new this()
  }

  /**
   * Create an EventEmitter.
   */
  constructor () {
    this.listeners = new Map()
  }

  /**
   * Registers an event listener for the given event type.
   *
   * @param event - The event name or type.
   * @param handler - The callback to invoke when the event is emitted.
   */
  on<TEvent extends Event = Event>(event: WildcardEventName, handler: MixedListenerHandler<TEvent, WildcardEventName>): this {
    const handlers = this.listeners.get(event)
    isNotEmpty<Array<MixedListenerHandler<TEvent, WildcardEventName>>>(handlers)
      ? handlers.push(handler)
      : this.listeners.set(event, [handler])

    return this
  }

  /**
   * Registers a one-shot event listener that is removed after its first invocation.
   *
   * @param event - The event name or type.
   * @param handler - The callback to invoke once when the event is emitted.
   */
  once<TEvent extends Event = Event>(event: WildcardEventName, handler: MixedListenerHandler<TEvent, WildcardEventName>): this {
    const onceHandler = (async (...args: any[]): Promise<void> => {
      this.off(event, onceHandler)
      await (handler as (...a: any[]) => unknown | Promise<unknown>)(...args)
    }) as MixedListenerHandler<TEvent, WildcardEventName>

    return this.on(event, onceHandler)
  }

  /**
   * Removes an event listener for the given event type.
   *
   * @param event - The event name or type.
   * @param handler - The callback to remove.
   */
  off<TEvent extends Event = Event>(event: WildcardEventName, handler: MixedListenerHandler<TEvent, WildcardEventName>): this {
    const handlers = this.listeners.get(event)

    if (isNotEmpty<Array<MixedListenerHandler<TEvent, WildcardEventName>>>(handlers)) {
      const index = handlers.indexOf(handler)
      if (index !== -1) { handlers.splice(index, 1) }
      if (handlers.length === 0) { this.listeners.delete(event) }
    }

    return this
  }

  /**
   * Emits an event, triggering all associated listeners.
   *
   * @param event - The event name or an instance of Event.
   * @param args - Additional arguments to pass to the listeners.
   */
  async emit<TEvent extends Event = Event>(event: string | symbol | TEvent, args?: any): Promise<void> {
    let eventName: string | symbol
    let eventPayload: TEvent | undefined

    if (event instanceof Event) {
      eventName = event.type
      eventPayload = event
    } else {
      eventName = event
      eventPayload = args
    }

    const handlers = this.listeners.get(eventName)
    const wildcardHandlers = this.listeners.get('*')

    // Listeners must fire even when no payload is provided (e.g. `emit('ready')`).
    if (isNotEmpty<Array<ListenerHandler<TEvent>>>(handlers)) {
      for (const handler of handlers.slice()) {
        await handler(eventPayload as TEvent)
      }
    }

    if (isNotEmpty<Array<WildcardListenerHandler<WildcardEventName, TEvent>>>(wildcardHandlers)) {
      for (const handler of wildcardHandlers.slice()) {
        await handler(eventName, eventPayload as TEvent)
      }
    }
  }
}
