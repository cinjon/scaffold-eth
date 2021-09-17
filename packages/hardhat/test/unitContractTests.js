const { ethers, getNamedAccounts } = require("hardhat");
const { use, expect } = require("chai");
const { solidity } = require("ethereum-waffle");
const { BigNumber } = require("ethers");

use(solidity);

describe("Unit Contracts", function () {    
    let scienceContract, mlcContract, u0ParentMerkle;
    let deployer, creator0, creator1, creator2, creator3, creator4, creator5, creatorAddresses, signingAccounts;
    let u0, u1, u2, u3, u4;
    let transfer;

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
            signingAccounts = await ethers.getSigners().then(signers => signers.filter(account => creatorAddresses.indexOf(account.address) > -1));            
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

        it("Should deploy three Unit contracts, each with no parents", async function() {
            const UnitFactory = await ethers.getContractFactory("UnitCoinV1");
            u0 = await UnitFactory.deploy(
                "Unit0", "U0", "url0", "creator0", creator0, scienceContract.address, ["ParentID1", "ParentID2", "ParentID3"], []
            )                
            u1 = await UnitFactory.deploy(
                "Unit1", "U1", "url1", "creator1", creator1, scienceContract.address, ["ParentID1", "ParentID2", "ParentID3"], []
            )                
            u2 = await UnitFactory.deploy(
                "Unit2", "U2", "url2", "creator2", creator2, scienceContract.address, ["ParentID1", "ParentID2", "ParentID3"], []
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

        it("Should not be able to send any held balance because we haven't set up a claim distributor yet.", async function() {
            // TODO
        })        

        it("Should not be able to set a claim distributor because we don't have a parent merkle distributor yet.", function() {
            // TODO
        })        

        it("Should deploy the parent merkle interactions function", async function() {
            const scienceMerkle1000 = "0x3f884a605dab55f926db10d6c94cee3e6717f6d9df013ae4716da0113b8ded24";
            const MerkleFactory = await ethers.getContractFactory("MerkleDistributor");
            u0ParentMerkle = await MerkleFactory.deploy(u0.address, scienceMerkle1000);
            expect(await u0.balanceOf(u0ParentMerkle.address)).to.equal(0);
        });
        
        it("Should send the parent amount to the parent merkle.", async function() {
            await u0.sendToParents(u0ParentMerkle.address);
            const expected = BigNumber.from("1000000000000000000000");
            expect(await u0.balanceOf(u0ParentMerkle.address)).to.equal(expected);
        });

        it("Should not be claimed yet for science pool (the parent).", async function() {
            expect(await u0ParentMerkle.isClaimed(0)).to.equal(false);
            const expected = BigNumber.from("100000000000000000000");
            expect(await u0.balanceOf(scienceContract.address)).to.equal(expected);
        });

        it("Should be able to have science pool claim the parent share.", async function() {
            expect(scienceContract.address).to.equals("0x5FbDB2315678afecb367f032d93F642f64180aa3");
            const expected = BigNumber.from("1000000000000000000000");
            expect(await u0.balanceOf(u0ParentMerkle.address)).to.equal(expected);
            await u0ParentMerkle.claim(0, scienceContract.address, "0x3635c9adc5dea00000", []);
            const expected2 = BigNumber.from("1100000000000000000000");
            expect(await u0.balanceOf(scienceContract.address)).to.equal(expected2);
            expect(await u0.balanceOf(u0ParentMerkle.address)).to.equal(0);
        });

        it("Should mint paper with parents and 1 missing.", async function() {
            u3 = await UnitFactory.deploy(
                "Unit3", "U3", "url3", "creator3", creator3, scienceContract.address, ["url0", "url1", "url4"], [u0.address, u1.address]
            )  
            // Make merkle root, etc.
        });        

        it("Should mint paper with parents and 0 missing.", async function() {
            u4 = await UnitFactory.deploy(
                "Unit4", "U4", "url4", "creator4", creator3, scienceContract.address, ["url0", "url1"], [u0.address, u1.address]
            )  
            // Make merkle root, etc.
        });        

        it("Should add a parent.", async function() {
            expect(await u3.getKnownParents()).to.equal([u0.address, u1.address]);
            await u3.addParent(u4.address)
            expect(await u3.getKnownParents()).to.equal([u0.address, u1.address, u4.address]);
        });               
        
        it("Should set up the first Splits contract on u0.", async function() {
            // TODO
        })

        it("Should send held balance from u0 to the last splits contract.", async function() {
            // TODO
        })

    })
})
  