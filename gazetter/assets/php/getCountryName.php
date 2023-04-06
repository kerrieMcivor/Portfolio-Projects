<?php

	ini_set('display_errors', 'On');
	error_reporting(E_ALL);
    $executionStartTime = microtime(true);
    $countryData = json_decode(file_get_contents("./countryBorders.json"), true);
    $countryInfo;


    foreach($countryData['features'] as $feature) {
        $name = $feature["properties"]["name"];
		$code = $feature["properties"]["iso_a2"];
        $countryInfo[$name] = $code;
    }

	$output['status']['code'] = "200";
	$output['status']['name'] = "ok";
	$output['status']['description'] = "success";
	$output['status']['returnedIn'] = intval((microtime(true) - $executionStartTime) * 1000) . " ms";
	$output['data'] = $countryInfo;
	
	
	header('Content-Type: application/json; charset=UTF-8');

	echo json_encode($output); 

?>
