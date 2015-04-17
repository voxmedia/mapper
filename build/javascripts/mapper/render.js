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
        this.el.header = svg.append('text');
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
        
        // Map array of geo properties:
        // Give all countries an empty value, and exclude unnamed geographies.
        var data = [];
        for (var i = 0; i < self.geodata.length; i++) {
          var props = self.geodata[i].properties;
          if (props.name) data.push(props);
        }

        done();

        // Populate map data as rows:
        if (typeof self.onData === 'function') self.onData(data);
      });
    },

    getRowValue: function(styler, row) {
      var opts = this.options;
      styler = styler.split('_');
      var styleGroup = styler[0];
      var columnName = opts[styleGroup+'_column'];
      var isNumeric = (opts.columns[columnName] === 'number');
      var parser = isNumeric ? this.parseNumber : String;
      return parser(row[columnName]);
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

    // Renders the map with new data:
    render: function() {
      var opts = this.options;
      
      this.heat = d3.scale.linear()
        .domain(opts.fills.map(function(d) { return +d.value; }))
        .range(opts.fills.map(function(d) { return d3.rgb(d.color); }))
        .clamp(opts.heat_clamp);

      // Render data, title, and all geographies:
      this._y = 20;
      renderData(this);
      renderHeaders(this);
      renderGeography(this);

      // Render legend based on map type:
      //opts.heat_scale ? renderHeatLegend(this) : renderCohortLegend(this);
      renderCohortLegend(this)
      
      // Render frame bounds and brand watermark:
      renderFrame(this);
      renderBrand(this);
    }
  };

  // Render Data
  //
  // Pre-renders map data configuration for drawing out graphics.
  // Some visual data (such as outlines) will need to be pre-calculated for rendering order.
  function renderData(map) {
    var opts = map.options;
    var tooltip = template(opts.tooltip);
    var rows = {};

    // Convert data rows into a hash keyed by id:
    for (var i = 0; i < opts.rows.length; i++) {
      rows[String(opts.rows[i].id)] = opts.rows[i];
    }

    for (i = 0; i < map.geodata.length; i++) {
      var geo = map.geodata[i].properties || {};
      var row = rows[String(geo.id)];

      if (row) {
        if (opts.heat_scale) {
          geo.fill_color = map.heat(map.getRowValue('fill_color', row));
        } else {
          geo.fill_color = map.getStyle('fill_color', row);
        }

        geo.stroke_color = map.getStyle('stroke_color', row);
        geo.stroke_size = map.getStyle('stroke_size', row);
        geo.tooltip = tooltip(row);
      }
    }

    // Sort geographies by stroke size:
    map.geodata.sort(function(a, b) {
      return a.properties.stroke_size - b.properties.stroke_size;
    });
  }

  // Render Headers
  //
  // Renders the map's header and subhead 
  function renderHeaders(map) {
    var opts = map.options;
    var header = map.el.header
      .attr('x', opts.width/2)
      .attr('y', map._y)
      .style('dominant-baseline', 'hanging')
      .style('text-anchor', 'middle')
      .style('font', opts.header_font)
      .style('fill', opts.font_color)
      .text(opts.header);

    // Increment Y-rendering position:
    map._y += header.node().getBBox().height + 20;
  }

  // Render Geography
  //
  // Renders all map geography shapes with their colors:
  function renderGeography(map) {
    var g = map.el.map;
    var opts = map.options;
    var pad = 20;

    var geo = g.selectAll('path')
      .data(map.geodata);

    geo
      .enter()
      .insert('path');

    geo
      .attr('data-id', function(d) { return d.id; })
      .each(function(d) {
        var el = d3.select(this);
        var p = d.properties;

        el.attr('fill', p.fill_color || opts.fill_color);
        el.attr('stroke', p.stroke_color || opts.stroke_color);
        el.attr('stroke-width', p.stroke_size || opts.stroke_size);
        if (p.tooltip) el.attr('data-tooltip', p.tooltip);
      })
      .attr('d', map.path);

    geo
      .exit()
      .remove();

    // Scale and position map centered within map view:
    var bbox = g.node().getBBox();
    var maxWidth = opts.width - (pad * 2);
    var scale = maxWidth / bbox.width;
    var offsetX = pad - (bbox.x * scale);
    var offsetY = map._y - (bbox.y * scale);
    g.attr('transform', 'translate('+offsetX+','+offsetY+') scale('+scale+')');

    map._y += Math.round(bbox.height * scale) + pad;
  }

  // Legend Reset
  // Removes outdated legend display before rendering new graphics.
  function resetLegend(map) {
    if (map.el.defs) map.el.defs.remove();
    map.el.legend.html('');
  }

  // Render Legend (Cohorts)
  // Renders the cohort-color swatch grid & labels.
  function renderCohortLegend(map) {
    resetLegend(map);
    var opts = map.options;
    var legend = map.el.legend;
    var data = opts.fills.concat(opts.strokes).filter(function(d) { return d.inLegend; });
    var maxWidth = 0;
    var swatch = 20;
    var pad = 20;

    // Configure swatch rects:
    var swatches = legend.selectAll('rect').data(data);
    swatches.enter().append('rect');
    swatches.exit().remove();

    // Configure label texts:
    var labels = legend.selectAll('text').data(data);
    labels.enter().append('text');
    labels.exit().remove();

    // Set text for each label, then find maximum width label:
    labels
      .text(function(d) { return d.label; })
      .attr('style', 'font:'+opts.legend_font+';fill:'+opts.font_color)
      .each(function(d) {
        maxWidth = Math.max(maxWidth, this.getComputedTextLength());
      });

    // Calculate minimum allowed column width, then balance column count:
    maxWidth = Math.round(swatch + 10 + maxWidth + pad);
    var layout = columnLayout(data.length, maxWidth, opts.width * 0.66);

    // Layout swatches:
    swatches
      .each(function(d, i) {
        if (d.type === 'fill') {
          // Fill swatches:
          d3.select(this)
            .attr('x', layout.x(i))
            .attr('y', layout.y(i))
            .attr('width', swatch)
            .attr('height', swatch)
            .attr('style', 'fill:'+d.color);

        } else {
          // Stroke swatches:
          var stroke = d.size;

          d3.select(this)
            .attr('x', layout.x(i) + stroke/2)
            .attr('y', layout.y(i) + stroke/2)
            .attr('width', swatch - stroke)
            .attr('height', swatch - stroke)
            .attr('style', 'fill:none;stroke:'+ d.color +';stroke-width:'+stroke);
        }
      });

    // Layout labels:
    labels
      .each(function(d, i) {
        d3.select(this)
          .style('dominant-baseline', 'middle')
          .attr('x', swatch + 10 + layout.x(i))
          .attr('y', layout.y(i) + swatch * 0.6);
      });

    legend.attr('transform', 'translate(20,'+ map._y +')');

    map._y += layout.h() + pad;
  }

  // Render Legend (Heat Scale)
  // Renders a heat gradient bar.
  function renderHeatLegend(map) {
    resetLegend(map);
    map.el.defs = map.el.svg.append('defs').html('');

    var opts = map.options;
    var legend = map.el.legend;

    var gradient = map.el.defs
      .append('linearGradient')
      .attr('id', 'heat')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');

    var ramp = legend
      .append('rect')
      .attr('width', 150)
      .attr('height', 20)
      .attr('fill', 'url(#heat)');

    opts.fills.forEach(function(fill, i) {
      gradient
        .append('stop')
        .attr('offset', (i/(opts.fills.length-1) * 100)+'%')
        .attr('style', 'stop-color:'+fill.color);
    });

    map._y += 20 + pad;
  }

  // Render Frame
  //
  // Renders the background rectangle fill and SVG bounding box.
  function renderFrame(map) {
    var opts = map.options;

    // Background fill rect:
    map.el.bg
      .attr('width', opts.width)
      .attr('height', map._y)
      .attr('fill', opts.background_color);

    // SVG frame rect:
    map.el.svg
      .attr('viewBox', '0 0 '+opts.width+' '+map._y);
  }

  // Render Brand
  //
  // Renders the brand mark in the lower-right corner.
  function renderBrand(map) {
    if (!map.brand) return;

    var opts = map.options;
    var brand = map.el.brand.attr('d', map.brand);
    var bbox = brand.node().getBBox();
    var pad = 20;

    scale = (opts.width * 0.15) / bbox.width;
    offsetX = opts.width - Math.round(bbox.width * scale) - pad;
    offsetY = map._y - Math.round(bbox.height * scale) - pad;
    brand.attr('transform', 'translate('+offsetX+','+offsetY+') scale('+scale+')');
  }

  function template(str) {
    // Generate a reusable function that will serve as a template
    // generator (and which will be cached).
    return new Function("o",
      "var p=[];" +
     
      // Introduce the data as local variables using with(){}
      "with(o){p.push('" +
     
      // Convert the template into pure JavaScript
      str
        .replace(/[\r\t\n]/g, " ")
        .split("<%").join("\t")
        .replace(/((^|%>)[^\t]*)'/g, "$1\r")
        .replace(/\t=(.*?)%>/g, "',$1,'")
        .split("\t").join("');")
        .split("%>").join("p.push('")
        .split("\r").join("\\'")
    + "');}return p.join('');");
  }

  // Column Layout Helper (for legend items)
  // ---------------------------------------------------
  // Used for rendering legend items as balanced columns.
  // Accepts a numer of legend items, a minimum item width, and a total range to fill.
  // Returns an object with X/Y calc functions optimized for:
  // - Minimum possible columns,
  // - Minimum possible rows,
  // - Maximum possible items in last row.
  function columnLayout(numItems, minItemWidth, range) {
    // Calculate maximum allowed columns:
    var cols = Math.floor(range / minItemWidth);
    var rows = Infinity;
    var widow;

    // Fewer items than allowed columns:
    if (numItems < cols) {
      
      cols = numItems;

    } else {

      // Calculate ideal column count:
      // Use hill-climbing to find fewest columns with fewest rows and fullest final row.
      for (var i = cols; i > 0; i--) {
        // Calculate row count and widow items for this column config:
        var r = Math.ceil(numItems / i);
        var w = numItems % i;

        // Stop searching if we've exceeded minimum row count:
        // (we're count down, so we know we have surpassed minimum rows now)
        if (r > rows) break;

        // Record new minimum row counts,
        // and reset widow counter for each new row threshold reached:
        if (r !== rows) {
          rows = r;
          widow = -Infinity;
        }

        // Keep column count if there are no widows,
        // or if widow count is higher than previous best:
        // (we want exactly zero widows, or else as many hanging items as possible)
        if (w === 0 || w >= widow) {
          widow = w;
          cols = i;
        }
      }
    }

    // Return functions for calculating X and Y positions:
    return {
      rowHeight: 20,
      rowPad: 5,

      x: function(i) {
        return Math.floor(range / cols) * (i % cols);
      },

      y: function(i) {
        return Math.floor(i / cols) * (this.rowHeight + this.rowPad);
      },

      h: function() {
        return this.y(numItems-1) + this.rowHeight;
      }
    };
  }

}());
