// deploy/00_deploy_your_contract.js
const { assert } = require("console");
const { ethers, getUnnamedAccounts } = require("hardhat");

module.exports = async ({ getNamedAccounts, getUnnamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { admin, deployer, science, mlc, adam, cinjon, frontend } = await getNamedAccounts();
  const accounts = await ethers.getSigners();
  console.log(science); // account 12
  console.log(mlc); // account 13
  console.log(cinjon); // account 14
  console.log(adam);
  console.log(deployer); // account 0
  const namedAccounts = [adam, cinjon, science, mlc];
  console.log(accounts.filter(account => namedAccounts.indexOf(account.address) > -1).map(account => account.address));
  const zeroAddress = "0x0000000000000000000000000000000000000000";

  // Make the Poolcoin and the Unit coins with not parents.  
  const scienceCoinDeploy = await deploy("SciencePool", {
    from: deployer, // science, // deployer,
    contract: "PoolCoin",
    args: ["SCI Science 2", "SCIP-SCI"],
    log: true
  });
  const scienceCoin = await ethers.getContractAt("PoolCoin", scienceCoinDeploy.address);
  const scienceOwner = await scienceCoin.owner();
  // assert(scienceOwner == deployer);
  const scienceAddress = scienceCoin.address;

  const mlcCoinDeploy = await deploy("MLCPool", {
    from: deployer, // mlc, // deployer
    contract: "PoolCoin",
    args: ["SCI MLCollective 2", "SCIP-SCI"],
    log: true
  });
  const mlcCoin = await ethers.getContractAt("PoolCoin", mlcCoinDeploy.address);
  const mlcAddress = mlcCoin.address;  
  const mlcOwner = await mlcCoin.owner();
  // assert(mlcOwner == deployer);

  console.log('addresses');
  console.log(scienceAddress); // on rinkeby: 0xc3Ee875B98ce225307bE46b7A6371a63c2542303
  const UnitFactory = await ethers.getContractFactory("UnitCoinV1");
  // Deploy pommerman all to scienceAddress. This took gas = 1743170. Expensive! We can save by hashing all of the 
  // strings together.
  pommerman = await deploy("PommermanCoin", {
    from: deployer, // cinjon, // deployer,
    contract: "UnitCoinV1",
    args: ["Pommerman: A Multi-Agent Playground 2", "SCIC-PAMAP", "arxiv.org/abs/1809.07124", "Cinjon Resnick", cinjon, scienceAddress, scienceAddress,
           ["10.1609/aimag.v35i3.2549", "ijcai.org/proceedings/2017/772", "nature.com/articles/nature16961", "arxiv.org/abs/1605.06676"], [], scienceAddress],
    log: true
  });
  // I sent 1000 to Adam offline.
  console.log(pommerman.address); // on rinkeby: 0xaa596A3972Cf2211c31f7c956a710ae50F141f1F
  console.log(cinjon) // 0xCD2d5Dfa106aad2B9235dBd2D44D62dD9c8f5E63

  // Deploy backplay to a combination of 0.4 Pommerman, 0.3 ALE, 0.3 RCG --> give 0.4 to pommerman and 0.6 to science 
  // (for storage) in the merkle. The 0.4 to Pommerman is going 0.79 to cinjon (owner), 0.1 to Adam, 0.01 to science 
  // for pool, and 0.10 to science for parents. So that's 0.79*0.4=0.316 to cinjon, 0.1*0.4 = 0.04 to Adam, and 
  // 0.11*0.4 + 0.6 = 0.644 to science.
  // Assuming that the pommerman addres is at 0xaa596A3972Cf2211c31f7c956a710ae50F141f1F on rinkeby and the cinjon address
  // at 0xCD2d5Dfa106aad2B9235dBd2D44D62dD9c8f5E63 and ADam at 0x95F978fcdcdA9BdF7bdB1Eef42Fc4a4C199828CB, then the 
  // merkleRoot is:
  // {"merkleRoot":"0x11fde7b18cab8fe72f09dd4978ceece0ee84b24d744a024cb8683a509b939364","tokenTotal":"0x3635c9adc5dea00000","claims":{"0x95F978fcdcdA9BdF7bdB1Eef42Fc4a4C199828CB":{"index":0,"amount":"0x022b1c8c1227a00000","proof":["0x1db8298955190f688ddfc0c62ba042314b8afb7fc60f3bd991f3d66b8963f4e0","0xb0106a9e0dd1df58d76a3fdde9f7e9b9301efb2b4df467d5516174337ba69c71"]},"0x99bD72290Ef8277B929F5C3C719f438f8b44Fd2c":{"index":1,"amount":"0x22e94b9bf117900000","proof":["0x8cf8cd7af7179a9e438bec1df6ff7c686ba3294bd478ede7f3e0d6560f652327","0xb0106a9e0dd1df58d76a3fdde9f7e9b9301efb2b4df467d5516174337ba69c71"]},"0xCD2d5Dfa106aad2B9235dBd2D44D62dD9c8f5E63":{"index":2,"amount":"0x11216185c29f700000","proof":["0x670279bb9a577cc26a10f6ddf9feebb35db2a3196dd89ea106a163be93b5da8b"]}}}
  const backplayMerkleRoot = "0x11fde7b18cab8fe72f09dd4978ceece0ee84b24d744a024cb8683a509b939364"
  MerkleFactory = await ethers.getContractFactory("MerkleDistributor"); 
  // This is at 0xb1D01179b05283d632D59886BA0728619e24D799 and took 470483 gas
  backplayParentMerkle = await deploy("MerkleDistributor", {
    from: deployer, // cinjon,
    args: [zeroAddress, backplayMerkleRoot],
    log: true
  });

  // It's gas=77234 to do the setTokenOnce and it's gas=1933492 to do the deploy.
  // ... Somehow it ended up being 1853707 to do the full deploy locally. How did that work?
  // 0x7c6dA498B910c5DE9c9D2C4F0985d77ACE260F2A with 1853767 gas
  backplay = await deploy("BackplayCoin", { // 1853743 gas
    from: deployer, // cinjon,
    contract: "UnitCoinV1",
    args: ["Backplay: Man muss immer umkehren 2", "SCIC-BMMIU", "arxiv.org/abs/1807.06919", "Cinjon Resnick", cinjon, scienceAddress, scienceAddress,
    ["arxiv.org/abs/1809.07124", "arxiv.org/abs/1207.4708", "proceedings.mlr.press/v78/florensa17a.html"], [pommerman.address], backplayParentMerkle.address],
    log: true,
    gasLimit: ethers.BigNumber.from('2250000'),
  });
};
module.exports.tags = ["UnitCoinV1", "PoolCoin"];


function shuffle(array) {
  var currentIndex = array.length,  randomIndex;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}