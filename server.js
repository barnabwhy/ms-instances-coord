const express = require('express')
const app = express()
const port = 3000

const fs = require('fs');

let pathToInstances = process.env.INSTANCES_PATH || './instances.json';
let instances = JSON.parse(fs.readFileSync(pathToInstances, 'utf-8'));

fs.watch(pathToInstances, (eventType, filename) => {
    try {
        if(eventType == "change") {
            let fileData = fs.readFileSync(pathToInstances, 'utf-8');
            fileJson = JSON.parse(fileData);
            instances = fileJson;
        }
    } catch(e) {
        console.log(e)
    }
});

let files = fs.readdirSync('api');
files.forEach(file => {
    let handler = require('./api/'+file);
    app.get('/'+file.replace('.js',''), (req, res) => {
        try {
            handler(req, res, instances);
        } catch(e) {
            res.status(500).send()
        }
    });
});

app.listen(port, () => {
  console.log(`Master server coordinator listening on port ${port}`)
})
