let str = "42f25949a686a51e313368c9808c407d5508c4a4bb62945e6756293e2d40dee9d23debd3448901dfbcc596892705aa2000e4c5bca826144476dae50a2086b1b852071053e7d14b14a0f1e7f6cc1ce6d1c95901c5b265354344ebc43e7811ac8ddd9f4e46"

const iconv = require("iconv-lite")
let buf = Buffer.from(str, "hex")
console.log(buf);
let a = iconv.decode(buf, "GB18030").toString()
console.log(a);
console.log(buf[0]);
console.log(iconv.decode(buf, "gbk"));
const languageEncoding = require("detect-file-encoding-and-language")
languageEncoding(buf)
    .then(fileInfo => console.log(fileInfo.encoding))
    .catch(err => console.log(err));

// const detectCharacterEncoding = require('detect-character-encoding');
// const charsetMatch = detectCharacterEncoding(buf);

// console.log(charsetMatch);