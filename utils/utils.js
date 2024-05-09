/*
 * @Author: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @Date: 2023-11-16 13:10:59
 * @LastEditors: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @LastEditTime: 2023-11-17 21:17:22
 * @FilePath: \robot-shopping\utils.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
const schedule = require("node-schedule")
const axios = require("axios")
const robotUrl = "http://10.0.0.9:5786"
// const robotUrl = "http://127.0.0.1:5786"
/* 
发给机器人服务器
*/
let errsum = 0
module.exports.sendArray = async (array, selkey) => {
    let { data } = await axios({
        url: `${robotUrl}/api/message?selkey=${selkey}`,
        method: "post",
        data: {
            "type": "queue",
            "code": array,
            "timeout": 240000
        }
    })
    console.log(data);
    if (data.code != 200 && errsum < 5) {
        errsum++
        console.log(`发送失败！重试${errsum}`, data);
        await wait(1)
        return this.sendArray(array, selkey)
    } else if (errsum >= 5) {
        errsum = 0
        return "err"
    }
    return data
}
function wait(t) {
    return new Promise(resolve => {
        setTimeout(() => resolve(), t * 1000)
    })
}


module.exports.sendSingle = async (obj, selkey) => {
    obj["timeout"] = 24000
    let { data } = await axios({
        url: `${robotUrl}/api/message?selkey=${selkey}`,
        method: "post",
        data: obj
    })
    // console.log(data);
    return data
}
