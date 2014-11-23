function MapRenderer(opts) {
  if (opts) this.init(opts);
}

(function() {

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

    parseTooltip: function() {
      var templateSettings = _.templateSettings
      _.templateSettings = {interpolate: /\{\{(.+?)\}\}/g};
      var template = _.template(this.options.tooltip);
      _.templateSettings = templateSettings;
      return template;
    },

    // Gets the style for a value:
    // field is defined as "fill_color".
    getStyle: function(styler, row) {
      var opts = this.options;
      styler = styler.split('_');
      var styleGroup = styler[0];
      var styleAttr = styler[1];
      var styles = opts[styleGroup+'s'];

      // Return early with default style if there are no options:
      if (!styles.length || !row) return null;

      var columnName = opts[styleGroup+'_column'];
      var isNumeric = (opts.columns[columnName] === 'number');
      var value = row[columnName];

      // Parse numeric column, and return default style for null values:
      if (isNumeric) {
        value = this.parseNumber(value);
        if (value === null) return null;
      } else {
        value = String(value);
      }

      for (var i = 0; i < styles.length; i++) {
        var style = styles[i];
        var op = style.operator;
        var delta = isNumeric ? 
          value - this.parseNumber(style.value) : 
          value.localeCompare(String(style.value));

        if (
          (op === 'lt' && delta < 0) ||
          (op === 'lte' && delta <= 0) ||
          (op === 'eq' && delta === 0) ||
          (op === 'gte' && delta >= 0) ||
          (op === 'gt' && delta > 0)
        ) return style[styleAttr];
      }

      return null;
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

      // Create shape layers:
      if (!this.el) {
        this.el = {};
        var svg = this.el.svg = d3.select('#'+opts.el)
          .append('svg')
          .attr('width', '100%');

        this.el.bg = svg.append('rect');
        this.el.map = svg.append('g');
        this.el.legend = svg.append('g');
        this.el.title = svg.append('text');
        this.el.brand = svg.append('path');
      }

      this.loadJSON(opts, function() {
        jsonLoaded = true;
        done();
      });

      this.loadCSV(opts, function() {
        csvLoaded = true;
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
        self.geodata = topojson.feature(data, data.objects[featureset]).features;
        self.path = d3.geo.path().projection(projection);
        if (!self.data) self.data = self.geodata.map(function(d) { return {id: String(d.id), value: '0'}; });
        done();

        // Populate map data as rows:
        if (typeof self.onData === 'function') self.onData(self.data);
      });
    },

    // Renders the map with new data:
    render: function() {
      // Re-initialize when changing types:
      var self = this;
      var opts = this.options;
      var pad = 20;
      var yinc = pad;
      var rows = {};
      var tooltip = this.parseTooltip();

      // Convert data rows into an object with ids:
      for (var i = 0; i < opts.rows.length; i++) {
        rows[String(opts.rows[i].id)] = opts.rows[i];
      }

      for (i = 0; i < this.geodata.length; i++) {
        var geo = this.geodata[i];
        var row = rows[String(geo.id)];
        if (!row) continue;

        geo.properties = {
          fill_color: self.getStyle('fill_color', row),
          stroke_color: self.getStyle('stroke_color', row),
          stroke_size: self.getStyle('stroke_size', row),
          tooltip: tooltip(row)
        };
      }

      // Sort geographies by stroke size:
      this.geodata.sort(function(a, b) {
        return a.properties.stroke_size - b.properties.stroke_size;
      });

      // TITLE:
      var title = this.el.title
        .attr('x', opts.width/2)
        .attr('y', yinc)
        .style('alignment-baseline', 'hanging')
        .style('text-anchor', 'middle')
        .style('font', opts.title_font)
        .text(opts.title);

      yinc += 20;

      // MAP:
      var map = this.el.map;
      var geo = map.selectAll('path')
        .data(this.geodata);

      geo
        .enter()
        .insert('path');

      geo
        .attr('data-id', function(d) { return d.id; })
        .attr('fill', function(d) { return d.properties.fill_color || opts.fill_color; })
        .attr('stroke', function(d) { return d.properties.stroke_color || opts.stroke_color; })
        .attr('stroke-width', function(d) { return d.properties.stroke_size || opts.stroke_size; })
        .attr('data-tooltip', function(d) { return d.properties.tooltip; })
        .attr('d', this.path);

      geo
        .exit()
        .remove();

      // Scale and position map centered within map view:
      var bbox = this.bbox(map);
      var maxWidth = opts.width - (pad * 2);
      var scale = maxWidth / bbox.width;
      var offsetX = pad - (bbox.x * scale);
      var offsetY = yinc - (bbox.y * scale);
      map.attr('transform', 'translate('+offsetX+','+offsetY+') scale('+scale+')');

      yinc += Math.round(bbox.height * scale);

      // LEGEND:
      var legend = this.el.legend
        .selectAll('rect')
        .data(opts.fills.concat(opts.strokes));

      legend
        .enter()
        .insert('rect');

      legend
        .attr('x', pad)
        .attr('y', function(d) { return yinc += 20; })
        .attr('width', 20)
        .attr('height', 20)
        .attr('fill', function(d) { return d.type == 'fill' ? d.color : null; })
        .attr('stroke', function(d) { return d.type == 'stroke' ? d.color : null; })
        .attr('stroke-width', function(d) { return d.type == 'stroke' ? d.size : null; });

      legend
        .exit()
        .remove();

      yinc += pad;

      // FRAME:
      this.el.bg
        .attr('width', opts.width)
        .attr('height', yinc)
        .attr('fill', opts.background_color);

      this.el.svg
        .attr('viewBox', '0 0 '+opts.width+' '+yinc);

      // BRANDING:
      if (typeof this.brand === 'string') {
        var brand = this.el.brand;
        brand.attr('d', this.brand);
        bbox = this.bbox(brand);

        scale = (opts.width * 0.15) / bbox.width;
        offsetX = opts.width - Math.round(bbox.width * scale) - pad;
        offsetY = yinc - Math.round(bbox.height * scale) - pad;
        brand.attr('transform', 'translate('+offsetX+','+offsetY+') scale('+scale+')');
      }
    },

    bbox: function(el) {
      return el[0][0].getBBox()
    }
  };

}());