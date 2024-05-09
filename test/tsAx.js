// 导入 express 模块
const express = require('express')
// 创建 express 的服务器实例
const app = express()

// TODO_01：安装并导入 JWT 相关的两个包，分别是 jsonwebtoken 和 express-jwt
const jwt = require('jsonwebtoken')
const expressJWT = require('express-jwt')


// 允许跨域资源共享
const cors = require('cors')
app.use(cors())

// 解析 post 表单数据的中间件
const bodyParser = require('body-parser')
// 这里用内置的中间件也行： app.use(express.urlencoded({ extended: false }))
app.use(bodyParser.urlencoded({ extended: false }))

// TODO_02：定义 secret 密钥，建议将密钥命名为 secretKey
// 这个 secretKey 的是可以是任意的字符串
const secretKey = 'smiling ^_^'

// TODO_04：注册将 JWT 字符串解析还原成 JSON 对象的中间件
// 1. 使用 app.use() 来注册中间件
// 2. express.JWT({ secret: secretKey, algorithms: ['HS256'] }) 就是用来解析 Token 的中间件
// 2.1 express-jwt 模块，现在默认为 6版本以上，必须加上： algorithms: ['HS256']
// 3. .unless({ path: [/^\/api\//] }) 用来指定哪些接口不需要访问权限
// 4. 注意：只要配置成功了 express-jwt 这个中间件，就会自动把解析出来的用户信息，挂载到 req.user 属性上
app.use(expressJWT({
    secret: secretKey,
    algorithms: ['HS256']
}).unless({
    path: [/^\/api\//g]
}))

// 登录接口
app.post('/api/login', function (req, res) {
    // 将 req.body 请求体中的数据，转存为 userinfo 常量
    const userinfo = req.body
    // 登录失败
    if (userinfo.username !== 'admin' || userinfo.password !== '000000') {
        return res.send({
            status: 400,
            message: '登录失败！'
        })
    }
    // 登录成功
    // TODO_03：在登录成功之后，调用 jwt.sign() 方法生成 JWT 字符串。并通过 token 属性发送给客户端
    // 参数 1：用户的信息对象
    // 参数 2：解密的秘钥
    // 参数 3：配置对象，可以配置 token 的有效期
    // 记住：千万不要把密码加密到 token 字符串中！
    const tokenStr = jwt.sign({ username: userinfo.username }, secretKey, { expiresIn: '30s' })
    res.send({
        status: 200,
        message: '登录成功！',
        token: tokenStr // 要发送给客户端的 token 字符串
    })
})

// 这是一个有权限的 API 接口，必须在 Header 中携带 Authorization 字段，值为 token，才允许访问
app.get('/admin/getinfo', function (req, res) {
    // TODO_05：使用 req.user 获取用户信息，并使用 data 属性将用户信息发送给客户端
    console.log(req.user);
    res.send({
        status: 200,
        message: '获取用户信息成功！',
        data: req.user // 要发送给客户端的用户信息
    })
})

// TODO_06：使用全局错误处理中间件，捕获解析 JWT 失败后产生的错误
app.use((err, req, res, next) => {
    // 这次错误是由 token 解析失败导致的
    if (err.name === 'UnauthorizedError') {
        return res.send({
            status: 401,
            message: '无效的token'
        })
    }
    res.send({
        status: 500,
        message: '未知的错误'
    })
})

// 调用 app.listen 方法，指定端口号并启动web服务器
app.listen(8888, function () {
    console.log('Express server running at http://127.0.0.1:8888')
})