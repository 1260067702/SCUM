/*
 * @Author: 菱 admin@example.com
 * @Date: 2023-09-10 11:36:40
 * @LastEditors: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @LastEditTime: 2023-11-19 01:41:18
 * @FilePath: \scumFtpData\utils.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
const ftp = require('ftp');//连接FTP
const path = require('path');
const iconv = require("iconv-lite")
const fs = require("fs")

module.exports.FtpClient = class {
    constructor(config) {
        this.client = new ftp();
        this.client.connect(config);
        this.client.on('close', () => {
            console.log('FTP连接关闭')
        });

        this.client.on('end', () => {
            console.log('FTP连接断开')
        });
    }

    handle() {
        return new Promise(resolve => {
            this.client.on('ready',  () => {
                console.log("ready");
                resolve("ready")
            })

            this.client.on('error', (err) => {
                console.log('FTP连接错误: ' + JSON.stringify(err))
                resolve("err")
            });
        })

    }


    /* 
    列出目标目录
    */
    async list(dirpath) {
        // let { err: ea, dir } = await this.cwd(dirpath);
        return new Promise((resolve, reject) => {
            this.client.list(dirpath, (err, files) => {
                if (err) resolve()
                resolve(files)
                // this.client.close()
            })
        });
    }

    /* 
    切换目录
    */
    cwd(dirpath) {
        return new Promise((resolve, reject) => {
            this.client.cwd(dirpath, (err, dir) => {
                resolve({ err: err, dir: dir });
            })
        });
    }

    /* 
    下载文件
    */
    async get(filePath) {
        return new Promise(async resolve => {
            const dirpath = path.dirname(filePath);
            const fileName = path.basename(filePath);
            let { err: ea, dir } = await this.cwd(dirpath);
            this.client.get(fileName, (err, rs) => {
                if (err) resolve(null)
                let ws = fs.createWriteStream("../logs/" + fileName);
                try {
                    rs.pipe(ws);
                } catch (error) {
                    resolve(null)
                }

                setTimeout(() => {
                    resolve(iconv.decode(fs.readFileSync("../logs/" + fileName), "utf-16").toString());
                }, 3000);


            });
        })


    }

    end() {
        this.client.end()
    }
}