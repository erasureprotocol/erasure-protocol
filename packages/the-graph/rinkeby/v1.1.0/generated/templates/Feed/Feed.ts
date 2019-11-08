// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.

import {
  EthereumCall,
  EthereumEvent,
  SmartContract,
  EthereumValue,
  JSONValue,
  TypedMap,
  Entity,
  EthereumTuple,
  Bytes,
  Address,
  BigInt,
  CallResult
} from "@graphprotocol/graph-ts";

export class Initialized extends EthereumEvent {
  get params(): Initialized__Params {
    return new Initialized__Params(this);
  }
}

export class Initialized__Params {
  _event: Initialized;

  constructor(event: Initialized) {
    this._event = event;
  }

  get operator(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get multihash(): Bytes {
    return this._event.parameters[1].value.toBytes();
  }

  get metadata(): Bytes {
    return this._event.parameters[2].value.toBytes();
  }
}

export class MetadataSet extends EthereumEvent {
  get params(): MetadataSet__Params {
    return new MetadataSet__Params(this);
  }
}

export class MetadataSet__Params {
  _event: MetadataSet;

  constructor(event: MetadataSet) {
    this._event = event;
  }

  get metadata(): Bytes {
    return this._event.parameters[0].value.toBytes();
  }
}

export class OperatorUpdated extends EthereumEvent {
  get params(): OperatorUpdated__Params {
    return new OperatorUpdated__Params(this);
  }
}

export class OperatorUpdated__Params {
  _event: OperatorUpdated;

  constructor(event: OperatorUpdated) {
    this._event = event;
  }

  get operator(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get status(): boolean {
    return this._event.parameters[1].value.toBoolean();
  }
}

export class HashFormatSet extends EthereumEvent {
  get params(): HashFormatSet__Params {
    return new HashFormatSet__Params(this);
  }
}

export class HashFormatSet__Params {
  _event: HashFormatSet;

  constructor(event: HashFormatSet) {
    this._event = event;
  }

  get hashFunction(): i32 {
    return this._event.parameters[0].value.toI32();
  }

  get digestSize(): i32 {
    return this._event.parameters[1].value.toI32();
  }
}

export class HashSubmitted extends EthereumEvent {
  get params(): HashSubmitted__Params {
    return new HashSubmitted__Params(this);
  }
}

export class HashSubmitted__Params {
  _event: HashSubmitted;

  constructor(event: HashSubmitted) {
    this._event = event;
  }

  get hash(): Bytes {
    return this._event.parameters[0].value.toBytes();
  }
}

export class Feed extends SmartContract {
  static bind(address: Address): Feed {
    return new Feed("Feed", address);
  }

  getCreator(): Address {
    let result = super.call("getCreator", []);

    return result[0].toAddress();
  }

  try_getCreator(): CallResult<Address> {
    let result = super.tryCall("getCreator", []);
    if (result.reverted) {
      return new CallResult();
    }
    let value = result.value;
    return CallResult.fromValue(value[0].toAddress());
  }

  isActiveOperator(caller: Address): boolean {
    let result = super.call("isActiveOperator", [
      EthereumValue.fromAddress(caller)
    ]);

    return result[0].toBoolean();
  }

  try_isActiveOperator(caller: Address): CallResult<boolean> {
    let result = super.tryCall("isActiveOperator", [
      EthereumValue.fromAddress(caller)
    ]);
    if (result.reverted) {
      return new CallResult();
    }
    let value = result.value;
    return CallResult.fromValue(value[0].toBoolean());
  }

  isOperator(caller: Address): boolean {
    let result = super.call("isOperator", [EthereumValue.fromAddress(caller)]);

    return result[0].toBoolean();
  }

  try_isOperator(caller: Address): CallResult<boolean> {
    let result = super.tryCall("isOperator", [
      EthereumValue.fromAddress(caller)
    ]);
    if (result.reverted) {
      return new CallResult();
    }
    let value = result.value;
    return CallResult.fromValue(value[0].toBoolean());
  }

  getFactory(): Address {
    let result = super.call("getFactory", []);

    return result[0].toAddress();
  }

  try_getFactory(): CallResult<Address> {
    let result = super.tryCall("getFactory", []);
    if (result.reverted) {
      return new CallResult();
    }
    let value = result.value;
    return CallResult.fromValue(value[0].toAddress());
  }

  hasActiveOperator(): boolean {
    let result = super.call("hasActiveOperator", []);

    return result[0].toBoolean();
  }

