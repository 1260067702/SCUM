// var mongo = require('mongodb').MongoClient;
const { ObjectId } = require('mongodb');
const moment = require("moment")
const schedule = require("node-schedule")
const axios = require("axios")
const mongo = require("../utils/mongo")

// 定时重置
schedule.scheduleJob('0 0 0 * * *', function () {
    console.log('重置签到');
    reQian()
});

const jwt = require("../utils/token");

// var url = 'mongodb://scum:PMmBZeja5isGscM2@10.0.0.9:27017/?authSource=scum';
// const dbName = 'scum';
// const op = {
//     useNewUrlParser: true
// }
// const client = new mongo(url, op);
// const db = client.db(dbName);

// client.connect();



async function reQian() {
    let serverList = await mongo.findMany("scum", "account", { enable: true })
    serverList.forEach(async item => {
        await mongo.updateMany("scum", `${item.database}_user`, {}, {
            $set: {
                "mrfl": false,
                "mrqd": false
            }
        })
    })

}
/* 
查询服务器
*/
async function queryServer(hostname) {
    let result = await mongo.findOne("scum", `account`, { hostname, enable: true })
    return result
}

/* 
注册接口
*/
module.exports.createUser = async (req, res) => {

    console.log(req.body);
    let server = await queryServer(req.headers.host)
    console.log(server);
    if (!server) {
        res.send({
            msg: "没有找到该服务器的商城",
            code: 500,
            data: {}
        })
        return
    }
    if (!server.registration_switch) {
        res.send({
            msg: "未开放注册",
            code: 500,
            data: {}
        })
        return
    }
    if (req.body && req.body.steamId && req.body.username && req.body.password && req.body.nickname) {
        console.log("用户数据正确");
        let user = await mongo.findOne("scum", `${server.database}_user`, { steam: req.body.steamId })

        console.log(user);
        // return
        if (user && user.username) {
            res.send({
                msg: "steamId已被绑定",
                code: 202,
                data: {}
            })
            return
        }
        if (!user) {
            res.send({
                msg: "请登录一次游戏，等待后台录入数据",
                code: 202,
                data: {}
            })
            return
        }
        let reg = await mongo.updateMany("scum", `${server.database}_user`, { steam: req.body.steamId }, {
            $set: {
                steamId: req.body.steamId,
                username: req.body.username,
                password: req.body.password,
                nickname: req.body.nickname,
                fraction: (parseInt(server.initial_integral) == NaN ? 0 : parseInt(server.initial_integral)) + (parseInt(user.fraction) == NaN ? 0 : parseInt(user.fraction)),
                // mrfl: false,
                // mrqd: false,
                // xsfl: false,
                senior: false,
                enable: true
            }
        })
        if (reg.acknowledged) {
            res.send({
                msg: "注册成功",
                code: 200,
                data: {}
            })
        }
        else {
            res.send({
                msg: "未知错误",
                code: 203,
                data: {}
            })
        }



    } else {
        console.log("用户数据错误", req.body);
        res.send({
            msg: "err",
            code: 500,
            data: {}
        })
    }
    // client.close()
}
/* 

登录接口
*/
module.exports.login = async (req, res) => {
    // console.log(req);
    let server = await queryServer(req.headers.host)
    if (!server) {
        res.send({
            msg: "没有找到该服务器的商城",
            code: 500,
            data: {}
        })
        return
    }
    if (req.body && req.body.username && req.body.password) {
        // await client.connect();
        let data = await mongo.findOne("scum", `${server.database}_user`, { username: req.body.username, password: req.body.password, enable: true })
        if (data) {
            data["server"] = server.server
            data["hostname"] = server.hostname
            data["database"] = server.database
            data["selkey"] = server.selkey
            let token = await jwt.setToken(data)



            res.send({
                code: 200,
                data: {
                    nickname: data.nickname,
                    username: data.username,
                    token: token,
                    jf: data.fraction,
                    senior: data.senior,
                },
                msg: "登录成功"
            })
        } else {
            res.send({
                code: 201,
                data: {},
                msg: "账号或密码错误"
            })
        }

    }
    // client.close()
}

/* 
上传图片接口
*/
module.exports.upload = async (req, res) => {
    // console.log(req);
    await mongo.insertOne("scum", "images", {
        name: req.body.name,
        imgUrl: req.file.filename
    })
    let imgs = await mongo.findMany("scum", "images", {})
    res.send({
        msg: "上传成功",
        code: 200,
        data: imgs
    })
    // client.close()
}
/* 
管理员添加商品
*/

