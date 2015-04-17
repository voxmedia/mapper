Mapper.views.EditorMainView = Backbone.View.extend({
  el: '#editor-main',

  initialize: function() {
    //this.setView('editor-settings');
    this.setView('editor-style');
  },

  setView: function(tab) {
    this.$('a[data-editor-view]')
      .removeClass('active')
      .filter('[data-editor-view="'+tab+'"]')
      .addClass('active');

    this.$('.m-editor-view')
      .hide()
      .filter('#'+tab)
      .show();
  },

  events: {
    'click a[data-editor-view]': 'onTab'
  },

  onTab: function(evt) {
    evt.preventDefault();
    this.setView(this.$(evt.currentTarget).attr('data-editor-view'));
  }
});
