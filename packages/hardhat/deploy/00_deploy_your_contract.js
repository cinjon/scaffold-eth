// deploy/00_deploy_your_contract.js

const { ethers, getUnnamedAccounts } = require("hardhat");

module.exports = async ({ getNamedAccounts, getUnnamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { frontend, admin, allPool, creator0, creator1, creator2, creator3, creator4, creator5, creator6, creator7, deployer } = await getNamedAccounts();

  getNamedAccounts().then(accounts => {console.log('Get Named Accounts'); console.log(accounts);})
  getUnnamedAccounts().then(accounts => {console.log('Get Unnamed Accounts'); console.log(accounts);})

  const poolCoin = await deploy("PoolCoin", {
    from: deployer,
    args: [],
    log: true
  });

  const u0 = await deploy("Unit0", {
    from: deployer,
    contract: "UnitCoinV1",
    args: ["Unit0", "U0", "hash0", "url0", "creator0", creator0, allPool, [], []],
    log: true,
  });


  const u1 = await deploy("Unit1", {
    from: deployer,
    contract: "UnitCoinV1",
    args: ["Unit1", "U1", "hash1", "url1", "creator1", creator1, allPool, [], []],
    log: true,
  });

  const u2 = await deploy("Unit2", {
    from: deployer,
    contract: "UnitCoinV1",
    args: ["Unit2", "U2", "hash2", "url2", "creator2", creator2, allPool, [], []],
    log: true,
  });

  const u3 = await deploy("Unit3", {
    from: deployer,
    contract: "UnitCoinV1",
    args: ["Unit3", "U3", "hash3", "url3", "creator3", creator3, allPool, [u0.address], [100]],
    log: true,
  });

  const u4 = await deploy("Unit4", {
    from: deployer,
    contract: "UnitCoinV1",
    args: ["Unit4", "U4", "hash4", "url4", "creator4", creator4, allPool, [u0.address], [50]],
    log: true,
  });

  const u5 = await deploy("Unit5", {
    from: deployer,
    contract: "UnitCoinV1",
    args: ["Unit5", "U5", "hash5", "url5", "creator5", creator5, allPool, [u0.address, u1.address], [40, 60]],
    log: true,
  });

  const u6 = await deploy("Unit6", {
    from: deployer,
    contract: "UnitCoinV1",
    args: ["Unit6", "U6", "hash6", "url6", "creator6", creator6, allPool, [u5.address, u2.address], [40, 60]],
    log: true,
  });

  const u7 = await deploy("Unit7", {
    from: deployer,
    contract: "UnitCoinV1",
    args: ["Unit7", "U7", "hash7", "url7", "creator7", creator7, allPool, [u4.address, u2.address], [40, 60]],
    log: true,
  });

  // const tokenU4 = await ethers.getContractAt("UnitCoinV1", u4.address);  
  // await tokenU4.transferOwnership("0x06D7B826826fc0b8480B002949D7d28b8CAd8242")
  const deployerWallet = ethers.provider.getSigner();
  console.log(deployerWallet);
  console.log('*****');
  // await creator0.sendTransaction({to: creator1, value: ethers.utils.parseEther("0.1")})

  [owner] = await ethers.getSigners();
  console.log(owner)
  
  const transactionHash = await owner.sendTransaction({
    to: creator0, // "contract address",
    value: ethers.utils.parseEther("1.0"), // Sends exactly 1.0 ether
  });
  console.log(transactionHash);

  // // Acccounts now exposed
  // const params = [{
  //   from: creator1,
  //   to: creator2,
  //   value: ethers.utils.parseEther("0.1") // ethers.utils.parseUnits("0.1", 'ether').toHexString()
  // }];

  // const transactionHash = await ethers.provider.send('eth_sendTransaction', params)
  // console.log('transactionHash is ' + transactionHash);

  // const creator0Artifact = await ethers.getContractAt("Creator0", creator0);
  // console.log(creator0Artifact);
  // await ethers.getContractAt("UnitCoinV1", u4.address);
  // await tokenU4.transferOwnership("0x06D7B826826fc0b8480B002949D7d28b8CAd8242")
  // await tokenU4.transferOwnership("0x06D7B826826fc0b8480B002949D7d28b8CAd8242")
  // await tokenU4.transferOwnership("0x06D7B826826fc0b8480B002949D7d28b8CAd8242")

  // Ok, so now let's pass around some coins.

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
module.exports.tags = ["UnitCoinV1", "PoolCoin"];
