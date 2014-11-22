// Map renderer:

Mapper.views.MapRenderView = Backbone.View.extend({
  el: '#map-preview',
  initialize: function(opts) {
    _.extend(this, opts);
    this.$el.find('#map-renderer').attr('id', this.settings.get('el'));
    this.renderer = new MapRenderer();
    this.renderer.onData = _.bind(this.data.resetData, this.data);

    this.listenTo(this.data, 'reset change', this.render);
    this.listenTo(this.fills, 'add remove change sort', this.render);
    this.listenTo(this.strokes, 'add remove change sort', this.render);
    this.listenTo(this.settings, 'change', this.render);
    this.render();
  },

  render: _.debounce(function() {
    this.renderer.init(Mapper.getRenderConfig({rows: true}));
  }, 10)
});

/*
Mapper.views.MapRenderView = Backbone.View.extend({
  SVG_NS: 'http://www.w3.org/2000/svg',
  el: '#map-preview',

  initialize: function(options) {
    _.extend(this, options);
    var svg = this.svg = document.createElementNS(this.SVG_NS, 'svg');
    svg.setAttribute("version", "1.1");
    svg.setAttribute("xmlns", this.SVG_NS);
    svg.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
    svg.setAttribute('viewBox', '0 0 950 600');
    svg.setAttribute('width', '100%');
    this.$el.append(svg);
    this.$el.attr('id', this.settings.get('el'));

    this.renderer = new MapRenderer(Mapper.getRenderConfig());

    this.save = new Image();

    this.listenTo(this.data, 'reset change', this.render);
    this.listenTo(this.fills, 'add remove change', this.render);
    this.listenTo(this.strokes, 'add remove change', this.render);
    this.listenTo(this.settings, 'change', this.render);
  },

  // Gets the paint color for a value:
  // Will select between heat and cohort plotting based on settings.
  getColor: function(value) {
    return this.settings.get('heatScale') ? this.getHeatColor(value) : this.getCohortColor(value);
  },

  render: _.debounce(function() {
    this.renderMap();
    this.renderLegend();
    this.renderTitle();
    this.renderSave();
  }, 10),

  // Gets a tooltip templating function:
  // this swaps in fancy {{ var }} field parsing for easier use.
  getTooltip: function() {
    var templateSettings = _.templateSettings
    _.templateSettings = {interpolate: /\{\{(.+?)\}\}/g};
    var template = _.template(this.settings.get('tooltip'));
    _.templateSettings = templateSettings;
    return template;
  },

  // Renders the map graphics:
  renderMap: function() {
    // Remove any old graphic element, then create anew:
    if (this.gMap) this.gMap.parentNode.removeChild(this.gMap);
    this.gMap = document.createElementNS(this.SVG_NS, 'g');

    // Gets a cached tooltip function for render fields:
    var tooltip = this.getTooltip();

    // Add all geography shapes:
    var shapes = this.data.map(function(dat) {
      if (!dat.shape) dat.shape = document.createElementNS(this.SVG_NS, 'path');
      dat.shape.setAttribute('d', dat.get('shape'));
      dat.shape.setAttribute('fill', dat.getFillColor());
      dat.shape.setAttribute('stroke', dat.getStrokeColor());
      dat.shape.setAttribute('stroke-width', dat.getStrokeSize());
      dat.shape.setAttribute('data-tooltip', tooltip(dat.attributes));
      return dat.shape;
    }, this);

    // Sort based on stroke weight (thickest goes last):
    shapes.sort(function(a, b) {
      var a = +a.getAttributeNS(null, 'stroke-width');
      var b = +b.getAttributeNS(null, 'stroke-width');
      return a - b;
    });

    // Append map shapes in order of stroke weight:
    _.each(shapes, function(shape) {
      this.gMap.appendChild(shape);
    }, this);

    // Append new map graphic to SVG:
    this.svg.appendChild(this.gMap);
  },

  // Renders the legend graphics:
  renderLegend: function() {
    var mapHeight = 610;
    var legendRows = Math.ceil(this.fills.length);

    // Remove any old graphic element, then create anew:
    if (this.gLegend) this.gLegend.parentNode.removeChild(this.gLegend);
    this.gLegend = document.createElementNS(this.SVG_NS, 'g');

    // Set SVG bounding box height to accomodate legend items:
    this.svg.setAttribute('viewBox', '0 0 950 '+(mapHeight + 15 * legendRows));

    // Create a swatch for each legend item:
    this.fills.each(function(t, i) {
      if (!t.get('inLegend')) return;
      if (!t.swatch) t.swatch = document.createElementNS(this.SVG_NS, 'rect');
      t.swatch.setAttribute('x', 5);
      t.swatch.setAttribute('y', mapHeight + 15 * i);
      t.swatch.setAttribute('width', 20);
      t.swatch.setAttribute('height', 15);
      t.swatch.setAttribute('fill', t.get('color'));
      this.gLegend.appendChild(t.swatch);

      var label = document.createElementNS(this.SVG_NS, 'text');
      label.setAttribute('x', 35);
      label.setAttribute('y', mapHeight + 15 * (i+1));
      label.setAttribute('style', 'font-family:"Balto";font-size:14;font-style:italic;font-weight:300;');
      label.innerHTML = t.get('label');
      //console.log(label.getComputedTextLength());
      this.gLegend.appendChild(label);
    }, this);

    // Append new legend graphic to SVG:
    this.svg.appendChild(this.gLegend);
  },

  // Renders the map title graphic:
  renderTitle: function() {
    if (this.gTitle) this.gTitle.parentNode.removeChild(this.gTitle);
    var title = this.gTitle = document.createElementNS(this.SVG_NS, 'text');
    title.setAttribute('x', 475);
    title.setAttribute('y', 10);
    title.setAttribute('style', 'alignment-baseline:hanging;font-family:"Balto";font-size:28;font-weight:700;text-anchor:middle;');
    title.innerHTML = this.settings.get('title');

    if (this.gBrand) this.gBrand.parentNode.removeChild(this.gBrand);
    var brand = this.gBrand = document.createElementNS(this.SVG_NS, 'path');
    brand.setAttribute('d', VoxLogo);
    brand.setAttribute('fill', 'black');
    brand.setAttribute('transform', 'translate(815, 560) scale(0.5)');

    // Append new legend graphic to SVG:
    this.svg.appendChild(this.gTitle);
    this.svg.appendChild(this.gBrand);
  },

  // Renders the save-image data:
  renderSave: function() {
    var svg = unescape(encodeURIComponent(this.el.innerHTML));
    $('#save-image').attr('href', 'data:image/svg+xml;base64,'+window.btoa(svg));
  }
});*/