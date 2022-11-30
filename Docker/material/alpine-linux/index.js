const express = require('express');
const morgan = require("morgan")

const app = express();

app.use(morgan('dev'));
app.get('/', (req, res )=> {
  return res.send("welcome")
})
app.listen(3000, () => {
  console.log('server is listening on port 3000');
})
