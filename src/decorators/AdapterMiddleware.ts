import { ClassType } from '../declarations'
import { setClassMetadata } from './Metadata'
import { ADAPTER_MIDDLEWARE_KEY } from './constants'

/**
 * AdapterMiddleware options.
 *
 * This interface defines the configuration options for marking a class as middleware.
 */
export interface AdapterMiddlewareOptions {
  /**
   * The params to pass to the middleware.
   */
  params?: unknown[]

  /**
   * The execution priority of the middleware.
   */
  priority?: number

  /**
   * The platform name for which the middleware is used.
   */
  adapterAlias?: string

  /**
   * The platform name for which the middleware is used.
   */
  platform?: string
}

/**
 * AdapterMiddleware decorator to mark a class as middleware within the Stone.js framework.
 *
 * This decorator is used to customize classes as middleware, allowing them to be registered and managed
 * as part of the request/response lifecycle or other layers such as adapter, kernel, or router.
 *
 * @param options - The configuration options for the middleware, including platform, priority, singleton registration, alias, layer, and type.
 * @returns A decorator function to set metadata on the target class.
 *
 * @example
 * ```typescript
 * @AdapterMiddleware({ priority: 1, singleton: true })
 * class MyMiddleware {
 *   // AdapterMiddleware class logic here.
 * }
 * ```
 */
export const AdapterMiddleware = <T extends ClassType = ClassType>(options: AdapterMiddlewareOptions = {}): ClassDecorator => {
  return setClassMetadata<T>(ADAPTER_MIDDLEWARE_KEY, { ...options, isClass: true })
}
