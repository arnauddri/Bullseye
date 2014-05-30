$(document).ready(function() {
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