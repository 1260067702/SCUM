let yu = 97 % 10
console.log(yu);
const { log } = require("console");
const { findone, findMany, Insert, updateMany } = require("../utils/mongo")
const moment = require("moment")
let text = "#announce 现在时间：${moment(new Date()).format('kk:mm')}"
// console.log(eval("`" + text + "`"));
var mongo = require('mongodb').MongoClient;
const { ObjectId } = require('mongodb');
var url = 'mongodb://scum:PMmBZeja5isGscM2@10.0.0.9:27017/?authSource=scum';
const dbName = 'scum';
const op = {
    useNewUrlParser: true
}
// const client = new mongo(url, op);
// const db = client.db(dbName);
// client.connect()
// db.collection("3365_user").find({ username: "whk" }).toArray().then(data => {
//     console.log(data);
//     client.close()
// })

console.log(moment().format('YYYY-MM-DD'));
console.log(moment().add(1, "days").format('YYYY-MM-DD'));
// const { parentPort, workerData } = require("worker_threads");
// console.log(workerData);
// parentPort.postMessage({ test2: "666" })

// findMany("scum", "3365_user", { username: "whk" }).then((resp, err) => {
//     console.log(resp, err);
// }).catch(e => {
//     console.log(e);
// })

updateMany("scum", `3365_user`, {}, {
    $set: {
        "mrfl": false,
        "mrqd": false
    }
})

