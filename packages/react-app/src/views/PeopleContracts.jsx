// This view shows all the addresses that are bijected to people. Examples are the creator* addresses and the admin 
// address. It shows all of the coins they hold as well as their unclaimed airdrops. 
// If they can trigger an airdrop, then it allows them to do that.


import { SyncOutlined } from "@ant-design/icons";
import { utils } from "ethers";
import { Button, Card, DatePicker, Divider, Input, List, Progress, Slider, Spin, Switch } from "antd";
import React, { useState } from "react";
import { Address, Balance, TokenBalance } from "../components";
import { concat } from "@apollo/client";


export default function PeopleContracts({
  address,
  mainnetProvider,
  localProvider,
  readContracts,
  blockExplorer,
  userSigner,
  peopleAddresses,
}) {    
  const orderedContracts = Object.entries(readContracts).sort((a, b) => a[0].localeCompare(b[0]));
  const tables = orderedContracts.map(inorganic => {      
    const orderedAddresses = peopleAddresses.map(
          contractArr => {
            return (
            <div key={contractArr[0]}>
              <Address address={contractArr[1]} name={contractArr[0]} ensProvider={localProvider} />
              <Balance address={contractArr[1]} provider={localProvider} />
              <TokenBalance address={contractArr[1]} contracts={readContracts} name={inorganic[0]}/>
            </div>
          )
        }
    )
    return <div><h2>{inorganic[0]}</h2>{orderedAddresses}</div>
  })
  return (
    <div>
        {tables}
    </div>
  );
}
