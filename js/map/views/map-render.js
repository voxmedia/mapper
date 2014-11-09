// Map renderer:

Mapper.views.MapRenderView = Backbone.View.extend({
  SVG_NS: 'http://www.w3.org/2000/svg',
  el: '#map-view',

  initialize: function(options) {
    _.extend(this, options);
    var svg = this.svg = document.createElementNS(this.SVG_NS, 'svg');
    svg.setAttribute("version", "1.1");
    svg.setAttribute("xmlns", this.SVG_NS);
    svg.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
    svg.setAttribute('viewBox', '0 0 950 600');
    svg.setAttribute('width', '100%');
    this.$el.append(svg);
    this.save = new Image();

    this.listenTo(this.geos, 'reset change:value', this.render);
    this.listenTo(this.thresholds, 'add remove change', this.render);
    this.listenTo(this.settings, 'change', this.render);
  },

  getCohortColor: function(value) {
    var threshold = this.thresholds.find(function(t, i) {
      var v = t.get('value');
      var c = t.get('operator');
      if (c === 'lt' && value < v) return true;
      if (c === 'lte' && value <= v) return true;
      if (c === 'eq' && value === v) return true;
      if (c === 'gte' && value >= v) return true;
      if (c === 'gt' && value > v) return true;
    }, this);

    return threshold ? threshold.get('color') : this.settings.get('blankColor');
  },

  getHeatColor: function(value) {
    var low = this.thresholds.at(0);
    var high = this.thresholds.at(1);

    if (!low || !high || value < low.get('value') || value > high.get('value')) {
      return this.settings.get('blankColor');
    }
    
    // Calculate midpoint percentage:
    var lv = low.get('value');
    var hv = high.get('value');
    var perc = (value - lv) / (hv - lv);

    // Break out A components:
    var a = low.get('color');
    var ar = parseInt(a.substr(1, 2), 16);
    var ag = parseInt(a.substr(3, 2), 16);
    var ab = parseInt(a.substr(5, 2), 16);

    // Break out B components:
    var b = high.get('color');
    var br = parseInt(b.substr(1, 2), 16);
    var bg = parseInt(b.substr(3, 2), 16);
    var bb = parseInt(b.substr(5, 2), 16);

    // Interpolate midpoints:
    var cr = Math.round(ar + (br - ar) * perc);
    var cg = Math.round(ag + (bg - ag) * perc);
    var cb = Math.round(ab + (bb - ab) * perc);

    return 'rgb('+ cr +','+ cg +','+ cb +')';
  },

  getColor: function(value) {
    return this.settings.get('heatScale') ? this.getHeatColor(value) : this.getCohortColor(value);
  },

  render: function() {
    this.renderMap();
    this.renderLegend();
    this.renderTitle();
    this.renderSave();
  },

  // Renders the map graphics:
  renderMap: function() {
    // Remove any old graphic element, then create anew:
    if (this.gMap) this.gMap.parentNode.removeChild(this.gMap);
    this.gMap = document.createElementNS(this.SVG_NS, 'g');

    // Add all geography shapes:
    this.geos.each(function(geo) {
      if (!geo.shape) geo.shape = document.createElementNS(this.SVG_NS, 'path');
      geo.shape.setAttribute('d', geo.get('shape'));
      geo.shape.setAttribute('fill', this.getColor(geo.get('value')));
      this.gMap.appendChild(geo.shape);
    }, this);

    // Append new map graphic to SVG:
    this.svg.appendChild(this.gMap);
  },

  // Renders the legend graphics:
  renderLegend: function() {
    var mapHeight = 610;
    var legendRows = Math.ceil(this.thresholds.length);

    // Remove any old graphic element, then create anew:
    if (this.gLegend) this.gLegend.parentNode.removeChild(this.gLegend);
    this.gLegend = document.createElementNS(this.SVG_NS, 'g');

    // Set SVG bounding box height to accomodate legend items:
    this.svg.setAttribute('viewBox', '0 0 950 '+(mapHeight + 15 * legendRows));

    // Create a swatch for each legend item:
    this.thresholds.each(function(t, i) {
      if (!t.get('inLegend')) return;
      if (!t.swatch) t.swatch = document.createElementNS(this.SVG_NS, 'rect');
      t.swatch.setAttribute('x', '5');
      t.swatch.setAttribute('y', mapHeight + 15 * i);
      t.swatch.setAttribute('width', '20');
      t.swatch.setAttribute('height', '15');
      t.swatch.setAttribute('fill', t.get('color'));
      this.gLegend.appendChild(t.swatch);

      var label = document.createElementNS(this.SVG_NS, 'text');
      label.setAttribute('x', '35');
      label.setAttribute('y', mapHeight + 15 * (i+1));
      label.innerHTML = t.get('label');
      this.gLegend.appendChild(label);
    }, this);

    // Append new legend graphic to SVG:
    this.svg.appendChild(this.gLegend);
  },

  renderTitle: function() {
    if (this.gTitle) this.gTitle.parentNode.removeChild(this.gTitle);
    var title = this.gTitle = document.createElementNS(this.SVG_NS, 'text');
    title.setAttribute('x', 475);
    title.setAttribute('y', 10);
    title.setAttribute('style', 'alignment-baseline:hanging;font-size:24;font-weight:bold;text-anchor:middle;');
    title.innerHTML = this.settings.get('title');

    // Append new legend graphic to SVG:
    this.svg.appendChild(this.gTitle);
  },

  // Renders the save-image data:
  renderSave: function() {
    var svg = unescape(encodeURIComponent(this.el.innerHTML));
    $('#save-image').attr('href', 'data:image/svg+xml;base64,'+window.btoa(svg));
  }
});