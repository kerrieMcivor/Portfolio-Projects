<?php
    $latitude = $_POST['latitude'];
    $longitude = $_POST['longitude'];
    
        $url = "https://world-time-by-api-ninjas.p.rapidapi.com/v1/worldtime";

        $data = array(
            'lat' => $latitude,
            'lon' => $longitude
        );

        $headers = array(
            'X-RapidAPI-Key: b0b6fd23e7msh1c298d942139507p1be034jsn6bbebb61879d',
            'X-RapidAPI-Host: world-time-by-api-ninjas.p.rapidapi.com'
        );

        $curl = curl_init();
        curl_setopt_array($curl, array(
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => '',
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 0,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => 'POST',
            CURLOPT_POSTFIELDS => http_build_query($data),
            CURLOPT_HTTPHEADER => $headers
        ));

        $response = curl_exec($curl);

        curl_close($curl);

        $decode = json_decode($response ,true);	

        $output['status']['code'] = "200";
        $output['status']['name'] = "ok";
        $output['status']['description'] = "success";
        $output['data'] = $decode;

        echo json_encode($output); 
    
