$(document).ready(function() {

  $('a[data-post-url]').click(function (e) {
    e.preventDefault();

    var url = $(this).data('post-url');

    $.post(url).success(function () {
      location.reload();
    });
  });

  $('a[data-delete-url]').click(function (e) {
    e.preventDefault();

    var url = $(this).data('delete-url');

    $.ajax(url, {method: 'DELETE'}).success(function () {
      location.reload();
    });
  });
});