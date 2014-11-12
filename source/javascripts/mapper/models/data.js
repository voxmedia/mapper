(function() {
  
  // DataStyleMapper:
  // This guy knows how all the data works together.
  // A data reader is pre-configured with the all fields its going to work with,
  // then presented with a geography, it reads out its data configuration...
  // Kind of an IOC on object-orientation, where the process is specialized rather than the object.
  var DataStyleMapper = {
    val: function(value) {
      switch (this.dataType) {
        case 'number': return value === '' ? null : Number(value);
        case 'string': return String(value);
      }
    },

    // Selects a plotted cohort color for a value:
    // Cohorts use value fills and editorially defined comparison operators.
    getCohortData: function(value) {
      // Parse the data value:
      value = this.val(value);

      // IMPORTANT: if a field specifically evals as NULL, then skip it.
      // This differentiates between no-data, and falsey values.
      if (value !== null) {
        // If we got a valid value, then proceed to match a cohort:
        var cohort = this.styles.find(function(t) {
          var v = this.val(t.get('value'));
          var c = t.get('operator');
          if (c === 'lt' && value < v) return true;
          if (c === 'lte' && value <= v) return true;
          if (c === 'eq' && value === v) return true;
          if (c === 'gte' && value >= v) return true;
          if (c === 'gt' && value > v) return true;
        }, this);
      }

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
      var low = this.styles.at(0);
      var high = this.styles.at(1);

      // Special-case out the color selection for out-of-range values:
      if (!low || !high || value === '') return this.settings.get(this.defaultField);

      // Force numeric types:
      value = this.val(value);
      var lv = this.val(low.get('value'));
      var hv = this.val(high.get('value'));

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

      return ['rgb(',cr,',',cg,',',cb,')'].join('');
    },

    map: function(dat, styleGroup, field) {
      // Store the name of the base field this will pick from:
      this.styleField = field;

      // Create the field names that this will reference out of settings:
      // Default settings value: desolves as "fillColor" or "strokeSize"
      this.defaultField = styleGroup+field.replace(/^./, function(m) { return m.toUpperCase(); });

      // Create local aliases to model data:
      this.settings = Mapper.settings;
      this.styles = Mapper[styleGroup+'s'];

      // Get the data value in question from the geography:
      var dataField = this.settings.get(styleGroup+'Field');
      var value = dat.get(dataField);

      // Lookup the requested field's dataType:
      this.dataType = dat.collection.getFieldType(dataField);

      // Render heat scale (when enabled) for color settings:
      if (field === 'color' && this.dataType === 'number' && this.settings.get('heatScale')) {
        return this.getHeatColor(value);
      }

      // Otherwise, use cohort picking:
      return this.getCohortData(value);
    }
  };

  // Individual Datum model:
  // will be extended with shape data, and any CSV imports:
  // provides an object-oriented API for accessing its own style data.
  var Datum = Backbone.Model.extend({
    defaults: {
      id: '',
      value: 0
    },

    getFillColor: function() {
      return DataStyleMapper.map(this, 'fill', 'color');
    },

    getStrokeColor: function() {
      return DataStyleMapper.map(this, 'stroke', 'color');
    },

    getStrokeSize: function() {
      return DataStyleMapper.map(this, 'stroke', 'size');
    }
  });

  // Data collection:
  // manages a collection of geographies,
  // and manages the definition of their field data types.
  Mapper.models.Data = Backbone.Collection.extend({
    model: Datum,
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

    detectType: function(s) {
      var key;

      // Check for un-determinable string values:
      if (typeof s === 'string') {
        if (s === '' || s.toLowerCase() === 'null') return null;
      }

      // Try to cast it to a number:
      if ((key = +s) == key) return 'number';

      // Check for string with length:
      if (String(s).length) return 'string';

      // Give up:
      return null;
    },

    // Gets a datatype for the specified field name:
    getFieldType: function(fieldName) {
      // Look for cached field type:
      var dataType = this._datatypes[fieldName];
      if (dataType) return dataType;

      // If no cached datatype was found,
      // then we'll need to look up the type and commit it to the cache:

      // Look through data set until a conclusive value is found:
      for (var i = 0; i < this.length; i++) {
        dataType = this.detectType(this.at(i).attributes[fieldName]);
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
      if (!options || !options.silent) this.trigger('change');
      return dataType;
    }
  });

}());