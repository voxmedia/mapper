(function() {

  // Individual line item views for legend form:
  var LegendFormItemView = Backbone.Epoxy.View.extend({
    el: $('#legend-form-item-view').html(),

    events: {
      'click .destroy': 'onDestroy'
    },

    onDestroy: function() {
      this.model.collection.remove(this.model);
    }
  });


  // Form view for full legend region:
  Mapper.views.MapLegendView = Backbone.Epoxy.View.extend({
    el: '#map-legend-form',
    itemView: LegendFormItemView,

    events: {
      'click #legend-form-add': 'onAddItem'
    },

    onAddItem: function() {
      this.collection.newItem();
    }
  });

}());