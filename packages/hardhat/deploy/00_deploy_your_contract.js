// deploy/00_deploy_your_contract.js

const { ethers, getUnnamedAccounts } = require("hardhat");

module.exports = async ({ getNamedAccounts, getUnnamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { admin, allPool, creator0, creator1, creator2, creator3, creator4, creator5, creator6, deployer } = await getNamedAccounts();

  const poolCoin = await deploy("PoolCoin", {
    from: deployer,
    args: [],
    log: true
  });

  const u0 = await deploy("Unit0", {
    from: deployer,
    contract: "UnitCoinV1",
    args: ["Unit0", "U0", "hash0", "url0", "creator0", creator0, admin, allPool, [], []],
    log: true,
  });


  const u1 = await deploy("Unit1", {
    from: deployer,
    contract: "UnitCoinV1",
    args: ["Unit1", "U1", "hash1", "url1", "creator1", creator1, admin, allPool, [], []],
    log: true,
  });

  // const u2 = await deploy("UnitV1", {
  //   from: deployer,
  //   args: ["Unit2", "U2", "hash2", "url2", "creator2", creator2, admin, allPool, [], []],
  //   log: true,
  // });

  // const u2 = await deploy("UnitV1", {
  //   from: deployer,
  //   args: ["Unit0", "U0", "hash0", "url0", "creator0", creator0, admin, allPool, [], []],
  //   log: true,
  // });

  // const u0 = await deploy("UnitV1", {
  //   from: deployer,
  //   args: ["Unit0", "U0", "hash0", "url0", "creator0", creator0, admin, allPool, [], []],
  //   log: true,
  // });

  // const u0 = await deploy("UnitV1", {
  //   from: deployer,
  //   args: ["Unit0", "U0", "hash0", "url0", "creator0", creator0, admin, allPool, [], []],
  //   log: true,
  // });


  /*
    // Getting a previously deployed contract
    const YourContract = await ethers.getContract("YourContract", deployer);
    await YourContract.setPurpose("Hello");

    //const yourContract = await ethers.getContractAt('YourContract', "0xaAC799eC2d00C013f1F11c37E654e59B0429DF6A") //<-- if you want to instantiate a version of a contract at a specific address!
  */

  /*
  //If you want to send value to an address from the deployer
  const deployerWallet = ethers.provider.getSigner()
  await deployerWallet.sendTransaction({
    to: "0x34aA3F359A9D614239015126635CE7732c18fDF3",
    value: ethers.utils.parseEther("0.001")
  })
  */

  /*
  //If you want to send some ETH to a contract on deploy (make your constructor payable!)
  const yourContract = await deploy("YourContract", [], {
  value: ethers.utils.parseEther("0.05")
  });
  */

  /*
  //If you want to link a library into your contract:
  // reference: https://github.com/austintgriffith/scaffold-eth/blob/using-libraries-example/packages/hardhat/scripts/deploy.js#L19
  const yourContract = await deploy("YourContract", [], {}, {
   LibraryName: **LibraryAddress**
  });
  */
};
module.exports.tags = ["UnitV1", "PoolCoin", "PoolCoin2"];
