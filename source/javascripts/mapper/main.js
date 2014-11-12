var Mapper = {
  models: {},
  views: {},

  init: function() {
    this.settings = new this.models.Settings();
    this.geos = new this.models.Geographies();
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
    
    var editorData = new this.views.MapDataView({
      collection: this.geos,
      model: this.settings
    });

    this.mapPreview = new this.views.MapRenderView({
      settings: this.settings,
      fills: this.fills,
      strokes: this.strokes,
      geos: this.geos
    });

    this.fills.reset([
      {value: 50, color: '#6d98a8', label: 'Reads Vox'},
      {value: 100, color: '#fa4b2a', label: 'Reads Verge'}
    ]);

    this.geos.seed(MapData);
  }
};