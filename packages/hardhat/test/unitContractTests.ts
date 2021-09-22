import {deployments, ethers, getNamedAccounts} from "hardhat";
import { use, expect} from "chai";
import { waffleChai } from "@ethereum-waffle/chai";
import {solidity} from "ethereum-waffle";
import { BigNumber } from "ethers";
import AllocationTree from "../contracts/balance-tree";
import { sign } from "crypto";

// const { ethers, getNamedAccounts } = require("hardhat");
// const { use, expect } = require("chai");
// const { solidity } = require("ethereum-waffle");
// const { BigNumber } = require("ethers");
// const AllocationTree = require("../contracts/balance-tree");

use(solidity);

const deploySplitter = async () => {
    const Splitter = await ethers.getContractFactory("Splitter");
    const splitter = await Splitter.deploy();
    return await splitter.deployed();
};
  
const deployProxyFactory = async (
    splitterAddress,
    fakeWETHAddress
) => {
    const SplitFactory = await ethers.getContractFactory("SplitFactory");
    const proxyFactory = await SplitFactory.deploy(
        splitterAddress,
        fakeWETHAddress
    );
    return await proxyFactory.deployed();
};

describe("Unit Contracts", function () {  
    const scienceMerkle1000 = "0x3f884a605dab55f926db10d6c94cee3e6717f6d9df013ae4716da0113b8ded24";
    let scienceContract, mlcContract, u0ParentMerkle, u1ParentMerkle, u2ParentMerkle, u3ParentMerkle, u4ParentMerkle;
    let fakeWETH, deployer, creator0, creator1, creator2, creator3, creator4, creator5, funder1;
    let creatorAddresses, fundingAddresses, fundingAccounts, signingAccounts;
    let u0, u1, u2, u3, u4;
    let transfer;
    let tree, proxy, callableProxy, proxyFactory;
    let UnitFactory, MerkleFactory, SplitFactory;
    const zeroAddress = "0x0000000000000000000000000000000000000000";

    describe("Science", function() {
        this.beforeEach(async () => {
            const accounts = await getNamedAccounts();
            const { deploy } = deployments;
            deployer = accounts['deployer'];
            creator0 = accounts['creator0'];
            creator1 = accounts['creator1'];
            creator2 = accounts['creator2'];
            creator3 = accounts['creator3'];
            creator4 = accounts['creator4'];
            creator5 = accounts['creator5'];
            creatorAddresses = [creator0, creator1, creator2, creator3, creator4, creator5];
            funder1 = accounts['funder1'];
            fundingAddresses = [funder1];
            const signers = await ethers.getSigners();
            fakeWETH = signers[1];
            signingAccounts = signers.filter(account => creatorAddresses.indexOf(account.address) > -1);
            fundingAccounts = signers.filter(account => fundingAddresses.indexOf(account.address) > -1);
            // { frontend, admin, allPool, creator0, creator1, creator2, creator3, creator4, creator5, creator6, creator7, deployer } = await getNamedAccounts();
        })

        it("Should deploy Science Pool and MLC Pool", async function () {      
            const PoolFactory = await ethers.getContractFactory("PoolCoin");
            scienceContract = await PoolFactory.deploy("SciencePool", {
                from: deployer,
                contract: "PoolCoin",
                args: ["RSF Science", "RFSCI"],
                log: true
            });
            mlcContract = await PoolFactory.deploy("MLCPool", {
                from: deployer,
                contract: "PoolCoin",
                args: ["RSF MLCollective", "RFMLC"],
                log: true
            });
            // console.log(scienceContract.address); // 0x5FbDB2315678afecb367f032d93F642f64180aa3
            // console.log(mlcContract.address); // 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
          });

        it("Should deploy Units u0, u1, and u2 with the distribution just to the Science contract.", async function() {
            MerkleFactory = await ethers.getContractFactory("MerkleDistributor");
            UnitFactory = await ethers.getContractFactory("UnitCoinV1");

            u0 = await UnitFactory.deploy(
                "Unit0", "U0", "url0", "creator0", creator0, scienceContract.address, scienceContract.address, 
                ["ParentID1", "ParentID2", "ParentID3"], [], scienceContract.address
            )
            const expected = BigNumber.from("1100000000000000000000");
            expect(await u0.balanceOf(scienceContract.address)).to.equal(expected);            

            u1 = await UnitFactory.deploy(
                "Unit1", "U1", "url1", "creator1", creator1, mlcContract.address, scienceContract.address,
                ["ParentID1", "ParentID2", "ParentID3"], [], scienceContract.address
            )
            const expectedMLC = BigNumber.from("100000000000000000000");
            expect(await u1.balanceOf(mlcContract.address)).to.equal(expectedMLC);            
            const expectedScience = BigNumber.from("1000000000000000000000");
            expect(await u1.balanceOf(scienceContract.address)).to.equal(expectedScience);            

            u2 = await UnitFactory.deploy(
                "Unit2", "U2", "url2", "creator2", creator2, scienceContract.address, scienceContract.address,
                ["ParentID1", "ParentID2", "ParentID3"], [], scienceContract.address
            )
        });

        it("Should transfer some u1 to other people", async function() {
            expect(await u1.balanceOf(creator1)).to.equal(BigNumber.from("8900000000000000000000"));
            await u1.connect(signingAccounts[1]).transfer(creator2, BigNumber.from("30000000000000000000"));
            await u1.connect(signingAccounts[1]).transfer(creator3, BigNumber.from("100000000000000000000"));
            await u1.connect(signingAccounts[1]).transfer(creator4, BigNumber.from("1000000000000000000000"));
            await u1.connect(signingAccounts[4]).transfer(creator5, BigNumber.from("400000000000000000000"));

            expect(await u1.balanceOf(creator1)).to.equal(BigNumber.from("7770000000000000000000"));
            expect(await u1.balanceOf(creator2)).to.equal(BigNumber.from("30000000000000000000"));
            expect(await u1.balanceOf(creator3)).to.equal(BigNumber.from("100000000000000000000"));
            expect(await u1.balanceOf(creator4)).to.equal(BigNumber.from("600000000000000000000"));
            expect(await u1.balanceOf(creator5)).to.equal(BigNumber.from("400000000000000000000"));
        })

        it("Should transfer some u2 to other people", async function() {
            expect(await u2.balanceOf(creator2)).to.equal(BigNumber.from("8900000000000000000000"));
            await u2.connect(signingAccounts[2]).transfer(creator5, BigNumber.from("20000000000000000000"));
            await u2.connect(signingAccounts[2]).transfer(creator3, BigNumber.from("400000000000000000000"));
            await u2.connect(signingAccounts[2]).transfer(creator5, BigNumber.from("3000000000000000000000"));
            await u2.connect(signingAccounts[5]).transfer(creator4, BigNumber.from("600000000000000000000"));

            expect(await u2.balanceOf(creator1)).to.equal(0);
            expect(await u2.balanceOf(creator2)).to.equal(BigNumber.from("5480000000000000000000"));
            expect(await u2.balanceOf(creator3)).to.equal(BigNumber.from("400000000000000000000"));
            expect(await u2.balanceOf(creator4)).to.equal(BigNumber.from("600000000000000000000"));
            expect(await u2.balanceOf(creator5)).to.equal(BigNumber.from("2420000000000000000000"));
        })

        it("Should mint paper with parents and 1 missing.", async function() {
            // Of the 1000 parent coins, u0 gets 30%, u1 gets 60%, and u4 gets 10%. The u4 doesnt exist yet, so that 
            // goes to the sciencepool for holding. The u0 is split (via the ownership) between 1% to the pool, 89% to 
            // creator0, and an additional 10% to the pool because the u0 parents have not been instantiated. The u1 is
            // split (via ownership) between 1% to the pool, an additional 10% to the pool for the not yet instantiated
            // parents, and the rest according to the prior transactions: creator1 gets 77.7%; creator2 gets .3%; 
            // creator3 gets 1%; creator4 gets 6%; creator5 gets 4%.
            // The totals are: 
            // sciencePool: 1000*0.10 + 1000*0.3*0.11 + 1000*0.6*0.11 = 199
            // creator0: 1000*0.3*0.89 = 267
            // creator1: 1000*0.6*0.777 = 466.2
            // creator2: 1000*0.6*0.003 = 1.8
            // creator3: 1000*0.6*0.01 = 6
            // creator4: 1000*0.6*0.06 = 36
            // creator5: 1000*0.6*0.04 = 24
            // Total: 1000             
            // We push up 1.8 to 2 and 466.2 to 466 in order to make the numbers whole.           

            const u3MerkleRoot = "0xe0e6b85b0d8d0d2c7f3de3c94ce9a4e7be1cd6c2bdd477fa11cde51cac0e1c60";
            u3ParentMerkle = await MerkleFactory.deploy(zeroAddress, u3MerkleRoot);
            expect(await u3ParentMerkle.token()).to.equal(zeroAddress);
            u3 = await UnitFactory.deploy(
                "Unit3", "U3", "url3", "creator3", creator3, scienceContract.address, scienceContract.address, ["url0", "url1", "url4"], [u0.address, u1.address], u3ParentMerkle.address
            )  
            expect(await u3ParentMerkle.token()).to.equal(u3.address);
            const expected = BigNumber.from("1000000000000000000000");
            expect(await u3.balanceOf(u3ParentMerkle.address)).to.equal(expected);
            const knownParents = await u3.getKnownParentAddresses();
            const parentIDs = await u3.getParentIDs();

            // Can't seem to do lists below. Frustrating.
            expect(knownParents[0]).to.equal(u0.address)
            expect(knownParents[1]).to.equal(u1.address)
            expect(parentIDs[0]).to.equal("url0");
            expect(parentIDs[1]).to.equal("url1");
            expect(parentIDs[2]).to.equal("url4");
        });        

        it("Should allow sciencepool to claim the tokens from u3.", async function() {
            const expected = BigNumber.from("1000000000000000000000");
            expect(await u3.balanceOf(u3ParentMerkle.address)).to.equal(expected);

            // sciencePool's merkle leaf: {"index":3,"amount":"0x0ac9ae05a71ebc0000","proof":["0xa03f32686a850f15cea5583fe0b2c076c98c7505e30ad0c84c1a76b853e441f4","0xaa02f7bd7d0b60bdb582b0e63e19c7b81902fe6ca8b35f5b1e4540131f3a6db1","0x4a69a6d6123fbb15b22790821610e322dc3414373572e47e01c11ae84edc6657"]}            
            await u3ParentMerkle.claim(3, scienceContract.address, "0x0ac9ae05a71ebc0000", [
                "0xa03f32686a850f15cea5583fe0b2c076c98c7505e30ad0c84c1a76b853e441f4",
                "0xaa02f7bd7d0b60bdb582b0e63e19c7b81902fe6ca8b35f5b1e4540131f3a6db1",
                "0x4a69a6d6123fbb15b22790821610e322dc3414373572e47e01c11ae84edc6657"
            ]);
            const expected2 = BigNumber.from("299000000000000000000");
            expect(await u3.balanceOf(scienceContract.address)).to.equal(expected2);
            const expected3 = BigNumber.from("801000000000000000000");
            expect(await u3.balanceOf(u3ParentMerkle.address)).to.equal(expected3);
        })

        it("Should allow creator1 to claim the tokens from u3.", async function() {    
            // creator1's merkle leaf: {"index":1,"amount":"0x19430c9306b4080000","proof":["0xcfb6bbd3885f2f75f173f73aee75b8318cc70178a6b1c501a514bae3ea1c4bae","0xf496f93e5364b944fbab5f092e23ab667ca1c1db8f50b203c4b3b734655bb9c1","0x83eccfbd876ac4ec456cb636a78fb28726b14429d89abc819de0f856611cbec2"]}
            await u3ParentMerkle.claim(1, creator1, "0x19430c9306b4080000", [
                "0xcfb6bbd3885f2f75f173f73aee75b8318cc70178a6b1c501a514bae3ea1c4bae",
                "0xf496f93e5364b944fbab5f092e23ab667ca1c1db8f50b203c4b3b734655bb9c1",
                "0x83eccfbd876ac4ec456cb636a78fb28726b14429d89abc819de0f856611cbec2"
            ]);
            const expected4 = BigNumber.from("466000000000000000000");
            expect(await u3.balanceOf(creator1)).to.equal(expected4);
            const expected5 = BigNumber.from("335000000000000000000");
            expect(await u3.balanceOf(u3ParentMerkle.address)).to.equal(expected5);
        })

        it("Should not be able to mint a token with no parentMerkle address.", async function() {
            await expect(UnitFactory.deploy(
                "Unit4", "U4", "url4", "creator4", creator4, scienceContract.address, scienceContract.address, ["url0", "url1"], [u0.address, u1.address], zeroAddress
            )).to.be.reverted; 
        });  

        it("Should mint paper u4 with parents and 0 missing.", async function() {
            // Of the 1000 parent coins, u0 gets 70% and u1 gets 30%. The u0 is split (via the ownership) between 1% to 
            // the pool, 89% to creator0, and an additional 10% to the pool because the u0 parents have not been 
            // instantiated. The u1 is split (via ownership) between 1% to the pool, an additional 10% to the pool for 
            // the not yet instantiated parents, and the rest according to the prior transactions: creator1 gets 77.7%; 
            // creator2 gets .3%; creator3 gets 1%; creator4 gets 6%; creator5 gets 4%.
            // The totals are: 
            // sciencePool: 1000*0.70*0.11 + 1000*0.3*0.11 = 110
            // creator0: 1000*0.7*0.89 = 623
            // creator1: 1000*0.3*0.777 = 233.1
            // creator2: 1000*0.3*0.003 = 0.9
            // creator3: 1000*0.3*0.01 = 3
            // creator4: 1000*0.3*0.06 = 18
            // creator5: 1000*0.3*0.04 = 12
            // Total: 1000             
            // We push up 0.9 to 1 and 233.1 to 233 in order to make the numbers whole. 
                        
            const u4MerkleRoot = "0x38264727f9097438f9f66446852ee9560b80bf381373328b5ec3641f774332a2";
            u4ParentMerkle = await MerkleFactory.deploy(zeroAddress, u4MerkleRoot);
            expect(await u4ParentMerkle.token()).to.equal(zeroAddress);            
            u4 = await UnitFactory.deploy(
                "Unit4", "U4", "url4", "creator4", creator4, scienceContract.address, scienceContract.address, ["url0", "url1"], [u0.address, u1.address], u4ParentMerkle.address
            )  
            expect(await u4ParentMerkle.token()).to.equal(u4.address);
        });        

        it("Should add u4 as a parent to u3.", async function() {
            let knownParents = await u3.getKnownParentAddresses();
            expect(knownParents[0]).to.equal(u0.address)
            expect(knownParents[1]).to.equal(u1.address)
            await u3.addParents([u4.address]);
            knownParents = await u3.getKnownParentAddresses();
            expect(knownParents[0]).to.equal(u0.address)
            expect(knownParents[1]).to.equal(u1.address)
            expect(knownParents[2]).to.equal(u4.address)
        });               

        it("Should set up the first Splits contract on u1.", async function() {
            expect(await u1.balanceOf(mlcContract.address)).to.equal(BigNumber.from("100000000000000000000"));
            expect(await u1.balanceOf(scienceContract.address)).to.equal(BigNumber.from("1000000000000000000000"));
            expect(await u1.balanceOf(creator1)).to.equal(BigNumber.from("7770000000000000000000"));
            expect(await u1.balanceOf(creator2)).to.equal(BigNumber.from("30000000000000000000"));
            expect(await u1.balanceOf(creator3)).to.equal(BigNumber.from("100000000000000000000"));
            expect(await u1.balanceOf(creator4)).to.equal(BigNumber.from("600000000000000000000"));
            expect(await u1.balanceOf(creator5)).to.equal(BigNumber.from("400000000000000000000"));            

            const claimers = [mlcContract.address, scienceContract.address, creator1, creator2, creator3, creator4, creator5];
            const allocationPercentages = [0.01, 0.10, 0.777, 0.003, 0.01, 0.06, 0.04]
            const allocations = allocationPercentages.map((percentage, index) => {
                return {
                  account: claimers[index],
                  allocation: BigNumber.from(percentage * 10**9),
                };
              });
      
            tree = new AllocationTree(allocations);
            const rootHash = tree.getHexRoot();
    
            const splitter = await deploySplitter();
            SplitFactory = await ethers.getContractFactory("SplitFactory");
            proxyFactory = await SplitFactory.deploy(
                splitter.address,
                fakeWETH.address
            );            

            const deployTx = await proxyFactory.createSplit(rootHash);

            // Compute address.
            const constructorArgs = ethers.utils.defaultAbiCoder.encode(
                ["bytes32"],
                [rootHash]
            );
            const salt = ethers.utils.keccak256(constructorArgs);
            const proxyBytecode = (await ethers.getContractFactory("SplitProxy")).bytecode;
            const codeHash = ethers.utils.keccak256(proxyBytecode);

            const proxyAddress = await ethers.utils.getCreate2Address(
                proxyFactory.address,
                salt,
                codeHash
            );
            proxy = await (
                await ethers.getContractAt("SplitProxy", proxyAddress)
            ).deployed();
    
            callableProxy = await (
                await ethers.getContractAt("Splitter", proxy.address)
            ).deployed();            
        })

        it("Should have funder1 give 1 eth to u1 and have it go to the mlc pool", async function() {
            console.log('yo mlc');
            console.log(await ethers.provider.getBalance(mlcContract.address));
            const sendTrans = await fundingAccounts[0].sendTransaction({
                to: u1.address,
                value: ethers.utils.parseEther("1"),
              });
            console.log(sendTrans);
            console.log(await ethers.provider.getBalance(mlcContract.address));
            expect(await ethers.provider.getBalance(mlcContract.address)).to.equal(BigNumber.from("1000000000000000000"));
            expect(await ethers.provider.getBalance(proxy.address)).to.equal(BigNumber.from("0"));
        })

        it("Should have funder1 give 5 eth to the proxy", async function() {
            console.log('hii')
            await fundingAccounts[0].sendTransaction({
                to: proxy.address,
                value: ethers.utils.parseEther("5"),
              });

            console.log('hii2')
            expect(await ethers.provider.getBalance(proxy.address)).to.equal(BigNumber.from("5000000000000000000"));
            console.log('hii3')
            await callableProxy.incrementWindow();
            console.log('hi4')
            const balanceWindowAfter = await callableProxy.balanceForWindow(0);
            console.log(balanceWindowAfter);
            // const balanceWindowAfter1 = await callableProxy.balanceForWindow(1);
            // console.log(balanceWindowAfter1);
        })

        // it("Should send held balance from u0 to the last splits contract.", async function() {
        //     // TODO
        // })

    })
})
  