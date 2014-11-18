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

  // Gets the style for a value:
  // field is defined as "fill_color".
  getStyle: function(styler, row) {
    var opts = this.options;
    var defaultStyle = opts[styler];
    styler = styler.split('_');
    var styleGroup = styler[0];
    var styleAttr = styler[1];
    var styles = opts[styleGroup+'s'];

    // Return early with default style if there are no options:
    if (!styles.length || !row) return defaultStyle;

    var columnName = opts[styleGroup+'_column'];
    var isNumeric = (opts.columns[columnName] === 'number');
    var value = row[columnName];

    // Parse numeric column, and return default style for null values:
    if (isNumeric) {
      value = this.parseNumber(value);
      if (value === null) return defaultStyle;
    } else {
      value = String(value);
    }

    for (var i = 0; i < styles.length; i++) {
      var style = styles[i];
      var op = style.operator;
      var delta = isNumeric ? 
        value - this.parseNumber(style.value) : 
        value.localeCompare(String(style.value));

      if (styleAttr === 'size') {
        console.log(value, style);
      }
      if (
        (op === 'lt' && delta < 0) ||
        (op === 'lte' && delta <= 0) ||
        (op === 'eq' && delta === 0) ||
        (op === 'gte' && delta >= 0) ||
        (op === 'gt' && delta > 0)
      ) return style[styleAttr];
    }

    return defaultStyle;
  },

  // Initializes the map with graphics and data:
  init: function(opts) {
    var self = this;
    var jsonLoaded = false;
    var csvLoaded = false;
    function done() {
      if (jsonLoaded && csvLoaded) {
        self.options = opts;
        self.render();
      }
    }

    if (!this.el) {
      var svg = d3.select('#'+opts.el).append('svg').attr('width', '100%');
      this.el = {
        svg: svg,
        bg: svg.append('rect'),
        map: svg.append('g'),
        title: svg.append('text')
      };
    }

    this.loadCSV(opts, function() {
      csvLoaded = true;
      done();
    });

    this.loadJSON(opts, function() {
      jsonLoaded = true;
      done();
    });
  },

  // Loads CSV data rows based on map options:
  loadCSV: function(opts, done) {
    if (opts.rows) return done();

    // CSV needs to load:
    d3.csv(opts.csv, function(error, rows) {
      opts.rows = rows;
      done();
    });
  },
  
  loadJSON: function(opts, done) {
    if (opts.type === this.options.type) return done();
    var projection, featureset;
    var self = this;

    // Projections for future consideration...
    // times, wagner6, naturalEarth, robinson
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

    
    var self = this;
    var rows = {};
    var size = 0;

    for (var i=0; i < opts.rows.length; i++) {
      var r = opts.rows[i];
      rows[r.id] = r;
    }

    function row(d) {
      return rows[String(d.id)];
    }

    var map = this.el.map
      .selectAll('path')
      .data(data);

    map
      .enter()
      .insert('path');

    map
      .attr('data-id', function(d) { return d.id; })
      .attr('fill', function(d) { return self.getStyle('fill_color', row(d)); })
      .attr('stroke', function(d) { return self.getStyle('stroke_color', row(d)); })
      .attr('stroke-width', function(d) { return (size = self.getStyle('stroke_size', row(d))); })
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