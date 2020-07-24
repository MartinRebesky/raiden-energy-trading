

$(document).ready ( function(){
   console.log("jquery loaded");
   getAccounts();
   getStatusNetting();
   //getAddresses();
});

var countAccounts = 0;

//update every 10 sec.
//var checkAccounts = window.setInterval(getAccounts, 10000);
var checkAccounts = window.setInterval(getStatusChannel, 5000);
var checkAccounts = window.setInterval(getStatusNetting, 30000);

/*
load all accounts in DOM
build all accounts in HTML
*/
function getAccounts(){
      $.ajax({
          type: 'GET',
          url: 'http://localhost:9000/getCheckedAccounts',
          data: { get_param: 'value' },
          success: function (data) {
              let accounts = data;
              console.log(data)
              var res = document.createElement("div");
              let counter = countNetwork(accounts);
              for(let i = 0; i < counter; i++){
                var div = document.createElement("div");
                div.class = "network";
                let h1 = document.createElement("h1");
                h1.innerHTML = "Netzwerk" + (i+1) + " <button type='button' onclick='startServices(" + i + ")'>Netzwerk neustart</button>";

                div.appendChild(h1);

                var table = document.createElement("table")
                table.width = "100%";
                table.border = "1";
                for(account of accounts){
                  let networkid = account.api[11];
                  if(account.networkid == i){
                    var tr = document.createElement("tr");
                    tr.class = "account";

                    let th1 = document.createElement("th");
                    let th2 = document.createElement("th");
                    let th3 = document.createElement("th");
                    let th4 = document.createElement("th");
                    let th5 = document.createElement("th");
                    let link = document.createElement("a")

                    //get link to web ui
                    let index = account.api.indexOf("/", 12)
                    let linkStr = account.api.substring(0, index);
                    link.href = linkStr
                    link.innerHTML = account.address

                    th1.appendChild(link);
                    th2.innerHTML = account.status;

                    //set status channel
                    th3.id = "status_channel_" + account.address
                    th3.innerHTML = account.statusChannel;

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
                  }
                }
                div.appendChild(table);
                res.appendChild(div);
              }

              document.getElementById("networks").innerHTML = "";
              document.getElementById("networks").appendChild(res);
          }


        //document.getElementById("networks").innerHTML = "Networks";
      });
}

function getStatusNetting(){
  console.log("hallo")
  $.ajax({
      type: 'GET',
      url: 'http://localhost:8000/getStatusNetting',
      data: { get_param: 'value' },
      success: function (data) {
        document.getElementById("status_netting").innerHTML = data.status;
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
          let id = "status_channel_" + account.address
          try{
            document.getElementById(id).innerHTML = account.status;
          }catch(e){

          }
        }

      }
  });
}

function openChannel(addr){
  console.log(addr);
  $.post("http://localhost:9000/openChannel", {"addr": "" + addr});
}

function closeChannel(addr){
  $.post("http://localhost:9000/closeChannel", {"addr": "" + addr});
}

/*
post start specific network
*/
async function startServices(networkid){
  $.post("http://localhost:9000/startServices", {"networkid": networkid});
}

/*
post stop specific network
*/
async function stopServices(networkid){
  $.post("http://localhost:9000/stopServices", {"networkid": networkid});
}

/*
post add n networks
*/
async function addNetwork(){
  let n = document.getElementById("n").value;
  $.post("http://localhost:9000/addNetwork", {"n": n});
}

/*
post remove n networks
*/
async function removeNetwork(){
  let n = document.getElementById("n").value;
  $.post("http://localhost:9000/removeNetwork", {"n": n});
}

function countNetwork(accounts){
  let count = 0
  for(account of accounts){
    if(account.networkid > count){
      count = account.networkid;
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
