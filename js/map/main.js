var Mapper = {
  models: {},
  views: {},

  init: function() {
    this.settings = new this.models.Settings();
    this.geos = new this.models.Geographies();
    this.thresholds = new this.models.Thresholds();
    
    this.mapLegendView = new this.views.MapLegendView({
      collection: this.thresholds,
      model: this.settings
    });

    this.mapSettingsView = new this.views.MapSettingsView({
      model: this.settings
    });
    
    this.mapDataView = new this.views.MapDataView({
      collection: this.geos,
      model: this.settings
    });

    this.mapRenderView = new this.views.MapRenderView({
      settings: this.settings,
      thresholds: this.thresholds,
      geos: this.geos
    });

    this.thresholds.reset([
      {value: 50, color: '#6d98a8', label: 'Reads Vox'},
      {value: 100, color: '#fa4b2a', label: 'Reads Verge'}
    ]);

    this.geos.seed(MapData);
  }
};