module.exports.addArticle = async (req, res) => {
    let result = await mongo.insertOne("scum", `${req.user.database}_shopping`, req.body)
    if (result.acknowledged) {
        let queryAll = await mongo.findMany("scum", `${req.user.database}_shopping`, {})
        res.send({
            code: 200,
            msg: "添加成功！",
            data: queryAll
        })
    } else {
        res.send({
            code: 201,
            msg: "添加失败！",
            data: {}
        })
    }
    // client.close()

}
/* 
管理员获取全部商品
*/
module.exports.AdminQueryAll = async (req, res) => {
    let queryAll = await mongo.findMany("scum", `${req.user.database}_shopping`, {})
    res.send({
        code: 200,
        msg: "",
        data: queryAll
    })
    // client.close()
}
/* 
管理员修改商品
*/
module.exports.AdminChangeArticle = async (req, res) => {
    let id = req.body._id
    delete req.body._id
    // console.log("修改的内容",req.body);
    let ChangeArticleResult = await mongo.updateMany("scum", `${req.user.database}_shopping`, { _id: new ObjectId(id) }, { $set: req.body })
    console.log(ChangeArticleResult);
    if (ChangeArticleResult.modifiedCount > 0) {
        res.send({
            code: 200,
            msg: "修改成功",
            data: {}
        })
    } else {
        res.send({
            code: 201,
            msg: "修改失败",
            data: {}
        })
    }
    // client.close()
}
/* 
管理员删除商品
*/
module.exports.AdminDeleteArticle = async (req, res) => {
    let del = await mongo.delete("scum", `${req.user.database}_shopping`, { _id: new ObjectId(req.body._id) })
    console.log(del);
    if (del.deletedCount > 0) {
        let queryAll = await mongo.find("scum", `${req.user.database}_shopping`, {})
        res.send({
            code: 200,
            msg: "删除成功",
            data: queryAll
        })
    } else {
        res.send({
            code: 200,
            msg: "删除失败",
            data: {}
        })
    }
    // client.close()
}
/* 
管理员查询礼包
*/
module.exports.AdminQueryGift = async (req, res) => {
    let gift = await mongo.findMany("scum", `${req.user.database}_gift`, {})
    console.log(gift);
    res.send({
        code: 200,
        data: gift,
        msg: ""
    })
    // client.close()
}
/* 
管理员管理礼包
*/
module.exports.AdminChangeGift = async (req, res) => {
    let id = req.body._id
    delete req.body._id
    let changeGift = await mongo.updateMany("scum", `${req.user.database}_gift`, { _id: new ObjectId(id) }, { $set: req.body })
    console.log(changeGift);
    if (changeGift.modifiedCount > 0) {
        let gift = await mongo.findMany("scum", `${req.user.database}_gift`, {})
        res.send({
            code: 200,
            msg: "修改成功",
            data: gift
        })
    } else {
        res.send({
            code: 201,
            msg: "修改失败",
            data: {}
        })
    }

    // client.close()
}
/* 
主界面数据获取
*/
module.exports.mainData = async (req, res) => {
    console.log(req.body);

    let gift = await mongo.findMany("scum", `${req.user.database}_gift`, {})

    let transmit = await mongo.findMany("scum", `${req.user.database}_transmit`, { isOn: true, type: "公共" })
    // console.log(transmit);
    for (const key in transmit) {
        delete transmit[key].name
        delete transmit[key].userId
        delete transmit[key].server
        delete transmit[key].position
        delete transmit[key].isOn
    }

    /* let list = await db.collection(`${req.user.database}_ranks`).aggregate([
        {
            $match: {
                "enable": true
            }
        },
        {
            $project: {
                playerNum: {
                    $size: "$item"
                },
                item: 1,
                boss: 1,
                name: 1
            }
        },
        {
            $sort: {
                playerNum: -1
            }
        }
    ]).toArray() */
    let list = await mongo.find("scum", `${req.user.database}_ranks`, [
        {
            $match: {
                enable: true
            }
        },
        {
            $project: {
                playerNum: {
                    $size: "$item"
                },
                item: 1,
                boss: 1,
                name: 1
            }
        },
        {
            $sort: {
                playerNum: -1
            }
        }
    ])

    let ranks = await mongo.findOne("scum", `${req.user.database}_ranks`, {
        $or: [{
            enable: true,
            boss: req.user._id
        }, {
            "item": {
                'id': req.user._id,
                'verify': true
            }
        }]
    })
    console.log(ranks);
    if (ranks) {
        for (const key in ranks.item) {
            let us = await mongo.findOne("scum", `${req.user.database}_user`, { _id: new ObjectId(ranks.item[key]) })
            ranks.item[key] = {
                name: us.nickname,
                id: us._id,
                verify: ranks.item[key].verify
            }
        }
    }

    // let userList = await db.collection(`${req.user.database}_user`).find({ enable: true }, 50).project({ name: 1, fraction: 1 }).sort({ fraction: -1 }).toArray()
    let userList = await mongo.find("scum", `${req.user.database}_user`, [{
        $project: { name: 1, fraction: 1 }
    }, {
        $sort: { fraction: -1 }
    }])

    // let user = await db.collection(`${req.user.database}_user`).find({ _id: new ObjectId(req.user._id), enable: true }).project({ nickname: 1, username: 1, fraction: 1, online: 1 }).toArray()
    let user = await mongo.find("scum", `${req.user.database}_user`, [{
        $match: { _id: new ObjectId(req.user._id), enable: true }
    }, {
        $project: { nickname: 1, username: 1, fraction: 1, online: 1 }
    }])

    // let privateTransmit = await db.collection(`${req.user.database}_transmit`).find({ userId: req.user._id, type: "私人", isOn: true }).project({ notes: 1, price: 1 }).toArray()
    let privateTransmit = await mongo.find("scum", `${req.user.database}_transmit`, [{
        $project: { notes: 1, price: 1 }
    }, {
        $match: { userId: req.user._id, type: "私人", isOn: true }
    }])

    // let gonggao = await db.collection("account").findOne({ database: req.user.database })
    let gonggao = await mongo.findOne("scum", "account", { database: req.user.database })

    // let message = await db.collection(`${req.user.database}_message`).find({ steamid: req.user.steamId }).sort({ datetime: -1 }).toArray()
    let message = await mongo.find("scum", `${req.user.database}_message`, [{
        $match: { steamid: req.user.steamId }
    },
    {
        $sort: { datetime: -1 }
    }])
    res.send({
        code: 200,
        msg: "请求成功",
        data: {
            gift,
            transmit,
            gonggao: gonggao.gonggao,
            by: "Zero QQ:1260067702",
            ranksList: list,
            ranks,
            userList,
            user: user[0],
            privateTransmit,
            message: message
        }
    })
}
/* 
礼包领取
*/
module.exports.giveXSFL = async (req, res) => {
    console.log(req.body);

    let queryLiBao = await mongo.findOne("scum", `${req.user.database}_gift`, { _id: new ObjectId(req.body._id) })
    console.log(queryLiBao);
    if (!queryLiBao || !queryLiBao.isOn) {
        res.send({
            code: 201,
            data: {},
            msg: "没有此礼包"
        })
        return
    }
    console.log(this.getDate());
    let name = req.user.name.replace(/[\(].+?[\)]/g, "")///\((?:.*)\)/g
    console.log(name);
    let order = {
        dateTime: this.getDate(),
        name: name,
        type: queryLiBao.name,
        info: queryLiBao.content,
        status: "未发货",
        steamId: req.user.steamId
    }
    let isUse = await mongo.findOne("scum", `${req.user.database}_user`, { _id: new ObjectId(req.user._id) })
    console.log(isUse);
    switch (queryLiBao.name) {
        case "新手福利":
            if (isUse && !isUse.xsfl) {
                /* let server = await queryServer(req.headers.host)
                order["selkey"] = server.selkey */
                /* 
                创建发货订单
                */
                let addOrder = await mongo.insertOne("scum", `${req.user.database}_orders`, order)
                console.log(addOrder);
                await mongo.updateMany("scum", `${req.user.database}_user`, { _id: new ObjectId(req.user._id) }, { $set: { xsfl: true } })
                let ods = await mongo.findMany("scum", `${req.user.database}_orders`, { steamId: req.user.steamId })
                res.send({
                    code: 200,
                    data: ods,
                    msg: "领取成功"
                })
            } else {
                res.send({
                    code: 202,
                    data: {},
                    msg: "你已领取过新手福利了"
                })
            }
            break
        case "每日礼包":
            if (isUse && !isUse.mrfl) {
                /* let server = await queryServer(req.headers.host)
                order["selkey"] = server.selkey */
                /* 
                创建发货订单
                */
                let addOrder = await mongo.insertOne("scum", `${req.user.database}_orders`, order)
                console.log(addOrder);
                await mongo.updateMany("scum", `${req.user.database}_user`, { _id: new ObjectId(req.user._id) }, { $set: { mrfl: true } })
                let ods = await mongo.findMany("scum", `${req.user.database}_orders`, { steamId: req.user.steamId })


                res.send({
                    code: 200,
                    data: ods,
                    msg: "领取成功"
                })
            } else {
                res.send({
                    code: 202,
                    data: {},
                    msg: "你今日已领取过了"
                })
            }
            break
        case "每日签到":
            if (isUse && !isUse.mrqd) {
                let jf1 = await mongo.findOne("scum", `${req.user.database}_user`, { _id: new ObjectId(req.user._id) })
                await mongo.updateMany("scum", `${req.user.database}_user`, { _id: new ObjectId(req.user._id) }, { $set: { mrqd: true, fraction: parseInt(jf1.fraction) + 10 } })

                let jf = await mongo.findOne("scum", `${req.user.database}_user`, { _id: new ObjectId(req.user._id) })

                let text = `每日签到 +${10} 积分，剩余 ${parseInt(isUse.fraction) + 10} 积分`
                await mongo.insertOne("scum", `${req.user.database}_message`, { steamid: req.user.steamId, text, datetime: this.getDate() })

                res.send({
                    code: 200,
                    msg: "签到成功积分＋10",
                    data: {
                        jf: jf.fraction
                    }
                })
            } else {
                res.send({
                    code: 201,
                    msg: "今日已签到过了"
                })
            }

            break
        default:
            res.send({
                code: 203,
                data: {},
                msg: "错误"
            })
            break
    }


}
/* 
获取当前日期
*/
module.exports.getDate = () => {
    return moment().format('YYYY-MM-DD HH:mm:ss');
}

