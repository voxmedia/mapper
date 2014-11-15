function MapRenderer(opts) {
  if (opts) this.init(opts);
}

MapRenderer.prototype = {
  brand: '', // << SVG path data for branding logo, if desired.
  options: {
    background_color: '#eee',
    columns: null,
    fill_color: '#ddd',
    stroke_color: '#fff',
    stroke_size: 1,
    type: null
  },

  // getCSVParser( {columns:'types'} )
  // Builds a parser function for assembling typed CSV data.
  // NOTE: parsing number types MUST preserve the distinction between no data and zero data...
  // Therefore, empty numeric values are specifically parsed as NULL rather than coerced into Zero.
  // @param columns => {id: 'string', value: 'number'}
  getCSVParser: function(columns) {
    // If columns are not defined, then return a pass-through.
    if (!columns) return function() { return d; };

    // Otherwise, build data-type accessor function:
    var accessors = [];

    for (var column in columns) {
      var accessor = 'd["'+column+'"]';
      if (columns[column] === 'number') accessor = (accessor+' ? +'+accessor+' : null');
      accessors.push('"'+column+'": '+accessor);
    }
    
    return new Function('d', 'return {'+ accessors.join(',') +'};');
  },

  // Initializes the map with graphics and data:
  init: function(opts) {
    // Projections for future consideration:
    // times, wagner6, naturalEarth, robinson
    var projection, featureset;
    var self = this;

    if (!this.svg) {
      this.svg = d3.select('#'+opts.el)
        .append('svg')
        .attr('width', '100%');

      this.bg = this.svg.append('rect');
      this.map = this.svg.append('g');
    }

    // Configure type-specific resources:
    switch (opts.type) {
      case 'world':
        projection = d3.geo.times();
        featureset = 'countries';
        break;
      case 'us-county':
        projection = d3.geo.albersUsa();
        featureset = 'counties';
        break;
      case 'us-state':
      default:
        projection = d3.geo.albersUsa();
        featureset = 'states';
        break;
    }

    // Generating pathing function:
    this.path = d3.geo.path().projection(projection);

    // Load shapefile and CSV data
    d3.json('data/'+opts.type+'.json', function(error, data) {
      self.data = data;
      self.features = data.objects[featureset];
      self.options = opts;

      if (opts.csv) {
        // Load CSV data:
        d3.csv(opts.csv, this.getCSVParser(opts.columns), function(error, rows) {
          opts.rows = rows;
          self.render(opts);
        });

      } else {
        //this.getCSVParser(opts.columns);
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
    var map = this.map
      .selectAll('path')
      .data(data)

    map
      .enter()
      .insert('path');

    map
      .attr('data-id', function(d) { return d.id; })
      .attr('fill', opts.fill_color)
      .attr('stroke', opts.stroke_color)
      .attr('stroke-width', opts.stroke_width)
      .attr("d", this.path);

    map
      .exit()
      .remove();

    this.bg
      .attr('width', width)
      .attr('height', height)
      .attr('fill', opts.background_color);

    var bbox = this.map[0][0].getBBox();
    this.map.attr('transform', 'translate(-'+Math.round(bbox.x*1.1)+',-'+Math.round(bbox.y)+')');
    this.svg.attr('viewBox', '0 0 '+Math.round(bbox.width)+' '+Math.round(bbox.height));
    this.options = opts;

    //this.renderBrand();
  },

  renderBrand: function() {
    if (typeof this.brand === 'string') {
      this.brand = this.svg
        .append('path')
        .attr('d', this.brand);
    }
  }
};