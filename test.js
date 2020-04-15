var MongoClient = require('mongodb').MongoClient;
var mongourl = "mongodb://localhost:27017/";

MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  var dbo = db.db("mydb");
  var myobj = { name: "smart meter", value: "50" };
  dbo.collection("smart_meter_data").insertOne(myobj, function(err, res) {
    if (err) throw err;
    console.log("1 document inserted");
    db.close();
  });
}); 