/* 
管理员获取传送点
*/
module.exports.AdminGetTransmit = async (req, res) => {
    let transmit = await mongo.findMany("scum", `${req.user.database}_transmit`, {})
    let users = await mongo.find("scum", `${req.user.database}_user`, [{
        $project: {
            name: 1
        }
    }, {
        $match: {}
    }])
    res.send({
        code: 200,
        data: { transmit, users },
        msg: ""
    })
}

/* 
添加传送点
*/
module.exports.AdminAddTransmit = async (req, res) => {
    if (req.body.userId != "") {
        let queryUser = await mongo.findOne("scum", `${req.user.database}_user`, { _id: new ObjectId(req.body.userId) })
        if (!queryUser) {
            res.send({
                code: 201,
                msg: "查询不到此用户",
                data: {}
            })

        }
        req.body["name"] = queryUser.name
        return
    }
    let add = await mongo.insertOne("scum", `${req.user.database}_transmit`, req.body)
    if (add.acknowledged) {
        res.send({
            code: 200,
            msg: "添加成功",
            data: add
        })
    } else {
        res.send({
            code: 201,
            msg: "添加失败",
            data: {}
        })
    }

}

/* 
修改传送点
*/
module.exports.AdminChangeTransmit = async (req, res) => {
    let id = req.body._id
    delete req.body.server
    delete req.body._id
    let change = await mongo.updateMany("scum", `${req.user.database}_transmit`, { _id: new ObjectId(id) }, { $set: req.body })
    console.log(change);
    if (change.modifiedCount > 0) {
        let transmit = await mongo.findMany("scum", `${req.user.database}_transmit`, {})
        res.send({
            code: 200,
            msg: "保存成功",
            data: transmit
        })
    } else {
        res.send({
            code: 201,
            msg: "保存失败",
            data: {}
        })
    }

}

