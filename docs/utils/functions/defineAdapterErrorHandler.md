[**Core Documentation v0.0.4**](../../README.md)

***

[Core Documentation](../../modules.md) / [utils](../README.md) / defineAdapterErrorHandler

# Function: defineAdapterErrorHandler()

> **defineAdapterErrorHandler**\<`RawEventType`, `RawResponseType`, `ExecutionContextType`\>(`module`, `options`): [`MetaAdapterErrorHandler`](../../declarations/interfaces/MetaAdapterErrorHandler.md)\<`RawEventType`, `RawResponseType`, `ExecutionContextType`\>

Defined in: [core/src/utils.ts:129](https://github.com/stonemjs/core/blob/d2167ff53d508d3a75c05f0cf962180518d3e061/src/utils.ts#L129)

Defines an adapter error handler with metadata for the provided handler function.
This function allows users to define an adapter error handler with metadata.

## Type Parameters

• **RawEventType**

• **RawResponseType**

• **ExecutionContextType**

## Parameters

### module

[`AdapterErrorHandlerType`](../../declarations/type-aliases/AdapterErrorHandlerType.md)\<`RawEventType`, `RawResponseType`, `ExecutionContextType`\>

The module handler function to be defined.

### options

`Omit`\<[`MetaAdapterErrorHandler`](../../declarations/interfaces/MetaAdapterErrorHandler.md)\<`RawEventType`, `RawResponseType`, `ExecutionContextType`\>, `"module"`\>

The metadata options for the handler.

## Returns

[`MetaAdapterErrorHandler`](../../declarations/interfaces/MetaAdapterErrorHandler.md)\<`RawEventType`, `RawResponseType`, `ExecutionContextType`\>

The defined error handler with metadata.
