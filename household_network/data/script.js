

$(document).ready ( function(){
   console.log("jquery loaded");
   getAccounts();
});

var checkAccounts = window.setInterval(getAccounts, 30000);

/*
load all accounts in DOM
*/
function getAccounts(){
      $.ajax({
          type: 'GET',
          url: 'http://localhost:9000/allAccounts',
          data: { get_param: 'value' },
          success: function (data) {
              let accounts = data;
              var res = document.createElement("div");
              let counter = countNetwork(accounts);
              for(let i = 0; i < counter; i++){
                var div = document.createElement("div");
                div.class = "network";
                let h1 = document.createElement("h1");
                h1.innerHTML = "Netzwerk" + (i+1);
                div.appendChild(h1);

                var table = document.createElement("table")
                table.width = "100%";
                table.border = "1";
                for(account of accounts){
                  if(account.networkid == i){
                    var tr = document.createElement("tr");
                    tr.class = "account";

                    let th1 = document.createElement("th");
                    let th2 = document.createElement("th");
                    let th3 = document.createElement("th");
                    th1.innerHTML = account.address;
                    th2.innerHTML = account.api;
                    th3.innerHTML = account.status;

                    tr.appendChild(th1);
                    tr.appendChild(th2);
                    tr.appendChild(th3);

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

/*
post start specific network
*/
async function startServices(network){
      $.post("http://localhost:9000/startServices", network);
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
