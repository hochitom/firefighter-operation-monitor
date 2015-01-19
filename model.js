'use strict';

var mongoose = require('mongoose');

var Emergency = mongoose.model('Emergencies', {
    name: String,
    UID: {
        type: String,
        index: true,
        unique: true
    },
    date: {
        type: Date,
        index:true
    },
    subject: String
});

module.exports = Emergency;
