const express = require('express');
const app = express();
const fileUpload = require("express-fileupload")

const cron = require('node-cron');
const serverport = process.env.PORT || 8000;
const axios = require('axios');
const bodyParser = require('body-parser');
const fs = require('fs');
const child_process = require('child_process')

const Web3 = require('web3');
const solc = require('solc');
const Tx = require('ethereumjs-tx').Transaction;
const keythereum = require("keythereum");
const log = require('ololog').configure({ time: true });
const ansi = require('ansicolor').nice

const timezone = 2;

require('dotenv').config()


app.use(bodyParser.json());
app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

/*start*/
//const addr = "0xF3457dADCF2E4F6fD2bBcfd2fAE3814e6A3cDBCd";
const addr = checksummed();
const privKey = getPrivKey("1234") //password from first keyfile of keystores
const api = getApi();
const tkn = "0x0321Aa034bED3a22CcFE91E169DB3E63830ad239";
const contractaddr = "0xcc77c453471c00af35d08f0103991cc604adf5a2";
const rpcUrl = "https://goerli.infura.io/v3/568d1aa1488f4d3ca4be7ba148703e01";

/*
returns a checksummed address from any ethereum address
very importent to read keyfile.json and get address
*/
function checksummed() {
    //get keyfiles
    let keystores = fs.readdirSync("./data/keystore");

    //get the address from the first keyfile of keystore
    let json = JSON.parse(fs.readFileSync("./data/keystore/" + keystores[0]));
    let address = json.address.toLowerCase().replace('0x','');;

    //hashing address
    let web3 = new Web3();
    var hash = web3.utils.sha3(address).replace('0x', '');

    var res = '0x';
    for(i in address){
      if(parseInt(hash[i]) < 8){
        res += address[i]
      }else{
        res += address[i].toUpperCase();
      }
    }
    return res
};

/*
returns the private key from the first keyfile of keystore
*/
function getPrivKey(password){
  //get private key with password
  try {
    var keyObject = keythereum.importFromFile(addr.toLowerCase(), "./data");
    var privateKey = keythereum.recover(password, keyObject);
  } catch (e) {
    console.log(e)
  }

  return privateKey.toString("hex");


}

/*
get api from docker-compose file
*/
function getApi(){
  //get string from docker-compose.yml
  let yml = fs.readFileSync("./docker-compose.yml", "UTF8");
  res = ""

  //get ip address
  let index = yml.indexOf("ipv4_address: '") + 15;
  ip = "";
  for(let i = index; i < yml.length; i++){
    if(yml[i] == "'"){
      break
    }else{
      ip += yml[i];
    }
  }

  //get port
  index = yml.indexOf("0.0.0.0:") + 8;
  let port = "";
  for(let i = index; i < yml.length; i++){
    if(yml[i] == " " | yml[i] == "\n" | yml[i] == "\t"){
      break
    }else{
      port += yml[i];
    }
  }

  res += "http://" + ip + ":" + port + "/api/v1/"
  return res
}

/*
start server
*/
app.listen(serverport, () => {
    console.log(addr + ` listening on port ${serverport}`);
    startRaidenClient();
});

//write matches in smart contract and deploy on blockchain
async function deployMatches(){
  //let matches = await matchHouseholds(await getHouseholds());
  let matches = await matchHouseholds(await getHouseholds())
  if(matches.length <= 0){
    console.log("deployMatches: no matches")
    return false
  }
  let web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));

  let abi = JSON.parse(fs.readFileSync("abi.json"));
  let CoursesContract = new web3.eth.Contract(abi, contractaddr);
  let gasPrice = await web3.eth.getGasPrice();
  let nonce = await web3.eth.getTransactionCount(addr);

  let rawTx = {
     from: addr,
     to: contractaddr,
     data: CoursesContract.methods.deployMatches(matches).encodeABI(),
     gasPrice: web3.utils.toHex(gasPrice),
     gas: web3.utils.toHex(8000000),
     nonce: web3.utils.toHex(nonce),
     value: 0x00,
     chainId: 0x05
  };

  //create new transaction and sign
  let tx = new Tx(rawTx, {chain: "goerli"});
  let bufferedKey = Buffer.from(privKey, "hex");

  tx.sign(bufferedKey);
  let serializedTx = tx.serialize();

  //send transaction
  await web3.eth.sendSignedTransaction("0x" + serializedTx.toString("hex"));
  console.log("matches deployed")

};

/*get all households that sends data in the last 10 minutes
  every household is only contained once
  return households[] with [0] = prosumer[](id,balance) and [1] = consumer[](id,balance)*/
