const express = require('express');
const app = express();
const {MongoClient} = require('mongodb')

const url = process.env.MONGO_CONNECTION_STRING || "mongodb://localhost:27017";
const dbName = "dockerApp";

const collectionName = "count";

async function start(){
    const client = await MongoClient.connect(url);
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

app.get('/add', async (req, res) => {
    const response = await collection.insertOne({});
    return res.send({inserted: response.insertedCount});
})


    app.listen(3000, () => {
        console.log('running on port 3000');
    })
}

start();
