const express = require('express');

const cron = require('node-cron');
const app = express();
const port = process.env.PORT || 8000;
const axios = require('axios');
const bodyParser = require('body-parser');
const fs = require('fs');

const Web3 = require('web3');
const solc = require('solc');
const Tx = require('ethereumjs-tx').Transaction;
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
const tkn = "0x1276fa5F5DDCb9adEc850E559AfdB37E588DAb7b";
const api = "http://172.13.0.16:5001/api/v1/";
const addr = "0x7303fd35225679E6B425FD14E0513c3E44ADa93F";
const privKey = "aae362c8003d9e6908cc4a8ae5a56383841fa366f0605b94f37c7ea9bd0f793f";
const contractaddr = "0x4bb6b1b21b819bba06a1a3f5ba48eb21338346ce";
const rpcUrl = "https://goerli.infura.io/v3/9081143fcc3e4533ae4cc3e26ff0a586";
/*addr: 0xD552f5fC6520C202E7263b8243A24e0cFB78749c*/

var consumerTest = [{"id":"0","balance": 3},{"id": "1","balance": 10},{"id": "2", "balance": 6},{"id": "3","balance": 4},{"id": "4", "balance": 7},{"id": "5", "balance": 11}];
var prosumerTest = [{"id": "10","balance": 128},{"id": "11", "balance": 34}];

app.get('/test', async(req, res) => {


res.send("nur ein test");
});

function getPrivkey(){
    var keyObject = keythereum.importFromFile(addr, "./");
    var privateKey = keythereum.recover("1234", keyObject);
    console.log(privateKey.toString('hex'));
};

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

    res.send("network join");

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

//write matches in smart contract and deploy on blockchain
async function deployMatches(){
    
    let matches = await matchHouseholds();

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
	gas: web3.utils.toHex(1000000),
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

};

/*match consumer with prosumer
  return a string array with the format "prosumeraddr:consumeraddr"*/
async function matchHouseholds(){

    let households = await getHouseholds();
    console.log(households);
    let consumer = households[1];
    let prosumer = households[0];
    
    let res = [];
    let contains = [];

    for(let i = 0; i < consumer.length; i++){
	for(let j = 0; j < prosumer.length; j++){
	    if(!contains.includes(prosumer[j]) && consumer[i].balance <=
	      prosumer[j].balance){
		contains.push(prosumer[j]);
		let consumerId = consumer[i].id;
		let prosumerId = prosumer[j].id;
		res.push(prosumerId + ":" + consumerId);
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


/*get all households that sends data in the last 10 minutes
  every household is only contained once
  return households[] with [0] = prosumer[](id,balance) and [1] = consumer[](id,balance)*/
async function getHouseholds(){
    
    let payments = await axios.get(api + "payments");
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

/*running a function every minute
  checks if 15 minutes are over to receive and match the households every
  1, 16, 31, 46 minutes
  1 minute after all households send the smart meter data*/
cron.schedule('* * * * *', () => {
    let minutes = [1, 16, 31, 46]
    let date = new Date();
    console.log(date.getMinutes());
    if(minutes.includes(date.getMinutes())){
	console.log("matching phase");
	deployMatches();
    }
});


app.listen(port, () => {
    console.log(`Netting Server listening on ${port}`);
});
