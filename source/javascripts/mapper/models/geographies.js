(function() {

  var Geography = Backbone.Model.extend({
    defaults: {
      id: '',
      value: 0
    }
  });

  Mapper.models.Geographies = Backbone.Collection.extend({
    model: Geography,
    comparator: 'id',

    getFields: function() {
      return _.without(this.fields || _.keys(Geography.prototype.defaults), 'id');
    },

    seed: function(data) {
      var models = [];

      for (var id in data) {
        if (data.hasOwnProperty(id)) {
          models.push({id: id, shape: data[id]});
        }
      }

      this.reset(models);
    },

    loadCSV: function(file) {
      Papa.parse(file, {
        dynamicTyping: true,
        header: true,
        complete: _.bind(function(result) {
          if (result.errors.length) {
            return alert(result.errors[0]);
          }

          this.fields = result.meta.fields;
          this.set(result.data, {silent: true});
          this.trigger('reset change:value');
        }, this)
      });
    }
  });

}());