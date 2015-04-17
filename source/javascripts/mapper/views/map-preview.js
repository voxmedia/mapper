// Map renderer:

Mapper.exporting = {
  canvas: document.createElement("canvas"),
  render: _.debounce(function() {
    this.canvas.width = 1024;
    this.canvas.height = 1000;

    var version = Date.now();
    var svg = document.querySelector('#map-preview svg');
    svg.setAttributeNS(null, 'width', '1024px');

    var xml = new XMLSerializer().serializeToString(svg);
    canvg(this.canvas, xml, { ignoreMouse: true, ignoreAnimation: true });
    svg.setAttributeNS(null, 'width', '100%');

    $('#export-svg').attr({
      href: 'data:image/svg+xml;base64,'+window.btoa(xml),
      download: 'map-'+version+'.svg'
    });

    $('#export-png').attr({
      href: this.canvas.toDataURL(),
      download: 'map-'+version+'.png'
    });

  }, 100)
};

Mapper.views.MapRenderView = Backbone.View.extend({
  el: '#map-preview',

  initialize: function(opts) {
    _.extend(this, opts);
    this.$el.find('#map-renderer').attr('id', this.settings.get('el'));
    this.renderer = new MapRenderer();
    this.renderer.onData = _.bind(function(data) {
      data = _.each(data, function(d) { d.value = '0'; });
      this.data.resetData(data);
    }, this);

    this.listenTo(this.data, 'reset change', this.render);
    this.listenTo(this.fills, 'add remove change sort', this.render);
    this.listenTo(this.strokes, 'add remove change sort', this.render);
    this.listenTo(this.settings, 'change', this.render);
    this.render();
  },

  render: _.debounce(function() {
    this.renderer.init(Mapper.getRenderConfig({rows: true}));
    Mapper.exporting.render();
  }, 10)
});