/* 
删除传送点
*/
module.exports.AdminDeleteTransmit = async (req, res) => {
    let del = await mongo.delete("scum", `${req.user.database}_transmit`, { _id: new ObjectId(req.body._id) })
    console.log(del);
    if (del.deletedCount > 0) {
        let transmit = await mongo.findMany("scum", `${req.user.database}_transmit`, {})
        res.send({
            code: 200,
            msg: "删除成功",
            data: transmit
        })
    } else {
        res.send({
            code: 201,
            msg: "删除失败",
            data: {}
        })
    }

}
/* 
玩家传送
*/
module.exports.transmit = async (req, res) => {
    let ser = await mongo.findOne("scum", "account", { selkey: req.user.selkey })
    console.log(ser);
    if (!ser.public) {
        res.send({
            code: 209,
            data: {},
            msg: "传送已禁用"
        })
        return
    }


    let queryTransmit = await mongo.findOne("scum", `${req.user.database}_transmit`, { _id: new ObjectId(req.body.id) })
    let user = await mongo.findOne("scum", `${req.user.database}_user`, { _id: new ObjectId(req.user._id) })
    let name = user.name.replace(/[\(].+?[\)]/g, "")///\((?:.*)\)/g
    let order = {
        dateTime: this.getDate(),
        name: name,
        type: "地图传送",
        code: `#teleport ${queryTransmit.position.x} ${queryTransmit.position.y} ${queryTransmit.position.z} "${user.steamId}"`,
        status: "未发货",
        steamId: req.user.steamId
    }
    if (queryTransmit && (user.fraction - queryTransmit.price) >= 0) {

        await mongo.updateMany("scum", `${req.user.database}_user`, { _id: new ObjectId(req.user._id) },
            { $set: { fraction: user.fraction - queryTransmit.price } })

        let addOrder = await mongo.insertOne("scum", `${req.user.database}_orders`, order)
        console.log(addOrder);
        let ods = await mongo.findMany("scum", `${req.user.database}_orders`, { steamId: req.user.steamId })

        let text = `地图传送消费 ${queryTransmit.price} 积分，剩余 ${user.fraction - queryTransmit.price} 积分`
        await mongo.insertOne("scum", `${req.user.database}_message`, { steamid: req.user.steamId, text, datetime: this.getDate() })
        res.send({
            code: 200,
            msg: `马上开始传送,请稍等！本次消耗${queryTransmit.price}积分`,
            data: ods
        })
    } else {
        res.send({
            code: 201,
            msg: "积分不足！",
            data: {}
        })
    }

}

module.exports.by = (req, res) => {
    res.send({
        code: 200,
        data: "By: Zero QQ：1260067702",
        msg: ""
    })
}

