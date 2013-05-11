var Imap = require('imap'),
    inspect = require('util').inspect;

var imap = new Imap({
        user: 'test@hochoertler.at',
        password: '9488232',
        host: 'mail.hochoertler.at',
        port: 143,
        secure: false
    });

function show(obj) {
    return inspect(obj, false, Infinity);
}

function die(err) {
    console.log('Uh oh: ' + err);
    process.exit(1);
}

function openInbox(cb) {
    imap.connect(function(err) {
        if (err) die(err);
        imap.openBox('INBOX', true, cb);
    });
}

var checkMails = function () {
    openInbox(function(err, mailbox) {
        if (err) die(err);
            imap.seq.fetch(mailbox.messages.total + ':*', { struct: false }, {
                headers: 'from',
                body: true,
                cb: function(fetch) {
                    fetch.on('message', function(msg) {

                    console.log('Saw message no. ' + msg.seqno);

                    var body = '';

                    msg.on('headers', function(hdrs) {
                        console.log('Headers for no. ' + msg.seqno + ': ' + show(hdrs));
                    });

                    msg.on('data', function(chunk) {
                        body += chunk.toString('utf8');
                    });

                    msg.on('end', function() {
                        console.log('Finished message no. ' + msg.seqno);
                        console.log('UID: ' + msg.uid);
                        console.log('Flags: ' + msg.flags);
                        console.log('Date: ' + msg.date);
                        console.log('Body: ' + show(body));
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

var startChecking = function () {
    setInterval(checkMails, 10000); 
};

exports.startChecking = startChecking;