
// Map data form view (with drag-and-drop CSV)

Mapper.views.MapDataView

Mapper.views.MapDataView = Backbone.View.extend({
  el: '#editor-data',

  initialize: function() {
    this.listenTo(this.collection, 'reset', this.render);
    this.listenTo(this.collection, 'change:value', this.renderRange);
  },

  render: function() {
    var fields = this.collection.getFields();
    var head = '<th>id</th>';
    var body = '';

    _.each(fields, function(field) {
      head += '<th>'+field+'</th>';
    });

    this.collection.each(function(geo) {
      var row = ['<tr><td>',geo.id.toUpperCase(),'</td>'];

      for (var i=0; i < fields.length; i++) {
        row.push('<td><input type="text" name="',fields[i],'" value="',geo.get(fields[i]),'" data-id="'+geo.id+'"></td>');
      }
      
      row.push('</tr>');
      body += row.join('');
    }, this);

    this.$('thead').html('<tr>'+head+'</tr>');
    this.$('tbody').html(body);
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

    this.$('#data-range').html('<b>Value Min:</b> '+min+', <b>Max:</b> '+max);
  },

  events: {
    'change input': 'onValue',
    'dragover #data-dropzone': 'onZoneOver',
    'dragleave #data-dropzone': 'onZoneOut',
    'drop #data-dropzone': 'onZoneDrop'
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
      this.$('#data-dropzone').addClass('pulse');
    }
  },

  onZoneOut: function(evt) {
    this.$('#data-dropzone').removeClass('pulse');
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
    var geo = this.collection.get($field.attr('data-id'));
    if (geo) geo.set($field.attr('name'), $field.val());
  }
});