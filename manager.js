const express = require('express');
const port = process.env.PORT || 8000;
const app = express();
const fs = require('fs');
const Web3 = require('web3');
const Tx = require('ethereumjs-tx').Transaction;
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
const tkn = "0x1276fa5F5DDCb9adEc850E559AfdB37E588DAb7b";
const contractaddr = "0x07799d623c82c4c4ada1245eb7688453216d529b";

/*add new accounts to addresses.json
  n = number of accounts to be added

  move accounts from unused to used
  run a chell command to create n new geth accounts
  write address and keyfile to addresses.json*/
function add(n){

    while(accounts.unused.length != 0){
      account = accounts.unused.pop();
      account.api = "";
      accounts.used.push(account);
      fs.renameSync("./network/data/keystore/unused/" + account.keyfile, "./network/data/keystore/used/" + account.keyfile);
      n--;
    }

  for(let i = 0; i < n; i++){
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
  console.log("added new accounts");
  writeDockerCompose();
}

/*
  remove an account
  accounts are moved to unused and removed from used
*/
function remove(n){
  if(n > accounts.length){
    console.log("not so many accounts available");
    return False
  }

  for(let i = 0; i < n; i++){
    account = accounts.used.pop();
    accounts.unused.push(account);
    fs.renameSync("./network/data/keystore/used/" + account.keyfile, "./network/data/keystore/unused/" + account.keyfile);
  }

  fs.writeFileSync("./network/accounts.json", JSON.stringify(accounts));
  writeDockerCompose();
}

/*write the docker-compose.yml for every account in addresses.json
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
    let api = "http://'172." + Math.ceil(i/5) + ".144." + netid + ":5001/api/v1/";
    accounts.used[i-1].api = api;
    res +=
    "  raiden_" + i + ": \n" +
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
          				"      --eth-rpc-endpoint https://goerli.infura.io/v3/20a2ed4fef6248c2922a3d63fb004698 \n" +
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

  fs.writeFileSync("./network/docker-compose.yml", res);
  fs.writeFileSync("./network/accounts.json", JSON.stringify(accounts));
}

add(7);

/*

app.get('/test', async(req, res) => {

res.send("nur ein test");
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
