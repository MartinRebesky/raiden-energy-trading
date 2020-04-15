const express = require('express');

const cron = require('node-cron');
const app = express();
const port = process.env.PORT || 8000;
const axios = require('axios');
const bodyParser = require('body-parser');

const api = "http://172.13.0.16:5001/api/v1"
const address = "0xD552f5fC6520C202E7263b8243A24e0cFB78749c"

var consumerTest = [{"0", "03"},{"1", "010"},{"2", "06"},{"3", "04"},{"4", "07"},{"5", "011"}];
var prosumerTest = [{"10", "128"},{"11", "134"}];

app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.use(bodyParser.json());

app.get('/match', async(req, res) => {
	res.send(matchHousholds(consumerTest, prosumerTest));
});

/* holt sich die Payment Historie vom Raiden Client und erstellt jeweils ein Objekt mit Adresse und identifier (identifier[0]? 0 = negativ, 1 = positiv)*/
app.get('/', async(req, res) => {

const response = await axios.get('http://0.0.0.0:8501/api/v1/payments');

let prosumer = [];
let consumer = [];
let data = [];
let currentId = [];
let actDate = new Date();
for(let i = response.data.length - 1; i >= 0; i--){
	let dataDate = new Date(response.data[i].log_time);
	if((actDate - dataDate)/60000 >= 70){
		break;
	}else{
		let id = response.data[i].initiator;
		let balance = response.data[i].identifier;	
		if(!currentId.includes(id)){
			currentId.push(id);
			data.push({id, balance});
			if(balance[0] == '0'){
				consumer.push({id, balance});
			}else{
				prosumer.push({id, balance});
			}
		}
			
	}
}
console.log("prosumer: " + prosumer[0]);
console.log("consumer: " + consumer);
return res.send(matchHousholds(consumer, prosumer));

});
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
function matchHousholds(consumer, prosumer){

	let res = [];
	let count = 0;
	for(let i = 0; i < consumer.length; i++){
		for(let j = 0; j < prosumer.length; j++){
			if(consumer[i].balance <= prosumer[j].balance){
				let consumerId = consumer[i].id;
				let prosumerId = prosumer[j].id;

				res.push({consumerId, prosumerId});
				prosumer[j].balance -= consumer[i].balance;
				break;
			}
		}
	}
	return res;
}

app.listen(port, () => {
    console.log(`Netting Server listening on ${port}`);
});
