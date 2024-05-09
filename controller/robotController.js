const { Worker } = require("worker_threads")
const mongo = require("../utils/mongo")
const { ObjectId } = require("mongodb")
const moment = require("moment")
global.robots = {}


module.exports.Controller = async (req, res) => {
    let account = await mongo.findOne("scum", "account", { selkey: req.user.selkey, enable: true })
    if (!account) {
        res.send({
            code: 500,
            msg: "未查询到商城",
            data
        })
        return
    }
    // console.log(account);
    if (robots[account.selkey]) robots[account.selkey].terminate()
    robots[account.selkey] = new Worker("./dao/goodsRobot.js", { workerData: account });
    robots[account.selkey].once("message", data => {
        console.log(data);
        res.send({
            code: 200,
            msg: "服务器状态",
            data
        })
    })
    robots[account.selkey].on("exit", (e) => {
        console.log("结束线程：" + account.selkey);
    })

}

module.exports.getSendGoods = async (req, res) => {

    if (!robots[req.user.selkey]) {
        res.send({
            code: 500,
            msg: "未找到该商城服务器"
        })
        return
    }
    // console.log(req.user.selkey, robots);
    robots[req.user.selkey].postMessage({ type: "getSendGoods" })
    robots[req.user.selkey].once("message", data => {
        console.log(data);
        res.send({
            code: 200,
            msg: "服务器状态",
            data
        })
    })

}

module.exports.updateTask = async (req, res) => {
    if (!robots[req.user.selkey]) {
        res.send({
            code: 500,
            msg: "未找到该商城服务器"
        })
        return
    }
    robots[req.user.selkey].postMessage({ type: "updateTask" })
    res.send({
        code: 200,
        data: {},
        msg: "重启任务成功"
    })

}

module.exports.setChat = async (req, res) => {
    if (!req.body) {
        res.send({
            code: 202,
            data: {},
            msg: "参数错误！"
        })
        return
    }
    if (!req.body.text) {
        res.send({
            code: 202,
            data: {},
            msg: "参数错误2！"
        })
        return
    }
    if (req.body.text.includes("#")) {
        res.send({
            code: 202,
            data: {},
            msg: "包含敏感字符"
        })
        return
    }
    let user = await mongo.findOne("scum", `${req.user.database}_user`, { _id: new ObjectId(req.user._id) })
    if (!user) {
        res.send({
            code: 500,
            msg: "没有此用户"
        })
        return
    }
    if (parseInt(user.fraction) >= 1) {
        await mongo.updateMany("scum", `${req.user.database}_user`, { _id: new ObjectId(req.user._id) }, { $set: { fraction: parseInt(user.fraction) - 1 } })
        if (robots[req.user.selkey]) {
            robots[req.user.selkey].postMessage({ type: "setChat", data: `${req.user.nickname} 说: ${req.body.text} [网页消息]` })

            let text = `发送网页消息消费 ${1} 积分，剩余 ${parseInt(user.fraction) - 1} 积分`
            mongo.insertOne("scum", `${req.user.database}_message`, { steamid: req.user.steamId, text, datetime: this.getDate() })

            res.send({
                code: 200,
                data: {},
                msg: "发送成功！"
            })
        } else {
            res.send({
                code: 500,
                data: {},
                msg: "发送失败！"
            })
        }

    } else {
        res.send({
            code: 202,
            data: {},
            msg: "积分不足！"
        })
    }

}

/* 
获取当前日期
*/
module.exports.getDate = () => {
    return moment().format('YYYY-MM-DD HH:mm:ss');
}


module.exports.sendServerMessage = (selkey, text) => {
    console.log("添加消息至队列",selkey, text);
    if (robots[selkey]) robots[selkey].postMessage({ type: "setChat", data: text })
}
