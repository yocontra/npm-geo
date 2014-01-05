require('fixnode');
var request = require('request');
var _ = require('lodash');
var async = require('async');
var placename = require('placename');
var argv = require('optimist').argv;
var fs = require('fs');
var path = require('path');

var limit = 100;
var backoff = 3000;
var count = 0;
var user = argv.user;
var pass = argv.pass;

if (!user || !pass) throw "Missing argument";

var outFile = path.join(__dirname, 'data', 'authors-with-location.json');

var authors = require('./data/authors');

console.log('There are', authors.length, 'authors');
console.log('Grabbing locations from github...');

async.eachLimit(authors, limit, findLocation, function(err){
  if (err) {
    console.log('Error getting location:', err);
    process.exit(1);
  }
  var success = _.where(authors, function(v){
    return !!v.location;
  });
  console.log('Failed to find location for', authors.length-success.length, 'authors');
  fs.writeFileSync(outFile, JSON.stringify(success, null, 2));
  console.log('Done!');
});


function findLocation(author, cb) {
  var url = "https://api.github.com/users/"+author.github;

  var opt = {
    json: true,
    headers: {
      'User-Agent': 'npm-geo-app'
    },
    auth: {
      user: user,
      pass: pass
    }
  };

  var retry = function(delay) {
    if (delay) delay = Math.max(0, delay*1000-Date.now());
    if (!delay) delay = backoff;
    console.log('Waiting', delay/1000, 'seconds');
    setTimeout(function(){
      findLocation(author, cb);
    }, delay);
  };

  request(url, opt, function(err, res, user){
    //console.log(err, res.statusCode, res.headers);
    //if (res.statusCode === 403) return cb("Invalid username or token");
    if (res.statusCode === 404) return cb();
    if (err) return retry();
    var remaining = parseInt(res.headers['x-ratelimit-remaining'], 10);
    var reset = parseInt(res.headers['x-ratelimit-reset'], 10);
    if (remaining === 0) return retry(reset);

    console.log(++count, remaining);

    if (user.location) {
      author.location = user.location;
    }
    cb();
    /*
    var name = user.location.replace(/\b[A-Z]\./g, '');
    placename(name, function (err, pt) {
      if (err || !pt || !pt[0]) {
        author.location = user.location;
        return cb();
      }
      author.location = {
        place: pt[0].name,
        country: pt[0].country,
        lat: pt[0].lat,
        lon: pt[0].lon,
        population: pt[0].population
      };
      cb();
    });
    */
  });
}