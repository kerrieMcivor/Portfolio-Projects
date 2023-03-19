	$('#btnRun').click(function() {

		$.ajax({
			url: "Neighbourhoodlibs/php/neighbourhood.php",
			type: 'POST',
			dataType: 'json',
			data: {
				lat: $('#selLat').val(),
				lng: $('#selLng').val(),
			},
			success: function(result) {

				console.log(JSON.stringify(result));

				if (result.status.name == "ok") {

					$('#results').html(result['data'][0]);

				}
			
			},
			error: function(jqXHR, textStatus, errorThrown) {
				"Something's gone wrong";
			}
		}); 
	
	});