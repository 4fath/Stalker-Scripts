/**
 * Created by TOSHIBA on 4.6.2016.
 */
'use strict';

require('dotenv').config();
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var mongoUrl = process.env.MONGODB_LOCAL_URL;

mongoose.connect(mongoUrl, function (err) {
    if (err) {
        console.log('DB connection error :' + err);
    } else {
        console.log('DB success !');
    }
});

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error'));

var RecordSchema = new Schema({
    username: String,
    tweet_count: Number,
    following_count: Number,
    followers_count: Number,
    like_count: Number,
    created_at: {
        type: Date,
        required: true,
        default: Date.now()
    }
});

var Record = mongoose.model('Record', RecordSchema);

module.exports = Record;