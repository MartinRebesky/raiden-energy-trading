const axios = require("axios");
var durchlauf = 0;

async function einsatz(){

  response = await axios.get("http://localhost:9000/getAllAccounts");

  console.log(accounts);
}

einsatz();
