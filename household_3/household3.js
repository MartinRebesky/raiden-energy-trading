const express = require('express');

const cron = require('node-cron');
const app = express();
const port = process.env.PORT || 8003;
const axios = require('axios');
const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
}); 

/*start*/
const netserver = "0xD552f5fC6520C202E7263b8243A24e0cFB78749c";
const tkn = "0xD8EA06B2bC22Ded08e8642564deA164Ce61FF220";
const api = "http://172.13.0.3:5001/api/v1/";
const meterData = "214";
/*adr: 0x2F3a0db383A23dBD10f18c8D72cCeEedCcDcAdc5*/

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

    let connect = api + 'payments/' + tkn + "/" + netserver;
    let data = {
	"amount": "1",
	"identifier": meterData
    };
    

    axios.post(connect, data).then(
	    response => {
		console.log(response.data)
	    }
	).catch(err => {console.log(err)})
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

app.get('/test', async (req, res) => {

    let adr = await axios.get(api + "address");
    res.send(adr);

});

/*send smart meter data to netting server*/
function doPayment(){
    let connect = api + 'payments/' + tkn + "/" + netserver;
    let data = {
	"amount": "1",
	"identifier": meterData
    };
    

    axios.post(connect, data).then(
	    response => {
		console.log(response.data)
	    }
	).catch(err => {console.log(err)});
};

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
