<?php 
    $countryBorders = file_get_contents('../../countryBorders.geo.json');
    var_dump(json_decode($countryBorders));

?>