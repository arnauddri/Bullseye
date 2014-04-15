$( document ).ready(function() {
	var path = window.location;

	var queue_status = path.pathname.substr(path.pathname.lastIndexOf('/') + 1);
	var queue_name = path.pathname.substr(0,path.pathname.lastIndexOf(queue_status) - 1);
	queue_name = queue_name.substr(queue_name.lastIndexOf('/') + 1);

	var limit = parseInt(path.href.substr(path.href.lastIndexOf('=') + 1)) + 100;
	limit = (isNaN(limit)) ? 100 : limit;
	
	$('.load-more a').attr('href', path.pathname + '?limit=' + limit);

	$('#menu li a').removeClass('active');
	$('.title').removeClass('active');

	$('[data-queue=' + queue_name + ']').next().find('.' + queue_status + ' a').addClass('active');
	$('[data-queue=' + queue_name + ']').addClass('active');

	$('.title').click(function(){
		if ($(this).next().is(':visible')){
			$(this).find('#arrow').css('transform','rotate(180deg)');
		}else{
			$(this).find('#arrow').css('transform','rotate(0deg)');
		}
		$(this).next().toggle();
	});
});