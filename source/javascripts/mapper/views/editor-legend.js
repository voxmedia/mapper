(function() {

  // Individual line item views for legend form:
  var LegendFormItemView = Backbone.Epoxy.View.extend({
    el: $('#editor-legend-item').html(),

    events: {
      'click .destroy': 'onDestroy'
    },

    onDestroy: function() {
      this.model.collection.remove(this.model);
    }
  });


  // Form view for full legend region:
  Mapper.views.MapLegendView = Backbone.Epoxy.View.extend({
    el: '#editor-legend',
    itemView: LegendFormItemView,

    events: {
      'click #editor-legend-add': 'onAddItem'
    },

    onAddItem: function() {
      this.collection.newItem();
    }
  });

}());