module.exports.getShopping = async (req, res) => {
    console.log(req.body);
    let shopping = await mongo.findMany("scum", `${req.user.database}_shopping`, { isGou: "是" })
    res.send({
        code: 200,
        data: shopping,
        msg: "获取成功"
    })
}

module.exports.shoppingOverUp = async (req, res) => {
    console.log(req.body);
    let price = 0
    let info = []
    let user = await mongo.findOne("scum", `${req.user.database}_user`, { _id: new ObjectId(req.user._id) })
    console.log(user);

    for (const key in req.body) {
        let shopping = await mongo.findOne("scum", `${req.user.database}_shopping`, { _id: new ObjectId(req.body[key]._id) })

        /* 
           限购处理
           */
        let quota = await handleQuota(req.user.database, user.steamId, shopping.quotaType, shopping.quota, shopping._id.toString(), parseInt(req.body[key].num))
        if (quota != "ok") {
            res.send({
                code: 500,
                msg: quota,
                data: {}
            })
            return
        }


        price += parseInt(req.body[key].num) * shopping.price
        info.push({
            code: req.body[key].code,
            number: parseInt(req.body[key].num),
            group: req.body[key].group,
            multiple: shopping.type,
            spId: shopping._id.toString()
        })
    }
    console.log("总价格：" + price);

    if (!user || user.fraction < price) {
        res.send({
            code: 201,
            msg: "积分不足",
            data: {}
        })
        return
    }


    let name = user.name.replace(/[\(].+?[\)]/g, "")///\((?:.*)\)/g
    let order = {
        dateTime: new Date(),
        name: name,
        type: "商品购买",
        info: info,
        status: "未发货",
        steamId: user.steamId,

    }
    let server = await queryServer(req.headers.host)
    order["selkey"] = server.selkey

    let addOrder = await mongo.insertOne("scum", `${req.user.database}_orders`, order)
    console.log(addOrder);
    // let ods = await db.collection("orders").find({ steamId: req.user.steamId }).toArray()\
    await mongo.updateMany("scum", `${req.user.database}_user`, { _id: new ObjectId(user._id) }, { $set: { fraction: parseInt(user.fraction - price) } })
    let jf = await mongo.findOne("scum", `${req.user.database}_user`, { _id: new ObjectId(req.user._id) })
    let text = `购买商品消费 ${price} 积分，剩余 ${parseInt(user.fraction - price)} 积分。`
    await mongo.insertOne("scum", `${req.user.database}_message`, { steamid: req.user.steamId, text, datetime: this.getDate() })


    res.send({
        code: 200,
        msg: "购买成功",
        data: {
            jf: jf.fraction
        }
    })
}

async function handleQuota(database, steamId, quotaType, quota, spId, number) {
    console.log(database, steamId, quotaType, quota, spId);
    console.log("限购处理");
    // 0不限制，1每账号，2每日，3每月
    switch (parseInt(quotaType)) {
        case 1:
            console.log("每个账号");
            let singleuser = await mongo.findMany("scum", `${database}_orders`, [{
                $match: {
                    steamId: steamId,
                    "info.spId": {
                        $eq: spId.toString()
                    }
                }
            }])
            console.log("每个账号", singleuser);
            if (singleuser.length + number <= quota) {
                return "ok"
            }
            return `每个账号只能购买${quota}次`
        case 2:
            console.log("每天只能购买");
            let dayuser = await mongo.findMany("scum", `${database}_orders`, {
                steamId, "info.spId": {
                    $eq: spId.toString()
                }, dateTime: {
                    $gt: new Date(moment().add(-1, "days").format('YYYY-MM-DD')),
                    $lt: new Date(moment().add(1, "days").format('YYYY-MM-DD'))
                }
            })
            console.log(dayuser);
            if (dayuser.length + number <= quota) {
                return "ok"
            }
            return `每天只能购买${quota}次`
        case 3:
            console.log("30天内只能购买");
            return `30天内只能购买${quota}次`

        default:
            console.log("不限制");
            return "ok"
    }

}

module.exports.getOrders = async (req, res) => {
    let order = await mongo.findMany("scum", `${req.user.database}_orders`, { steamId: req.user.steamId })
    res.send({
        data: order,
        msg: "",
        code: 200
    })
}

/* 
首页信息
*/
module.exports.selectServer = async (req, res) => {
    console.log(req.headers.host);
    let queryServer = await mongo.findOne("scum", "account", { hostname: req.headers.host, enable: true })

    if (queryServer) {
        res.send({
            code: 200,
            msg: "正确",
            data: {
                server: queryServer.server,
                group: queryServer.group
            }
        })
    } else {
        res.send({
            code: 201,
            msg: "错误",
            data: {}
        })
    }

}
/* 
图片列表
*/
module.exports.getImages = async (req, res) => {
    let imgs = await mongo.findMany("scum", "images", {})
    res.send({
        code: 200,
        data: imgs,
        msg: "图片列表"
    })
}

