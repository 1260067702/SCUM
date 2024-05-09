/*
 * @Author: 菱 admin@example.com
 * @Date: 2023-08-19 14:57:23
 * @LastEditors: 菱 admin@example.com
 * @LastEditTime: 2023-09-10 11:21:12
 * @FilePath: \SCUM\fork.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
// const { fork } = require("child_process")
var mongo = require('mongodb').MongoClient;
// const jwt = require("./token")
var url = 'mongodb://scum:PMmBZeja5isGscM2@10.0.0.9:27017/?authSource=scum';
const dbName = 'scum';
const op = {
    useNewUrlParser: true
}
const client = new mongo(url, op);
const db = client.db(dbName);

module.exports.works = async (data) => {
    console.log(data);
    await client.connect();
    let result = await db.collection('3366_user').findOne({ steam: data.steam });
    // console.log(result);
    if (!result) {
        let add = await db.collection("3366_user").insertOne({ steam: data.steam, name: data.name, pos: data.pos, online: data.online })
        console.log(add);
    }
}
