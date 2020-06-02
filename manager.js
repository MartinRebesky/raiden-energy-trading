const express = require('express');
const port = process.env.PORT || 8000;
const app = express();
const fs = require('fs');
const Web3 = require('web3');
const Transaction = require('ethereumjs-tx').Transaction;
const child_process = require('child_process')
var accounts = require('./network/accounts.json');




const cron = require('node-cron');
const axios = require('axios');
const bodyParser = require('body-parser');

const solc = require('solc');
//const keythereum = require("keythereum");
const log = require('ololog').configure({ time: true });
const ansi = require('ansicolor').nice

require('dotenv').config()


app.use(bodyParser.json());
app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

/*start*/
const addr = "0x513C83E1E888bD0a7bCCA3F9950fd7E75f076D09";
const privKey = "78fcdfe9214abf934afefaa3bcc31c6178bf549966b266a01f03869b0b9ea52d";
const tkn = "0x4A077a9dd42726E722eF167c9363EEC318e40182";
const contractaddr = "0x07799d623c82c4c4ada1245eb7688453216d529b";
const rpcUrl = "https://goerli.infura.io/v3/20a2ed4fef6248c2922a3d63fb004698";
const nettingAddr = "0x18e663C2238cdB011e75d4c1E19910499259667A";

/*add new accounts to accounts.json
  n = number of accounts to be added

  move accounts from unused to used
  run a chell command to create n new geth accounts
  write address and keyfile to addresses.json*/
function add(n){

    while(accounts.unused.length != 0 && n > 0){
      account = accounts.unused.pop();
      account.api = "";
      accounts.used.push(account);
      fs.renameSync("./network/data/keystore/unused/" + account.keyfile, "./network/data/keystore/used/" + account.keyfile);
      n--;
    }

  for(n; n > 0; n--){
    let cmd = String(child_process.execSync("geth account new --datadir ./network/data --password ./network/data/password.txt"));
    let output = cmd.split("\n")
    for(str of output){
      if(str.includes("Public address of the key:")){
        var addr = str.split(":")[1].replace(/\s/g, "");
      }else if(str.includes("Path of the secret key file:")){
        var keyfile = str.split(":")[1].split("/")[3];
      }
    }

    accounts.used.push({
      "addr": addr,
      "keyfile": keyfile,
      "api": ""
    });

    fs.renameSync("./network/data/keystore/" + keyfile, "./network/data/keystore/used/" + keyfile);
  }
  fs.writeFileSync("./network/accounts.json", JSON.stringify(accounts));
  writeDockerCompose();
  console.log("added new accounts");
}

/*
  remove an account
  accounts are moved to unused and removed from used
*/
function remove(n){
  if(n > accounts.used.length){
    console.log("not so many accounts available");
    return false;
  }

  for(let i = 0; i < n; i++){
    account = accounts.used.pop();
    accounts.unused.push(account);
    try {
      fs.renameSync("./network/data/keystore/used/" + account.keyfile, "./network/data/keystore/unused/" + account.keyfile);
    } catch (e) {
      console.log(e)
    }

  }
  fs.writeFileSync("./network/accounts.json", JSON.stringify(accounts));
  writeDockerCompose();
  console.log("removed accounts");
}

/*write the docker-compose.yml for every used account
  create 1 network for 5 accounts
  write the api for an account in accounts.json*/
function writeDockerCompose(){
  let res = "version: '3'\nnetworks:\n";
  for(let i = 1; i <= Math.ceil(accounts.used.length/5); i++){
    res +=
    "  raiden_net_" + i + ":\n" +
          "    driver: bridge\n" +
          "    ipam:\n" +
            "      driver: default\n" +
            "      config:\n" +
            "      - subnet: 172." + i + ".144.0/16\n\n";
  }

  res += "services:\n";

  let netid = 5;
  for(let i = 1; i <= accounts.used.length; i++){
    let api = "http://172." + Math.ceil(i/5) + ".144." + netid + ":5001/api/v1/";
    accounts.used[i-1].api = api;
    res +=
    "  raiden_" + accounts.used[i-1].addr.toLowerCase() + ": \n" +
    			"    build:\n" +
          			"      context: . \n" +
          			"      dockerfile: ./Dockerfile \n" +
        			"    volumes: \n" +
          				"      - './data:/data' \n" +
        			"    networks: \n" +
          				"      raiden_net_" + Math.ceil(i/5) + ": \n" +
            				"        ipv4_address: '172." + Math.ceil(i/5) + ".144." + netid + "' \n" +
        			"    command: \n" +
          				"      --keystore-path ./data/keystore/used \n" +
          				"      --network-id goerli \n" +
          				"      --eth-rpc-endpoint " + rpcUrl + " \n" +
          				"      --gas-price fast \n" +
          				"      --environment-type development \n" +
         				"      --api-address 0.0.0.0:5001 \n" +
         				"      --accept-disclaimer \n" +
         				"      --address '" + accounts.used[i-1].addr + "' \n" +
          				"      --password-file ./data/password.txt\n" +
    					"      --web-ui\n\n";
    if(netid == 9){
      netid = 5;
    }else{
      netid++
    }
  }
  fs.writeFileSync("./network/accounts.json", JSON.stringify(accounts));
  fs.writeFileSync("./network/docker-compose.yml", res);
}

