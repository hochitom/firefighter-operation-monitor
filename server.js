var Imap = require('imap'),
    inspect = require('util').inspect;

var imap = new Imap({
      user: 'test@hochoertler.at',
      password: '9488232',
      host: 'mail.hochoertler.at',
      port: 993,
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

openInbox(function(err, mailbox) {
  if (err) die(err);
  imap.search([ 'UNSEEN', ['SINCE', 'May 20, 2010'] ], function(err, results) {
    if (err) die(err);
    imap.fetch(results,
      { headers: ['from', 'to', 'subject', 'date'],
        cb: function(fetch) {
          fetch.on('message', function(msg) {
            console.log('Saw message no. ' + msg.seqno);
            msg.on('headers', function(hdrs) {
              console.log('Headers for no. ' + msg.seqno + ': ' + show(hdrs));
            });
            msg.on('end', function() {
              console.log('Finished message no. ' + msg.seqno);
            });
          });
        }
      }, function(err) {
        if (err) throw err;
        console.log('Done fetching all messages!');
        imap.logout();
      }
    );
  });
});