async function getHouseholds(){

    let payments = await axios.get(api + "payments/" + tkn);
    let prosumer = [];
    let consumer = [];
    let households = [];
    let contains = [];
    let messages =[]
    let actDate = new Date();

    for(let i = payments.data.length - 1; i >= 0; i--){
	     let paymentDate = new Date(payments.data[i].log_time);
	     if((actDate - paymentDate)/60000 >= 7000){
	        break;
	     }else{
	        let id = payments.data[i].initiator;
	        let balance = payments.data[i].identifier;
	        if(!contains.includes(id)){
            messages.push(payments[i]);
		          contains.push(id);
		          households.push({id, balance});
		          if(balance[0] == '2'){
		              consumer.push({id, "balance":
		              parseInt(balance.substring(1))});
		          }else{
		              prosumer.push({id, "balance":
		              parseInt(balance.substring(1))});
		          }
	        }
	     }
    }

    let res = [prosumer, consumer];
    endDate = new Date();
    console.log(res);
    return res;
};

/*match consumer with prosumer
  return a string array with the format "prosumeraddr:consumeraddr"*/
async function matchHouseholds(households){
  console.log(households);
  let consumer = households[1];
  let prosumer = households[0];

  let res = [];
  let contains = [];

  for(let i = 0; i < consumer.length; i++){
	   for(let j = 0; j < prosumer.length; j++){
	      if(!contains.includes(prosumer[j]) && consumer[i].balance <= prosumer[j].balance){
  		     contains.push(prosumer[j]);
  		     let consumerId = consumer[i].id;
  		     let prosumerId = prosumer[j].id;
  		     res.push([prosumerId, consumerId]);
  		     prosumer[j].balance -= consumer[i].balance;
  		     break;
	      }
	   }
     if(contains.length == prosumer.length){
       contains = [];
     }
  }

  console.log(res);
  return res;
};

/*
  hashes every Payment received from each household
  get all payments in the last 8 minutes
*/
async function hashPayments(){
  let web3 = new Web3();
  let accounts = [];
  let hashes = [];
  let messages = [];
  let actDate = new Date();
  let payments = await axios.get(api + "payments/" + tkn);
  payments = payments.data.reverse();

  for(payment of payments){
    if(accounts.includes(payment.initiator) | payment.event != "EventPaymentReceivedSuccess"){
      continue;
    }
    let paymentDate = new Date(payment.log_time);
    if((actDate - paymentDate)/60000 >= 8){
       break;
    }else{
      accounts.push(payment.initiator);
      messages.push(payment)
      let channelObject = await axios.get(api + "channels/" + tkn + "/" + payment.initiator);
      //create object that has to be hashed
      let object = {"target": addr, "initiator": payment.initiator, "identifier": payment.identifier, "hashed_identifier": web3.utils.sha3(payment.identifier), "token_address": tkn, "amount": payment.amount, "channel_identifier": channelObject.data.channel_identifier};
      let hash = web3.utils.sha3(JSON.stringify(object));
      hashes.push({"address": payment.initiator, "hash": hash});
    }
  }
  let afterDate = new Date();
  console.log("Anzahl der accounts: ", accounts.length, " größe der Historie: ", payments.length, " hashzeit: ", (afterDate - actDate)/1000, " Sekunden")
  fs.appendFileSync('./hash_zeit.csv', accounts.length + "," + payments.length + "," + (afterDate - actDate)/1000 + " Sekunden" + '\n');
  axios.post("http://localhost:9000/postHashes", {"hashes": hashes})
    .then(response => {console.log(response.data)})
    .catch(err => {console.log(err)});

  return {"hashes": hashes, "messages": messages}

  /*
  axios.post("http://localhost:9000/postMessages", {"messages": messages})
    .then(response => {console.log(response.data)})
    .catch(err => {console.log(err)});
  */
}

/*
  if a raiden client has not allready joined the tokennetwork, then mint tokens and join the tokennetwork
*/
async function checkTokenNetwork(){
    try {
      x = await axios.get(api + "connections", {timeout: 1000});
      if(!x.data.hasOwnProperty(tkn)){
        mintAndJoinToken();
      }else{
        console.log("Netting Server allready joined")
      }
    } catch (e) {
      console.log(e);
      console.log("Netting Server not online")
    }
}

/*
  mints token for every used account
  if succesfully minted some tokens, then join the tokennetwork
*/

function mintAndJoinToken(){
      let connect = api + "_testing/tokens/" + tkn + "/mint";
      let data = {
  	     "to": addr,
  	      "value": 51000000000000000000
      };

      axios.post(connect, data).then(
  	    response => {
          console.log(response);
  		      console.log("Netting Server minted tokens")
            joinTokennetwork();
  	    }
  	  ).catch(err => {console.log(addr + ": minting failed")});
}

