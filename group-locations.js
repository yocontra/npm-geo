var _ = require('lodash');
var geodist = require('geodist');

var outFile = path.join(__dirname, 'data', 'grouped-locations.json');

var authors = require('./data/authors-with-location');

console.log('There are', authors.length, 'authors with locations');
console.log('Grouping locations...');

var places = _.chain(authors)
  .groupBy(function(v) {
    if (v.location.name) {
      return (v.location.name+' '+v.location.country).trim();
    }
    return v.location;
  })
  .map(function(authors, place){
    return _.reduce(authors, function(sum, author) {
      return sum+author.count;
    });
  })
  .value();

fs.writeFileSync(outfile, JSON.stringify(places, null, 2));

console.log('Total of', places.length, 'places with modules');
console.log('Done!');