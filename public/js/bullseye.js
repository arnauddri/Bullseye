$(document).ready(function() {
  $('.title').click(function(){
    if ($(this).next().is(':visible')) {
      $(this).find('#arrow').css('transform','rotate(180deg)');
    } else {
      $(this).find('#arrow').css('transform','rotate(0deg)');
    }

    $(this).next().toggle();
  });

  $('a[data-post-url]').click(function (e) {
    e.preventDefault();

    var url = $(this).data('postUrl');

    $.post(url).success(function () {
      location.reload();
    });
  });

  $('a[data-delete-url]').click(function (e) {
    e.preventDefault();

    var url = $(this).data('deleteUrl');

    $.ajax(url, {method: 'DELETE'}).success(function () {
      location.reload();
    });
  });
});