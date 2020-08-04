const axios = require("axios");
const fs = require('fs');
const tkn = "0x0321Aa034bED3a22CcFE91E169DB3E63830ad239";
const nettingAddr = "0xF3457dADCF2E4F6fD2bBcfd2fAE3814e6A3cDBCd";
var durchlauf = 0;

async function einsatz(index){
  let responseAccounts = await axios.get("http://localhost:9000/getAllAccounts");
  let accounts = responseAccounts.data.accounts;
  for(let i = 0; i < index; i++){
    console.log(i)
    console.log(accounts[i].address)
    await axios.post("http://localhost:9000/sendMeterData", {"addr": accounts[i].address});
  }
  wait(120000);
  let responseMessages = await axios.get("http://localhost:8000/getMessages");
  let messages = responseMessages.data.messages;
  checkMessages(messages);
}

function wait(millisec){
  let startTime = new Date();
  let endTime = new Date();
  while(endTime - startTime < millisec){
    endTime = new Date();
  }
}

/*
	checks the timestamp from the received messages by the netting server with the send messages by the households
*/
async function checkMessages(messages){
	let response = await axios.get("http://localhost:9000/getAllAccounts");
  let accounts = response.data.accounts;
	let actDate = new Date();
	let average = 0;
	let count = 0;
	for(message of messages){
		account = accounts.filter(acc => acc.address == message.initiator)[0];
		try{
			let payments = await axios.get(account.api + "payments/" + tkn + "/" + nettingAddr);
			let payment = payments.data.reverse()[0];
			let paymentDate = new Date(payment.log_time);
			if((actDate - paymentDate)/60000 <= 13 && payment.event == "EventPaymentSentSuccess"){
				count++;
				messageDate = new Date(message.log_time);
				average += messageDate - paymentDate;
			}
		}catch(err){
			console.log(err);
		}
	}
	try{
		console.log(count, ": ", (average/count)/1000, "Sekunden");
		fs.appendFileSync('./data/payment_zeit.csv', count + "," + (average/count)/1000 + " Sekunden" + '\n');
	}catch(err){
		console.log(err);
	}
}

async function einsatzsimulation(){
  await einsatz(10);
  await einsatz(20);
  await einsatz(30);
  await einsatz(40);
  await einsatz(50);
}

einsatzsimulation();