  try_hasActiveOperator(): CallResult<boolean> {
    let result = super.tryCall("hasActiveOperator", []);
    if (result.reverted) {
      return new CallResult();
    }
    let value = result.value;
    return CallResult.fromValue(value[0].toBoolean());
  }

  getOperator(): Address {
    let result = super.call("getOperator", []);

    return result[0].toAddress();
  }

  try_getOperator(): CallResult<Address> {
    let result = super.tryCall("getOperator", []);
    if (result.reverted) {
      return new CallResult();
    }
    let value = result.value;
    return CallResult.fromValue(value[0].toAddress());
  }

  isCreator(caller: Address): boolean {
    let result = super.call("isCreator", [EthereumValue.fromAddress(caller)]);

    return result[0].toBoolean();
  }

  try_isCreator(caller: Address): CallResult<boolean> {
    let result = super.tryCall("isCreator", [
      EthereumValue.fromAddress(caller)
    ]);
    if (result.reverted) {
      return new CallResult();
    }
    let value = result.value;
    return CallResult.fromValue(value[0].toBoolean());
  }
}

export class InitializeCall extends EthereumCall {
  get inputs(): InitializeCall__Inputs {
    return new InitializeCall__Inputs(this);
  }

  get outputs(): InitializeCall__Outputs {
    return new InitializeCall__Outputs(this);
  }
}

export class InitializeCall__Inputs {
  _call: InitializeCall;

  constructor(call: InitializeCall) {
    this._call = call;
  }

  get operator(): Address {
    return this._call.inputValues[0].value.toAddress();
  }

  get multihash(): Bytes {
    return this._call.inputValues[1].value.toBytes();
  }

  get metadata(): Bytes {
    return this._call.inputValues[2].value.toBytes();
  }
}

export class InitializeCall__Outputs {
  _call: InitializeCall;

  constructor(call: InitializeCall) {
    this._call = call;
  }
}

export class SubmitHashCall extends EthereumCall {
  get inputs(): SubmitHashCall__Inputs {
    return new SubmitHashCall__Inputs(this);
  }

  get outputs(): SubmitHashCall__Outputs {
    return new SubmitHashCall__Outputs(this);
  }
}

export class SubmitHashCall__Inputs {
  _call: SubmitHashCall;

  constructor(call: SubmitHashCall) {
    this._call = call;
  }

  get multihash(): Bytes {
    return this._call.inputValues[0].value.toBytes();
  }
}

export class SubmitHashCall__Outputs {
  _call: SubmitHashCall;

  constructor(call: SubmitHashCall) {
    this._call = call;
  }
}

export class SetMetadataCall extends EthereumCall {
  get inputs(): SetMetadataCall__Inputs {
    return new SetMetadataCall__Inputs(this);
  }

  get outputs(): SetMetadataCall__Outputs {
    return new SetMetadataCall__Outputs(this);
  }
}

export class SetMetadataCall__Inputs {
  _call: SetMetadataCall;

  constructor(call: SetMetadataCall) {
    this._call = call;
  }

  get metadata(): Bytes {
    return this._call.inputValues[0].value.toBytes();
  }
}

export class SetMetadataCall__Outputs {
  _call: SetMetadataCall;

  constructor(call: SetMetadataCall) {
    this._call = call;
  }
}

export class TransferOperatorCall extends EthereumCall {
  get inputs(): TransferOperatorCall__Inputs {
    return new TransferOperatorCall__Inputs(this);
  }

  get outputs(): TransferOperatorCall__Outputs {
    return new TransferOperatorCall__Outputs(this);
  }
}

export class TransferOperatorCall__Inputs {
  _call: TransferOperatorCall;

  constructor(call: TransferOperatorCall) {
    this._call = call;
  }

  get operator(): Address {
    return this._call.inputValues[0].value.toAddress();
  }
}

export class TransferOperatorCall__Outputs {
  _call: TransferOperatorCall;

  constructor(call: TransferOperatorCall) {
    this._call = call;
  }
}

export class RenounceOperatorCall extends EthereumCall {
  get inputs(): RenounceOperatorCall__Inputs {
    return new RenounceOperatorCall__Inputs(this);
  }

  get outputs(): RenounceOperatorCall__Outputs {
    return new RenounceOperatorCall__Outputs(this);
  }
}

export class RenounceOperatorCall__Inputs {
  _call: RenounceOperatorCall;

  constructor(call: RenounceOperatorCall) {
    this._call = call;
  }
}

export class RenounceOperatorCall__Outputs {
  _call: RenounceOperatorCall;

  constructor(call: RenounceOperatorCall) {
    this._call = call;
  }
}
