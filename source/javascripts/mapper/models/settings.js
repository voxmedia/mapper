Mapper.models.Settings = Backbone.Epoxy.Model.extend({
  defaults: {
    el: 'mapper-'+Date.now(),
    columns: {id: 'string', value: 'number'},
    //csv: 'data/states.csv',
    background_color: '#eeeeee',
    fill_color: '#dddddd',
    fill_column: 'value',
    font_color: 'black',
    heat_clamp: true,
    heat_scale: false,
    height: 500,
    theme: 'light',
    type: 'world',
    tooltip: '<%= name %>: <%= value %>',
    stroke_color: 'rgba(255,255,255,0.25)',
    stroke_column: 'value',
    stroke_size: 1,
    header: 'My Awesome Map',
    header_font: '700 35px "Roboto", Helvetica',
    subheader: 'Subheading',
    subheader_font: '15px "Roboto", Helvetica',
    legend_font: 'bold 14px "Roboto", Helvetica',
    width: 960
  },

  themes: [
    {
      theme: 'light',
      background_color: '#e9e7e8',
      font_color: 'black'
    },
    {
      theme: 'dark',
      background_color: '#63676a',
      font_color: 'white'
    }
  ],

  initialize: function() {
    this.listenTo(this, 'change:theme', this.setTheme);
    this.setTheme();
  },

  setTheme: function() {
    // Finds selected theme definition, and sets its attributes to the model:
    this.set(_.findWhere(this.themes, {theme: this.get('theme')}) || {});
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