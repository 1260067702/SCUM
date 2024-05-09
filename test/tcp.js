/*
 * @Author: Administrator admin@example.com
 * @Date: 2023-07-05 20:28:41
 * @LastEditors: Administrator admin@example.com
 * @LastEditTime: 2023-07-05 20:29:58
 * @FilePath: \scum\tcp.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
const net = require('net');

// 源服务器配置
const sourceHost = '10.0.0.18';
const sourcePort = 888;

// 目标服务器配置
const targetHost = '103.78.123.69';
const targetPort = 30602;

// 创建源服务器
const sourceServer = net.createServer((sourceSocket) => {
    // 创建目标服务器连接
    const targetSocket = new net.Socket();
    targetSocket.connect(targetPort, targetHost);

    // 数据从源服务器流向目标服务器
    sourceSocket.pipe(targetSocket);

    // 数据从目标服务器流回源服务器
    targetSocket.pipe(sourceSocket);

    // 关闭连接时的处理
    sourceSocket.on('close', () => {
        targetSocket.end();
    });

    targetSocket.on('close', () => {
        sourceSocket.end();
    });

    sourceSocket.on('error', (error) => {
        console.error('源服务器连接错误:', error);
    });

    targetSocket.on('error', (error) => {
        console.error('目标服务器连接错误:', error);
    });
});

// 监听源服务器端口
sourceServer.listen(sourcePort, sourceHost, () => {
    console.log(`TCP转发服务器正在监听 ${sourceHost}:${sourcePort}`);
});
