var express = require('express');
var app = express();
var path = require('path');
var formidable = require('express-formidable');
var demo = require('./avacloud-demo');

app.use(express.static(__dirname + '/assets'));
app.use(formidable());

app.get('/', function (req, res) {
    var indexPath = path.join(__dirname + '/index.html');
    res.sendFile(indexPath);
});

app.post('/upload-gaeb', function (req, res) {
    var clientId = req.fields.clientId;
    var clientSecret = req.fields.clientSecret;
    if (!clientId || !clientSecret) {
        res.write('Missing clientId or clientSecret');
        res.end();
        return;
    }

    var gaebFile = req.files.gaebFile;
    if (!gaebFile) {
        res.write('Missing gaebFile');
        res.end();
        return;
    }

    demo.returnAvaProject(clientId, clientSecret, gaebFile)
        .then(function (avaProject) {
            res.set({ 'content-type': 'application/json; charset=utf-8' });
            res.write(JSON.stringify(avaProject, null, 2));
            res.end();
        })
        .catch(function (error) {
            res.write(JSON.stringify(error, null, 2));
            res.end();
        });
})

app.listen(8080, function () {
    console.log('Server listening on port 8080');
});
