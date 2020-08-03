

$(document).ready ( function(){
   console.log("jquery loaded");
   getAccounts();
   getStatusNetting();
   getStatusAccounts();
   getStatusChannel();
});

var countAccounts = 0;

//update every 10 sec.
var checkStatusNetting = window.setInterval(getStatusNetting, 15000);
var checkstatus = window.setInterval(getStatusAccounts, 15000);
var checkStatusChannel = window.setInterval(getStatusChannel, 15000);


/*
load all accounts in DOM
build all accounts in HTML
*/
function getAccounts(){
      $.ajax({
          type: 'GET',
          url: 'http://localhost:9000/getAllAccounts',
          data: { get_param: 'value' },
          success: function (data) {
              let networkCount = data.networkCount;

              //remove all in main
              var main = document.getElementById("networks");
              main.innerHTML = "";

              for(let networkID = 0; networkID < networkCount; networkID++){
                //create Network
                var network = document.createElement("div");
                network.className = "network";
                let h1 = document.createElement("h1");
                h1.innerHTML = "Netzwerk" + (networkID+1) + " <button type='button' onclick='startServices(" + networkID + ")'>Netzwerk neustart</button>";
                network.appendChild(h1);

                var table = document.createElement("table")
                table.className = "w3-table-all w3-large";
                let accounts = data.accounts.filter(acc => acc.networkID == networkID);
                for(account of accounts){
                  var tr = document.createElement("tr");
                  tr.className = "account";

                  let th1 = document.createElement("th");
                  let th2 = document.createElement("th");
                  let th3 = document.createElement("th");
                  let th4 = document.createElement("th");
                  let th5 = document.createElement("th");
                  let link = document.createElement("a")

                  //get link to web ui
                  let index = account.api.indexOf("/", 12);
                  let linkStr = account.api.substring(0, index);
                  link.href = linkStr;
                  link.innerHTML = account.address;
                  th1.id = account.address;
                  th1.appendChild(link);

                  //create and set status channel with an id
                  //load gif
                  var img = new Image(20,20);
                  img.src = "load.gif";

                  th2.id = "status_" + account.address;
                  th2.appendChild(img);

                  th3.id = "status_channel_" + account.address;

                  //create buttons
                  let string = "openChannel(" + account.address + ")"
                  th4.innerHTML = " <button type='button' onclick='openChannel(\"" + account.address + "\")'>Channel öffnen</button>";
                  th5.innerHTML = " <button type='button' onclick='closeChannel(\"" + account.address + "\")'>Channel schließen</button>";

                  tr.appendChild(th1);
                  tr.appendChild(th2);
                  tr.appendChild(th3);
                  tr.appendChild(th4);
                  tr.appendChild(th5);

                  table.appendChild(tr);
                  network.appendChild(table);
                }
                main.appendChild(network);
              }
          }


        //document.getElementById("networks").innerHTML = "Networks";
      });
}

function getStatusNetting(){
  $.ajax({
      type: 'GET',
      url: 'http://localhost:8000/getStatusNetting',
      data: { get_param: 'value' },
      success: function (data) {
        document.getElementById("status_netting").innerHTML = data.status;
      }
  });
}

function getStatusAccounts(){
  $.ajax({
      type: 'GET',
      url: 'http://localhost:9000/getStatus',
      data: { get_param: 'value' },
      success: function (data) {
        console.log(data)
        for(account of data){
          let id = "status_" + account.address;
          try{
            document.getElementById(id).innerHTML = account.status;
          }catch(e){

          }
        }
      }
  });
}

function getStatusChannel(){
  $.ajax({
      type: 'GET',
      url: 'http://localhost:9000/getStatusChannel',
      data: { get_param: 'value' },
      success: function (data) {
        for(account of data){
          let id = "status_channel_" + account.address;
          try{
            document.getElementById(id).innerHTML = account.status;
          }catch(e){

          }
        }

      }
  });
}

function sendMeterData(addr){
  $.post("http://localhost:9000/sendMeterData", {"addr": "" + addr});
}

function sendMeterDataAll(){
  $.post("http://localhost:9000/sendMeterData", {"addr": -1});
}

function openChannel(addr){
  $.post("http://localhost:9000/openChannel", {"addr": "" + addr});
}

function closeChannel(addr){
  $.post("http://localhost:9000/closeChannel", {"addr": "" + addr});
}

/*
post start specific network
*/
async function startServices(networkID){
  $.post("http://localhost:9000/startServices", {"networkID": networkID});
}

/*
post stop specific network
*/
async function stopServices(networkID){
  $.post("http://localhost:9000/stopServices", {"networkID": networkID});
}

/*
post add n networks
*/
async function addNetwork(){
  let n = document.getElementById("n").value;
  await $.post("http://localhost:9000/addNetwork", {"n": n});
  getAccounts();
}

/*
post remove n networks
*/
async function removeNetwork(){
  let n = document.getElementById("n").value;
  await $.post("http://localhost:9000/removeNetwork", {"n": n});
  getAccounts();
}

function countNetwork(accounts){
  let count = 0
  for(account of accounts){
    if(account.networkID > count){
      count = account.networkID;
    }
  }
  return count + 1
}

function buildRaiden(){
  let accounts = httpGet("http://localhost:9000/allAccounts")
  console.log(allAccounts)
}

function httpGet(theUrl){
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.overrideMimeType('application/json');
  xmlHttp.onreadystatechange = function() {
      if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
          callback(xmlHttp.responseText);
  }
  xmlHttp.open("GET", theUrl, true); // true for asynchronous
  xmlHttp.send(null);
}

$.getJSON( "localhost:9000/allAccounts", function( data ) {
  alert('came inside');
  var items = [];
  $.each( data, function() {
    console.log(data)
  });

  /*

  $( "<ul/>", {
    "class": "my-new-list",
    html: items.join( "" )
  }).appendTo( "body" );

  */
});