/*
  join the tokennetwork
*/
function joinTokennetwork(){
  let connect = api + "connections/" + tkn;
  let data = {
  	"funds":4500
  };
  axios.put(connect, data)
    .then(response => {console.log(response, "Netting Server joined tokennetwork");})
    .catch(err => {
      console.log(err);
      console.log("Netting Server: join tokennetwork failed")
    });
}

async function startRaidenClient(){
  await child_process.execSync("docker-compose down");
  child_process.exec("gnome-terminal --title='netting raiden client' -x sh -c 'docker-compose up'");
}

/*
running a function every minute
checks if 15 minutes are over to receive and match the households every
1, 16, 31, 46 minutes
1 minute after all households send the smart meter data
*/
cron.schedule('* * * * *', () => {
    let minutes = [1, 16, 31, 46]
    let date = new Date();
    console.log(date.getMinutes());
    if(minutes.includes(date.getMinutes())){
	     console.log("matching phase");
	     hashPayments();
    }
});

/*
	checks if an Raiden client is offline
	if so then start the specific networks
*/
async function checkRaidenClient(){
  try {
    response = await axios.get(api + "status", {timeout: 500});
    if(response.status == 200 && response.data.status == "ready"){
      return;
    }else if(response.status == 200 && response.data.status == "unavailable" ){
      return;
    }else{
      startRaidenClient();
    }
  } catch (e) {
    startRaidenClient();
  }

}



app.get('/test', async(req, res) => {
  res.send("nur ein test");
});

async function test(){
  console.log(addr)
}

/*show addr, channel, payments and pending tranfers*/
app.get('/', async (req, res) => {

    let adr = await axios.get(api + "address");
    let channel = await axios.get(api + "channels/" + tkn);
    let payments = await axios.get(api + "payments/" + tkn);
    let pending = await axios.get(api + "pending_transfers");

    let response = [
	     adr.data,
	     channel.data,
	     payments.data,
	     pending.data
    ];

    res.send(response);
});

/*join the token network*/
app.get('/join_network', async(req, res) => {

    let connect = api + "connections/" + tkn;
    let data = {
	"funds":50000000000000000000,
	"initial_channel_target": 0
    };

    axios.put(connect, data).then(
	    response => {
		console.log(response.data);
	    }
	).catch(err => {console.log(err)});

    res.send("network join");pwe

});


/*mint some Tokens for the token network*/
app.get('/mint', async(req, res) => {

    let adr = await axios.get(api + "address");
    let connect = api + "_testing/tokens/" + tkn + "/mint";
    let data = {
	"to": adr.data.our_address,
	"value": 51000000000000000000
    };
    const headers = {
	'Content-Type': 'application/json'
    }

    axios.post(connect, data).then(
	    response => {
		console.log(response.data)
	    }
	).catch(err => {console.log(err)});

	return res.send("minting");
});




/*get all households that sends data in the last 10 minutes
  every household is only contained once
  return households[] with [0] = prosumer[](id,balance) and [1] = consumer[](id,balance)*/
async function getHouseholds(){

    let payments = await axios.get(api + "payments/" + tkn);
    let prosumer = [];
    let consumer = [];
    let households = [];
    let contains = [];
    let actDate = new Date();

    for(let i = payments.data.length - 1; i >= 0; i--){
	let paymentDate = new Date(payments.data[i].log_time);
	if((actDate - paymentDate)/60000 >= 7000){
	    break;
	}else{
	    let id = payments.data[i].initiator;
	    let balance = payments.data[i].identifier;
	    if(!contains.includes(id)){
		contains.push(id);
		households.push({id, balance});
		if(balance[0] == '2'){
		    consumer.push({id, "balance":
		      parseInt(balance.substring(1))});
		}else{
		    prosumer.push({id, "balance":
		      parseInt(balance.substring(1))});
		}
	    }
	}
    }

    let res = [prosumer, consumer];
    console.log(res);
    return res;
};

async function checkStatus(){
  try {
    response = await axios.get(api + "status", {timeout: 5000});
    if(response.status == 200 && response.data.status == "ready"){
      return {"status": response.data.status}
    }else{
      return {"status": "not ready"}
    }
  }catch(e){
    return "offline"
  }
}


/*
---------------server api begin---------------
*/

app.use(express.static("data"));
app.use(fileUpload());

app.get('/getStatusNetting', async function (req,res) {
  status = await checkStatus();
  res.send(status)
});

app.get("/getMessages", async function (req, res){
  let response = await hashPayments();
  res.send({"messages": response.messages});
});

app.post("/hashPayments", async function (req,res){
  hashPayments();
  res.send("hashed");
});
