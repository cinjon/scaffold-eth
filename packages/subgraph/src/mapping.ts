/// <reference types="node" />

import { BigInt, Address } from "@graphprotocol/graph-ts"
import {
  Unit4,
  Transfer
} from "../generated/Unit4/Unit4"
import { User } from "../generated/schema"

export function handleTransfer(event: Transfer): void {
  let fromAddress = event.params.from;
  let fromString = fromAddress.toHexString();
  let toString = event.params.to.toHexString();
  let amount = event.params.value;

  let transferAddress = event.address;
  let transferAddressString = transferAddress.toHexString();

  let fromUser = User.load(fromString);
  let updateFrom = false;
  let zeroAddress = new Address(0);
  if (fromAddress != zeroAddress && fromUser != null) {
    // We are not minting.
    fromUser = fromUser as User;
    fromUser.balance = fromUser.balance.minus(amount);
    updateFrom = true;
  } 
  
  let toUser = User.load(toString);
  if (toUser == null) {
    toUser = new User(toString);
    toUser.address = event.params.to;
    toUser.createdAt = event.block.timestamp;
    toUser.balance = BigInt.fromI32(0);
  }
  toUser = toUser as User;
  
  toUser.balance = toUser.balance.plus(amount);
  if (updateFrom) {
    fromUser.save();
  }
  toUser.save();
}

