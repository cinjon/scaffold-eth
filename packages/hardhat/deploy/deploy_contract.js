// deploy/00_deploy_your_contract.js
const { ethers, getUnnamedAccounts } = require("hardhat");

module.exports = async ({ getNamedAccounts, getUnnamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { frontend, admin, allPool, creator0, creator1, creator2, creator3, creator4, creator5, creator6, creator7, deployer } = await getNamedAccounts();
  const creatorAddresses = [creator0, creator1, creator2, creator3, creator4, creator5, creator6, creator7];
  // getNamedAccounts().then(accounts => {console.log('Get Named Accounts'); console.log(accounts);})
  // getUnnamedAccounts().then(accounts => {console.log('Get Unnamed Accounts'); console.log(accounts);})

  const allAccounts = await ethers.getSigners();
  console.log(allAccounts.map(account => account.address));
  const accounts = await ethers.getSigners().then(accounts => accounts.filter(account => creatorAddresses.indexOf(account.address) > -1));
  // console.log('accounts')  ;
  // console.log(accounts.map(account => account.address));

  // console.log('creators')
  // console.log(creatorAddresses)
  
  // console.log('alternating accounts and creators [4, 7]')
  // console.log(accounts[4].address);
  // console.log(creatorAddresses[4]);
  // console.log(accounts[5].address);
  // console.log(creatorAddresses[5]);
  // console.log(accounts[6].address);
  // console.log(creatorAddresses[6]);
  // console.log(accounts[7].address);
  // console.log(creatorAddresses[7]);


  // Have people send ether to each other.
  var j = 0;
  for (var i=0; i<3; i++) {
    shuffle(creatorAddresses)
    j = -1;
    for (const account of accounts) {    
      j += 1;
      if (creatorAddresses[j] == account.address) {
        continue;
      }

      const numEth = (1 + getRandomInt(10)).toString();
      await account.sendTransaction({
        to: creatorAddresses[j], // "contract address",
        value: ethers.utils.parseEther(numEth), 
      });
    }  
  }

  // Make the Poolcoin and the Unit coins with not parents.  
  const scienceCoin = await deploy("SciencePool", {
    from: deployer,
    contract: "PoolCoin",
    args: ["RSF Science", "RFSCI"],
    log: true
  });
  const scienceAddress = scienceCoin.address;
  const mlcCoin = await deploy("MLCPool", {
    from: deployer,
    contract: "PoolCoin",
    args: ["RSF MLCollective", "RFMLC"],
    log: true
  });
  const mlcAddress = mlcCoin.address;

  // Fuck, we can't do the parentMerkleAddress beforehand because we need to give that contract this token address.
  // Unless ... unless we made it ownable until we set the tokenAddress...?
  // What we could do is a) first deploy this contract, then b) deploy the parentMerkleAddress with this token address.
  // and then c) go back and deploy the parentSupply to that parentAddress. But then who pays for b) and c)?
  // if we could have a slow rollout of the parentMerkleAddress by letting it get changed by this contract..., that would
  // work too. But we wouldnt be able to do that because this contract wouldn't own it yet.

  // Assuming scienceAddress is at 0x5FbDB2315678afecb367f032d93F642f64180aa3,
  // The merkle root is at {"merkleRoot":"0x3f884a605dab55f926db10d6c94cee3e6717f6d9df013ae4716da0113b8ded24","tokenTotal":"0x3635c9adc5dea00000","claims":{"0x5FbDB2315678afecb367f032d93F642f64180aa3":{"index":0,"amount":"0x3635c9adc5dea00000","proof":[]}}}
  const scienceMerkle1000 = "0x3f884a605dab55f926db10d6c94cee3e6717f6d9df013ae4716da0113b8ded24";
  console.log(scienceAddress);
  console.log(mlcAddress);
  // TODO: Make a uniswap airdrop merkle out of the scienceCoin
  
  const UnitFactory = await ethers.getContractFactory("UnitCoinV1");
  const u0Factory = await UnitFactory.deploy(
    "Unit0", "U0", "url0", "creator0", creator0, scienceAddress, ["ParentID1", "ParentID2", "ParentID3"], []
    );
    console.log(u0Factory);
  console.log('hiiii');

  const u0 = await deploy("Unit0", {
    from: deployer,
    contract: "UnitCoinV1",
    args: [
      "Unit0", "U0", "url0", "creator0", creator0, scienceAddress, ["ParentID1", "ParentID2", "ParentID3"], []
    ],
    log: true,
  });
  const u0ParentMerkle = await deploy("Unit0ParentMerkle", {
    from: deployer,
    contract: "MerkleDistributor",
    args: [u0.address, scienceMerkle1000],
    log: true
  })

  // const u1 = await deploy("Unit1", {
  //   from: deployer,
  //   contract: "UnitCoinV1",
  //   args: ["Unit1", "U1", "hash1", "url1", "creator1", creator1, allPool],
  //   log: true,
  // });

  // const u2 = await deploy("Unit2", {
  //   from: deployer,
  //   contract: "UnitCoinV1",
  //   args: ["Unit2", "U2", "hash2", "url2", "creator2", creator2, allPool],
  //   log: true,
  // });

  // const u3 = await deploy("Unit3", {
  //   from: deployer,
  //   contract: "UnitCoinV1",
  //   args: ["Unit3", "U3", "hash3", "url3", "creator3", creator3, allPool],
  //   log: true,
  // });

  // const u4 = await deploy("Unit4", {
  //   from: deployer,
  //   contract: "UnitCoinV1",
  //   args: ["Unit4", "U4", "hash4", "url4", "creator4", creator4, allPool],
  //   log: true,
  // });

  // const u5 = await deploy("Unit5", {
  //   from: deployer,
  //   contract: "UnitCoinV1",
  //   args: ["Unit5", "U5", "hash5", "url5", "creator5", creator5, allPool],
  //   log: true,
  // });

  // const u6 = await deploy("Unit6", {
  //   from: deployer,
  //   contract: "UnitCoinV1",
  //   args: ["Unit6", "U6", "hash6", "url6", "creator6", creator6, allPool],
  //   log: true,
  // });

  // const u7 = await deploy("Unit7", {
  //   from: deployer,
  //   contract: "UnitCoinV1",
  //   args: ["Unit7", "U7", "hash7", "url7", "creator7", creator7, allPool],
  //   log: true,
  // });

  
  // // NOTE: This is not working :(
  // const tokenU4 = await ethers.getContractAt("UnitCoinV1", u4.address);  
  // // await tokenU4.transferOwnership("0x06D7B826826fc0b8480B002949D7d28b8CAd8242")  
  
  // // Transfer some Unit4 from account 4 to account 6 and 7.
  // const trans1 = await tokenU4.connect(accounts[4]).transfer(creatorAddresses[7], 25)
  // const trans2 = await tokenU4.connect(accounts[4]).transfer(creatorAddresses[6], 55)
  // // Transfer some Unit4 from account 6 to account 3.
  // const trans3 = await tokenU4.connect(accounts[6]).transfer(creatorAddresses[3], 8)
  // // Transfer some Unit4 from account 7 to account 0.
  // const trans4 = await tokenU4.connect(accounts[7]).transfer(creatorAddresses[0], 7)
    


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

  // const uniswapMerkleRoot = "0xc8500f8e2fcf3c9a32880e1b973fb28acc88be35787a8abcf9981b2b65dbdeb5";
  // const uniswapTokenAddress = "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984";
  // // const uniswapDistributor = await deploy("MerkleDistributor", {
  // //   from: deployer,
  // //   contract: "MerkleDistributor",
  // //   args: [uniswapTokenAddress, uniswapMerkleRoot],
  // //   log: true,
  // // });


  // const genRanHex = size => [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');

  // // PaymentSplitter
  // const peopleNums = [1, 2, 3, 4, 5, 10, 50, 100, 500, 1000, 8000];

  // let num = peopleNums[0];
  // console.log('Dong people num ' + num.toString())
  // let addresses = [...Array(num).keys()].map(n => "0x" + genRanHex(40));
  // console.log(addresses);
  // let shares = Array.from({length: addresses.length}, () => 1+ Math.floor(Math.random() * 40));
  // await deploy("PaymentSplitter" + num, {
  //   from: deployer,
  //   contract: "PaymentSplitter",
  //   args: [addresses, shares],
  //   log: true,
  // });  

  // num = peopleNums[1];
  // console.log('Dong people num ' + num.toString())
  // addresses = [...Array(num).keys()].map(n => "0x" + genRanHex(40));
  // shares = Array.from({length: addresses.length}, () => 1+ Math.floor(Math.random() * 40));
  // await deploy("PaymentSplitter" + num, {
  //   from: deployer,
  //   contract: "PaymentSplitter",
  //   args: [addresses, shares],
  //   log: true,
  // });  

  // num = peopleNums[2];
  // console.log('Dong people num ' + num.toString())
  // addresses = [...Array(num).keys()].map(n => "0x" + genRanHex(40));
  // shares = Array.from({length: addresses.length}, () => 1+ Math.floor(Math.random() * 40));
  // await deploy("PaymentSplitter" + num, {
  //   from: deployer,
  //   contract: "PaymentSplitter",
  //   args: [addresses, shares],
  //   log: true,
  // });  

  // num = peopleNums[3];
  // console.log('Dong people num ' + num.toString())
  // addresses = [...Array(num).keys()].map(n => "0x" + genRanHex(40));  
  // shares = Array.from({length: addresses.length}, () => 1+ Math.floor(Math.random() * 40));
  // await deploy("PaymentSplitter" + num, {
  //   from: deployer,
  //   contract: "PaymentSplitter",
  //   args: [addresses, shares],
  //   log: true,
  // });  

  // num = peopleNums[4];
  // console.log('Dong people num ' + num.toString())
  // addresses = [...Array(num).keys()].map(n => "0x" + genRanHex(40)); 
  // shares = Array.from({length: addresses.length}, () => 1+ Math.floor(Math.random() * 40));
  // await deploy("PaymentSplitter" + num, {
  //   from: deployer,
  //   contract: "PaymentSplitter",
  //   args: [addresses, shares],
  //   log: true,
  // });  

  // num = peopleNums[5];
  // console.log('Dong people num ' + num.toString())
  // addresses = [...Array(num).keys()].map(n => "0x" + genRanHex(40)); 
  // shares = Array.from({length: addresses.length}, () => 1+ Math.floor(Math.random() * 40));
  // await deploy("PaymentSplitter" + num, {
  //   from: deployer,
  //   contract: "PaymentSplitter",
  //   args: [addresses, shares],
  //   log: true,
  // });  


  // num = peopleNums[6];
  // console.log('Dong people num ' + num.toString())
  // addresses = [...Array(num).keys()].map(n => "0x" + genRanHex(40)); 
  // shares = Array.from({length: addresses.length}, () => 1 + Math.floor(Math.random() * 40));
  // await deploy("PaymentSplitterTest" + num, {
  //   from: deployer,
  //   contract: "PaymentSplitterTest",
  //   args: [addresses, shares],
  //   log: true,
  // });  

  // const deployProxyFactory = async (
  //   splitterAddress: string,
  //   fakeWETHAddress: string
  // ) => {
  //   const SplitFactory = await ethers.getContractFactory("SplitFactory");
  //   const proxyFactory = await SplitFactory.deploy(
  //     splitterAddress,
  //     fakeWETHAddress
  //   );
  //   return await proxyFactory.deployed();
  // };

  // const deploySplitter = async () => {
  //   const Splitter = await ethers.getContractFactory("Splitter");
  //   const splitter = await Splitter.deploy();
  //   return await splitter.deployed();
  // };

  // const mirrorMerkleRoot = uniswapMerkleRoot
  // const mirrorWethAddress = uniswapTokenAddress;


  // const splitter = await deploy("Splitter", {
  //   from: deployer,
  //   contract: "Splitter",
  //   // args: [],
  //   log: true,
  // });  

  
  // // console.log(splitter);
  // // console.log(splitter.address);
  // // console.log(mirrorWethAddress);

  
  // const splitFactory = await deploy("SplitFactory", {
  //   from: deployer,
  //   contract: "SplitFactory",
  //   args: [splitter.address, mirrorWethAddress],
  //   log: true,
  // });
  // const splitFactoryContract = await ethers.getContractAt("SplitFactory", splitFactory.address);
  // console.log(deployer)
  // console.log(allAccounts[0].address);
  // const splitProxy = await splitFactoryContract.connect(allAccounts[0]).createSplit(mirrorMerkleRoot);
  // console.log(splitProxy);
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