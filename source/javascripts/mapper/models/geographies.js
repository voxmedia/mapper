(function() {
  
  // GeoStyleMapper:
  // This guy knows how all the data works together.
  // A data reader is pre-configured with the all fields its going to work with,
  // then presented with a geography, it reads out its data configuration...
  // Kind of an IOC on object-orientation, where the process is specialized rather than the object.
  var GeoStyleMapper = {
    // Selects a plotted cohort color for a value:
    // Cohorts use value fills and editorially defined comparison operators.
    getCohortData: function(value) {
      var cohort = this.collection.find(function(t) {
        var v = t.get('value');
        var c = t.get('operator');
        if (typeof v == 'number') {
          // Numeric comparisons:
          if (c === 'lt' && value < v) return true;
          if (c === 'lte' && value <= v) return true;
          if (c === 'eq' && value === v) return true;
          if (c === 'gte' && value >= v) return true;
          if (c === 'gt' && value > v) return true;
        } else {
          // Loose-typed value match:
          if (value == v) return true;
        }
      }, this);

      return cohort ? cohort.get(this.styleField) : this.settings.get(this.defaultField);
    },

    getRGB: function(c) {
      if (c.length <= 7) {
        // Parse out hex "#000000" into [0, 0, 0]
        c = c.replace('#', '');
        return [
          parseInt(c.substr(0, 2), 16),
          parseInt(c.substr(2, 2), 16),
          parseInt(c.substr(4, 2), 16)
        ];
      }

      // Parse out "rgb(0, 0, 0);" into [0, 0, 0]
      return _.map(c.match(/\d+/g), function(d) {
        return +d;
      });
    },

    // Gets the interpolated heat color for a value:
    // Heat interpolation calculates the midpoint color between two values.
    getHeatColor: function(value) {
      var low = this.collection.at(0);
      var high = this.collection.at(1);

      // Special-case out the color selection for out-of-range values:
      if (!low || !high || value === '') return this.settings.get(this.defaultField);

      // Force numeric types:
      value = +value;
      var lv = +low.get('value');
      var hv = +high.get('value');

      // Cap ends of range:
      if (value < lv) return low.get('color');
      if (value > hv) return high.get('color');
      
      // Calculate midpoint percentage and A/B colors:
      var perc = (value - lv) / (hv - lv);
      var a = this.getRGB(low.get('color'));
      var b = this.getRGB(high.get('color'));

      // Interpolate midpoints:
      var cr = Math.round(a[0] + (b[0] - a[0]) * perc);
      var cg = Math.round(a[1] + (b[1] - a[1]) * perc);
      var cb = Math.round(a[2] + (b[2] - a[2]) * perc);

      return 'rgb('+ cr +','+ cg +','+ cb +')';
    },

    map: function(geo, styleGroup, field) {
      // Store the name of the base field this will pick from:
      this.styleField = field;

      // Create the field names that this will reference out of settings:
      // Default settings value: desolves as "fillColor" or "strokeSize"
      this.defaultField = styleGroup+field.replace(/^./, function(m) { return m.toUpperCase(); });

      // Create local aliases to model data:
      this.settings = Mapper.settings;
      this.collection = Mapper[styleGroup+'s'];

      // Get the data value in question from the geography:
      var dataField = this.settings.get(styleGroup+'Field');
      var value = geo.get(dataField);

      // Lookup the requested field's dataType:
      this.dataType = geo.collection.getFieldType(dataField);

      // Render heat scale (when enabled) for color settings:
      if (field === 'color' && this.dataType === 'number' && this.settings.get('heatScale')) {
        return this.getHeatColor(value);
      }

      // Otherwise, use cohort picking:
      return this.getCohortData(value);
    }
  };

  // Individual Geography model:
  // will be extended with shape data, and any CSV imports:
  // provides an object-oriented API for accessing its own style data.
  var Geography = Backbone.Model.extend({
    defaults: {
      id: '',
      value: 0
    },

    getFillColor: function() {
      return GeoStyleMapper.map(this, 'fill', 'color');
    },

    getStrokeColor: function() {
      return GeoStyleMapper.map(this, 'stroke', 'color');
    },

    getStrokeSize: function() {
      return GeoStyleMapper.map(this, 'stroke', 'size');
    }
  });

  // Geographies collection:
  // manages a collection of geographies,
  // and manages the definition of their field data types.
  Mapper.models.Geographies = Backbone.Collection.extend({
    model: Geography,
    comparator: 'id',
    _datatypes: {},

    seed: function(data) {
      var models = [];

      for (var id in data) {
        if (data.hasOwnProperty(id)) {
          models.push({id: id, shape: data[id]});
        }
      }

      this._datatypes = {};
      this.reset(models);
    },

    loadCSV: function(file) {
      Papa.parse(file, {
        header: true,
        complete: _.bind(function(result) {
          if (result.errors.length) {
            return alert('An error occured while parsing this CSV.');
          }

          this._datatypes = {};
          Mapper.settings.set('fields', result.meta.fields);
          this.set(result.data, {silent: true});
          this.trigger('reset change');
        }, this)
      });
    },

    // Gets a datatype for the specified field name:
    getFieldType: function(fieldName) {
      // Look for cached field type:
      for (var key in this._datatypes) {
        if (fieldName === key) return this._datatypes[key];
      }

      // If no cached datatype was found,
      // then we'll need to look up the type and commit it to the cache:
      var dataType;

      // Look through data set until a conclusive value is found:
      for (var i = 0; i < this.length; i++) {
        dataType = DataType.detect(this.at(i).attributes[fieldName]);
        if (dataType !== null) break;
      }

      // Set inconclusive types to strings:
      if (dataType === null) dataType = 'string';
      return this.setFieldType(fieldName, dataType, {silent: true});
    },

    // Sets a datatype for the specified field name:
    // field types are cached for quick reference.
    setFieldType: function(fieldName, dataType, options) {
      this._datatypes[fieldName] = dataType;
      if (!options || !options.silent) this.trigger('change:value');
      return dataType;
    }
  });

}());