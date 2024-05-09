/*
 * @Author: Administrator admin@example.com
 * @Date: 2023-07-03 02:45:01
 * @LastEditors: 菱 admin@example.com
 * @LastEditTime: 2023-10-01 15:48:21
 * @FilePath: \scum\index.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
const express = require("express")
const app = express()
/* 
监听器
*/
// require("./sendgood")

const { router } = require("./router/router")

// app.use(express.urlencoded({ extended: true }))

app.use(router)

app.listen(3366, () => {
    console.log("web服务器已启动");
})