module.exports.serverMsg = async (req, res) => {
    console.log(req.query);
    // console.log(robots);
    axios({
        url: "http://10.0.0.18:5787/serverMsg?selkey=" + req.query.selkey,
        method: "post",
        data: req.body
    }).then(({ data }) => {
        res.send(data)
    }).catch(({ data }) => {
        console.log(data);
        res.send(data)
    })

}

/* 
获取队伍列表
*/
module.exports.getRanks = async (req, res) => {
    let list = await mongo.findMany("scum", `${req.user.database}_ranks`, { enable: true })
    res.send({
        code: 200,
        data: list,
        msg: "小队列表"
    })
}
/* 
创建队伍
*/
module.exports.createRanks = async (req, res) => {
    console.log(req.body);
    if (req.body && req.body.ranksName && req.body.ranksName.length > 0 && req.body.ranksName.length < 9) {
        let query3 = await mongo.findOne("scum", `${req.user.database}_ranks`, {
            item: { $elemMatch: { id: req.user._id } }
        })
        console.log(query3);
        if (query3) {
            res.send({
                data: {},
                code: 500,
                msg: "你有队伍了不能创建"
            })
            return
        }
        let query1 = await mongo.findOne("scum", `${req.user.database}_ranks`, { boss: req.user._id })
        if (query1) {
            res.send({
                code: 203,
                data: {},
                msg: "你已有队伍"
            })
            return
        }
        let query2 = await mongo.findOne("scum", `${req.user.database}_ranks`, { name: req.body.ranksName })
        if (query2) {
            res.send({
                code: 204,
                data: {},
                msg: "队伍名称已存在"
            })
            return
        }
        let result = await mongo.insertOne("scum", `${req.user.database}_ranks`, {
            name: req.body.ranksName,
            item: [{ id: req.user._id, verify: true }],
            boss: req.user._id,
            enable: true
        })
        if (result.acknowledged) {
            res.send({
                code: 200,
                data: result,
                msg: "创建成功"
            })
        } else {
            res.send({
                code: 201,
                data: {},
                msg: "创建失败"
            })
        }

    } else {
        res.send({
            code: 500,
            data: {},
            msg: "创建失败"
        })
    }

}
/* 
加入队伍
*/
module.exports.joinRanks = async (req, res) => {
    console.log(req.body);

    if (!req.body || !req.body.id) {
        res.send({
            data: {},
            code: 500,
            msg: "错误"
        })
        return
    }

    let query1 = await mongo.findOne("scum", `${req.user.database}_ranks`, { boss: req.user._id })
    console.log(query1);
    if (query1) {
        res.send({
            data: query1,
            code: 500,
            msg: "你有队伍不能加入其他队"
        })
        return
    }
    let query2 = await mongo.findOne("scum", `${req.user.database}_ranks`, {
        item: { $elemMatch: { id: req.user._id } }
    })
    console.log(query2);
    if (query2) {
        res.send({
            data: query2,
            code: 500,
            msg: "你已申请加入队伍或者已在队伍里"
        })
        return
    }
    let join = await mongo.updateMany("scum", `${req.user.database}_ranks`, { _id: new ObjectId(req.body.id) }, { $push: { item: { id: req.user._id, verify: false } } })
    console.log(join);
    res.send({
        data: join,
        code: 200,
        msg: "申请已发送等待队长同意"
    })
}

module.exports.outRanks = async (req, res) => {

    if (!req.body || !req.body.id) {
        res.send({
            msg: "出错了!",
            code: 201,
            data: {}
        })
        return
    }
    let query = await mongo.delete("scum", `${req.user.database}_ranks`, { boss: req.user._id })
    console.log(query);
    if (query.deletedCount > 0) {
        res.send({
            msg: "队伍已解散!江湖再见！",
            code: 200,
            data: {}
        })
        return
    }
    let change = await mongo.updateMany("scum", `${req.user.database}_ranks`, { _id: new ObjectId(req.body.id), 'item.id': req.user._id },
        {
            $pull: { item: { id: req.user._id } }
        })
    console.log(change);
    if (change.modifiedCount > 0) {
        res.send({
            msg: "退出成功!",
            code: 200,
            data: {}
        })
    } else {
        res.send({
            msg: "退出队伍出错!",
            code: 202,
            data: {}
        })
    }

}

