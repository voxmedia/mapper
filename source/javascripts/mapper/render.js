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

  // Parses out a number, or returns null for empty values:
  // This is designed to distinguish between 0 and empty values.
  parseNumber: function(d) {
    return d ? +d : null;
  },

  // Converts a value into a string:
  parseString: function(d) {
    return String(d);
  },

  compareNumber: function(op, a, b) {
    switch (op) {
      case 'lte': return a <= b;
      case 'lt': return a < b;
      case 'eq': return a === b;
      case 'gt': return a > b;
      case 'gte': return a >= b;
    }
  },

  // Parses all styler values based on their column datatype:
  // We'll need to make sure that styler values match data value types.
  parseStyles: function(opts) {
    var parsers = {
      'number': this.parseNumber,
      'string': this.parseString
    };

    for (var i=0; i < opts.styles.length; i++) {
      var style = opts.styles[i];
      var columnName = opts[style.type+'_column'];
      var dataType = opts.columns[columnName];
      style.value = parsers[dataType](style.value);
    }
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
    var self = this;
    var loadedCSV = false;
    var loadedJSON = false;
    var done = function() {
      if (loadedCSV && loadedJSON) {
        self.options = opts;
        self.render(opts);
      }
    };

    if (!this.el) {
      var svg = d3.select('#'+opts.el).append('svg').attr('width', '100%');
      this.el = {
        svg: svg,
        bg: svg.append('rect'),
        map: svg.append('g'),
        title: svg.append('text')
      };
    }

    this.parseStyles(opts);

    this.loadCSV(opts, function() {
      loadedCSV = true;
      done();
    });

    this.loadJSON(opts, function() {
      loadedJSON = true;
      done();
    });
  },

  // Loads CSV data rows based on map options:
  loadCSV: function(opts, done) {
    if (opts.rows) {
      // Rows provided:
      opts.rows = opts.rows.map(this.getCSVParser(opts.columns));
      done();

    } else {
      // Load CSV rows:
      d3.csv(opts.csv, this.getCSVParser(opts.columns), function(error, rows) {
        opts.rows = rows;
        done();
      });
    }
  },

  // Loads map shapefile JSON based on map options:
  loadJSON: function(opts, done) {
    // Return early if this map has already been loaded:
    if (opts.type === this.options.type) return done();

    // Configure type-specific resources:
    var projection, featureset;
    var self = this;

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
        projection = d3.geo.albersUsa();
        featureset = 'states';
        break;
    }

    // Load shapefile and CSV data
    d3.json('data/'+opts.type+'.json', function(error, data) {
      self.data = data;
      self.features = data.objects[featureset];
      self.path = d3.geo.path().projection(projection);
      done();
    });
  },

  // Renders the map with new data:
  render: function() {
    // Re-initialize when changing types:
    var opts = this.options;

    // Scale SVG element:
    this.el.svg
      .attr('viewBox', '0 0 '+opts.width+' '+opts.height);

    // Render background rect:
    this.el.bg
      .attr('width', opts.width)
      .attr('height', opts.height)
      .attr('fill', opts.background_color);

    this.renderMap(opts);
    this.renderTitle(opts);
    //this.renderBrand(opts);
  },

  renderTitle: function(opts) {
    var title = this.el.title
      .attr('x', opts.width/2)
      .attr('y', 25)
      .style('alignment-baseline', 'hanging')
      .style('text-anchor', 'middle')
      .style('font', opts.title_font)
      .text(opts.title);
  },

  renderMap: function(opts) {
    var data = topojson.feature(this.data, this.features).features;

    var rows = {};

    for (var i=0; i < opts.rows.length; i++) {
      var row = opts.rows[i];
      rows[row.id] = row;
    }

    var map = this.el.map
      .selectAll('path')
      .data(data)

    map
      .enter()
      .insert('path');

    map
      .attr('data-id', function(d) { return d.id; })
      .attr('fill', function(d) {
        return opts.fill_color;
      })
      .attr('stroke', opts.stroke_color)
      .attr('stroke-width', opts.stroke_width)
      .attr('d', this.path);

    map
      .exit()
      .remove();

    var bbox = this.el.map[0][0].getBBox();
    this.el.map.attr('transform', 'translate(-'+Math.round(bbox.x*1.1)+',-'+Math.round(bbox.y)+') scale('+opts.width/bbox.width+')');
  },

  renderBrand: function() {
    if (typeof this.brand === 'string') {
      this.brand = this.el.svg
        .append('path')
        .attr('d', this.brand);
    }
  }
};