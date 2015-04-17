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

    // Shifts an item order by the specified offset:
    shiftItem: function(model, dir) {
      var at = this.indexOf(model);
      if (at + dir >= 0 && at + dir < this.length) {
        this.models.splice(at, 1);
        this.models.splice(at+dir, 0, model);
        this.trigger('sort');
      }
    }
  });

}());
