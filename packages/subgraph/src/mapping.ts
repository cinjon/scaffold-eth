/// <reference types="node" />

import { BigInt, Address } from "@graphprotocol/graph-ts"
import {
  Unit4,
  Transfer
} from "../generated/Unit4/Unit4"
import { Balance, Unit, User, UserUnit } from "../generated/schema"

export function handleTransfer(event: Transfer): void {
  let fromAddress = event.params.from;
  let fromString = fromAddress.toHexString();
  let toString = event.params.to.toHexString();
  let amount = event.params.value;
  // How do i get what type of token is this transfer...?
  // Do we need to override Transfer(...)?

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

  let fromUserUnit = UserUnit.load(fromUserUnitID);
  let fromUser = User.load(fromString);

  let updateFrom = false;
  if (!(fromAddress.toI32() == 0)) {
    // We are not minting.
    fromUser.balance -= amount;
    fromUserUnit.balance -= amount;    
    updateFrom = true;
  } 
  
  let toUserUnit = UserUnit.load(toUserUnitID);
  let toUser = User.load(toString);
  if (toUser == null) {
    toUser = new User(toString);
    toUser.address = event.params.to;
    toUser.createdAt = event.block.timestamp;
    toUser.balance = BigInt.fromI32(0);
  }
  toUser = toUser as User;
  unit = unit as Unit;
  
  if (toUserUnit == null) {
    toUserUnit = new UserUnit(toUserUnitID);
    toUserUnit.user = toString; //  <User> toUser;
    toUserUnit.unit = transferAddressString; // <Unit> unit;
    toUserUnit.balance = BigInt.fromI32(0);
  }
  toUserUnit.balance += amount;  

  toUser.balance += amount;
  if (updateFrom) {
    fromUser.save();
    fromUserUnit.save();
  }
  toUser.save();
  toUserUnit.save();
  unit.save();
}

