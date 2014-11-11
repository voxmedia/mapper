(function() {

  // Individual line item views for legend form:
  var EditorStyleStrokeItemView = Backbone.Epoxy.View.extend({
    el: $('#style-stroke-item').html(),

    events: {
      'click .destroy': 'onDestroy'
    },

    onDestroy: function() {
      this.model.collection.remove(this.model);
    }
  });


  // Form view for full legend region:
  Mapper.views.EditorStyleStrokeView = Backbone.Epoxy.View.extend({
    el: '#editor-style-stroke',
    itemView: EditorStyleStrokeItemView,

    events: {
      'click #style-stroke-add': 'onAdd'
    },

    onAdd: function() {
      this.collection.newItem();
    }
  });

}());