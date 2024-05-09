/*
 * @Author: 菱 admin@example.com
 * @Date: 2023-08-19 14:57:23
 * @LastEditors: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @LastEditTime: 2023-11-21 01:21:23
 * @FilePath: \SCUM\router.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
const express = require("express")
const { Router } = require("express")
const bodyParser = require('body-parser')
const expressJWT = require('express-jwt')
const cors = require("cors")
const multer = require("multer")

// const multer = require("multer")

const dao = require("../dao/dao")

const router = Router()

const storage = multer.diskStorage({
    //上传文件到服务器的存储位置
    destination: 'public/uploads',
    filename: function (req, file, callback) {
        console.log('file', file) //上传的文件信息
        var fileFormat = (file.originalname).split('.')
        var filename = new Date().getTime()
        callback(null, filename + "." + fileFormat[fileFormat.length - 1])
    }
})
const upload = multer({
    storage
})

const secretKey = 'hujbjnjllkjnyginoihighhjio'

router.use(cors())
router.use(express.json())
router.use(bodyParser.urlencoded({ extended: false }))
router.use(express.static('public'))
// router.use(multer({ dest: './upload' }).any())
router.use(expressJWT({
    secret: secretKey,
    algorithms: ['HS256'],
    credentialsRequired: false,
}).unless({
    path: [/^\/api\//]
}, (req, res, next) => {
    res.send({
        code: 500,
        data: {},
        msg: "错误404"
    })
}))

router.use("/admin/", (req, res, next) => {
    // console.log("权限中间件",req.user);
    if (req.user && req.user.senior) {
        next()
    } else {
        res.send({
            code: 500,
            data: {},
            msg: "你没有权限访问！"
        })
    }
})

router.post("/api/createUser", dao.createUser)
router.post("/api/login", dao.login)
router.post("/api/selectServer", dao.selectServer)
router.post("/api/serverMsg", dao.serverMsg)
router.post("/api/test", dao.test)

router.post("/admin/upload", upload.single('image'), dao.upload)
router.post("/admin/addArticle", upload.single('image'), dao.addArticle)
router.post("/admin/AdminQueryAll", dao.AdminQueryAll)
router.post("/admin/AdminChangeArticle", dao.AdminChangeArticle)
router.post("/admin/AdminDeleteArticle", dao.AdminDeleteArticle)
router.post("/admin/AdminQueryGift", dao.AdminQueryGift)
router.post("/admin/AdminChangeGift", dao.AdminChangeGift)
router.post("/admin/AdminGetTransmit", dao.AdminGetTransmit)
router.post("/admin/AdminAddTransmit", dao.AdminAddTransmit)
router.post("/admin/AdminChangeTransmit", dao.AdminChangeTransmit)
router.post("/admin/AdminDeleteTransmit", dao.AdminDeleteTransmit)
router.post("/admin/AdminGetImages", dao.getImages)
router.post("/admin/AdminGetUsers", dao.AdminGetUsers)
router.post("/admin/AdminChongZhi", dao.AdminChongZhi)
router.post("/admin/AdminChongZhiLog", dao.AdminChongZhiLog)
router.post("/admin/getlog", dao.getlog)
router.post("/admin/getRecoveryList", dao.getRecoveryList)
router.post("/admin/getServerConfig", dao.getServerConfig)
router.post("/admin/setServerConfig", dao.setServerConfig)
router.post("/admin/startSendGoods", require("../controller/robotController").Controller)
router.post("/admin/getSendGoods", require("../controller/robotController").getSendGoods)
router.post("/admin/updateTask", require("../controller/robotController").updateTask)
router.post("/admin/startLogServer", require("../controller/logController").startLogServer)
router.post("/admin/getLogServer", require("../controller/logController").getLogServer)

router.post("/user/mainData", dao.mainData)
router.post("/user/giveXSFL", dao.giveXSFL)
router.post("/user/transmit", dao.transmit)
router.post("/user/by", dao.by)
router.post("/user/getShopping", dao.getShopping)
router.post("/user/shoppingOverUp", dao.shoppingOverUp)
router.post("/user/getOrders", dao.getOrders)
router.post("/user/getRanks", dao.getRanks)
router.post("/user/createRanks", dao.createRanks)
router.post("/user/joinRanks", dao.joinRanks)
router.post("/user/outRanks", dao.outRanks)
router.post("/user/ranksTransmit", dao.ranksTransmit)
router.post("/user/privateTransmit", dao.privateTransmit)
router.post("/user/passPrivateTransmit", dao.passPrivateTransmit)
router.post("/user/getChat", require("../controller/logController").getChat)
router.post("/user/setChat", require("../controller/robotController").setChat)
router.post("/user/getRecovery", dao.getRecovery)

module.exports.router = router