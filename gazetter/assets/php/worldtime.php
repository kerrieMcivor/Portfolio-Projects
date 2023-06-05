<?php

	ini_set('display_errors', 'On');
	error_reporting(E_ALL);
    $executionStartTime = microtime(true);
    $url='https://api.api-ninjas.com/v1/worldtime?lat='.$_REQUEST['lat'].'&lon='.$_REQUEST['lon'];

    $ch = curl_init();
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($ch, CURLOPT_URL,$url);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'X-API-Key: +M8XLizXojPcr8nifMo38g==xfF7ZitXXsO4B1Vg'
    ]);

	$result=curl_exec($ch);

	curl_close($ch);

	$decode = json_decode($result,true);	

	$output['status']['code'] = "200";
	$output['status']['name'] = "ok";
	$output['status']['description'] = "success";
	$output['status']['returnedIn'] = intval((microtime(true) - $executionStartTime) * 1000) . " ms";
	$output['data'] = $decode;

    header('Content-Type: application/json; charset=UTF-8');

	echo json_encode($output); 

?>