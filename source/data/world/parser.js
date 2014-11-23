var fs = require('fs');
var world = require('./world');
var countries = require('./countries');
var geos = world.objects.countries.geometries;

var parsed = [];

for (var i = 0; i < geos.length; i++) {
  geo = geos[i];
  var id = ('000'+String(geo.id)).slice(-3);
  delete geo.id;

  // Omit missing country names and Antarctica
  if (countries[id] && id !== '010') {
    geo.properties = {id: id, name: countries[id]};
    parsed.push(geo);
  }
}

world.objects.countries.geometries = parsed;
fs.writeFile('./world.json', JSON.stringify(world));