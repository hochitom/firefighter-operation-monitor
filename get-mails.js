'use strict';

var config = require('./config');
var Imap = require('imap');
var inspect = require('util').inspect;

var lastmail;

var imap = new Imap({
        user: config.user,
        password: config.password,
        host: config.host,
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


var startChecking = function () {
    var checkMails = function () {
        console.log('check');
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
                            console.log({UID: msg.uid, date: msg.date, subject: hdrs.subject.toString('utf8')});
                            lastmail = msg.uid;
                        });
                    });
                }
            }, function(err) {
                if (err) throw err;
                console.log('Done fetching all messages!');
                imap.logout();
            });
        });
    };

    var interval = setInterval(checkMails, 10000);
};

module.exports = startChecking;