/*
  sends 0.01 testether to each used account when balance < 0.01
*/
async function sendEther(){
  let web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));
  var amount = await web3.utils.numberToHex(web3.utils.toWei('0.01', 'ether'));
  balance_manager = await web3.utils.fromWei( await web3.eth.getBalance(addr));
  console.log(balance_manager);

  for (account of accounts.used){
    balance_account = await web3.utils.fromWei(await web3.eth.getBalance(account.addr));

    if(balance_account >= 0.01){
      continue;
    }

    console.log(balance_account);

    try{
      let gasPrice = await web3.eth.getGasPrice();
      let nonce = await web3.eth.getTransactionCount(addr);

      let data = {
        from: addr,
        to: account.addr,
        gasPrice: await web3.utils.toHex(gasPrice),
        gas: web3.utils.toHex(1000000),
        nonce: web3.utils.toHex(nonce),
        value: amount,
        chainId: '0x05'
      };

      //create new transaction and sign
      let transaction = new Transaction(data, {chain: "goerli"});
      let bufferedKey = Buffer.from(privKey, "hex");
      transaction.sign(bufferedKey);

      //send transaction
      let serializedTx = transaction.serialize();
      await web3.eth.sendSignedTransaction("0x" + serializedTx.toString("hex"));
  } catch(err){
    sendEther();
  }
}

}

//tokennetwork request start
/*
  if a raiden client has not allready joined the tokennetwork, then mint tokens and join the tokennetwork
*/
async function checkTokenNetwork(){
  for(account of accounts.used){
    try {
      x = await axios.get(account.api + "connections");
      if(!x.data.hasOwnProperty(tkn)){
        mintAndJoinToken(account.addr);
      }else{
        console.log(account.addr + " allready joined")
      }
    } catch (e) {
      console.log(account.addr + " not online")
    }
  }
}

/*
  mints token for every used account
  if succesfully minted some tokens, then join the tokennetwork
*/

function mintAndJoinToken(addr){
  for (account of accounts.used){
    if(account.addr == addr){
      let connect = account.api + "_testing/tokens/" + tkn + "/mint";
      let data = {
  	     "to": account.addr,
  	      "value": 51000000000000000000
      };

      axios.post(connect, data).then(
  	    response => {
  		      console.log(addr + " minted tokens")
            joinTokennetwork(addr);
  	    }
  	  ).catch(err => {console.log(addr + ": minting failed")});
      break;
    }
  }
}

/*
  join the tokennetwork
*/
function joinTokennetwork(addr){
  for(account of accounts.used){
    if(account.addr == addr){
      let connect = account.api + "connections/" + tkn;
      let data = {
  	     "funds":50000000000000000000
      };

      axios.put(connect, data).then(
  	    response => {
  		      console.log(addr + " joined tokennetwork");
  	    }
  	).catch(err => {console.log(addr + ": join tokennetwork failed")});
    break;
    }

  }
}
//tokennetwork requests end

/*
  checks if all used clients have an open payment channel with the netting server
  @param open = boolean. if no open payment channel -> join or not (true, false)
*/
async function checkPaymentChannel(join){
  for(account of accounts.used){
    try {
      response = await axios.get(account.api + "channels/" + tkn + "/" + nettingAddr);
      console.log(response.data)
    } catch (e) {
      if(join && e.response.status == 404){

      }
    }

  }
}

/*
  return and print all used accounts
*/
function getUsedAccounts(){
  let res = [];
  for(account of accounts.used){
    console.log(account);
    res.push(account);
  }
  console.log("\n" + res.length);
  return res
}

/*
  checks if all used raiden clients are online
*/
async function checkOnline(){
  for(account of accounts.used){
    try {
      response = await axios.get(account.api + "address");
      if(response.data.our_address != undefined){
        console.log(response.data.our_address + " is online")
      }
    } catch (e) {
      console.log(account.addr + " is not online");
    }
  }
}

async function test(){
  try {
    x = await axios.get(accounts.used[0].api + "address")
    console.log(x.data.our_address)
  } catch (e) {
    console.log(e)
  }
}

//writeDockerCompose();
//getUsedAccounts();
//checkPaymentChannel(false);
checkOnline();
//checkTokenNetwork();
//sendEther();
//add(10);


/*
app.get('/test', async(req, res) => {

res.send(accounts);
});

function getPrivkey(){
    var keyObject = keythereum.importFromFile(addr, "./");
    var privateKey = keythereum.recover("1234", keyObject);
    console.log(privateKey.toString('hex'));
};

app.listen(port, () => {
    console.log(`Netting Server listening on ${port}`);

});
*/
