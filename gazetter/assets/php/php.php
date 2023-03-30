<?php 
    //accessing the countryBorders.json file to generate array to populate dropdown list
    $countryBorders = json_decode(file_get_contents('../countryBorders.json'), true);
    $countries = [];
    foreach ($countryBorders['features'] as $feature) {
        $name = $feature['properties']['name'];
        array_push($countries, $name );
    }
    //print_r($countries);
    //print_r($name);

    
?>