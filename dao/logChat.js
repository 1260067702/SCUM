const moment = require("moment")
module.exports.Chat = class {
    constructor(data) {
        this.data = data
        this.size = 0
        this.str = ""
    }
    async getNewLine(str) {
        console.log(str, "test");
        let newLog = str.replace(this.str, "")
        this.str = str
        return newLog
    }
    async prassData(newline) {
        let chats = []
        let chatCodes = []
        let array = newline.split("\n")
        // console.log(array);
        // 创建一个正则表达式来提取所需的内容
        const regex = /(\d{4}\.\d{2}\.\d{2}-\d{2}\.\d{2}\.\d{2}): '(\d{17}):([^(]+)\((\d+)\)' '(\w+): (.*)'/;
        // 提取日志内容
        for (const logLine of array) {
            const matches = logLine.match(regex);
            // console.log(logLine);
            // console.log(matches);
            if (matches) {
                const dateTime = moment.utc(`${matches[1]}`, 'YYYY.MM.DD-HH.mm.ss').utcOffset(8).format('YYYY-MM-DD HH:mm:ss');
                let chatObj = {
                    dateTime: dateTime,
                    steamId: matches[2],
                    name: matches[3],
                    id: matches[4],
                    type: matches[5],
                    text: matches[6]
                }
                // && matches[3] !== "机器人"
                if (matches[6].match(/@/) && matches[3] !== "机器人") {
                    chatCodes.push(chatObj)
                } else {
                    chats.push(chatObj)
                }

            }
        }

        return { chats, chatCodes }

    }

    async addToChats(chats, parentPort) {
        parentPort.postMessage({
            type: "setChats",
            data: chats
        })
    }
}