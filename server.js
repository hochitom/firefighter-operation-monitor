var http = require('http'),
    ecstatic = require('ecstatic'),
    mail = require('./get-mails').startChecking();

http.createServer(
    ecstatic({ root: __dirname + '/public' })
).listen(3000);

console.log('Listening on :3000');