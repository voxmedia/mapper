(function() {

  // Individual line item views for legend form:
  var EditorStyleFillItemView = Backbone.Epoxy.View.extend({
    el: $('#style-fill-item').html(),

    events: {
      'click .destroy': 'onDestroy'
    },

    onDestroy: function() {
      this.model.collection.remove(this.model);
    }
  });


  // Form view for full legend region:
  Mapper.views.EditorStyleFillView = Backbone.Epoxy.View.extend({
    el: '#editor-style-fill',
    itemView: EditorStyleFillItemView,

    events: {
      'click #style-fill-add': 'onAdd'
    },

    onAdd: function() {
      this.collection.newItem();
    }
  });

}());