module.exports.ranksTransmit = async (req, res) => {
    console.log(req.body);
    if (!req.body || !req.body.ranksId || !req.body.id) {
        res.send({
            code: 201,
            data: {},
            msg: "错误参数"
        })
        return
    }
    let ser = await mongo.findOne("scum", "account", { selkey: req.user.selkey })
    console.log(ser);
    if (!ser.ranks) {
        res.send({
            code: 209,
            data: {},
            msg: "传送已禁用"
        })
        return
    }
    let user = await mongo.findOne("scum", `${req.user.database}_user`, { _id: new ObjectId(req.user._id) })
    let query1 = await mongo.findOne("scum", `${req.user.database}_ranks`, { _id: new ObjectId(req.body.ranksId), item: { $elemMatch: { id: req.body.id } } })
    console.log(query1);
    if (query1 && user.online == "在线") {
        let player = await mongo.findOne("scum", `${req.user.database}_user`, { _id: new ObjectId(req.body.id) })
        if (!player) {
            res.send({
                code: 203,
                data: {},
                msg: "没有找到此玩家！"
            })
            return
        }
        if ((parseInt(user.fraction) - 1) <= 0) {
            res.send({
                code: 204,
                msg: `积分不足！`,
                data: {}
            })
            return
        }

        await mongo.updateMany("scum", `${req.user.database}_user`, { _id: new ObjectId(req.user._id) }, { $set: { fraction: user.fraction - 1 } })
        let order = {
            dateTime: this.getDate(),
            name: req.user.name,
            type: "队友传送",
            code: `#teleportto ${player.steamId} ${req.user.steamId}`,
            status: "未发货",
            steamId: req.user.steamId
        }
        let addOrder = await mongo.insertOne("scum", `${req.user.database}_orders`, order)

        let text = `队友传送消费 ${1} 积分，剩余 ${parseInt(user.fraction - 1)} 积分`
        await mongo.insertOne("scum", `${req.user.database}_message`, { steamid: req.user.steamId, text, datetime: this.getDate() })

        console.log(addOrder);
        res.send({
            code: 200,
            data: {},
            msg: `马上开始传送,请稍等！本次消耗${1}积分`
        })
        return
    }
    res.send({
        code: 202,
        data: {},
        msg: "玩家不在线！"
    })
}


module.exports.privateTransmit = async (req, res) => {

    if (!req.body || !req.body.id) {
        res.send({
            code: 201,
            msg: `参数错误！`,
            data: {}
        })
        return
    }

    let user = await mongo.findOne("scum", `${req.user.database}_user`, { _id: new ObjectId(req.user._id), enable: true })
    if (!user) {
        res.send({
            code: 202,
            msg: `玩家可能被封禁！`,
            data: {}
        })
        return
    }
    if (user.online == "离线") {
        res.send({
            code: 203,
            msg: `玩家不在线！`,
            data: {}
        })
        return
    }
    let query = await mongo.findOne("scum", `${req.user.database}_transmit`, { _id: new ObjectId(req.body.id), userId: req.user._id, isOn: true })
    console.log(query);
    if (!query) {
        res.send({
            code: 204,
            msg: `传送点不属于您`,
            data: {}
        })
        return
    }
    let ser = await mongo.findOne("scum", "account", { selkey: req.user.selkey })
    console.log(ser);
    if (!ser.private) {
        res.send({
            code: 209,
            data: {},
            msg: "传送已禁用"
        })
        return
    }
    if (parseInt(user.fraction) - parseInt(query.price) <= 0) {
        res.send({
            code: 205,
            msg: `积分不足！`,
            data: {}
        })
        return
    }
    let consumption = await mongo.updateMany("scum", `${req.user.database}_user`, { _id: new ObjectId(user._id) }, { $set: { fraction: parseInt(user.fraction) - parseInt(query.price) } })

    let order = {
        dateTime: this.getDate(),
        name: req.user.name,
        type: "私人传送",
        code: `#teleport ${query.position.x} ${query.position.y} ${query.position.z} "${user.steamId}"`,
        status: "未发货",
        steamId: req.user.steamId
    }
    let addOrder = await mongo.findOne("scum", `${req.user.database}_orders`, order)
    console.log(addOrder);

    let text = `私人传送消费 ${parseInt(query.price)} 积分，剩余 ${parseInt(user.fraction) - parseInt(query.price)} 积分`
    await mongo.insertOne("scum", `${req.user.database}_message`, { steamid: req.user.steamId, text, datetime: this.getDate() })

    res.send({
        code: 200,
        msg: `马上开始传送,请稍等！本次消耗${query.price}积分`,
        data: {}
    })
}


module.exports.passPrivateTransmit = async (req, res) => {
    console.log(req.body);
    if (!req.body || !req.body.id || !req.body.ranksId) {
        res.send({
            code: 201,
            data: {},
            msg: "参数错误"
        })
        return
    }
    console.log();
    let result = await mongo.updateMany("scum", `${req.user.data}_ranks`, {
        _id: new ObjectId(req.body.ranksId),
        'item.$.id': req.body.id
    }, {
        $set: {
            'item.$.verify': true
        }
    })
    console.log(result);
    res.send({
        code: 200,
        data: {},
        msg: "申请已通过"
    })

}



/* 
测试
*/

module.exports.test = async (req, res) => {
    let data = {
        fun: function () {
            console.log("我是一个方法");
        }
    }
    console.log(JSON.stringify(data));
    res.send({
        code: 200,
        data,
        msg: "测试消息"
    })
}

