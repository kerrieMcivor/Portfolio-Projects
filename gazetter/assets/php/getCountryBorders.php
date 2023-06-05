<?php

	ini_set('display_errors', 'On');
	error_reporting(E_ALL);
    $executionStartTime = microtime(true);
    $countryData = json_decode(file_get_contents("./countryBorders.json"), true);
    $countryBorders = [];

    foreach($countryData['features'] as $feature) {
        $code = $feature["properties"]["iso_a2"];
		$polygon = $feature["geometry"]["coordinates"];
        $countryBorders[$code] = $polygon;
    }


	$output['status']['code'] = "200";
	$output['status']['name'] = "ok";
	$output['status']['description'] = "success";
	$output['status']['returnedIn'] = intval((microtime(true) - $executionStartTime) * 1000) . " ms";
	$output['data'] = $countryBorders;
	
	
	header('Content-Type: application/json; charset=UTF-8');

	echo json_encode($output); 

?>