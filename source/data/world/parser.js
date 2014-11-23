var fs = require('fs');
var world = require('./world');
var countries = require('./countries');
var geos = world.objects.countries.geometries;

var parsed = [];

for (var i = 0; i < geos.length; i++) {
  geo = geos[i];
  var id = String(geo.id);
  delete geo.id;
  geo.properties = {id: id, name: countries[id] || ''};
  parsed.push(geo);
}

world.objects.countries.geometries = parsed;
fs.writeFile('./world.json', JSON.stringify(world));