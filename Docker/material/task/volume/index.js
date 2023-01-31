const express = require('express');
const app = express();


app.get('/', (req, res) => {
    return res.json({ data: "welcome, this iserer chnaged, this is nanother changes" });
})

app.post("/todo", (req, res) => {
    return res.json({ data: "welcome POST" })
})


const port = 3000;
app.listen(port, () => {
    console.log(`running on port ${port}`)
})