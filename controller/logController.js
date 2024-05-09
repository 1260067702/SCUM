const mong = require("../utils/mongo")
const { Worker } = require("worker_threads")
const { sendServerMessage } = require("./robotController")
global.logServer = {}
module.exports.startLogServer = async (req, res) => {
    let account = await mong.findOne("scum", "account", { selkey: req.user.selkey })
    if (account) {
        if (logServer[account.selkey]) logServer[account.selkey].terminate()
        logServer[account.selkey] = new Worker("./dao/logServer.js", { workerData: account })
    }
    // console.log(account);

    logServer[account.selkey].on("message", e => {
        switch (e.type) {
            case "setChat":
                sendServerMessage(e.selkey, e.data)
                break;
            case "callback":
                console.log("log收到消息");
                queryCallback(e)
                break;

            default:
                break;
        }
    })

    res.send({
        code: 200,
        msg: "启动日志服务"
    })
}


module.exports.getLogServer = (req, res) => {
    if (logServer[req.user.selkey]) {
        res.send({
            code: 200,
            msg: "已启动日志服务"
        })
    }else{
        res.send({
            code: 201,
            msg: "未启动日志服务"
        })
    }
}


function queryCallback(e) {
    if (!robots[e.selkey]) return
    robots[e.selkey].postMessage(e)
    robots[e.selkey].once("message", e2 => {
        switch (e2.type) {
            case "callback":
                logServer[e.selkey].postMessage(e2)
                break;
        }
    })
}
module.exports.getChat = (req, res) => {
    console.log("聊天请求");
    if (!logServer[req.user.selkey]) {
        res.send({
            code: 200,
            data: [],
            msg: "聊天日志"
        })
        return
    }
    logServer[req.user.selkey].postMessage({
        type: "getChat"
    })
    logServer[req.user.selkey].once("message", e => {
        if (e.type == "chats") {
            res.send({
                code: 200,
                data: e.data,
                msg: "聊天日志"
            })
        }
    })
}