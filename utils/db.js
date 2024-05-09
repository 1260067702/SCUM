var mongo = require('mongodb').MongoClient;

var url = 'mongodb://scum:PMmBZeja5isGscM2@127.0.0.1:27017/?authSource=scum';

module.exports.DB = async function (data) {
    // Database Name
    const dbName = 'scum';

    // Create a new MongoClient
    const op = {
        useNewUrlParser: true
    }

    const client = new mongo(url, op);
    await client.connect();
    const db = client.db(dbName);

    // const res = await db.collection('user').insertOne(data);
    const res = await db.collection('user').findOne({ steam: data.steam });
    console.log(res);
    client.close()
    return res
};




