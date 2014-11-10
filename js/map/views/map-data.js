
// Map data form view (with drag-and-drop CSV)

Mapper.views.MapDataView = Backbone.View.extend({
  el: '#map-data-form',
  template: _.template($('#map-data-list-item').html(), {variable: 'd'}),

  initialize: function() {
    this.listenTo(this.collection, 'reset', this.render);
    this.listenTo(this.collection, 'change:value', this.renderRange);
  },

  render: function() {
    var html = '';

    this.collection.each(function(geo) {
      html += this.template(geo.attributes);
    }, this);

    this.$('#map-data-list').html(html);
    this.renderRange();
  },

  renderRange: function() {
    var min = Infinity;
    var max = -Infinity;

    this.collection.each(function(geo) {
      var value = geo.get('value');
      if (!isNaN(value)) {
        min = Math.min(min, value);
        max = Math.max(max, value);
      }
    });

    this.$('#map-data-range').html('<b>Min:</b> '+min+', <b>Max:</b> '+max);
  },

  events: {
    'change input': 'onValue',
    'dragover #map-data-dropzone': 'onZoneOver',
    'dragleave #map-data-dropzone': 'onZoneOut',
    'drop #map-data-dropzone': 'onZoneDrop'
  },

  getDataTransfer: function(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    return evt.originalEvent.dataTransfer || null;
  },

  onZoneOver: function(evt) {
    var dataTransfer = this.getDataTransfer(evt);
    if (dataTransfer) {
      dataTransfer.dropEffect = 'copy';
      this.$('#map-data-dropzone').addClass('pulse');
    }
  },

  onZoneOut: function(evt) {
    this.$('#map-data-dropzone').removeClass('pulse');
  },

  onZoneDrop: function(evt) {
    var dataTransfer = this.getDataTransfer(evt);
    if (dataTransfer && dataTransfer.files.length) {
      this.collection.loadCSV(dataTransfer.files[0]);
      this.onZoneOut();
    }
  },

  onValue: function(evt) {
    var $field = this.$(evt.currentTarget);
    var geo = this.collection.get($field.attr('name'));
    if (geo) geo.set('value', $field.val());
  }
});