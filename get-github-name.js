require('fixnode');
var request = require('request');
var _ = require('lodash');
var async = require('async');

var fs = require('fs');
var path = require('path');

var registry = "http://registry.npmjs.org/";
var limit = 20;
var count = 0;

var outFile = path.join(__dirname, 'data', 'authors.json');

var npmTop = require('./data/npmTop').rows;

console.log('There are', npmTop.length, 'total modules');

// unique list of authors/modules and so we have only one module per author
var authors = filterNpm(npmTop);

console.log('There are', authors.length, 'total module authors');
console.log('Grabbing github names from npm...');

async.eachLimit(authors, limit, findGithub, function(err){
  if (err) {
    console.log('Error getting github name', err);
    process.exit(1);
  }
  var failed = _.where(authors, {guessed: true});
  console.log('Failed to find github usernames for', failed.length, 'authors');
  fs.writeFileSync(outFile, JSON.stringify(authors, null, 2));
  console.log('Done!');
});


function findGithub (author, cb) {
  var pkgUrl = registry+author.module+"/latest";
  request(pkgUrl, {json: true}, function(err, res, pkg){
    if (err) return findGithub(author, cb); // retry forever

    console.log(++count);

    // no repo attached!
    if (!pkg.repository || !pkg.repository.url) {
      author.github = author.npm;
      author.guessed = true;
      cb();
      return;
    }

    var username = extractUsername(pkg.repository.url);

    // not a gh repo!
    if (!username) {
      author.github = author.npm;
      author.guessed = true;
      cb();
      return;
    }

    author.github = username;
    author.guessed = false;
    cb();
  });
}

function extractUsername (repo) {
  var matches = repo.match(/github.com[\/:](.*)\//);
  if (!matches) return;
  return matches[1];
}

function filterNpm (npm) {
  return _.chain(npm)
    .groupBy(function(v) {
      return v.key[0];
    })
    .map(function(v, k){
      return {
        count: v.length,
        module: v[0].key[1],
        npm: k,
        github: null,
        location: null
      };
    })
    .sortBy('count')
    .value();
}