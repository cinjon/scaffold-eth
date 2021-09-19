// contracts/RCoin.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./IMerkleDistributor.sol";


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
//   publicUrl: the url where this creation lives and where we can find the publicHash.
//   creatorName: the name of the creator, e.g. Cinjon Resnick.
//   creatorAddress: the ethereum address of the creator.
//   poolAddress: the ethereum address of the pool to which this belonds.
//   parentIDs: the parent string identification information, for posterity to save.
//   knownParentAddresses: the known ethereum addresses for the parents. 
//   parentMerkleAddress: the ethereum address of the creator.
contract UnitCoinV1 is Ownable, ERC20Capped {
    event Distribution(address distributorAddress, uint256 balance);

    // Identifyng info.
    string public publicUrl;
    address public creatorAddress;
    string public creatorName;
    string[] private _parentIDs;
    address[] private _knownParentAddresses;
    address[] private _claimDistributors;  
    address private _parentDistributor;  

    // Standard across units.
    uint256 constant maximumParentSize = 5;

    constructor(string memory name, string memory symbol, string memory publicUrl_,
                string memory creatorName_, address creatorAddress_, address poolAddress, 
                string[] memory parentIDs, address[] memory parentAddresses, address parentMerkleAddress) 
                Ownable() ERC20(name, symbol) ERC20Capped(10000 * 10**uint(decimals())) {       
        // The identifying information.
        publicUrl = publicUrl_;
        creatorName = creatorName_;
        creatorAddress = creatorAddress_;

        require(creatorAddress != poolAddress, "Creator should not be the same as the pool.");
        require(creatorAddress != parentMerkleAddress, "Creator should not be the same as the parent merkle.");
        require(poolAddress != parentMerkleAddress, "Pool should not be the same as the parent merkle.");
        require(IMerkleDistributor(parentMerkleAddress).setTokenOnce(address(this)), "Failed to set merkle address.");

        _parentIDs = parentIDs;
        _knownParentAddresses = parentAddresses;
        _checkParents(_knownParentAddresses);

        // Mint to the creator, the pool of which this is a part, and the parentMerkle for parents to claim. That might
        // include dummy parents and/or the general pool. If it's the general Science pool, we can move over from there
        // to the actual parents when they come online.
        uint256 poolSupply = 100;
        uint256 parentSupply = 1000;
        uint256 creatorSupply = 8900;
        ERC20._mint(parentMerkleAddress, parentSupply * 10**uint(decimals()));
        ERC20._mint(creatorAddress, creatorSupply * 10**uint(decimals()));
        ERC20._mint(poolAddress, poolSupply * 10**uint(decimals()));
    }

    function _checkParents(address[] memory parentAddresses) private {
        require(parentAddresses.length <= maximumParentSize, "|Parents| > maximum.");
        for (uint i=0; i < parentAddresses.length; i++) {
            _checkValidAddress(parentAddresses[i]);
        }       

        for (uint i=0; i < parentAddresses.length; i++) {
            for (uint j=i+1; j < parentAddresses.length; j++) {
                require(parentAddresses[i] != parentAddresses[j], "Duplicate address over the full set of parents.");
            }
        }
    }

    function addParent(address parentAddress) public onlyOwner {        
        require(_knownParentAddresses.length + 1 <= maximumParentSize);
        _knownParentAddresses.push(parentAddress);
        _checkParents(_knownParentAddresses);
    }
    
    function getKnownParentAddresses() external view returns (address[] memory) {
        return _knownParentAddresses;
    }

    function getParentIDs() external view returns (string[] memory) {
        return _parentIDs;
    }

    function getClaimDistributorAddresses() public returns (address[] memory) {
        return _claimDistributors;
    }

    function _checkValidAddress(address toCheck) private {
        require(toCheck != address(0x0), "Cannot use the 0 address.");
        require(toCheck != address(this), "Cannot use this address.");
        require(toCheck != creatorAddress, "Cannot use the creator address.");
    }

    function setNewClaimDistributor(address payable ethDistributor) public onlyOwner {
        _checkValidAddress(ethDistributor);
        _claimDistributors.push(ethDistributor);
    }

    function sendHoldingsToDistributor() public {
        require(_claimDistributors.length > 0, "We do not have a distributor.");
        address payable distributor = payable(_claimDistributors[_claimDistributors.length - 1]);
        require(_sendEthToDistributor(distributor), "Sending holdings failed for ETH.");
    }

    function _sendEthToDistributor(address payable distributorAddress) private returns (bool) {
        uint256 balance = address(this).balance;
        (bool sent, bytes memory data) = distributorAddress.call{value: balance}("");
        emit Distribution(distributorAddress, balance);
        return sent;
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
