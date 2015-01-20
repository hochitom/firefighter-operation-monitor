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
    tls: false
});

function openInbox(cb) {
    return imap.openBox('INBOX', true, cb);

    /*imap.connect(function(err) {
        if (err) {
            console.error('error while checking for mails');
            console.error(err);
            return;
        }
        console.log('connected');
        imap.openBox('INBOX', true, cb);
    });*/
};

var checkMails = function () {
    console.log(new Date() + ': checking for mails');

    openInbox(function(err, box) {
        console.log('...');
        if (err) {
            console.error(err);
            return;
        }

        var data = {};

        var f = imap.seq.fetch(box.messages.total + ':*', {
            bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE)',
            struct: true
        });

        //var f = imap.seq.fetch(box.messages.total + ':*', { bodies: ['HEADER.FIELDS (FROM)','TEXT'] });
        f.on('message', function(msg, seqno) {
            console.log('Message #%d', seqno);
            var prefix = '(#' + seqno + ') ';


            data.UID = seqno;

            msg.on('body', function(stream, info) {
                if (info.which === 'TEXT') {
                    console.log(prefix + 'Body [%s] found, %d total bytes', inspect(info.which), info.size);
                }

                var buffer = '', count = 0;

                stream.on('data', function(chunk) {
                    count += chunk.length;
                    buffer += chunk.toString('utf8');

                    if (info.which === 'TEXT') {
                        console.log(prefix + 'Body [%s] (%d/%d)', inspect(info.which), count, info.size);
                    }
                });

                stream.once('end', function() {
                    if (info.which !== 'TEXT') {
                        data.subject = Imap.parseHeader(buffer).subject[0].toString('utf8');
                        data.date = Imap.parseHeader(buffer).date[0];

                        console.log(prefix + 'Parsed header: %s', inspect(Imap.parseHeader(buffer)));
                    } else {
                        console.log(prefix + 'Body [%s] Finished', inspect(info.which));
                    }
                });
            });

            msg.once('attributes', function(attrs) {
                console.log(prefix + 'Attributes: %s', inspect(attrs, false, 8));
            });

            msg.once('end', function() {
                console.log(prefix + 'Finished');
            });
        });

        f.once('error', function(err) {
            console.log('Fetch error: ' + err);
        });

        f.once('end', function() {
            console.log('Done fetching all messages!');

            var emergency = new Emergency(data);

            emergency.save(function (err) {
                if (err) console.error('saving to database failed!');
            });

            imap.end();
        });
    });
};


var startChecking = function () {
    imap.once('ready', function() {
        var interval = setInterval(checkMails, 30000);
        checkMails();
    });

    imap.once('error', function(err) {
        console.log(err);
    });

    imap.once('end', function() {
        console.log('Connection ended');
        imap.connect();
    });

    imap.connect();
};

module.exports = startChecking;
