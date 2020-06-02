const express = require('express');

const cron = require('node-cron');
const app = express();
const port = process.env.PORT || 8001;
const axios = require('axios');
const bodyParser = require('body-parser');
const fs = require('fs');

const Web3 = require('web3');
const solc = require('solc');
const Tx = require('ethereumjs-tx').Transaction;
const keythereum = require("keythereum");
const log = require('ololog').configure({ time: true });
const ansi = require('ansicolor').nice

const MongoClient = require('mongodb').MongoClient;
const mongourl = "mongodb://localhost:27017/";
var content = [];

app.use(bodyParser.json());
app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

/*start*/
const netserver = "0x7303fd35225679E6B425FD14E0513c3E44ADa93F";
const tkn = "0x4A077a9dd42726E722eF167c9363EEC318e40182";
const api = "http://172.13.0.15:5001/api/v1/";
const meterData = "150"
const rpcUrl = "https://goerli.infura.io/v3/9081143fcc3e4533ae4cc3e26ff0a586";
const contractaddr = "0x07799d623c82c4c4ada1245eb7688453216d529b";
const addr = 0x02516D1af993Fb82089473117D714B1A1f5d86dE


/*show the payment channel opened with the netting server
  show all Payments done*/
app.get('/', async (req, res) => {

    let adr = await axios.get(api + "address");
    let pending = await axios.get(api + "pending_transfers");
    let channel = await axios.get(api + "channels/" + tkn + "/" + netserver);
    let payments = await axios.get(api + "payments/" + tkn + "/" + netserver);

    let response = [
	adr.data,
	channel.data,
	payments.data,
	pending.data
    ];

    res.send(response);

});

/*open Payment Channel with Netting Server*/
app.get('/open_channel', async(req, res) => {

    let connect = api + "channels";
    let data = {
	"partner_address": netserver,
	"token_address": tkn,
	"total_deposit": "10000000000000000000",
	"settle_timeout": "500"
    };


    axios.put(connect, data).then(
	    response => {
		console.log(response.data)
	    }
	).catch(err => {console.log(err)})

    res.send("open channel");
});

/*do payment to send smart meter data*/
app.get('/do_payment', async (req, res) => {

    doPayment();
    res.send("payment will be send");
});

/*do deposit to the channel with the netting server*/
app.get('/deposit', async(req, res) => {

    let connect = api + "channels/" + tkn + "/" + netserver;
    let data = {
	"total_deposit": 10000000000000000000
    };


    axios.patch(connect, data).then(
	    response => {
		console.log(response.data)
	    }
	).catch(err => {console.log(err)});

    res.send("deposit");

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


/*close the channel with the netting server*/
app.get('/close', async (req, res) => {

    let connect = api + "channels/" + tkn + "/" + netserver;
    let data = {
	"state": "closed"
    };


    axios.patch(connect, data).then(
	    response => {
		console.log(response.data)
	    }
	).catch(err => {console.log(err)});

    res.send("closed");

});

/*send smart meter data to netting server
  get the smart meter value from Database*/
function doPayment(){

    MongoClient.connect(mongourl, function(err, db) {
	if (err) throw err;
	var dbo = db.db("mydb");
	var myobj = { name: "smart meter", value: "50" };
	dbo.collection("smart_meter_data").find(
	    {name: "smart meter"}).toArray(function(err, result){
	      if (err) throw err;
	      console.log(result[0].value);
	      let identifier = 1;
	      if(parseInt(result[0].value) < 0){
		identifier = 2;
	      }

	      let connect = api + 'payments/' + tkn + "/" + netserver;
    	      let data = {
		"amount": "1",
		"identifier": identifier + result[0].value
    	      };

	      console.log(data)
    	      axios.post(connect, data).then(
	    	response => {
		    console.log(response.data)
	    	}
	      ).catch(err => {console.log(err)});
	      db.close();
	});
    });


};

/*get the match from the smart contract
  match is defined as {consumer, prosumer} where consumer is the actual household*/
async function getMatch(){
    let web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));
    let abi = JSON.parse(fs.readFileSync("abi.json"));
    const contract = new web3.eth.Contract(abi, contractaddr);

    let result = {consumer: undefined, prosumer: undefined};
    for(let index = await contract.methods.matchCount().call() - 1; index >= 0; index--){
	if(netserver == await contract.methods.energy_matches(index).call()){
	    try{
		let i = 0;
		while(result.consumer == undefined){
		    let test = await contract.methods.getMatch(index, i).call();
		    if(test.consumer == addr){
			result.consumer = test.consumer;
		        result.prosumer = test.prosumer;
			return result;
		    }
		    i++
		}
	    }catch(e){
		return result;
	    }
	}
    }

    return result;

}
app.get("/test", async(req, res) => {

    console.log(await getMatch());

    res.send("das ist eine testseite");
});
/*running a function every minute
  checks if 15 minutes are over to send every 0, 15, 30, 45 minutes*/
cron.schedule('* * * * *', () => {
    let minutes = [0, 15, 30, 45]
    let date = new Date();
    console.log(date.getMinutes());
    if(minutes.includes(date.getMinutes())){
	console.log("sending phase");
	doPayment();
    }
});

app.listen(port, () => {
    console.log(`household server listening on ${port}`);
});
