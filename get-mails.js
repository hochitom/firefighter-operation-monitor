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
    console.log('checking for mails');

    openInbox(function(err, box) {
        console.log('...');

        if (err) {
            console.error(err);
            return;
        }

        if (box.uidnext === lastmail) {
            console.log('same uid as last mail');
            return;
        }

        if (box.messages.new === 0) {
            console.log('no new messages');
            return;
        }

        var data = false;

        var f = imap.seq.fetch(box.messages.total + ':*', {
            bodies: ['HEADER.FIELDS (FROM SUBJECT DATE)','TEXT']
        });

        //var f = imap.seq.fetch(box.messages.total + ':*', { bodies: ['HEADER.FIELDS (FROM SUBJECT)','TEXT'] });
        f.on('message', function(msg, seqno) {
            var prefix = '(#' + seqno + ') ';

            data = {};

            msg.on('body', function(stream, info) {
                /*if (info.which === 'TEXT') {
                    console.log(prefix + 'Body [%s] found, %d total bytes', inspect(info.which), info.size);
                }*/

                var buffer = '', count = 0;

                stream.on('data', function(chunk) {
                    count += chunk.length;
                    buffer += chunk.toString('utf8');

                    if (info.which === 'TEXT') {
                        //console.log(prefix + 'Body [%s] (%d/%d)', inspect(info.which), count, info.size);
                    }
                });

                stream.once('end', function() {
                    if (info.which !== 'TEXT') {
                        data.subject = Imap.parseHeader(buffer).subject[0].toString('utf8');
                        data.date = Imap.parseHeader(buffer).date[0];

                        console.log(prefix + 'Parsed header: %s', inspect(Imap.parseHeader(buffer)));
                    } else {
                        console.log(inspect(Imap.parseHeader(buffer)));
                        console.log(prefix + 'Body [%s] Finished', inspect(info.which));
                    }
                });
            });

            msg.once('attributes', function(attrs) {
                console.log(attrs);
                data.uid = attrs.uid;
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

            if (!data) return;

            var emergency = new Emergency(data);

            emergency.save(function (err, data) {
                if (err) {
                    console.error('saving to database failed!');
                    return;
                }

                lastmail = data.UID;
            });

            //imap.end();
        });
    });
};


var startChecking = function () {
    imap.once('ready', function() {
        var interval = setInterval(checkMails, 10000);
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
