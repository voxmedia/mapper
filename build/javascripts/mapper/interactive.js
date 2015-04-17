(function() {
  var $tooltip = $('<div class="map-tooltip"></div>').hide().appendTo('body');
  var content = null;

  $('.map-view').on('mousemove touchdown', function(evt) {
    var data = evt.target.getAttributeNS(null, 'data-tooltip');

    if (data && data !== content) {
      $tooltip.html(data).show();
      content = data;
    } else if (content && !data) {
      $tooltip.hide();
      content = null;
    }

    if (content) {
      var w = $tooltip.outerWidth();
      var h = $tooltip.outerHeight();
      $tooltip.css({
        left: (evt.pageX-w/2) +'px',
        top: (evt.pageY-h-20)+'px'
      });
    }
  });
}());
