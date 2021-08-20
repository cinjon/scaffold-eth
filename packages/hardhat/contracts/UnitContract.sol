// contracts/RCoin.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract PoolCoin is ERC20 {
    constructor() ERC20("Pool", "PCO") public {
        _mint(msg.sender, 10000);
    }
}

contract PoolCoin2 is ERC20 {
    constructor(string memory name) ERC20(name, "PCO") public {
        _mint(msg.sender, 10000);
    }
}

contract UnitCoin is ERC20Burnable {
    constructor(string memory name, string memory symbol, uint256 creatorSupply, uint256 poolSupply, 
                uint256 remainingParentSupply, address admin, address pool, address creator, 
                address[] memory parentAddresses, uint256[] memory parentSupplies) ERC20(name, symbol) {
        // Mint to the creator, the parents, and the pool of which this is a part.
        _mint(creator, creatorSupply);
        _mint(pool, poolSupply);
        for (uint i=0; i < parentSupplies.length; i++) {
            _mint(parentAddresses[i], parentSupplies[i]);
        }     

        // Mint the remaining parentSupply to the admin for storing and later giving out.
        if (remainingParentSupply > 0) {
            _mint(admin, remainingParentSupply);
        }
    }
}

/**
 * @title StorageV1
 * @author Cinjon
 */
contract StorageV1 {}