/* 
获取用户列表
*/
module.exports.AdminGetUsers = async (req, res) => {
    let result = await mongo.findMany("scum", `${req.user.database}_user`, {})
    res.send({
        code: 200,
        data: result,
        msg: "用户列表"
    })
}
/* 

充值
*/
module.exports.AdminChongZhi = async (req, res) => {
    if (!req.body || !req.body.id || !parseInt(req.body.num)) {
        res.send({
            code: 500,
            data: {},
            msg: "参数错误"
        })
        return
    }

    let query = await mongo.findOne("scum", `${req.user.database}_user`, { _id: new ObjectId(req.body.id) })
    if (!query) {
        res.send({
            code: 500,
            data: {},
            msg: "没有此用户"
        })
        return
    }
    let update = await mongo.updateMany("scum", `${req.user.database}_user`, { _id: new ObjectId(req.body.id) }, { $set: { fraction: parseInt(query.fraction) + parseInt(req.body.num) } })
    console.log("充值", update);
    if (update.modifiedCount > 0) {
        await mongo.insertOne("scum", `${req.user.database}_recharge`, {
            nickname: req.user.nickname,
            num: req.body.num,
            player: query.nickname,
            datetime: moment(new Date()).format('YYYY-MM-DD kk:mm:ss'),
            remarks: req.body.remarks
        })

        let text = `系统充值 ${parseInt(req.body.num)
            } 积分，剩余 ${parseInt(query.fraction) + parseInt(req.body.num)} 积分`
        await mongo.insertOne("scum", `${req.user.database} _message`, { steamid: query.steamId, text, datetime: this.getDate() })

        res.send({
            code: 200,
            data: {},
            msg: "充值成功"
        })
    } else {
        res.send({
            code: 201,
            data: {},
            msg: "未知状态"
        })
    }

}

module.exports.AdminChongZhiLog = async (req, res) => {
    let log = await mongo.find("scum", `${req.user.database}_recharge`, [{ $sort: { datetime: -1 } }])
    res.send({
        code: 200,
        data: log,
        msg: "充值日志"
    })
}


module.exports.getChat = (req, res) => {
    // console.log(req.user);
    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: "http://10.0.0.18:5785/getChat?selkey=" + req.user.selkey + "&type=Global",
        headers: {}
    };
    axios.request(config).then(({ data }) => {
        // console.log(data);
        res.send({
            data: data,
            code: 200,
            msg: "聊天日志"
        })
    }).catch((data) => {
        console.log(data);
        res.send(data)
    })



}




module.exports.getlog = async (req, res) => {
    if (!req.query || !req.query.group) {
        res.send({
            code: 500,
            data: {},
            msg: "参数错误"
        })
        return
    }
    if (req.query.name) {

        let file = await mongo.findOne("scum", `${req.user.database}_server_logs`, { name: req.query.name })
        res.send({
            code: 200,
            data: file,
            msg: "日志文件"
        })


        return
    }
    if (req.query.group == "all") {
        let file = await mongo.findMany("scum", `${req.user.database}_server_logs`, {})
        res.send({
            code: 200,
            data: file,
            msg: "全部日志文件"
        })
        return
    }
    let queryGroup = await mongo.find("scum", `${req.user.database}_server_logs`, [{ $match: { group: req.query.group } }, {
        $project: {
            "group": 1,
            "name": 1,
            "datetime": 1,
            "size": 1
        }
    }])
    res.send({
        code: 200,
        data: queryGroup,
        msg: "分类数据"
    })

}

module.exports.getRecovery = async (req, res) => {

    let table = await mongo.find("scum", `${req.user.database}_recovery_table`, [{
        $match: { available: true }
    }, {
        $sort: { points: 1 }
    }
    ])
    res.send({
        code: 200,
        msg: "回收列表",
        data: table
    })
}

module.exports.getRecoveryList = async (req, res) => {
    let queryList = await mongo.findMany("scum", `${req.user.database}_recovery_record`, {})
    res.send({
        code: 200,
        data: queryList,
        msg: "回收记录"
    })
}
module.exports.getServerConfig = async (req, res) => {
    let query = await mongo.findOne("scum", "account", { database: req.user.database })
    res.send({
        code: 200,
        data: query,
        msg: "商城配置"
    })
}

module.exports.setServerConfig = async (req, res) => {
    console.log(req.body);
    delete req.body._id
    delete req.body.hostname
    delete req.body.database
    delete req.body.enable
    let fang = await mongo.updateMany("scum", "account", { database: req.user.database }, { $set: req.body })
    res.send({
        code: 200,
        data: fang,
        msg: "保存配置"
    })
}

module.exports.startSendGoods = (req, res) => {
    require("../controller/robotController").Controller(req, res)
}

module.exports.getSendGoods = (req, res) => {
    axios({
        url: "http://10.0.0.18:5787/getSendGoods?selkey=" + req.user.selkey,
        method: "post"
    }).then(({ data }) => {
        res.send(data)
    })
}