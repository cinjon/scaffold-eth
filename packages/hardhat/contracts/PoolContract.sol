// contracts/RCoin.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";


contract PoolCoin is Ownable, ERC20 {
    constructor(string memory name, string memory symbol) Ownable() ERC20(name, symbol) public {
        _mint(msg.sender, 1000);
    }
}
