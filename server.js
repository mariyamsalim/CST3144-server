const express = require('express');
const app = express();
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const uri = "mongodb+srv://chewchew:mrr12345@beepboop.lfloe.mongodb.net/CST3144CW";
let db;

app.use(cors());

app.use(express.json());

MongoClient.connect(uri, { useUnifiedTopology: true }, (err, client) => {
    if (err) {
        console.error("Error connecting to MongoDB:", err);
        return;
    }
    db = client.db('webstore'); 
    console.log('Connected to MongoDB');
});

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next(); 
});

app.use('/images', (req, res, next) => {
    const filePath = path.join(__dirname, 'images', req.url);
    fs.stat(filePath, (err, fileInfo) => {
        if (err) {
            res.status(404).send("Image not found");
            return;
        }
        if (fileInfo.isFile()) res.sendFile(filePath);
        else next();
    });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
