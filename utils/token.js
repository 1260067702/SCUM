var jwt = require("jsonwebtoken");
var jwtSecret = "hujbjnjllkjnyginoihighhjio"; //签名
//登录接口 生成token的方法
var setToken = function (info) {
    return new Promise((resolve, reject) => {
        let token = jwt.sign(info, jwtSecret, { expiresIn: '7d' });
        resolve(token);
    })
}

//各个接口需要验证token的方法
var getToken = function (token) {
    return new Promise((resolve, reject) => {
        if (!token) {
            console.log("token是空的");
            reject({
                error: "token 是空的"
            });
        }
        else {
            var info = jwt.verify(token, jwtSecret);
            // console.log('info: ', info);
            resolve(info); //解析返回的值（sign 传入的值）
        }
    });
}


module.exports = {
    setToken,
    getToken
}