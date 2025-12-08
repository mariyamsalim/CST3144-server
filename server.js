const express = require('express');
const app = express();
const cors = require('cors');
const path = require('path');
const fs = require('fs');

app.use(cors());

app.use(express.json());

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
