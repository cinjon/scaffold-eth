// deploy/00_deploy_your_contract.js

const { ethers, getUnnamedAccounts } = require("hardhat");

module.exports = async ({ getNamedAccounts, getUnnamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { frontend, admin, allPool, creator0, creator1, creator2, creator3, creator4, creator5, creator6, creator7, deployer } = await getNamedAccounts();

  const creatorAddresses = [creator0, creator1, creator2, creator3, creator4, creator5, creator6, creator7];
  getNamedAccounts().then(accounts => {console.log('Get Named Accounts'); console.log(accounts);})
  getUnnamedAccounts().then(accounts => {console.log('Get Unnamed Accounts'); console.log(accounts);})

  const accounts = await ethers.getSigners().then(accounts => accounts.filter(account => creatorAddresses.indexOf(account.address) > -1));
  console.log('accounts')  ;
  console.log(accounts.map(account => account.address));

  console.log('creators')
  console.log(creatorAddresses)
  
  console.log('alternating accounts and creators [4, 7]')
  console.log(accounts[4].address);
  console.log(creatorAddresses[4]);
  console.log(accounts[5].address);
  console.log(creatorAddresses[5]);
  console.log(accounts[6].address);
  console.log(creatorAddresses[6]);
  console.log(accounts[7].address);
  console.log(creatorAddresses[7]);

  // Have people send ether to each other.
  // var j = 0;
  // for (var i=0; i<3; i++) {
  //   shuffle(creatorAddresses)
  //   j = -1;
  //   for (const account of accounts) {    
  //     j += 1;
  //     if (creatorAddresses[j] == account.address) {
  //       continue;
  //     }

  //     const numEth = (1 + getRandomInt(10)).toString();
  //     await account.sendTransaction({
  //       to: creatorAddresses[j], // "contract address",
  //       value: ethers.utils.parseEther(numEth), 
  //     });
  //   }  
  // }

  // Make the Poolcoin and the Unit coins with not parents.
  const poolCoin = await deploy("PoolCoin", {
    from: deployer,
    args: [],
    log: true
  });

  const u0 = await deploy("Unit0", {
    from: deployer,
    contract: "UnitCoinV1",
    args: ["Unit0", "U0", "hash0", "url0", "creator0", creator0, allPool],
    log: true,
  });


  const u1 = await deploy("Unit1", {
    from: deployer,
    contract: "UnitCoinV1",
    args: ["Unit1", "U1", "hash1", "url1", "creator1", creator1, allPool],
    log: true,
  });

  const u2 = await deploy("Unit2", {
    from: deployer,
    contract: "UnitCoinV1",
    args: ["Unit2", "U2", "hash2", "url2", "creator2", creator2, allPool],
    log: true,
  });

  const u3 = await deploy("Unit3", {
    from: deployer,
    contract: "UnitCoinV1",
    args: ["Unit3", "U3", "hash3", "url3", "creator3", creator3, allPool],
    log: true,
  });

  const u4 = await deploy("Unit4", {
    from: deployer,
    contract: "UnitCoinV1",
    args: ["Unit4", "U4", "hash4", "url4", "creator4", creator4, allPool],
    log: true,
  });

  const u5 = await deploy("Unit5", {
    from: deployer,
    contract: "UnitCoinV1",
    args: ["Unit5", "U5", "hash5", "url5", "creator5", creator5, allPool],
    log: true,
  });

  const u6 = await deploy("Unit6", {
    from: deployer,
    contract: "UnitCoinV1",
    args: ["Unit6", "U6", "hash6", "url6", "creator6", creator6, allPool],
    log: true,
  });

  const u7 = await deploy("Unit7", {
    from: deployer,
    contract: "UnitCoinV1",
    args: ["Unit7", "U7", "hash7", "url7", "creator7", creator7, allPool],
    log: true,
  });

  
  // NOTE: This is not working :(
  const tokenU4 = await ethers.getContractAt("UnitCoinV1", u4.address);  
  // await tokenU4.transferOwnership("0x06D7B826826fc0b8480B002949D7d28b8CAd8242")  
  
  // Transfer some Unit4 from account 4 to account 6 and 7.
  const trans1 = await tokenU4.connect(accounts[4]).transfer(creatorAddresses[7], 25)
  const trans2 = await tokenU4.connect(accounts[4]).transfer(creatorAddresses[6], 55)
  // Transfer some Unit4 from account 6 to account 3.
  const trans3 = await tokenU4.connect(accounts[6]).transfer(creatorAddresses[3], 8)
  // Transfer some Unit4 from account 7 to account 0.
  const trans4 = await tokenU4.connect(accounts[7]).transfer(creatorAddresses[0], 7)
  console.log(tokenU4);
  console.log(trans1.value);
  console.log(trans2.value);
  console.log(trans3.value);
  console.log(trans4.value);


  // Below this is stuff that was here before that we want to keep for 
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