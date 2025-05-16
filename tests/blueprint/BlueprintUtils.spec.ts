import { getMetadata } from '../../src/decorators/Metadata'
import { IncomingEvent } from '../../src/events/IncomingEvent'
import { CONFIGURATION_KEY } from '../../src/decorators/constants'
import { isMetaClassModule, isMetaFactoryModule, isMetaFunctionModule } from '../../src/utils'
import { defineConfig, defineBlueprintMiddleware, defineStoneApp } from '../../src/blueprint/BlueprintUtils'

describe('defineStoneApp', () => {
  it('should create blueprint with function-based event handler', () => {
    const handler = vi.fn((_event: IncomingEvent) => {})

    const blueprint = defineStoneApp(handler)

    if (isMetaFunctionModule(blueprint.stone?.kernel?.eventHandler)) {
      expect(blueprint.stone?.kernel?.eventHandler?.module).toBe(handler)
      expect(blueprint.stone?.kernel?.eventHandler?.isFactory).toBe(false)
      expect(blueprint.stone?.kernel?.eventHandler?.isClass).toBe(false)
    }
  })

  it('should create blueprint with class-based event handler', () => {
    class MyHandler {
      handle (_event: IncomingEvent) {}
    }

    const blueprint = defineStoneApp(MyHandler, { isFactory: false })

    if (isMetaClassModule(blueprint.stone?.kernel?.eventHandler)) {
      expect(blueprint.stone?.kernel?.eventHandler?.module).toBe(MyHandler)
      expect(blueprint.stone?.kernel?.eventHandler?.isFactory).toBe(false)
      expect(blueprint.stone?.kernel?.eventHandler?.isClass).toBe(true)
    }
  })

  it('should create blueprint with factory-based event handler', () => {
    const factory = () => (_event: IncomingEvent) => {}

    const blueprint = defineStoneApp(factory, { isFactory: true })

    if (isMetaFactoryModule(blueprint.stone?.kernel?.eventHandler)) {
      expect(blueprint.stone?.kernel?.eventHandler?.module).toBe(factory)
      expect(blueprint.stone?.kernel?.eventHandler?.isFactory).toBe(true)
      expect(blueprint.stone?.kernel?.eventHandler?.isClass).toBe(false)
    }
  })

  it('should merge additional blueprints', () => {
    const handler = vi.fn()
    const additional = { stone: { name: 'test-app' } }

    const blueprint = defineStoneApp(handler, undefined, [additional])

    expect(blueprint.stone?.name).toBe('test-app')

    if (isMetaFunctionModule(blueprint.stone?.kernel?.eventHandler)) {
      expect(blueprint.stone?.kernel?.eventHandler?.module).toBe(handler)
    }
  })

  it('should override config kernel field', () => {
    const handler = vi.fn()
    const blueprint = defineStoneApp(handler, {
      kernel: {
        middleware: [{ module: vi.fn() }]
      }
    })

    expect(blueprint.stone?.kernel?.middleware).toHaveLength(1)

    if (isMetaFunctionModule(blueprint.stone?.kernel?.eventHandler)) {
      expect(blueprint.stone?.kernel?.eventHandler?.module).toBe(handler)
    }
  })
})

describe('defineConfig', () => {
  it('should define a class-based config from a function', async () => {
    const configure = vi.fn()
    const Config = defineConfig(configure)
    const instance = new Config()

    expect(instance.configure).toBe(configure)
    expect(instance.afterConfigure).toBeInstanceOf(Function)
    expect(async () => await instance.afterConfigure!({} as any)).not.toThrow()
    expect(getMetadata(Config, CONFIGURATION_KEY)).toEqual({ isClass: true })
  })

  it('should define a config from an object with configure and afterConfigure', async () => {
    const configure = vi.fn()
    const afterConfigure = vi.fn()
    const Config = defineConfig({ configure, afterConfigure })
    const instance = new Config()

    expect(instance.configure).toBe(configure)
    expect(instance.afterConfigure).toBe(afterConfigure)
  })

  it('should fallback to default empty configure/afterConfigure if missing', () => {
    const Config = defineConfig({})
    const instance = new Config()

    expect(async () => await instance.configure!({} as any)).not.toThrow()
    expect(async () => await instance.afterConfigure!({} as any)).not.toThrow()
  })
})

describe('defineBlueprintMiddleware', () => {
  const DummyMiddleware = vi.fn()

  it('should define function-based blueprint middleware', () => {
    const result = defineBlueprintMiddleware(DummyMiddleware)

    expect(result).toEqual({
      stone: {
        blueprint: {
          middleware: [{
            module: DummyMiddleware,
            isClass: false,
            isFactory: false
          }]
        }
      }
    })
  })

  it('should define array of function-based middleware with priority', () => {
    const another = vi.fn()
    const result = defineBlueprintMiddleware([DummyMiddleware, another], { priority: 1 })

    expect(result.stone?.blueprint?.middleware).toHaveLength(2)
    expect(result.stone?.blueprint?.middleware?.[0]).toMatchObject({
      module: DummyMiddleware,
      priority: 1,
      isClass: false,
      isFactory: false
    })
    expect(result.stone?.blueprint?.middleware?.[1]).toMatchObject({
      module: another,
      priority: 1,
      isClass: false,
      isFactory: false
    })
  })

  it('should define factory-based middleware', () => {
    const factory = () => DummyMiddleware
    const result = defineBlueprintMiddleware(factory, { isFactory: true })

    expect(result.stone?.blueprint?.middleware?.[0]).toMatchObject({
      module: factory,
      isFactory: true,
      isClass: false
    })
  })

  it('should define class-based middleware', () => {
    class ClassMiddleware {}
    const result = defineBlueprintMiddleware(ClassMiddleware, { isFactory: false })

    expect(result.stone?.blueprint?.middleware?.[0]).toMatchObject({
      module: ClassMiddleware,
      isClass: true,
      isFactory: false
    })
  })
})
