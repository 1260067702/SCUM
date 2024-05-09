const { parentPort, workerData } = require("worker_threads")
const { Log } = require("./log")
const { Login } = require("./logLogin")
const { Chat } = require("./logChat")
const { ChatCode } = require("./chatCode")
const DoanLog = require("./logDownload")
const schedule = require("node-schedule")

let chatInfos = []
let log = new Log(workerData, parentPort)
let login = new Login(workerData, parentPort)
let chat = new Chat(workerData, parentPort)
let chatCode = new ChatCode(workerData, parentPort)

/* 
每天下载服务器日志
*/
schedule.scheduleJob("loadFile", "0 30 0 * * *", () => new DoanLog(workerData, parentPort).start())


/* 
启动日志服务
*/
start()

async function start() {
    let logList = null
    do {
        logList = await log.getLogList()
    } while (!logList.length);
    console.log("开始分组");
    let group = log.getGroup(logList)
    let sort = log.getSort(group)
    console.log("排序");
    console.log("登录日志处理");
    // 登录日志
    startLogin(sort['login'][0].name, sort['login'][0].size)
    // 聊天日志
    startChat(sort['chat'][0].name, sort['chat'][0].size)

    setTimeout(start, 30000)
}
/* 
聊天记录处理
*/
async function startChat(name, size) {
    if (chat.size == size) {
        console.log("聊天日志无变化");
        return
    }
    chat.size = size

    let chatLogStr = await log.getStr(name, size)
    if (chatLogStr == "") return
    console.log(chatLogStr, "聊天日志成功");
    let str = await chat.getNewLine(chatLogStr)
    let chats = await chat.prassData(str)
    chatInfos.push(...chats.chats)
    chatCode.handle(chats.chatCodes, parentPort)
}
/* 
登录数据处理
*/
async function startLogin(name, size) {
    if (login.size == size) {
        console.log("登录日志无变化");
        return
    }
    login.size = size

    let loginLogStr = await log.getStr(name, size)
    console.log(loginLogStr, "获取日志成功");
    let str = await login.getNewLine(loginLogStr)
    let users = await login.prassData(str)
    login.handel(users, parentPort)
}
/* 
监听消息log任务
*/
parentPort.on("message", data => {
    switch (data.type) {
        case "getChat":
            console.log("获取聊天记录");
            parentPort.postMessage({
                type: "chats",
                data: chatInfos
            })
            break;

        default:
            break;
    }
})