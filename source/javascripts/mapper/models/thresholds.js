(function() {

  var Threshold = Backbone.Model.extend({
    defaults: {
      color: '#000000',
      inLegend: true,
      label: 'New legend item',
      operator: 'lte',
      value: 0
    }
  });

  Mapper.models.Thresholds = Backbone.Collection.extend({
    model: Threshold,
    comparator: 'value',

    initialize: function() {
      this.listenTo(this, 'change:value', this.sort);
    },

    newItem: function() {
      this.add(Threshold.prototype.defaults);
    }
  });

}());