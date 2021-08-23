// This view shows all the contracts that aren't bijected to people. Exampels are PoolCoin and any instance of UnitCoin.
// It shows all the coins. It shoudl also how much they own of other coins as well as unclaimed airdrops.


import { SyncOutlined } from "@ant-design/icons";
import { utils } from "ethers";
import { Button, Card, DatePicker, Divider, Input, List, Progress, Slider, Spin, Switch } from "antd";
import React, { useState } from "react";
import { Address, Balance, Contract } from "../components";

export default function InorganicContracts({
  address,
  mainnetProvider,
  localProvider,
  readContracts,
  blockExplorer,
  userSigner,
}) {

  const orderedContracts = readContracts ? Object.entries(readContracts).sort((a, b) => a[0].localeCompare(b[0])).map(
      contractArr => <div key={contractArr[0]}><Contract name={contractArr[0]} customContract={contractArr[1]} signer={userSigner} provider={localProvider} address={address} blockExplorer={blockExplorer} /><br /><br /></div>) : null

  return (
    <div>
        {orderedContracts}
    </div>
  );
}
