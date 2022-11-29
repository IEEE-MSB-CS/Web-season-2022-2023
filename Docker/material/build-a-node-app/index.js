const http = require('http');



process.on("SIGINT", () => {
    process.exit(1)
})
const server = http.createServer((req, res) => {
    console.log("request recieved");
    res.end("omg hi", "utf-8");
}).listen(3000)


console.log('server started')
