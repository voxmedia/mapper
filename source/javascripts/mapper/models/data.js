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
    }
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