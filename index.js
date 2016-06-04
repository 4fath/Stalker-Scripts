/**
 * Created by TOSHIBA on 4.6.2016.
 */
'use strict';

require('dotenv').config();
var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');
var nodemailer = require('nodemailer');

var Record = require('./Record');

var stalk_list = './stalk_list.json';
var stalk_results = './stalk_results.json';

var CronJob = require('cron').CronJob;

// second, minute, hour, day of mount(1-31), mount(1-12), day of week(0-7)
// here, every day, every hour just run

var twitterJob = new CronJob(process.env.CRON_OP, function () {
        console.log("Fetch and Store işlemi BAŞLADI :" + Date.now());
        startFetch();
        console.log("Fetch and Store işlemi BİTTİ :" + Date.now());
    }, function () {
        console.log("Veriler analize GİRDİ :" + Date.now());
        checkStatus();
        console.log("Veriler analize BİTTİ :" + Date.now());
    }, false
);

startTwitterJob();

function startTwitterJob() {
    console.log("=== startTwitterJob ===");
    twitterJob.start();
}

function stopTwitterJob() {
    console.log("==stopTwitterJob==");
    twitterJob.stop();
}

function startFetch() {
    console.log("==startFetch==");
    fs.readFile(stalk_list, 'utf8', function (err, data) {
        if (err) throw err;
        var parsedData = JSON.parse(data);
        parsedData.forEach(function (myData) {
            var usernameStr = myData.username;
            stalkAndStore(usernameStr);
        });
        console.log("ReadFile işlemi bitti");
        stopTwitterJob();
        startTwitterJob();
    });
}

function stalkAndStore(username) {
    console.log("==stalkAndStore==");
    request.get('https://twitter.com/' + username, function (error, response, body) {

        if (!error && response.statusCode == 200) {
            var $ = cheerio.load(body);

            var tweetCount = $('.ProfileNav-item--tweets > a > .ProfileNav-value').text();
            // console.log(username + " Tweet Count :" + tweetCount);

            var followingCount = $('.ProfileNav-item--following > a > .ProfileNav-value').text();
            // console.log(username + " Following Count :" + followingCount);

            var followerCount = $('.ProfileNav-item--followers > a > .ProfileNav-value').text();
            // console.log(username + " Followers Count :" + followerCount);

            var favoritesCount = $('.ProfileNav-item--favorites > a > .ProfileNav-value').text();
            // console.log(username + " Like counts :" + favoritesCount);

            var myRecord = new Record({
                username: username,
                tweet_count: tweetCount,
                following_count: followingCount,
                followers_count: followerCount,
                like_count: favoritesCount
            });
            myRecord.save(function (err) {
                if (err) throw err;
                console.log("Successfully recorded.")
            });
        } else {
            console.log("Error :" + error);
        }
    });
}

function checkStatus() {
    console.log("==checkStatus==");
    fs.readFile(stalk_list, 'utf8', function (err, data) {
        if (err) throw err;
        var parsedData = JSON.parse(data);
        console.log(parsedData);
        console.log(parsedData[0]);
        parsedData.forEach(function (myData) {
            compareRecords(myData.username);
        });
    });
}

function compareRecords(username) {
    console.log("==compareRecords==");
    var query = {"username": username};
    Record.find(query).sort('-created_at').limit(2).exec(function (err, records) {
        if (err) throw err;
        var newOne = records[0];
        var oldOne = records[1];
        
        console.log(newOne.tweet_count);
        console.log(oldOne.tweet_count);
        if (newOne.tweet_count != oldOne.tweet_count || newOne.following_count != oldOne.following_count ||
            newOne.followers_count != oldOne.followers_count || newOne.like_count != oldOne.like_count) {
            sendEmail(newOne.username);
        }
    });
}

function sendEmail(username) {

    var smtpTransport = nodemailer.createTransport("SMTP", {
        service: "Gmail",
        auth: {
            user: process.env.MAIL_USERNAME,
            pass: process.env.MAIL_PASS
        }
    });

    var htmlContent = "<b>There is some changes, look at !</b>" +
        "<br><br>" +
        "<a href=https://twitter.com/"+username+">"+username+"</a>";
    
    var mailOptions = {
        from: "Stalk App ✔ <nodejs.stalk@gmail.com>",
        to: process.env.TO_USER,
        subject: "Stalk App Bilgilendirme",
        html: htmlContent
    };

    smtpTransport.sendMail(mailOptions, function (error, response) {
        if (error) {
            console.log("there is something wrong");
            console.log(error);
        } else {
            console.log("Message sent: " + response.message);
        }
    });
}



    