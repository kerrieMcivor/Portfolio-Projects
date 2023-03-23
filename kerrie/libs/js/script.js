$('#srtm1BtnRun').click(function() {

	$.ajax({
		url: "libs/php/srtm1.php",
		type: 'POST',
		dataType: 'json',
		data: {
			latitude: $('#selectLatitude').val(),
			longitude: $('#selectLongitude').val(),
		},
		success: function(result) {

			console.log(JSON.stringify(result));

			if (result.status.name == "ok") {

				$('#srtm1').html(result['srtm1']);

			}
		
		},
		error: function(jqXHR) {
			console.log(jqXHR)
		}
	}); 

});

$('#srtm3BtnRun').click(function() {

	$.ajax({
		url: "libs/php/srtm3.php",
		type: 'POST',
		dataType: 'json',
		data: {
			latitude: $('#selectLatitude').val(),
			longitude: $('#selectLongitude').val(),
		},
		success: function(result) {

			console.log(JSON.stringify(result));

			if (result.status.name == "ok") {

				$('#srtm3').html(result['srtm3']);

			}
		
		},
		error: function(jqXHR) {
			console.log(jqXHR)
		}
	}); 

});


$('#GTOPO3OBtnRun').click(function() {

	$.ajax({
		url: "libs/php/GTOPO3O.php",
		type: 'POST',
		dataType: 'json',
		data: {
			latitude: $('#selectLatitude').val(),
			longitude: $('#selectLongitude').val(),
		},
		success: function(result) {

			console.log(JSON.stringify(result));

			if (result.status.name == "ok") {

				$('#GTOPO3O').html(result['data']['gtopo30']);

			}
		
		},
		error: function(jqXHR) {
			console.log(jqXHR)
		}
	}); 

});