'use strict';

var config = require('./config');
var http = require('http');
var mongoose = require('mongoose');
var checkMails = require('./get-mails')();

mongoose.connect(config.db);

var Emergency  = require('./model');

http.createServer(function (req, res) {
    console.log('new request', req.headers['user-agent']);

    Emergency
        .findOne()
        .sort('-date')
        .limit(1)
        .select('name date subject')
        .exec(function (err, emergency) {
            if (err) {
                console.error(err);
                res.writeHead(503, {'Content-Type': 'text/plain'});
                res.end(':(');
                return;
            }


            res.writeHead(200, {'Content-Type': 'application/json'});

            res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8000');

            res.end(JSON.stringify(emergency));
        });
}).listen(config.port, '0.0.0.0');

console.log('Listening on :' + config.port);
