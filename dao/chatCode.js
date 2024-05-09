const mongo = require("../utils/mongo")
module.exports.ChatCode = class {
    constructor(data, parentPort) {
        this.data = data
        this.parentPort = parentPort
        this.users = {}
    }
    async handle(codeList) {
        console.log(codeList);
        let str = ""
        if (codeList.length > 0) {
            console.log("有列表");
            this.parentPort.postMessage({
                type: "callback",
                data: "#listPlayers true",
                selkey: this.data.selkey
            })
            str = await new Promise(resolve => {
                this.parentPort.once("message", e => {
                    switch (e.type) {
                        case "callback":
                            // console.log(e.data);
                            resolve(e.data)
                            break;
                    }
                })
            })
        }
        // console.log("查询结果", str);
        await this.parsObj(str)
        console.log(this.users);
        for (const iterator of codeList) {
            console.log(iterator);
            let sp = await mongo.findOne("scum", `${this.data.database}_code`, { name: iterator.text, isGou: true })
            if (sp && sp.type == "商品") {
                /* 
                {
                dateTime: '2024-03-04 12:22:20',
                steamId: '76561198422931680',
                name: '机器人',
                id: '3',
                type: 'Global',
                text: '零 说: @Gift [网页消息]'
                }
                */
                console.log("口令购买");
                let us = await mongo.findOne("scum", `${this.data.database}_user`, { enable: true, steam: iterator.steamId, xsfl: false })
                if (us && this.users[iterator.steamId]) {
                    let order = {
                        dateTime: new Date(),
                        name: iterator.name,
                        type: "商品购买",
                        info: [
                            {
                                code: sp.code,
                                number: 1,
                                group: "口令",
                                multiple: "多件",
                                spId: sp._id
                            }
                        ],
                        status: "未发货",
                        steamId: iterator.steamId,
                        selkey: this.data.selkey
                    }
                    let ins = await mongo.insertOne("scum", `${this.data.database}_orders`, order)
                    await mongo.updateMany("scum", `${this.data.database}_user`, { steam: iterator.steamId }, {
                        $set: {
                            xsfl: true
                        }
                    })
                    console.log(ins);
                } else {
                    console.log("领过了");
                    this.parentPort.postMessage({ type: "setChat", selkey: this.data.selkey, data: `[${iterator.name}]Gift package can only be claimed once!礼包只能领一次！` })
                }


            } else if (sp && sp.type == "传送") {
                console.log("口令传送");
                if (this.users[iterator.steamId] && parseInt(this.users[iterator.steamId].balance) > parseInt(sp.price)) {
                    this.parentPort.postMessage({ type: "setChat", selkey: this.data.selkey, data: `#ChangeCurrencyBalance Normal -${sp.price} ${iterator.steamId}` })

                    let order = {
                        dateTime: new Date(),
                        name: iterator.name,
                        type: "地图传送",
                        code: `${sp.code} \"${iterator.steamId}\"`,
                        status: "未发货",
                        steamId: iterator.steamId
                    }
                    let ins = await mongo.insertOne("scum", `${this.data.database}_orders`, order)
                } else {
                    this.parentPort.postMessage({ type: "setChat", selkey: this.data.selkey, data: `[${iterator.name}]Insufficient US dollars!美元不足！` })

                }

            }
        }
    }
    async parsObj(str) {
        // let obj = {}
        console.log(str);
        let arr = str.match(/\n+.*\n.*\n.*\n.*\n.*\n.*\n/g)
        // console.log(sp);
        if (!arr) return
        for (const iterator of arr) {
            let rexus = /Steam: (.*)\((\d{17}).*\n.*\n.*balance: (\d+)/
            let resu = iterator.match(rexus)
            // console.log(resu);
            if (resu) {
                this.users[resu[2]] = {
                    name: resu[1],
                    balance: parseInt(resu[3])
                }
            }
        }
        // return obj
    }
}