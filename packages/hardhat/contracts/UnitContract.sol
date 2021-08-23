// contracts/RCoin.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract PoolCoin is ERC20 {
    constructor() ERC20("Pool", "PCO") public {
        _mint(msg.sender, 1000);
    }
}


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
contract UnitCoinV1 is Ownable, ERC20Burnable {
    // Identifyng info.
    string public publicHash;
    string public publicUrl;
    address public creatorAddress;
    string public creatorName;
    // TODO: Is there a set class?
    mapping(address => bool) public parentAddresses;
    uint8 public numParents = 0;

    // Standard across units.
    uint256 constant initialSupply = 1000;
    uint256 constant poolSupply = 10; // 1% to pool.
    uint256 constant maximumParentSize = 5;
    uint256 public remainingParentSupply = 100; // 10% to parents. "tithe"
    uint256 creatorSupply = initialSupply - poolSupply - remainingParentSupply;

    // Holds the coin balances of this contract in storage. Makes isReleaseFunds checking easier;
    mapping(string => uint256) private _heldCoinBalances;
    
    constructor(string memory name, string memory symbol, string memory publicHash_, string memory publicUrl_, 
                string memory creatorName_, address creatorAddress_, address poolAddress, 
                address[] memory parentAddresses_, uint256[] memory parentSupplies) Ownable() ERC20(name, symbol) {       
        require(parentSupplies.length == parentAddresses_.length, 
                "parentSupplies and parentAddresses have different lengths.");
        for (uint i=0; i < parentSupplies.length; i++) {
            remainingParentSupply -= parentSupplies[i];
            require(address(this) != parentAddresses_[i], "This unit's address was listed as a parent.");
            require(creatorAddress != parentAddresses_[i], "The creator address was listed as a parent.");            
        }        
        require(remainingParentSupply >= 0, "Parent coins were assigned more than the original parentSupply.");

        // The identifying information for this atom.
        publicHash = publicHash_;
        publicUrl = publicUrl_;
        creatorName = creatorName_;
        creatorAddress = creatorAddress_;

        string memory failureString;
        for (uint i=0; i < parentAddresses_.length; i++) {
            failureString = append("Address is duplicated twice: ", toAsciiString(parentAddresses_[i]));
            require(!parentAddresses[parentAddresses_[i]], failureString);
            parentAddresses[parentAddresses_[i]] = true;
            numParents += 1;
        }  

        // Mint to the creator, the parents, and the pool of which this is a part.
        _mint(creatorAddress, creatorSupply);
        _mint(poolAddress, poolSupply);
        for (uint i=0; i < parentSupplies.length; i++) {
            _mint(parentAddresses_[i], parentSupplies[i]);
        }     
    }

    // Add to the list of parents.
    // The flow is that for any parents that we didn't have at the beginning, we add them later on as they onboard and
    // do a transfer from this address, which was holding the funds, to their address. Their address will be a 
    // Unit as well, so it will effect an airdrop. Can only be called by the owner.
    function addParents(address payable[] memory newParentAddresses, uint256[] memory newParentSupplies) public onlyOwner {
        require(newParentAddresses.length == newParentSupplies.length, "Addresses and supplies differ in length.");
        require(numParents + newParentAddresses.length <= maximumParentSize, "|Parents| > maximum.");

        uint256 totalNewParentSupply;
        for (uint i=0; i < newParentSupplies.length; i++) {
            totalNewParentSupply += newParentSupplies[i];
        }       
        require(totalNewParentSupply <= remainingParentSupply, "Not enough remaining supply for new parents.");

        for (uint i=0; i < newParentAddresses.length; i++) {
            require(!parentAddresses[newParentAddresses[i]], "Duplicate address over the full set of parents.");
            parentAddresses[newParentAddresses[i]] = true;
            numParents += 1;
        }

        string memory failureString;
        for (uint i=0; i < newParentAddresses.length; i++) {
            console.log(newParentSupplies[i]);
            _mint(address(newParentAddresses[i]), newParentSupplies[i]);
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
        require(msg.sender == creatorAddress || msg.sender == this.owner() || msg.sender == address(this), 
                "Not a valid owner of airdrop");
    }
    
    function _triggerPayment() private {
        // TODO: What type of coin are we receiving?
        // _heldCoinBalances[msg.data] += msg.value;
    }

    // // Receives payment from an outside source. 
    // // Don't distribute the payment until triggered by the creator or the admin.
    // receive() external payable {
    //     // TODO
    // }

    // // Called when ether is sent to this contract but msg.data is not empty.
    // // Don't distribute the payment until triggered by the creator or the admin.
    // fallback() external payable {
    //     // TODO
    // }

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
