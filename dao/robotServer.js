

const { ObjectId } = require('mongodb');
const mongo = require("../utils/mongo")
const moment = require("moment")
const fs = require("fs")
const { sendArray, sendSingle } = require("../utils/utils");
module.exports = class Robot {
    constructor(item) {
        this.data = item
        this.database = item.database    //服务器数据库
        this.selkey = item.selkey    //机器人通讯密钥
        this.run = false //是否处于运行中
        this.messages = []  //发送的消息队列
        this.auto = 5   //1自动上线2等待3重载4停止0没有操作
        this.shibie = item.shibie
        this.callback = false

        this.status = false //机器人是否在线
        this.interval = setInterval(async () => {
            if (this.auto == 1) {
                console.log("自动上线中");
                return
            } else if (this.auto == 2) {
                console.log("等待操作响应");
                return
            } else if (this.auto == 3) {
                console.log(`${this.database}错误`);
                this.auto = 1
                return
            } else if (this.auto == 4) {
                clearInterval(this.interval)
                return
            } else if (this.auto == 5) {
                console.log("上线机器人");
                this.auto = 1
                await this.upLine()
                return
            }
            if (!this.status) {
                console.log("机器人不在线");
                await this.upLine()
                return
            }
            if (!this.run) {
                await this.sendOutGoods()
            }
        }, 3000)
    }
    async upLine() {
        /* 
        检测机器人是否已在线
        */
        let isOnLine = await sendSingle({
            type: "findImage",
            code: this.shibie[0]
        }, this.selkey)
        console.log(1, isOnLine);
        if (isOnLine.code == 200 && isOnLine.data[0] != null) {
            console.log("机器人已在线");

            await sendSingle({
                "type": "Mouse",
                "code": {
                    "x": 100,
                    "y": 100
                }
            }, this.selkey)

            this.status = true
            this.auto = 0
            return
        } else if (isOnLine.code == 202 && isOnLine.msg == "机器人不在线") {
            this.auto = 4
            return
        }
        /* 
        点击ok
        */
        let findok = await sendSingle({
            type: "findImage",
            code: this.shibie[1]
        }, this.selkey)

        let ok = await sendSingle({
            "type": "mouseClick",
            "code": "left"
        }, this.selkey)
        console.log(ok);

        /* 
        寻找继续游戏按钮
        */
        let isFind = await this.findImg()
        if (!isFind) {
            console.log("自动上线失败");
            this.auto = 3
            return
        }

        /* 
        点击继续游戏
        */
        this.auto = 2 //进入耗时间等待
        let click = await sendSingle({
            "type": "mouseClick",
            "code": "left"
        }, this.selkey)
        console.log(click);

        /* 
        等待两分钟
        */
        await this.wait(120)
        /* 
        切换机器人发言频道
        打开地图并显示地图上玩家
        */
        await sendArray([{
            type: "Keyboard",
            code: "T"
        }, {
            type: "Keyboard",
            code: "Tab"
        }, {
            type: "Clipboard",
            code: "#ShowOtherPlayerInfo true"
        }, {
            type: "Keyboard",
            code: "Enter"
        }, {
            type: "Clipboard",
            code: "机器人已上线"
        }, {
            type: "Keyboard",
            code: "Enter"
        }, {
            type: "Keyboard",
            code: "Enter"
        }, {
            type: "Keyboard",
            code: "M"
        }], this.selkey)


        console.log("执行完成");
        /* 
        检测机器人是否已在线 #ChangeCurrencyBalance Normal 100 true
        */
        let isOnLine2 = await sendSingle({
            type: "findImage",
            code: this.shibie[0]
        }, this.selkey)
        console.log("再次检测", isOnLine2);


        await sendSingle({
            "type": "Mouse",
            "code": {
                "x": 100,
                "y": 100
            }
        }, this.selkey)

        this.status = true
        this.auto = 0
    }

    wait(t) {
        return new Promise(resolve => {
            setTimeout(() => resolve(), t * 1000)
        })
    }

    async move() {
        let mo = await sendSingle({
            "type": "Mouse",
            "code": {
                "x": 100,
                "y": 100
            }
        }, this.selkey)
        console.log(mo);
    }
    async findImg() {
        let pos = await sendSingle({
            type: "findImage",
            code: this.shibie[2]
        }, this.selkey)
        console.log(pos);
        if (pos.code != 200) {
            console.log("没有找到继续游戏");
            return
        } else if (pos.data[0] != null) {
            return true
        }
    }

    async sendOutGoods() {
        if (this.callback) {
            console.log("优先队列执行中");
            return
        }
        let list = await mongo.findMany("scum", `${this.database}_orders`, { status: "未发货" })
        // console.log(list);
        if (!this.callback && !this.run && list.length > 0) {
            console.log("检测到需要发货的订单", this.database, this.selkey);
            this.run = true
            await mongo.updateMany("scum", `${this.database}_orders`, { _id: new ObjectId(list[0]._id) }, { $set: { status: "发货中" } })
            if (list[0].type.includes("传送")) {
                this.mapTP(list[0])
            } else {
                this.robotHandle2(list[0])
            }

        } else if (!this.callback && !this.run && this.messages.length > 0) {
            /* 
            发送服务器消息
            */
            this.run = true
            this.serverMsg(this.messages[0])

        }

    }

    /* 
商品发放
*/
    async robotHandle(data) {
        console.log(`日期：${data.dateTime}  [${data.name}] ${data.type}`);
        let array = [{
            type: "Keyboard",
            code: "T"
        },
        {
            type: "Clipboard",
            code: `尊敬的玩家 [${data.name}] 您订购的商品正在发货中，请到空旷的场地等待机器人发货！不要动！不要动！不要动！空旷的场地！空旷的场地！空旷的场地！`
        },
        {
            type: "Keyboard",
            code: "Enter"
        }]

        for (const key in data.info) {
            switch (data.info[key].group) {
                case "特殊":
                    for (let index = 0; index < data.info[key].number; index++) {
                        array.push({
                            type: "Clipboard",
                            code: `${data.info[key].code} Location ${data.steamId}`
                        })

                        array.push({
                            type: "Keyboard",
                            code: "Enter"
                        })
                    }
                    break

                default:
                    if (data.info[key].number <= 10) {
                        if (data.info[key].multiple == "多件") {
                            let codeList = data.info[key].code.split("\n")
                            // console.log(codeList);
                            for (const iterator of codeList) {
                                array.push(this.createCmd(iterator, data.info[key].number, data.steamId))
                                array.push({
                                    type: "Keyboard",
                                    code: "Enter"
                                })
                            }
                        } else {
                            array.push(this.createCmd(data.info[key].code, data.info[key].number, data.steamId))
                            array.push({
                                type: "Keyboard",
                                code: "Enter"
                            })
                        }

                    } else if (data.info[key].number > 10) {
                        /* 
                        数量大于10
                        */
                        for (let index = 0; index < parseInt(data.info[key].number / 10); index++) {
                            /* 
                            先发整十数
                            */
                            if (data.info[key].multiple == "多件") {
                                /* 
                                商品为多件
                                */
                                let codeList = data.info[key].code.split("\n")
                                // console.log(codeList);
                                for (const iterator of codeList) {
                                    array.push(this.createCmd(iterator, 10, data.steamId))
                                    array.push({
                                        type: "Keyboard",
                                        code: "Enter"
                                    })
                                }
                            } else {
                                /* 
                                商品为单件
                                */
                                array.push(this.createCmd(data.info[key].code, 10, data.steamId))
                                array.push({
                                    type: "Keyboard",
                                    code: "Enter"
                                })

                            }
                        }
                        /* 
                        后发余数
                        */
                        let yu = data.info[key].number % 10
                        if (data.info[key].multiple == "多件") {
                            /* 
                            商品为多件
                            */
                            let codeList = data.info[key].code.split("\n")
                            // console.log(codeList);
                            for (const iterator of codeList) {
                                array.push(this.createCmd(iterator, yu, data.steamId))
                                array.push({
                                    type: "Keyboard",
                                    code: "Enter"
                                })
                            }
                        } else {
                            /* 
                            商品为单件
                            */
                            array.push(this.createCmd(data.info[key].code, yu, data.steamId))
                            array.push({
                                type: "Keyboard",
                                code: "Enter"
                            })

                        }



                    }

                    break
            }
        }

        array.push({
            type: "Clipboard",
            code: `尊敬的玩家[${data.name}] 您的商品发货已完成请查收！`
        })
        array.push({
            type: "Keyboard",
            code: "Enter"
        })
        array.push({
            type: "Keyboard",
            code: "Enter"
        })
        console.log(JSON.stringify(array));
        let result = await sendArray(array, this.selkey)
        console.log(result);
        if (result == "err") {

            await mongo.updateMany("scum", `${this.database}_orders`, { _id: new ObjectId(data._id) }, { $set: { status: "发货失败" } })
        } else {

            await mongo.updateMany("scum", `${this.database}_orders`, { _id: new ObjectId(data._id) }, { $set: { status: "发货完成" } })
        }
        this.run = false
    }
    /* 
    生成一个操作指令
    */
    createCmd(code, number, steamId, multiple) {
        switch (multiple) {
            case "特殊":
                return {
                    type: "Clipboard",
                    code: `${code} Location ${steamId}`
                }
                break;

            default:
                return {
                    type: "Clipboard",
                    code: `${code} ${number} Location ${steamId}`
                }
                break;
        }

    }

    /* 
    商品发放2
    */

    async robotHandle2(data) {
        console.log(`日期：${data.dateTime}  [${data.name}] ${data.type}`);
        let array = [{
            type: "Keyboard",
            code: "T"
        },
        {
            type: "Clipboard",
            code: eval("`" + this.data.BfNotfiy.replace("@user", "${data.name}") + "`")
        },
        {
            type: "Keyboard",
            code: "Enter"
        }]

        for (const item of data.info) {
            // 物品单件数量
            let number = item.number
            switch (item.multiple) {
                case "多件":
                    // 分割行代码
                    let codeList = item.code.split("\n")
                    for (let index = 0; index < number; index++) {
                        for (const code of codeList) {
                            let singleCode = this.createManyShopping(code, data.steamId)
                            array.push(...singleCode)

                        }
                    }

                    break;

                default:
                    let singleCode = this.createSingleShopping(item.code, number, data.steamId, item.multiple)
                    array.push(...singleCode)
                    break;
            }

        }
        array.push({
            type: "Clipboard",
            code: eval("`" + this.data.AfNotfiy.replace("@user", "${data.name}") + "`")
        })
        array.push({
            type: "Keyboard",
            code: "Enter"
        })
        array.push({
            type: "Keyboard",
            code: "Enter"
        })
        console.log(JSON.stringify(array));
        let result = await sendArray(array, this.selkey)
        console.log(result);
        if (result == "err") {

            await mongo.updateMany("scum", `${this.database}_orders`, { _id: new ObjectId(data._id) }, { $set: { status: "发货失败" } })
        } else {

            await mongo.updateMany("scum", `${this.database}_orders`, { _id: new ObjectId(data._id) }, { $set: { status: "发货完成" } })
        }
        this.run = false

    }
    /* 
    多物品代码生成
    */
    createManyShopping(code, steamId) {
        let arr = []
        arr.push(this.createCmd(code, 0, steamId, "特殊"))
        arr.push({
            type: "Keyboard",
            code: "Enter"
        })
        return arr
    }
    /* 
    生成单个物品代码
    */
    createSingleShopping(code, number, steamId, multiple) {
        let arr = []
        if (number <= 10) {
            arr.push(this.createCmd(code, number, steamId, multiple))
            arr.push({
                type: "Keyboard",
                code: "Enter"
            })
        } else {
            for (let index = 0; index < parseInt(number / 10); index++) {
                arr.push(this.createCmd(code, 10, steamId, multiple))
                arr.push({
                    type: "Keyboard",
                    code: "Enter"
                })
            }
            arr.push(this.createCmd(code, number % 10, steamId, multiple))
            arr.push({
                type: "Keyboard",
                code: "Enter"
            })
        }
        return arr
    }
    /* 
    地图传送
    */
    async mapTP(data) {
        console.log(`日期：${data.dateTime}  [${data.name}] ${data.type}`);
        let array = [{
            type: "Keyboard",
            code: "T"
        }, {
            type: "Clipboard",
            code: eval("`" + this.data.CSBfNotfiy.replace("@user", "${data.name}") + "`")
        }, {
            type: "Keyboard",
            code: "Enter"
        }, {
            type: "Clipboard",
            code: data.code + " true"
        }, {
            type: "Keyboard",
            code: "Enter"
        }, {
            type: "Clipboard",
            code: eval("`" + this.data.CSAfNotfiy.replace("@user", "${data.name}") + "`")
        }, {
            type: "Keyboard",
            code: "Enter"
        }, {
            type: "Keyboard",
            code: "Enter"
        }]

        let result = await sendArray(array, this.selkey)
        console.log(result);
        await mongo.updateMany("scum", `${this.database}_orders`, { _id: new ObjectId(data._id) }, { $set: { status: "发货完成" } })
        this.run = false
    }

    async serverMsg(text) {
        console.log(`日期：${moment(new Date()).format('YYYY-MM-DD kk:mm:ss')} 服务器消息：${text}`);
        let array = [{
            type: "Keyboard",
            code: "T"
        }, {
            type: "Clipboard",
            code: eval("`" + text + "`")
        }, {
            type: "Keyboard",
            code: "Enter"
        }, {
            type: "Keyboard",
            code: "Enter"
        }]
        let result = await sendArray(array, this.selkey)
        // console.log(result);
        this.messages.splice(0, 1)
        this.run = false

        return result
    }

    async serverMsg2(text) {
        console.log(`日期：${moment(new Date()).format('YYYY-MM-DD kk:mm:ss')} 服务器消息：${text}`);
        let array = [{
            type: "Keyboard",
            code: "T"
        }, {
            type: "Clipboard",
            code: eval("`" + text + "`")
        }, {
            type: "Keyboard",
            code: "Enter"
        }, {
            type: "Keyboard",
            code: "Enter"
        }]
        let result = await sendArray(array, this.selkey)
        this.run = false

        return result
    }

}
