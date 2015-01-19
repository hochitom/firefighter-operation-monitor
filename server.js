'use strict';

var config = require('./config');
var http = require('http');
var checkMails = require('./get-mails')();

http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Hello World\n');
}).listen(config.port, '127.0.0.1');

console.log('Listening on :' + config.port);
