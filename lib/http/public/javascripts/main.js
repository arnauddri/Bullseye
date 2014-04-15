$( document ).ready(function() {
	var path = window.location.pathname;

	var queue_status = path.substr(path.lastIndexOf('/') + 1);
	var queue_name = path.substr(0,path.lastIndexOf(queue_status) - 1);
	queue_name = queue_name.substr(queue_name.lastIndexOf('/') + 1);

	console.log(queue_name);

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
	})

});