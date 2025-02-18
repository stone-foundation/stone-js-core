[**Core Documentation v0.0.4**](../../README.md)

***

[Core Documentation](../../modules.md) / [declarations](../README.md) / KernelResolver

# Type Alias: KernelResolver()\<TEvent, UResponse\>

> **KernelResolver**\<`TEvent`, `UResponse`\>: (`blueprint`) => [`LifecycleAdapterEventHandler`](../interfaces/LifecycleAdapterEventHandler.md)\<`TEvent`, `UResponse`\>

Defined in: [core/src/declarations.ts:544](https://github.com/stonemjs/core/blob/8c14a336c794eb98d8513b950cb1c2786962eaaf/src/declarations.ts#L544)

KernelResolver Type.

Represents a function that resolves a lifecycle event handler based on the provided blueprint.

## Type Parameters

• **TEvent** *extends* [`IncomingEvent`](../../events/IncomingEvent/classes/IncomingEvent.md)

• **UResponse** *extends* [`OutgoingResponse`](../../events/OutgoingResponse/classes/OutgoingResponse.md)

## Parameters

### blueprint

[`IBlueprint`](IBlueprint.md)

The application blueprint.

## Returns

[`LifecycleAdapterEventHandler`](../interfaces/LifecycleAdapterEventHandler.md)\<`TEvent`, `UResponse`\>

The lifecycle event handler.
