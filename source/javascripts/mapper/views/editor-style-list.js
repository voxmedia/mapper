(function() {

  var EditorStyleItemView = Backbone.Epoxy.View.extend({
    el: $('#style-list-item').html(),

    events: {
      'click [data-ui="destroy"]': 'onDestroy',
      'click [data-ui="up"]': 'onUp',
      'click [data-ui="down"]': 'onDown'
    },

    onDestroy: function() {
      this.model.collection.remove(this.model);
    },

    onUp: function() {
      this.model.collection.shiftItem(this.model, -1);
    },

    onDown: function() {
      this.model.collection.shiftItem(this.model, 1);
    }
  });

  // Form view for full legend region:
  Mapper.views.EditorStyleListView = Backbone.Epoxy.View.extend({
    itemView: EditorStyleItemView,

    events: {
      'click [data-ui="add"]': 'onAdd'
    },

    onAdd: function() {
      this.collection.newItem();
    }
  });

}());