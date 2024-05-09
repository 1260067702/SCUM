const { Log } = require("./log")
const mongo = require("../utils/mongo")
const moment = require("moment")

module.exports = class {
    constructor(data, parentPort) {
        this.data = data
        this.parentPort = parentPort
        this.log = new Log(data, parentPort)
    }
    /* 
    下载聊天记录
    */
    async start() {
        let logList = null
        do {
            logList = await this.log.getLogList()
        } while (!logList.length);
        console.log("开始分组");
        let group = this.log.getGroup(logList)
         group = this.log.getSort(group)
        for (const key in group) {
            let index = 0
            for (const iterator of group[key]) {

                let query = await mongo.findOne("scum", `${this.data.database}_server_logs`, { name: iterator.name })

                if (index == 0 || query) {
                    index = -1
                    continue
                }

                let date = iterator.name.match(/_(\d+)\./)
                const dateTime = moment.utc(`${date[1]}`, 'YYYYMMDDHHmmss').utcOffset(8).format('YYYY-MM-DD HH:mm:ss');

                let file = await this.log.getLog(iterator.name, iterator.size)

                let inser = await mongo.insertOne("scum", `${this.data.database}_server_logs`, {
                    group: key,
                    name: iterator.name,
                    datetime: dateTime,
                    size: iterator.size,
                    text: file
                })
                console.log(inser);
            }
        }
    }
}