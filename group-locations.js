var _ = require('lodash');
var fs = require('fs');
var path = require('path');

var outFile = path.join(__dirname, 'data', 'grouped-locations.json');

var authors = require('./data/authors-with-location');

console.log('There are', authors.length, 'authors with locations');
console.log('Grouping locations...');

var places = _.chain(authors)
  .groupBy('location')
  .reduce(function(result, authors, place){
    result[place] = _.reduce(authors, function(sum, author) {
      return sum+author.count;
    }, 0);
    return result;
  }, {})
  .value();

fs.writeFileSync(outFile, JSON.stringify(places, null, 2));

console.log('Total of', Object.keys(places).length, 'places with modules');
console.log('Done!');