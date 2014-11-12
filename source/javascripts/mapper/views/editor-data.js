
// Map data form view (with drag-and-drop CSV)
Mapper.views.MapDataView = Backbone.View.extend({
  el: '#editor-data',

  initialize: function() {
    this.listenTo(this.collection, 'reset', this.render);
    this.listenTo(this.collection, 'change', this.renderRange);
  },

  // Create function to build data-type select menu:
  // (kinda gross, I know...)
  renderTypeSelect: function(fieldName) {
    var opts = ['<select name="',fieldName,'">'];
    var fieldType = this.collection.getFieldType(fieldName);

    // Build an option for each datatype:
    _.each(['number', 'string', 'boolean'], function(type) {
      opts.push('<option value="',type,'"');
      if (type === fieldType) opts.push(' selected="selected"');
      opts.push('>',type,'</option>');
    });

    opts.push('</select>');
    return opts.join('');
  },

  // Renders all data into the grid:
  render: function() {
    var fields = _.without(this.model.get('fields'), 'id');
    var head = '<th>id</th>';
    var body = '';
    var self = this;

    // Build table header row:
    _.each(fields, function(field) {
      head += '<th>'+ field + this.renderTypeSelect(field) +'</th>';
    }, this);

    // Build all table body rows:
    this.collection.each(function(geo) {
      var row = ['<tr><td>',geo.id.toUpperCase(),'</td>'];

      for (var i=0; i < fields.length; i++) {
        row.push('<td><input type="text" name="',fields[i],'" value="',geo.get(fields[i]),'" data-id="'+geo.id+'"></td>');
      }
      
      row.push('</tr>');
      body += row.join('');
    }, this);

    // Populate table head and body:
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
    'change select': 'onDataType',
    'dragover #data-dropzone': 'onZoneOver',
    'dragleave #data-dropzone': 'onZoneOut',
    'drop #data-dropzone': 'onZoneDrop'
  },

  // Collection data-transfer settings from event object:
  getDataTransfer: function(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    return evt.originalEvent.dataTransfer || null;
  },

  // Triggered when dragging file over the CSV zone:
  onZoneOver: function(evt) {
    var dataTransfer = this.getDataTransfer(evt);
    if (dataTransfer) {
      dataTransfer.dropEffect = 'copy';
      this.$('#data-dropzone').addClass('pulse');
    }
  },

  // Triggered when dragging a file out of CSV zone:
  onZoneOut: function(evt) {
    this.$('#data-dropzone').removeClass('pulse');
  },

  // Triggered when dropping a file on the CSV zone:
  onZoneDrop: function(evt) {
    var dataTransfer = this.getDataTransfer(evt);
    if (dataTransfer && dataTransfer.files.length) {
      this.collection.loadCSV(dataTransfer.files[0]);
      this.onZoneOut();
    }
  },

  // Sets a value for a record field:
  onValue: function(evt) {
    var $field = this.$(evt.currentTarget);
    var geo = this.collection.get($field.attr('data-id'));
    if (geo) geo.set($field.attr('name'), $field.val());
  },

  // Sets the datatype associated with a column:
  onDataType: function(evt) {
    var $field = this.$(evt.currentTarget);
    this.collection.setFieldType($field.attr('name'), $field.val());
  }
});