Mapper.models.Settings = Backbone.Model.extend({
  defaults: {
    fields: ['id', 'value'],
    fillColor: '#eeeeee',
    fillField: 'value',
    heatClamp: true,
    heatScale: false,
    title: 'My Awesome Map',
    tooltip: 'State {{ id }}: {{ value }}',
    strokeColor: 'rgba(255,255,255,0.25)',
    strokeSize: 1,
    strokeField: 'value'
  }
});