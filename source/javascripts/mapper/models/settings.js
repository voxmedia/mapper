Mapper.models.Settings = Backbone.Model.extend({
  defaults: {
    fillColor: '#eeeeee',
    heatClamp: true,
    heatScale: false,
    title: 'My Awesome Map',
    tooltip: 'State {{ id }}: {{ value }}',
    strokeColor: 'rgba(255,255,255,0.25)'
  }
});