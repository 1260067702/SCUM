
const { parentPort, workerData } = require("worker_threads");
const { sendArray } = require("../utils/utils")
const mongo = require("../utils/mongo")
const Robot = require("./robotServer")
const schedule = require("node-schedule");
const { resolve } = require("path");

const robot = new Robot(workerData)
parentPort.postMessage({
    run: robot.run,
    status: robot.status,
    auto: robot.auto,
    messages: robot.messages
})

parentPort.on("message", async (arg1) => {
    console.log(`获取服务状态:${robot.data.server}`);
    switch (arg1.type) {
        case "getSendGoods":
            parentPort.postMessage({
                run: robot.run,
                status: robot.status,
                auto: robot.auto,
                messages: robot.messages
            })
            break;
        case "updateTask":
            await cancelTask(robot.database)
            await startTask(workerData.database)
            break;

        case "setChat":
            robot.messages.push(arg1.data)
            break

        case "callback":
            console.log("机器人收到消息");
            await handleCallback(arg1.selkey, arg1.data)
            break

        default:
            break;
    }

})
// 定时重连
upGame(workerData.restart)
//    广播消息
startTask(workerData.database)

async function upGame(timeList) {
    timeList.forEach(element => {
        // console.log(element.title);
        schedule.scheduleJob(element, element, () => {
            if (robot) {
                robot.auto = 5
                robot.status = false
            }
        })
    });
}

async function startTask(database) {
    let result = await mongo.findMany("scum", `${database}_task`, { enable: true })
    result.forEach(element => {
        // console.log(element.title);
        schedule.scheduleJob(element.title, element.time, () => {
            if (robot) {
                robot.messages.push(element.content)
            }
        })
    });
    // console.log(schedule.scheduledJobs);
}


async function cancelTask(database) {
    let result = await mongo.findMany("scum", `${database}_task`, { enable: true })

    for (const key in result) {
        if (schedule.scheduledJobs[result[key].title]) schedule.scheduledJobs[result[key].title].cancel()

    }
    // console.log(schedule.scheduledJobs);
}


async function handleCallback(selkey, data) {
    console.log(selkey, data);
    robot.callback = true
    let flag = true
    do {
        if (robot.auto == 0 && robot.status && !robot.run) {
            robot.run = true
            flag = false
        }
        await wait(1)
    } while (flag);
    console.log(`回调消息${selkey, data}`);
    let array = [{
        type: "Keyboard",
        code: "T"
    }, {
        type: "Clipboard",
        code: data
    }, {
        type: "Keyboard",
        code: "Enter"
    }, {
        type: "Keyboard",
        code: "Enter"
    }]

    let result = await sendArray(array, selkey)
    if (result.data.length > 0) {
        parentPort.postMessage({
            type: "callback",
            data: result.data[0],
            selkey
        })
    }
    console.log(result);
    robot.run = false
    robot.callback = false
}

function wait(t) {
    return new Promise(resolve => {
        setTimeout(() => resolve(), t * 100)
    })
}