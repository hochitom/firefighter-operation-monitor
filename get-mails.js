'use strict';

var config = require('./config');
var Imap = require('imap');
var inspect = require('util').inspect;
var Emergency = require('./model');

var lastmail;

var imap = new Imap({
    user: config.user,
    password: config.password,
    host: config.host,
    port: 143,
    secure: false
});

function openInbox(cb) {
    imap.connect(function(err) {
        if (err) {
            console.error('error while checking for mails');
            console.error(err);
            return;
        }
        imap.openBox('INBOX', true, cb);
    });
};


var startChecking = function () {
    var checkMails = function () {
        console.log(new Date() + ': checking for mails');
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

                            lastmail = msg.uid;

                            var emergency = new Emergency({
                                UID: msg.uid,
                                date: msg.date,
                                subject: hdrs.subject.toString('utf8')
                            });

                            emergency.save(function (err) {
                                if (err) console.error('saving to database failed!');
                            });
                        });
                    });
                }
            }, function(err) {
                if (err) {
                    console.error(err);
                }

                console.log('Done fetching all messages!');
                imap.logout();
            });
        });
    };

    var interval = setInterval(checkMails, 10000);
};

module.exports = startChecking;
