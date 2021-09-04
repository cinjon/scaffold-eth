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
// The unit U is minted by creator C and has an associated pool P and parents S. C immediately receives the vast 
// allotment minted to their address. P receives a small amount minted to their address. S receives the mint but to a
// Merkle that they need to claim. S may consist of a dummy paper.
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
//   name: the name of this coin.
//   symbol: the symbol of this coin.
//   publicHash: the hash that was put into the creation in order to identify it.
//   publicUrl: the url where this creation lives and where we can find the publicHash.
//   creatorName: the name of the creator, e.g. Cinjon Resnick.
//   creatorAddress: the ethereum address of the creator.
//   poolAddress: the ethereum address of the pool.
//   parentAddresses: the parent ethereum addresses, for posterity to save.
//   parentMerkleAddress: the ethereum address of the creator.
contract UnitCoinV1 is Ownable, ERC20Burnable {
    // Identifyng info.
    string public publicHash;
    string public publicUrl;
    address public creatorAddress;
    string public creatorName;
    address[] private _parentAddresses;
    uint8 public numParents;
    address[] private _claimDistributors;
    mapping(address => bool) _parentCheck;

    // Standard across units.
    uint256 constant initialSupply = 1000;
    uint256 constant poolSupply = 10; // 1% to pool.
    uint256 constant maximumParentSize = 5;
    uint256 constant parentSupply = 100; // 10% to parents. "tithe"
    uint256 creatorSupply = initialSupply - poolSupply - parentSupply;

    constructor(string memory name, string memory symbol, string memory publicHash_, string memory publicUrl_, 
                string memory creatorName_, address creatorAddress_, address poolAddress, 
                address[] memory parentAddresses, address parentMerkleAddress) Ownable() ERC20(name, symbol) {       
        // The identifying information for this atom.
        publicHash = publicHash_;
        publicUrl = publicUrl_;
        creatorName = creatorName_;
        creatorAddress = creatorAddress_;
        numParents = uint8(parentAddresses.length);
        _checkParents(parentAddresses);
        _parentAddresses = parentAddresses;

        // Mint to the creator, the pool of which this is a part, and the parentMerkle for parents to claim. That might
        // include dummy parents.
        _mint(creatorAddress, creatorSupply);
        _mint(poolAddress, poolSupply);
        _mint(parentMerkleAddress, parentSupply);
        _claimDistributors.push(parentMerkleAddress);
    }

    function _checkParents(address[] memory parentAddressses) private {
        require(parentAddressses.length <= maximumParentSize, "|Parents| > maximum.");
        for (uint i=0; i < parentAddressses.length; i++) {
            require(address(this) != parentAddressses[i], "This unit's address was listed as a parent.");
            require(creatorAddress != parentAddressses[i], "The creator address was listed as a parent.");            
        }       

        for (uint i=0; i < parentAddressses.length; i++) {
            require(!_parentCheck[parentAddressses[i]], "Duplicate address over the full set of parents.");
            _parentCheck[parentAddressses[i]] = true;
        }
    }

    function getParents() public returns (address[] memory) {
        return _parentAddresses;
    }

    function getClaimDistributorAddresses() public returns (address[] memory) {
        return _claimDistributors;
    }
    
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
