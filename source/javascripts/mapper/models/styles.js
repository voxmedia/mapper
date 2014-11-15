(function() {

  var Style = Backbone.Model.extend({
    defaults: {
      color: '#000000',
      inLegend: true,
      label: 'New legend item',
      operator: 'lte',
      size: 3,
      type: 'fill',
      value: 0
    }
  });

  Mapper.models.Styles = Backbone.Collection.extend({
    model: Style,
    comparator: 'value',

    initialize: function() {
      this.listenTo(this, 'change:value', this.sort);
    },

    newItem: function(opts) {
      this.add(opts || {});
    }
  });

}());