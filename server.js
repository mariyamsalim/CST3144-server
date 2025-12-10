//Import all required dependencies
const express = require('express');
const app = express();
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
require('dotenv').config();
let db;

//Enable CORS for all routes
app.use(cors());

//Parse incoming JSON requests
app.use(express.json());

//Connect to MongoDB database
MongoClient.connect(process.env.mongo_url, { useUnifiedTopology: true }, (err, client) => {
    if (err) {
        console.error("Error connecting to MongoDB:", err);
        return;
    }
    //Select database
    db = client.db('CST3144CW'); 
    console.log('Connected to MongoDB');
});

//Middleware to handle collection parameter
//When a route contains :collectionName, this middleware will set req.collection
app.param('collectionName', (req, res, next, collectionName) => {
    req.collection = db.collection(collectionName);
    return next();
});

//Middleware to log each request
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next(); 
});

//Middleware to serve images from the 'images' folder
app.use('/images', (req, res, next) => {
    const filePath = path.join(__dirname, 'images', req.url);
    //Check if file exists
    fs.stat(filePath, (err, fileInfo) => {
        if (err) {
            res.status(404).send("Image not found");
            return;
        }
        //Serve the file if it exists
        if (fileInfo.isFile()) res.sendFile(filePath);
        else next();
    });
});

//Route GET: Retrieve all documents from a collection
app.get('/collection/:collectionName', (req, res, next) => {
    req.collection.find({}).toArray((e, results) => {
        if (e) return next(e);
        res.send(results);
    });
});

//Route POST: Add a new document into a collection
app.post('/collection/:collectionName', (req, res, next) => {
    req.collection.insert(req.body, (e, results) => {
        if (e) return next(e);
        //result.ops contains the inserted documents
        res.send(results.ops); 
    });
});

//Route PUT: Update availableInventory of a document by id in a collection
app.put('/collection/:collectionName/:id', (req, res, next) => {
    const { availableInventory } = req.body;
    req.collection.update(
        { id: parseInt(req.params.id) }, //Find by id (converted to integer)
        { $set: { availableInventory: availableInventory } }, //Update availableInventory only
        { safe: true, multi: false }, //Ensure single update
        (e, result) => {
            if (e) return next(e);
            //Check if update was successful
            res.send((result.result.n === 1) ? {msg: 'success'} : {msg: 'error'});
        }
    );
});

//Route: Search Functionality
app.get('/search/activities', (req, res, next) => {
    const query = req.query.q;
    //If no query provided, return empty array
    if (!query) {
        return res.send([]); 
    }
    //Create a regex for case-insensitive search
    const cleanQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(cleanQuery, 'i');
    //Parse the query as a number for Price/Space searching
    const queryAsNumber = parseFloat(query);

    //Build the search criteria
    let searchCriteria = [
        { title: regex },       //Search in Title
        { location: regex }     //Search in Location
    ];

    //If the search query is a number, checking exact match on Price and Inventory
    if (!isNaN(queryAsNumber)) {
        searchCriteria.push({ price: queryAsNumber });
        searchCriteria.push({ availableInventory: queryAsNumber });
    }

    //Execute find on activities collection using $or array (searchCriteria) to match any condition
    db.collection('activities').find({
        $or: searchCriteria
    }).toArray((e, results) => {
        if (e) return next(e);
        res.send(results);
    });
});

const PORT = 3000;
//Start the server and listen for incoming requests
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
