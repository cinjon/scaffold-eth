// contracts/RCoin.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./ClaimDistributor.sol";

contract PoolCoin is ERC20 {
    constructor() ERC20("Pool", "PCO") public {
        _mint(msg.sender, 1000);
    }
}

// *** Initialization ***
// The unit U is minted by creator C and has an associated pool P. C immediately receives the vast allotment minted to
// their address. P receives a small amount minted to their address.
// *** Parent update ***
// When a list of new parents are assigned to U, then they get their supply minted. These tokens are new supply and we 
// do not try to account for anything going to them beforehand - it pays to mint earlier. The supply is minted to a 
// Merkle distributor which is already up and running beforehand.
// *** Payment sent to U ***
// We've already committed payment to parents by giving to their tokens. So at this point, we just need to make an 
// airdrop to all the holders. When that's triggered, we start another Merkle distributor and gift that distributor
// these coins. 
// *** What happens to payments to unclaimed addresses? ***
// The issue is what happens when someone hasn't claimed their U tokens yet. This happens when U becomes a parent to 
// another unit U1. In that case, the holders of U get U1 tokens airdropped to them. If one of those holders hasn't
// claimed then, then shouldn't they still be allowed to get the payment? Yes, because they technically own this; they
// just haven't gotten it yet due to inefficiencies in the system. 
// To do this, we need to account for it in the Merkel distributor. So we need to keep track of the historical claims
// as well and be able to ping whether a user has claimed.


