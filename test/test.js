const { Worker } = require("worker_threads")
const mongo = require("../utils/mongo")
// const worker = new Worker("./test/test2.js", { workerData: "马牛逼" });
// worker.once("message", data => {
// console.log(data);
// })

mongo.findMany("scum", `3365_transmit`, { isOn: true, type: "公共" }).then(data=>{
    console.log(data);
})
