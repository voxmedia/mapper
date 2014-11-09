(function() {

  // Thresholds:

  var Threshold = Backbone.Model.extend({
    defaults: {
      color: '#000000',
      inLegend: true,
      label: 'New legend item',
      operator: 'lte',
      value: 0
    }
  });

  Mapper.models.Thresholds = Backbone.Collection.extend({
    model: Threshold,
    comparator: 'value',

    initialize: function() {
      this.listenTo(this, 'change:value', this.sort);
    },

    newItem: function() {
      this.add(Threshold.prototype.defaults);
    }
  });


  // Geographies:

  var Geography = Backbone.Model.extend({
    defaults: {
      label: '',
      shape: '',
      value: 0
    }
  });

  Mapper.models.Geographies = Backbone.Collection.extend({
    model: Geography,
    comparator: 'id',

    seed: function(data) {
      var models = [];

      for (var id in data) {
        if (data.hasOwnProperty(id)) {
          models.push({id: id, label: '', shape: data[id]});
        }
      }

      this.reset(models);
    },

    loadCSV: function(file) {
      var self = this;
      var reader = new FileReader();

      // Handler to parse and populate loaded CSV data:
      reader.onload = function() {
        var pairs = reader.result.split('\n');
        var silent = {silent: true};

        // Loop through all id/value pairs and silently apply to collection:
        for (var i=0; i < pairs.length; i++) {
          var pair = pairs[i].split(',');
          var geo = self.get(pair[0]);
          if (geo) geo.set('value', parseInt(pair[1]), silent);
        }

        // Trigger a single change-value event at the end:
        self.trigger('reset change:value');
      };

      reader.readAsText(file);
    }
  });


  // Settings:

  Mapper.models.Settings = Backbone.Model.extend({
    defaults: {
      blankColor: '#eeeeee',
      heatScale: false
    }
  });

}());