(function() {

  var Fill = Backbone.Model.extend({
    defaults: {
      color: '#000000',
      inLegend: true,
      label: 'New legend item',
      operator: 'lte',
      value: 0
    }
  });

  Mapper.models.Fills = Backbone.Collection.extend({
    model: Fill,
    comparator: 'value',

    initialize: function() {
      this.listenTo(this, 'change:value', this.sort);
    },

    newItem: function() {
      this.add(Fill.prototype.defaults);
    }
  });

}());