const utils = require("../utils/utils")
const { FtpClient } = require("../utils/ftp")
const axios = require("axios")
module.exports.Log = class {
    constructor(account) {
        this.data = account
    }
    async getStr(name, size) {
        let loginLogStr = null
        do {
            loginLogStr = await this.getLog(name)
            console.log(loginLogStr.length, size);
            if (loginLogStr && loginLogStr.length * 2 > size) return ""
        } while (!(loginLogStr && loginLogStr.length * 2 == size));
        return loginLogStr
    }

    async getLogList() {
        let ftpcfg = {
            host: this.data.ftphost,
            port: this.data.ftpport,
            user: this.data.ftpuser,
            password: this.data.ftppassword,
            keepalive: 1000,
            ftptype: this.data.ftptype,
            ftppath: this.data.ftppath
        }
        let self = this
        let log = await self.ftpList(ftpcfg)
        return log
    }

    getSort(obj) {
        for (const key in obj) {
            obj[key] = obj[key].sort((a, b) => {
                return new Date(b.date) - new Date(a.date)
            })
        }
        return obj

    }

    getGroup(list) {
        let obj = {}
        for (const item of list) {
            let name = item.name.split("_")[0]
            // console.log(name);
            if (obj[name]) {
                obj[name].push(item)
            } else {
                obj[name] = []
                obj[name].push(item)
            }
        }
        // console.log(obj);
        return obj
    }

    async getLog(filename) {
        let ftpcfg = {
            filename,
            host: this.data.ftphost,
            port: this.data.ftpport,
            user: this.data.ftpuser,
            password: this.data.ftppassword,
            keepalive: 1000,
            ftptype: this.data.ftptype,
            ftppath: this.data.ftppath
        }
        let self = this
        let log = await this.ftpFile(ftpcfg)
        return log

    }

    async ftpList(ftpcfg) {
        try {
            let { data, Error } = await axios({
                url: "http://206.237.15.35:3344/scumFtpList",
                data: ftpcfg,
                method: "post"
            })
            // console.log(data);
            if (data.data) return data.data
            return []
        } catch (error) {
            console.log("请求列表错误");
            return []
        }

    }

    async ftpFile(ftpcfg) {
        try {
            let { data } = await axios({
                url: "http://206.237.15.35:3344/scumFtpFile",
                data: ftpcfg,
                method: "post"
            })
            // console.log(data.data);
            return data.data
        } catch (error) {
            console.log("请求文件错误");

            return []
        }
    }
    async localList() {
        let client = new FtpClient({
            host: this.data.ftphost,
            port: this.data.ftpport,
            user: this.data.ftpuser,
            password: this.data.ftppassword,
            keepalive: 1000,
            ftptype: this.data.ftptype,
            ftppath: this.data.ftppath
        })
        let result = await client.handle()
        if (result == "ready") {
            let list = await client.list(this.data.ftppath)
            console.log(list);
            client.end()
            if (list) return list


        }
        client.end()
        return null
    }
}