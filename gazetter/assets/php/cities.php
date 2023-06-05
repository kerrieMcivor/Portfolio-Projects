<?php

ini_set('display_errors', 'On');
	error_reporting(E_ALL);
    $executionStartTime = microtime(true);
	$url ="https://wft-geo-db.p.rapidapi.com/v1/geo/adminDivisions?countryIds=".$_REQUEST['countryCode']."&limit=10&sort=-population";

    $ch = curl_init();
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($ch, CURLOPT_URL,$url);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "X-RapidAPI-Host: wft-geo-db.p.rapidapi.com",
		"X-RapidAPI-Key: b0b6fd23e7msh1c298d942139507p1be034jsn6bbebb61879d"
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