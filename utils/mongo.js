var MongoClient = require('mongodb').MongoClient
var ObjectID = require('mongodb').ObjectID;
// 地址
var url = "mongodb://scum:PMmBZeja5isGscM2@10.0.0.9:27017/?authSource=scum"
//导出查询mongo自生成的id
exports.objid = ObjectID
global.db = new MongoClient(url)
db.connect()
/**
 * 封装条件查询数据
 * @param {*} table 数据库名称
 * @param {*} collect  集合名
 * @returns 
 */
exports.find = function (table, collect, param) {
    // console.log(table, collect, param);
    return new Promise((resolve, reject) => {
        var dbo = db.db(table);

        dbo.collection(collect).aggregate(param).toArray().then(function (result, err) { // 返回集合中所有数据
            // console.log(err);
            resolve(result)
            // db.close()
        }).catch(e => {
            // console.log("错误", collect);
        }).finally(() => {
            // db.close()
            // console.log("结束查询", collect);
            reject()
        })
    })
}
/**
 * 封装findMany()查询所有数据
 * @param {*} table 数据库名称
 * @param {*} collect  集合名
 * @returns 
 */
exports.findMany = function (table, collect, param) {
    // console.log(table, collect, param);
    return new Promise((resolve, reject) => {
        var dbo = db.db(table);
        dbo.collection(collect).find(param).toArray().then(function (result, err) { // 返回集合中所有数据
            // console.log(err);
            resolve(result)
            // db.close()
        }).catch(e => {
            // console.log("错误", collect);
        }).finally(() => {
            // db.close()
            // console.log("结束查询", collect);
            reject()
        })
    })
}
/**
 * 查询某一条记录
 * @param {*} table 
 * @param {*} collect 
 * @param {*} params 
 * @returns 
 */
exports.findOne = function (table, collect, params) {
    return new Promise((resolve, reject) => {
        var dbo = db.db(table);
        dbo.collection(collect).findOne(params).then(function (result, err) { // 返回集合中所有数据
            // console.log(err, result);
            resolve(result)
            // db.close()
        }).catch(e => {
            // console.log("错误", collect);
        }).finally(() => {
            // db.close()
            // console.log("结束查询", collect);
            reject()
        })
    })
}
/**
 * 封装更新方法
 * @param {*} table 
 * @param {*} collect 
 * @param {*} id 
 * @param {*} newdata 
 * @returns 
 */

exports.updateMany = function (table, collect, params, newdata) {
    return new Promise((resolve, reject) => {
        var dbo = db.db(table);
        dbo.collection(collect).updateMany(params, newdata).then(function (result, err) { // 返回集合中所有数据
            // console.log(err, result);
            resolve(result)
            // db.close()
        }).finally(() => {
            // db.close()
            reject()
        })
    })
}

/**
 * 封装插入数据方法
 * @param {*} table 
 * @param {*} collect 
 * @param {*} data 
 * @returns 
 */
exports.insertOne = function (table, collect, data) {
    return new Promise((resolve, reject) => {
        var dbo = db.db(table);
        dbo.collection(collect).insertOne(data).then(function (result, err) { // 返回集合中所有数据
            // console.log(err, result);
            resolve(result)
            // db.close()
        }).finally(() => {
            // db.close()
            reject()
        })
    })
}
/**
 * 封装删除的方法
 * @param {*} table 
 * @param {*} collect 
 * @param {*} params 
 * @returns 
 */
exports.delete = function (table, collect, params) {
    return new Promise((resolve, reject) => {
        var dbo = db.db(table);
        dbo.collection(collect).deleteOne(params).then((result => {
            resolve(result)
        }))
    })
} 
