var ecstatic = require('ecstatic'),
    http = require('http').createServer(
        ecstatic({ root: __dirname + '/public' })
    ),
    io = require('socket.io').listen(http),
    mail = require('./get-mails').startChecking(io);

http.listen(3000);

console.log('Listening on :3000');