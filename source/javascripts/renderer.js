//= require "vendor/d3.v3.min"
//= require "vendor/d3.times.projection"
//= require "vendor/topojson.v1.min"

function MapRender(opts) {
  this.init(opts);
}

MapRender.prototype = {
  options: {},

  // Initializes the map with graphics and data:
  init: function(opts) {
    // Projections for future consideration:
    // times, wagner6, naturalEarth, robinson
    var projection, shapefile, featureset;
    var self = this;

    if (!this.svg) {
      this.svg = d3.select('#'+opts.el)
        .append('svg')
        .attr('width', '100%');

      this.map = this.svg.append('g');
    }

    // Configure type-specific resources:
    switch (opts.type) {
      case 'world':
        projection = d3.geo.times();
        shapefile = 'data/world.json';
        featureset = 'countries';
        break;
      case 'us-county':
        projection = d3.geo.albersUsa();
        shapefile = 'data/us.json';
        featureset = 'counties';
        break;
      case 'us-state':
      default:
        projection = d3.geo.albersUsa();
        shapefile = 'data/us.json';
        featureset = 'states';
        break;
    }

    // Generating pathing function:
    this.path = d3.geo.path().projection(projection);

    // Load shapefile and CSV data
    d3.json(shapefile, function(error, data) {
      self.data = data;
      self.features = data.objects[featureset];
      self.options = opts;

      if (opts.csv) {
        // Load CSV data:
        var parser = opts.csvParser || function() { return d; };
        d3.csv(opts.csv, parser, function(error, rows) {
          opts.rows = rows;
          self.render(opts);
        });

      } else {
        self.render(opts);
      }
    });
  },

  // Renders the map with new data:
  render: function(opts) {
    // Re-initialize when changing types:
    if (!opts || opts.type !== this.options.type) return this.init(opts);
    
    var width = 960;
    var height = 500;
    var data = topojson.feature(this.data, this.features).features;

    // Remove map graphic before rendering:
    var paths = this.map
      .selectAll('path')
      .data(data)

    paths
      .enter()
      .insert('path');

    paths
      .attr('data-id', function(d) { return d.id; })
      .attr("d", this.path);

    paths
      .exit()
      .remove();

    var bbox = this.map[0][0].getBBox();
    this.map.attr('transform', 'translate(-'+Math.round(bbox.x*1.1)+',-'+Math.round(bbox.y)+')');
    this.svg.attr('viewBox', '0 0 '+Math.round(bbox.width)+' '+Math.round(bbox.height));
    this.options = opts;

    console.log(opts.rows);
  }
};