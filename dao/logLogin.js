const moment = require("moment")
const mongo = require("../utils/mongo")
module.exports.Login = class {
    constructor(data) {
        this.data = data
        this.size = 0
        this.str = ""
    }
    async handel(users, parentPort) {
        // console.log(users);
        for (const iterator of users) {
            let result = await mongo.findOne("scum", `${this.data.database}_user`, { steam: iterator.steamid })
            if (!result) {
                if (iterator.action == "在线") {
                    let add = await mongo.insertOne("scum", `${this.data.database}_user`, {
                        steam: iterator.steamid,
                        name: iterator.name,
                        pos: {
                            x: iterator.x,
                            y: iterator.y,
                            z: iterator.z
                        },
                        online: iterator.action,
                        address: iterator.ip,
                        userid: iterator.userid,
                        date: iterator.dateTime,
                        xsfl: false,
                        mrfl: false,
                        mrqd: false,
                        fraction: 0,
                        enable: true,
                    })
                    // console.log(add);

                    parentPort.postMessage({
                        type: "setChat",
                        data: eval("`" + this.data.playerIn.replace("@user", "${iterator.name}").replace("@server", "${this.data.server}") + "`"),
                        selkey: this.data.selkey
                    })
                    parentPort.postMessage({
                        type: "setChat",
                        data: eval("`" + this.data.newPlayerIn.replace("@user", "${iterator.name}").replace("@server", "${this.data.server}") + "`"),
                        selkey: this.data.selkey
                    })

                } else {
                    /* 
                    离线处理
                    */
                    let add = await mongo.insertOne("scum", `${this.data.database}_user`, {
                        steam: iterator.steamid,
                        name: iterator.name,
                        pos: {
                            x: iterator.x,
                            y: iterator.y,
                            z: iterator.z
                        },
                        online: iterator.action,
                        address: iterator.ip,
                        userid: iterator.userid,
                        date: iterator.dateTime,
                        xsfl: false,
                        mrfl: false,
                        mrqd: false,
                        fraction: 0,
                        enable: true,
                    })
                }

            } else {
                if (iterator.action == "在线") {
                    let update = await mongo.updateMany("scum", `${this.data.database}_user`,
                        { steam: iterator.steamid },
                        {
                            $set: {
                                name: iterator.name,
                                pos: {
                                    x: iterator.x,
                                    y: iterator.y,
                                    z: iterator.z
                                },
                                online: iterator.action,
                                address: iterator.ip,
                                userid: iterator.userid,
                                date: iterator.dateTime
                            }
                        })
                    // console.log(update);
                    parentPort.postMessage({
                        type: "setChat",
                        data: eval("`" + this.data.robotOnline.replace("@user", "${iterator.name}") + "`"),
                        selkey: this.data.selkey
                    })
                } else {
                    /* 
                    离线处理
                    */

                }
            }
        }
    }
    async getNewLine(str) {
        console.log(str, "test");
        let newLog = str.replace(this.str, "")
        this.str = str
        return newLog
    }
    async prassData(newline) {
        let users = []
        let array = newline.split("\n")
        // console.log(array);
        // 创建一个正则表达式来提取所需的内容
        const regex = /(\d{4}\.\d{2}\.\d{2}-\d{2}\.\d{2}\.\d{2}): '(\d+\.\d+\.\d+\.\d+) (\d{17}):([^(]+)\((\d+)\)\' logged (in|out) at: X=(-*\d+\.\d+) Y=(-*\d+\.\d+) Z=(-*\d+\.\d+)/;
        // 提取日志内容
        for (const logLine of array) {
            // console.log(logLine);
            const matches = logLine.match(regex);
            // console.log(matches);
            if (matches) {
                const dateTime = moment.utc(`${matches[1]}`, 'YYYY.MM.DD-HH.mm.ss').utcOffset(8).format('YYYY-MM-DD HH:mm:ss');;
                const ip = matches[2]
                let steamid = matches[3]
                const name = matches[4];
                let userid = matches[5]
                const action = matches[6] == "in" ? "在线" : "离线";
                const x = matches[7];
                const y = matches[8];
                const z = matches[9];
                console.log(`"日期时间: ${dateTime} IP地址: ${ip} steam Id: ${steamid} 用户: ${name} 动作: ${action} X坐标: ${x} Y坐标: ${y} Z坐标: ${z}`);
                /* 
                查询用户
                */
                users.push({
                    dateTime,
                    ip,
                    steamid,
                    name,
                    userid,
                    action,
                    x,
                    y,
                    z
                })
                continue
                let result = await db.collection(`${this.data.database}_user`).findOne({ steam: steamid });

                if (!result) {
                    /* 
                    新玩家
                    */
                    let add = await db.collection(`${this.data.database}_user`).insertOne({ steam: steamid, name: user, pos: { x, y, x }, online: action, address: ip, userid, date: dateTime })
                    // console.log(add);
                    if (action == "在线") {
                        let hy1 = await setServerMessage({ text: `欢迎新玩家[${user}]加入${this.data.database}服务器` }, this.data.selkey)
                        let hy2 = await setServerMessage({ text: `#announce 欢迎新玩家[${user}]` }, this.data.selkey)
                        await setServerMessage({ text: `#SetCurrencyBalance Normal 20000 ${steamid}` }, this.data.selkey)
                        // console.log(hy1.data, hy2.data);
                        await online({
                            nickname: user,
                            steamid,
                            database: this.data.database,
                            status: action,
                            selkey: this.data.selkey
                        })
                    }
                } else {
                    let update = await db.collection(`${this.data.database}_user`).updateOne({ steam: steamid }, { $set: { name: user, pos: { x, y, x }, online: action, address: ip, userid, date: dateTime } })
                    // console.log(update);
                    if (action == "在线") {
                        let hy1 = await setServerMessage({ text: `玩家[${user}]已上线~~~！` }, this.data.selkey)
                        // console.log(hy1);
                        await online({
                            nickname: user,
                            steamid,
                            database: this.data.database,
                            status: action,
                            selkey: this.data.selkey
                        })
                    } else if (action == "离线") {
                        await offline({
                            nickname: user,
                            steamid,
                            database: this.data.database,
                            status: action,
                            selkey: this.data.selkey
                        })
                    }
                }
            }
        }
        return users
    }
}