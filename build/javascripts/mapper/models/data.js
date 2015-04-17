(function() {
  
  // DataFormatter:
  // This guy knows how all the data works together.
  // A data reader is pre-configured with the all fields its going to work with,
  // then presented with a geography, it reads out its data configuration...
  // Kind of an IOC on object-orientation, where the process is specialized rather than the object.
  var DataFormatter = {
    val: function(value) {
      switch (this.dataType) {
        case 'number': return value === '' ? null : Number(value);
        case 'string': return String(value);
      }
    },

    // Selects a plotted cohort color for a value:
    // Cohorts use value fills and editorially defined comparison operators.
    /*getCohortData: function(value) {
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
      this.defaultField = styleGroup+'_'+field;

      // Create local aliases to model data:
      this.settings = Mapper.settings;
      this.styles = Mapper[styleGroup+'s'];

      // Get the data value in question from the geography:
      var dataField = this.settings.get(styleGroup+'_column');
      var value = dat.get(dataField);

      // Lookup the requested field's dataType:
      this.dataType = this.settings.columnType(dataField);

      // Render heat scale (when enabled) for color settings:
      if (field === 'color' && this.dataType === 'number' && this.settings.get('heat_scale')) {
        return this.getHeatColor(value);
      }

      // Otherwise, use cohort picking:
      return this.getCohortData(value);
    }*/
  };

  // Individual Datum model:
  // will be extended with shape data, and any CSV imports:
  // provides an object-oriented API for accessing its own style data.
  var Datum = Backbone.Model.extend({
    defaults: {
      id: '',
      value: 0
    }
  });

  // Data collection:
  // manages a collection of geographies,
  // and manages the definition of their field data types.
  Mapper.models.Data = Backbone.Collection.extend({
    model: Datum,
    comparator: 'id',
    _sort: {},

    // Custom method for column-type aware sorting:
    sort: function() {
      var self = this;
      DataFormatter.dataType = Mapper.settings.columnType(this.comparator);

      this.models.sort(function(a, b) {
        var va = DataFormatter.val(a.get(self.comparator));
        var vb = DataFormatter.val(b.get(self.comparator));
        var diff;

        // Primary sort on column value:
        if (DataFormatter.dataType === 'string') {
          diff = va.localeCompare(vb);
        } else {
          diff = va - vb;
        }

        // Secondary sort on id:
        if (diff === 0) {
          return a.id.localeCompare(b.id);
        }

        return diff;
      });

      this.trigger('sort');
    },

    loadCSV: function(file) {
      var reader = new FileReader();

      reader.onload = _.bind(function() {
        this.resetData(d3.csv.parse(reader.result));
      }, this);

      reader.readAsText(file);
    },

    resetData: function(data) {
      this._datatypes = {};
      this.reset(data, {silent: true});
      Mapper.settings.set('columns', this.getColumns());
      this.trigger('reset change');
    },

    // Gets an object with all columns and their data types.
    // Returns as {col1:'string', col2:'number'}
    getColumns: function() {
      // Function used to detect known data types:
      // We're deliberately returning null if we can't make a good assessment of a value.
      function detectType(s) {
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
      }

      // Return empty if there is no data:
      if (!this.length) return {};

      // Clone first row for the column set:
      var columns = this.at(0).toJSON();

      // Loop through all columns, and detect a datatype for each.
      // We'll keep looking through rows until we find an assessable value for each column.
      // Columns with no assessable values will be left as strings.
      for (var column in columns) {
        if (columns.hasOwnProperty(column)) {
          var type;

          for (var i = 0; i < this.length; i++) {
            type = detectType(this.at(i).attributes[column]);
            if (type) break;
          }

          columns[column] = type || 'string';
        }
      }

      return columns;
    }
  });

}());
