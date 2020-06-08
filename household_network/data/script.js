

$(document).ready ( function(){
   console.log("jquery loaded");

   getAccounts()
});

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
              console.log(accounts)
              var res = document.createElement("div");
              let counter = countNetwork(accounts);
              for(let i = 0; i < counter; i++){
                var div = document.createElement("div");
                for(account of accounts){
                  if(account.networkid == i){

                  }
                }

                console.log(i)
              }
          }


        document.getElementById("networks").innerHTML = "Networks";
      });
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