// This contract corresponds to a single unit. When instantiated, it holds a UnitCoin with this contract as the owner.
// Args:
//   coinName: the name of this coin.
//   coinSymbol: the symbol of this coin.
//   publicUrl: the url where this creation lives and where we can find the publicHash.
//   publicHash: the hash that was put into the creation in order to identify it.
//   creatorName: the name of the creator, e.g. Cinjon Resnick.
//   creatorAddress: the ethereum address of the creator.
//   parentAddresses: the parent addresses, can be empty at init.
//   parentSupplies: the associated parent supplies. should be the same size as the parent Addresses;
contract UnitV1 is Ownable {
    // Identifyng info.
    string private _publicHash;
    string private _publicUrl;
    address private _creatorAddress;
    string private _creatorName;
    // TODO: Is there a set class?
    mapping(address => bool) private _parentAddresses;
    uint8 numParents = 0;

    // Standard across units.
    uint256 constant initialSupply = 10000;
    uint256 constant poolSupply = 100; // 1% to pool.
    uint256 constant maximumParentSize = 5;
    uint256 remainingParentSupply = 1000; // 10% to parents. "tithe"
    uint256 creatorSupply = initialSupply - poolSupply - remainingParentSupply;

    // Holds the coin balances of this contract in storage. Makes isReleaseFunds checking easier;
    mapping(string => uint256) private _heldCoinBalances;
    
    // The associated coin.
    UnitCoin unitCoin; 
    
    constructor(string memory coinName, string memory coinSymbol, 
                string memory publicHash, string memory publicUrl, 
                string memory creatorName, address creatorAddress,
                address adminAddress, address poolAddress,
                address[] memory parentAddresses, uint256[] memory parentSupplies) Ownable() {       
        console.log(" hi im consol logging");
        require(parentSupplies.length == parentAddresses.length, 
                "parentSupplies and parentAddresses have different lengths.");
        for (uint i=0; i < parentSupplies.length; i++) {
            remainingParentSupply -= parentSupplies[i];
            require(address(this) != parentAddresses[i], "This unit's address was listed as a parent.");
            require(creatorAddress != parentAddresses[i], "The creator address was listed as a parent.");            
        }        
        require(remainingParentSupply >= 0, "Parent coins were assigned more than the original parentSupply.");

        // The identifying information for this atom.
        _publicHash = publicHash;
        _publicUrl = publicUrl;
        _creatorName = creatorName;
        _creatorAddress = creatorAddress;

        string memory failureString;
        for (uint i=0; i < parentAddresses.length; i++) {
            failureString = append("Address is duplicated twice: ", toAsciiString(parentAddresses[i]));
            require(!_parentAddresses[parentAddresses[i]], failureString);
            _parentAddresses[parentAddresses[i]] = true;
            numParents += 1;
        }  

        unitCoin = new UnitCoin(coinName, coinSymbol, creatorSupply, poolSupply, remainingParentSupply, adminAddress, 
                                poolAddress, creatorAddress, parentAddresses, parentSupplies);
    }

    // Add to the list of parents.
    // The flow is that for any parents that we didn't have at the beginning, we add them later on as they onboard and
    // do a transfer from this address, which was holding the funds, to their address. Their address will be a 
    // Unit as well, so it will effect an airdrop. Can only be called by the owner.
    function addParents(address[] memory newParentAddresses, uint256[] memory newParentSupplies) public onlyOwner {
        require(newParentAddresses.length == newParentSupplies.length, "Addresses and supplies differ in length.");
        require(numParents + newParentAddresses.length <= maximumParentSize, "|Parents| > maximum.");

        uint256 totalNewParentSupply;
        for (uint i=0; i < newParentSupplies.length; i++) {
            totalNewParentSupply += newParentSupplies[i];
        }       
        require(totalNewParentSupply <= remainingParentSupply, "Not enough remaining supply for new parents.");

        for (uint i=0; i < newParentAddresses.length; i++) {
            require(!_parentAddresses[newParentAddresses[i]], "Duplicate address over the full set of parents.");
            _parentAddresses[newParentAddresses[i]] = true;
            numParents += 1;
        }

        string memory failureString;
        for (uint i=0; i < newParentAddresses.length; i++) {
            // transfer the coin.
            (bool sent, ) = newParentAddresses[i].call{value: newParentSupplies[i]}("");
            failureString = append("Failed to send ether to ", toAsciiString(newParentAddresses[i]));
            require(sent, failureString);
            remainingParentSupply -= newParentSupplies[i];
        }        
    }

    // Airdrop held payment to all coin holders.
    // We take the held balances in our contract and distribute it proportionally to the unitCoin holders.
    // Can only be called by this contract, creatorAddress, or the owner.
    function airdrop() public {
        // TODO:
        // 1. Make the graphql of this contract? Omg that sounds so ... not fun.
        // 2. Then implement the Audius version of the Uniswap merkle distributor.
        // 3. Each airdrop will be its own thing so we need to keep track of them.
        require(msg.sender == _creatorAddress || msg.sender == this.owner() || msg.sender == address(this), 
                "Not a valid owner of airdrop");
    }
    
    function _triggerPayment() private {
        // TODO: What type of coin are we receiving?
        // _heldCoinBalances[msg.data] += msg.value;
    }

    // Receives payment from an outside source. 
    // Don't distribute the payment until triggered by the creator or the admin.
    receive() external payable {
        // TODO
    }

    // Called when ether is sent to this contract but msg.data is not empty.
    // Don't distribute the payment until triggered by the creator or the admin.
    fallback() external payable {
        // TODO
    }

    function toAsciiString(address x) internal view returns (string memory) {
        bytes memory s = new bytes(40);
        for (uint i = 0; i < 20; i++) {
            bytes1 b = bytes1(uint8(uint(uint160(x)) / (2**(8*(19 - i)))));
            bytes1 hi = bytes1(uint8(b) / 16);
            bytes1 lo = bytes1(uint8(b) - 16 * uint8(hi));
            s[2*i] = char(hi);
            s[2*i+1] = char(lo);            
        }
        return string(s);
    }

    function char(bytes1 b) internal pure returns (bytes1 c) {
        if (uint8(b) < 10) return bytes1(uint8(b) + 0x30);
        else return bytes1(uint8(b) + 0x57);
    }    

    function append(string memory a, string memory b) internal pure returns (string memory) {
        return string(abi.encodePacked(a, b));
    }
}
