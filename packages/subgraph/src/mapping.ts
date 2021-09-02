/// <reference types="node" />

import { BigInt, Address } from "@graphprotocol/graph-ts"
import {
  Unit4,
  Transfer
} from "../generated/Unit4/Unit4"
import { Unit, User, UserUnit } from "../generated/schema"

export function handleTransfer(event: Transfer): void {
  let fromAddress = event.params.from;
  let fromString = fromAddress.toHexString();
  let toString = event.params.to.toHexString();
  let amount = event.params.value;

  let transferAddress = event.address;
  let transferAddressString = transferAddress.toHexString();
  let fromUserUnitID = fromString + "-" + transferAddressString;
  let toUserUnitID = toString + "-" + transferAddressString;  

  let unit = Unit.load(transferAddressString);
  if (unit == null) {
    unit = new Unit(transferAddressString);
    unit.createdAt = event.block.timestamp;
    unit.address = transferAddress;
  }
  unit = unit as Unit;

  let fromUser = User.load(fromString);
  let fromUserUnit = UserUnit.load(fromUserUnitID);

  let updateFrom = false;
  let zeroAddress = new Address(0);
  if (fromAddress != zeroAddress && fromUser != null) {
    // We are not minting.
    fromUserUnit.balance = fromUserUnit.balance.minus(amount);
    updateFrom = true;
  }
  
  let toUser = User.load(toString);
  let toUserUnit = UserUnit.load(toUserUnitID);
  if (toUser == null) {
    toUser = new User(toString);
    toUser.address = event.params.to;
    toUser.createdAt = event.block.timestamp;
  }
  toUser = toUser as User;
  
  if (toUserUnit == null) {
    toUserUnit = new UserUnit(toUserUnitID);
    toUserUnit.user = toString;
    toUserUnit.unit = transferAddressString;
    toUserUnit.balance = BigInt.fromI32(0);
  }
  toUserUnit.balance = toUserUnit.balance.plus(amount);

  if (updateFrom) {
    fromUserUnit.save();
  }
  toUser.save();
  toUserUnit.save();
  unit.save();
}