// This contract corresponds to a single unit. When instantiated, it holds a UnitCoin with this contract as the owner.
// Args:
//   coinName: the name of this coin.
//   coinSymbol: the symbol of this coin.
//   publicUrl: the url where this creation lives and where we can find the publicHash.
//   publicHash: the hash that was put into the creation in order to identify it.
//   creatorName: the name of the creator, e.g. Cinjon Resnick.
//   creatorAddress: the ethereum address of the creator.
contract UnitCoinV1 is Ownable, ERC20Burnable {
    // Identifyng info.
    string public publicHash;
    string public publicUrl;
    address public creatorAddress;
    string public creatorName;
    mapping(address => bool) public parentAddresses;
    uint8 public numParents = 0;
    address[] private _claimDistributors;

    // Standard across units.
    uint256 constant initialSupply = 1000;
    uint256 constant poolSupply = 10; // 1% to pool.
    uint256 constant maximumParentSize = 5;
    uint256 public remainingParentSupply = 100; // 10% to parents. "tithe"
    uint256 creatorSupply = initialSupply - poolSupply - remainingParentSupply;

    constructor(string memory name, string memory symbol, string memory publicHash_, string memory publicUrl_, 
                string memory creatorName_, address creatorAddress_, address poolAddress) Ownable() ERC20(name, symbol) {       
        // The identifying information for this atom.
        publicHash = publicHash_;
        publicUrl = publicUrl_;
        creatorName = creatorName_;
        creatorAddress = creatorAddress_;

        // Mint to the creator and the pool of which this is a part.
        _mint(creatorAddress, creatorSupply);
        _mint(poolAddress, poolSupply);
    }

    function _checkNewParents(address payable[] memory newParentAddresses, uint256[] memory newParentSupplies) private {
        require(newParentAddresses.length == newParentSupplies.length, "Addresses and supplies differ in length.");
        uint8 newNumParents = numParents + uint8(newParentAddresses.length);
        require(newNumParents <= maximumParentSize, "|Parents| > maximum.");

        uint256 totalNewParentSupply;
        for (uint i=0; i < newParentSupplies.length; i++) {
            totalNewParentSupply += newParentSupplies[i];

            require(address(this) != newParentAddresses[i], "This unit's address was listed as a parent.");
            require(creatorAddress != newParentAddresses[i], "The creator address was listed as a parent.");            
        }       
        require(totalNewParentSupply <= remainingParentSupply, "Not enough remaining supply for new parents.");

        for (uint i=0; i < newParentAddresses.length; i++) {
            require(!parentAddresses[newParentAddresses[i]], "Duplicate address over the full set of parents.");
        }

        require(newNumParents < maximumParentSize || remainingParentSupply > totalNewParentSupply, 
                "We would reach the maximum parent size while still having supply remaining.");
    }

    function getClaimDistributorAddresses() public returns (address[] memory) {
        return _claimDistributors;
    }

    // Add to the list of parents via airdropping with a MerkleDistributor. This will take the tokens set aside for 
    // these parents and airdrop them to the holders of those parents via a MerkleDistributor.
    function addParentsAndAirdrop(address payable[] memory newParentAddresses, uint256[] memory newParentSupplies, 
                                  address payable distributorAddress) public onlyOwner {
        _checkNewParents(newParentAddresses, newParentSupplies);

        uint256 thisParentSupply = 0;
        for (uint i=0; i < newParentAddresses.length; i++) {
            parentAddresses[newParentAddresses[i]] = true;
            thisParentSupply += newParentSupplies[i];
        }
        numParents += uint8(newParentAddresses.length);

        _mint(distributorAddress, thisParentSupply);
        remainingParentSupply -= thisParentSupply;
        _claimDistributors.push(distributorAddress);
    }
    
    // Ahhhh fuck. I don't think this thing is going to work.
    // I was going to allow holders to claim their ETH / USDC / DOGE / etc, based on how much of the tokens they have.
    // Wait, we can do this. We know at the last snapshot how much they have. 
    // ... Hmm, by far the easier solution wrt bookkeeping would be to deploy a MerkleDistributor instead of trying to
    // account for what users have taken what and when everything came in. That would otherwise be hard.
    // In this other way we would take everything we have re Airdrop and move them to a new MerkleDistributor that has
    // who owns what. So this transfer would be expensive, it's true, but it would also be the only thing...
    function sendHoldingsToDistributor(address payable distributorAddress) public onlyOwner {
        string memory failureString = append("Transfer from Unit to Distributor ", toAsciiString(distributorAddress));
        require(_sendUSDCToDistributor(distributorAddress), append(failureString, " failed for USDC."));
        require(_sendEthToDistributor(distributorAddress), append(failureString, " failed for ETH."));
        _claimDistributors.push(distributorAddress);
    }

    function _sendEthToDistributor(address payable distributorAddress) private returns (bool) {
        uint256 balance = address(this).balance;
        (bool sent, bytes memory data) = distributorAddress.call{value: balance}("");
        return sent;
    }

    function _sendUSDCToDistributor(address payable distributorAddress) private returns (bool) {
        string memory usdcString = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";        
        address usdcAddress = parseAddressFromString(usdcString);
        return _sendTokenToDistributor(usdcAddress, distributorAddress);
    }

    function _sendTokenToDistributor(address tokenAddress, address payable distributorAddress) private returns (bool) {
        address myAddress = address(this);
        uint256 balance = IERC20(tokenAddress).balanceOf(myAddress);
        bool sent = IERC20(tokenAddress).transfer(distributorAddress, balance);
        return sent;
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

    // See: https://ethereum.stackexchange.com/questions/67436/a-solidity-0-5-x-function-to-convert-adress-string-to-ethereum-address
    function parseAddressFromString(string memory _a) internal pure returns (address _parsedAddress) {
        bytes memory tmp = bytes(_a);
        uint160 iaddr = 0;
        uint160 b1;
        uint160 b2;
        for (uint i = 2; i < 2 + 2 * 20; i += 2) {
            iaddr *= 256;
            b1 = uint160(uint8(tmp[i]));
            b2 = uint160(uint8(tmp[i + 1]));
            if ((b1 >= 97) && (b1 <= 102)) {
                b1 -= 87;
            } else if ((b1 >= 65) && (b1 <= 70)) {
                b1 -= 55;
            } else if ((b1 >= 48) && (b1 <= 57)) {
                b1 -= 48;
            }
            if ((b2 >= 97) && (b2 <= 102)) {
                b2 -= 87;
            } else if ((b2 >= 65) && (b2 <= 70)) {
                b2 -= 55;
            } else if ((b2 >= 48) && (b2 <= 57)) {
                b2 -= 48;
            }
            iaddr += (b1 * 16 + b2);
        }
        return address(iaddr);
    }
}
