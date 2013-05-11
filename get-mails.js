var Imap = require('imap'),
    inspect = require('util').inspect,
    fs = require('fs'),
    lastmail;

var imap = new Imap({
        user: 'test@hochoertler.at',
        password: '9488232',
        host: 'mail.hochoertler.at',
        port: 143,
        secure: false
    });

function show(obj) {
    return inspect(obj, false, Infinity);
};

function die(err) {
    console.log('Uh oh: ' + err);
    process.exit(1);
};

function openInbox(cb) {
    imap.connect(function(err) {
        if (err) die(err);
        imap.openBox('INBOX', true, cb);
    });
};


var startChecking = function (io) {
    io.sockets.on('connection', function (socket) {
    
        var checkMails = function () {
            openInbox(function(err, mailbox) {
                if (err) die(err);
                    imap.seq.fetch(mailbox.messages.total + ':*', { struct: false }, {
                        headers: ['subject', 'date'],
                        body: false,
                        cb: function(fetch) {
                            fetch.on('message', function(msg) {

                            var body;

                            msg.on('headers', function(hdrs) {
                                if (lastmail === msg.uid) return;
                                socket.emit('mail', {UID: msg.uid, date: msg.date, subject: hdrs.subject.toString('utf8')});
                                lastmail = msg.uid;
                            });

                            /*msg.on('data', function(chunk) {
                                body = chunk.toString('utf8');
                            });*/

                            /*msg.on('end', function() {
                                socket.emit('mail', {UID: msg.uid, date: msg.date, msg: body});
                            });*/
                        });
                    }
                }, function(err) {
                    if (err) throw err;
                    console.log('Done fetching all messages!');
                    imap.logout();
                });
            });
        };

        setInterval(checkMails, 10000);
    }); 
};

exports.startChecking = startChecking;