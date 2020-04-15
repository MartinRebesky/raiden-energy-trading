const express = require('express');

const cron = require('node-cron');
const app = express();
const port = process.env.PORT || 8001;
const axios = require('axios');
const bodyParser = require('body-parser');

app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.use(bodyParser.json());

const token_address = "0xE2b702eD684bEb02850ac604278f078A4ce8b6E6";
const netting_server_address = "0xD552f5fC6520C202E7263b8243A24e0cFB78749c";
const raiden_1_api = "http://172.13.0.15:5001/api/v1";
const raiden_2_api = "http://172.13.0.2:5001/api/v1";
const raiden_3_api = "http://172.13.0.3:5001/api/v1";
const raiden_4_api = "http://172.13.0.4:5001/api/v1";
const raiden_5_api = "http://172.13.0.5:5001/api/v1";
const raiden_6_api = "http://172.13.0.6:5001/api/v1";
const raiden_7_api = "http://172.13.0.7:5001/api/v1";

var adr;

app.listen(port, () => {
    adr = await axios.get(raiden_1_api + "/address");
    console.log(`household server listening on ${port}`);
});

/*show the payment channel opened with the netting server
  show all Payments done*/
app.get('/', async (req, res) => {
    
    let pending = await axios.get(raiden_1_api + "/pending_transfers");
    let channel = await axios.get(raiden_1_api + "/channels/" + token_address + "/" + netting_server_address);
    let payments = await axios.get(raiden_1_api + "/payments/" + token_address + "/" + netting_server_address);

    let response = [
	channel.data,
	payments.data,
	pening.data
    ];

    res.send(response);

});

/*get all addresses*/
app.get('/adr', async (req, res) => {
let raiden_1 = await axios.get(raiden_1_api + "/address");
let raiden_2 = await axios.get(raiden_2_api + "/address");
let raiden_3 = await axios.get(raiden_3_api + "/address");
let raiden_4 = await axios.get(raiden_4_api + "/address");
let raiden_5 = await axios.get(raiden_5_api + "/address");
let raiden_6 = await axios.get(raiden_6_api + "/address");
let raiden_7 = await axios.get(raiden_7_api + "/address");


let response = [];
response.push(raiden_1.data, raiden_2.data, raiden_3.data, raiden_4.data, raiden_5.data, raiden_6.data, raiden_7.data);

return res.send(response);

});

/*join the token network*/
app.get('/join_network', async(req, res) => {

    let connect = raiden_1_api + "/connections/" + token_address;
    let data = {
	"funds":10000000000000000000, 
	"initial_channel_target": 0
    };

    axios.put(connect, data).then(
	    response => {
		console.log(response.data);
	    }
	).catch({err => console.log(err)});

    res.send("network join");

});


/*mint some Tokens for the token network*/
app.get('/mint', async(req, res) => {

    let connect = raiden_1_api + "/_testing/tokens/" + token_address + "/mint";
    let data = {
	"to": adr,
	"value": 11000000000000000000
    };
    const headers = {
	'Content-Type': 'application/json'
    }
	
    axios.post(connect, data, {headers: headers}).then(
	    response => {
		console.log(response.data)
	    }
	).catch(err => {console.log(err)});

	return res.send("minting");	
});

/*open Payment Channel with Netting Server*/
app.get('/open_channel', async(req, res) => {

    let connect = raiden_1_api + "/channels";
    let data = {
	"partner_address": netting_server_address,
	"token_address": token_address,
	"total_deposit": 10000000000000000000,
	"settle_timeout": 500
    };
    

    axios.put(connect, data).then(
	    response => {
		console.log(response.data)
	    }	
	).catch(err => {console.log(err)})

    res.send("open channel");
});

/*do deposit to the channel with the netting server*/
app.get('/deposit', async(req, res) => {

    let connect = raiden_1_api + "/channels/" + token_address + "/" + netting_server_address;
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

/*do payment to send smart meter data*/
app.get('/do_payment', async (req, res) => {

    let connect = raiden_1_api + '/payments/' + token_address + "/" + netting_server_address;
    let ran = "" + Math.floor((Math.random() * 100) + 1);
    let data = {
	"amount": "1",
	"identifier": ran
    };
    

    axios.post(connect, data).then(
	    response => {
		console.log(response.data)
	    }
	).catch(err => {console.log(err)})
});

/*close the channel with the netting server*/
app.get('/close', async (req, res) => {

    let connect = raiden_1_api + "/channels/" + token_address + "/" + netting_server_address;
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

app.get('/test', async (req, res) => {

    res.send("nur ein Test");

});



/*running a function every minute
  checks if 15 minutes are over to send every 0, 15, 30, 45 minutes*/
cron.schedule('* * * * *', () => {
    let minutes = [0, 15, 30, 45]
    let date = new Date();
    console.log(date.getMinutes());
    if(minutes.includes(date.getMinutes())){
	console.log("es ist soweit");
    }
});


