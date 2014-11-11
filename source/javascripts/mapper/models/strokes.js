(function() {

  var Stroke = Backbone.Model.extend({
    defaults: {
      color: '#ff0000',
      label: 'New legend item',
      operator: 'lte',
      size: 3,
      value: 0
    }
  });

  Mapper.models.Strokes = Backbone.Collection.extend({
    model: Stroke,
    comparator: 'value',

    initialize: function() {
      this.listenTo(this, 'change:value', this.sort);
    },

    newItem: function() {
      this.add(Stroke.prototype.defaults);
    }
  });

}());
