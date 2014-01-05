require('fixnode');
var hyperquest = require('hyperquest');
var fs = require('fs');
var path = require('path');

var url = "http://isaacs.iriscouch.com/registry/_design/app/_view/npmTop?group_level=2";
var outFile = path.join(__dirname, 'data', 'npmTop.json');

var topStream = hyperquest(url).pipe(fs.createWriteStream(outFile));

topStream.once('end', function () {
  console.log('Done!');
});