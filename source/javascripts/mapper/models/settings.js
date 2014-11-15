Mapper.models.Settings = Backbone.Epoxy.Model.extend({
  defaults: {
    el: 'mapper-'+Date.now(),
    columns: {id: 'string', value: 'number'},
    background_color: '#eeeeee',
    fill_color: '#dddddd',
    fill_column: 'value',
    heat_clamp: true,
    heat_scale: false,
    type: 'us-state',
    title: 'My Awesome Map',
    tooltip: 'State {{ id }}: {{ value }}',
    stroke_color: 'rgba(255,255,255,0.25)',
    stroke_size: 1,
    stroke_column: 'value'
  },

  computeds: {
    // Computed attributes are virtualized model properties provided by Epoxy.
    // Specific data formats can be constructed and bound to without formally being stored on the model.
    columnNames: function() {
      return _.keys(this.get('columns'));
    }
  },

  // Gets/Sets column types:
  // Will trigger a "change:columns" when a type is set.
  columnType: function(column, type) {
    if (type) this.modifyObject('columns', column, type);
    return this.get('columns')[column];
  }
});