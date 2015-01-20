'use strict';

var config = require('./config');
var http = require('http');
var mongoose = require('mongoose');
var checkMails = require('./get-mails')();

mongoose.connect(config.db);

var Emergency  = require('./model');

http.createServer(function (req, res) {
    console.log('new request', req);

    Emergency
        .findOne()
        .sort('-date')
        .limit(1)
        .select('name date subject')
        .exec(function (err, emergency) {
            console.log(emergency);
            
            if (err) {
                console.error(err);
                res.writeHead(503, {'Content-Type': 'text/plain'});
                res.end(':(');
                return;
            }

            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end(JSON.stringify(emergency));
        });
}).listen(config.port, '127.0.0.1');

console.log('Listening on :' + config.port);
