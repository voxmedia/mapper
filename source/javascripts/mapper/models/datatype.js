var DataType = {
  detect: (function() {

    var common_strings = {
      'TRUE': 'boolean',
      'true': 'boolean',
      'FALSE': 'boolean',
      'false': 'boolean',
      'NaN': 'number',
      'NULL': null,
      'null': null,
      '': null
    };

    return function(s) {
      var key;

      // Try to match against keywords:
      for (key in common_strings) {
        if (s === key) return common_strings[key];
      }

      // Try to cast it to a number:
      if ((key = +s) == key) return 'number';

      // Check for string with length:
      if (String(s).length) return 'string';

      // Give up:
      return null;
    };

  }()),

  cast: function(value, dataType) {
    switch (dataType) {
      case 'number': return +value;
      case 'string': return value;
      case 'boolean': return (value && value.toLowerCase() !== 'false')
    }
  }
};