[**Core Documentation v0.0.4**](../../../README.md)

***

[Core Documentation](../../../modules.md) / [decorators/Service](../README.md) / Service

# Function: Service()

> **Service**\<`T`\>(`options`): `ClassDecorator`

Defined in: [core/src/decorators/Service.ts:42](https://github.com/stonemjs/core/blob/93efe04ef1a71ad6f49c3b315da54d45ace50f23/src/decorators/Service.ts#L42)

Service decorator to mark a class as a service and automatically bind it to the container.

This decorator is useful for marking classes that should be treated as services by the Stone.js framework,
making them easily injectable and manageable by the service container.

## Type Parameters

• **T** *extends* [`ClassType`](../../../declarations/type-aliases/ClassType.md) = [`ClassType`](../../../declarations/type-aliases/ClassType.md)

## Parameters

### options

`Partial`\<[`ServiceOptions`](../interfaces/ServiceOptions.md)\> = `{}`

The configuration options for the service, including singleton and alias settings.

## Returns

`ClassDecorator`

A decorator function to set metadata on the target class.

## Example

```typescript
@Service({ singleton: true, alias: 'MyService' })
class MyService {
  // Service class logic here.
}
```
