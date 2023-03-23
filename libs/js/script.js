	$('#elevationBtnRun').click(function() {

		$.ajax({
			url: "libs/php/elevation.php",
			type: 'POST',
			dataType: 'json',
			data: {
				lat: $('#selLat').val(),
				lng: $('#selLng').val(),
			},
			success: function(result) {

				console.log(JSON.stringify(result));

				if (result.status.name == "ok") {

					$('#results').html(result['data']['elevation']);
				}
			
			},
			error: function(jqXHR, textStatus, errorThrown) {
				console.log(jqXHR, textStatus, errorThrown);
			}
		}); 
	
	});

	$('#neighbourhoodBtnRun').click(function() {

		$.ajax({
			url: "libs/php/neighbourhood.php",
			type: 'POST',
			dataType: 'json',
			data: {
				lat: $('#selLat').val(),
				lng: $('#selLng').val(),
			},
			success: function(result) {

				console.log(JSON.stringify(result));

				if (result.status.name == "ok") {

					$('#results').html(result['data']['neighbourhood']);

				}
			
			},
			error: function(jqXHR, textStatus, errorThrown) {
				console.log(jqXHR, textStatus, errorThrown);
			}
		}); 
	});

	$('#oeanBtnRun').click(function() {

		$.ajax({
			url: "libs/php/ocean.php",
			type: 'POST',
			dataType: 'json',
			data: {
				lat: $('#selLat').val(),
				lng: $('#selLng').val(),
			},
			success: function(result) {

				console.log(result);

				if (result.status.name == "ok") {

					$('#results').html(result['data']['ocean']);

				}
			
			}, 
			error: function(jqXHR, textStatus, errorThrown) {
				console.log(jqXHR, textStatus, errorThrown);
			}
		}); 
	
	});