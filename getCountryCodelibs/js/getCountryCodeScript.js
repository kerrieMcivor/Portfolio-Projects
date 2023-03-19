	$('#btnRun').click(function() {

		$.ajax({
			url: "getCountryCodelibs/php/getCountryCode.php",
			type: 'POST',
			dataType: 'json',
			data: {
				lat: $('#selLat').val(),
				lng: $('#selLng').val(),
				lang: $('#selLang').val(),
				rad: $('#sellRad').val(),
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