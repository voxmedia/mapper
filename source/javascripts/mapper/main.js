var Mapper = {
  models: {},
  views: {},

  init: function() {
    this.settings = new this.models.Settings();
    this.data = new this.models.Data();
    this.fills = new this.models.Styles();
    this.strokes = new this.models.Styles();
    
    var editorMain = new this.views.EditorMainView();

    var editorSettings = new this.views.MapSettingsView({
      model: this.settings
    });

    var editorBaseView = new this.views.EditorStyleBaseView({
      model: this.settings
    });

    var editorFillView = new this.views.EditorStyleFillView({
      collection: this.fills,
      model: this.settings
    });

    var editorStrokeView = new this.views.EditorStyleStrokeView({
      collection: this.strokes,
      model: this.settings
    });
    
    var editorData = new this.views.EditorDataView({
      collection: this.data,
      model: this.settings
    });

    this.mapPreview = new this.views.MapRenderView({
      settings: this.settings,
      fills: this.fills,
      strokes: this.strokes,
      data: this.data
    });

    this.fills.reset([
      {value: 50, color: '#6d98a8', label: 'Reads Vox'},
      {value: 100, color: '#fa4b2a', label: 'Reads Verge'}
    ]);

    window.onbeforeunload = function() {
      //return "You are about to exit this layout.";
    };
  },

  getRenderConfig: function(opts) {
    var config = this.settings.toJSON();
    config.fills = this.fills.toJSON();
    config.strokes = this.strokes.toJSON();
    if (opts && opts.rows) config.rows = this.data.toJSON();
    return config;
  }
};