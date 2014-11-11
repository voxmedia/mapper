Mapper.models.Settings = Backbone.Model.extend({
  defaults: {
    blankColor: '#eeeeee',
    heatClamp: true,
    heatScale: false,
    title: 'My Awesome Map',
    tooltip: 'State {{ id }}: {{ value }}'
  }
});