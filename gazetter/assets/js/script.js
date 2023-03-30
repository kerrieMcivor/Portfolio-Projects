document.getElementById('map').onload = function () {
    document.getElementById('map').style.display = "block";
    document.getElementById('loader').style.display = "none";
}

document.getElementById('map').onerror = function () {
    console.log("Failed to load map");
    document.getElementById('loader').style.display = "none";
    // Add code to display an error message or retry loading the map
}


//using php array to add options to select box
/*$.ajax({
    url: "assets/php/php.php",
    type: 'POST',
    dataType: 'json',
    data: {
        countryName: '',
    },
    success: function(result) {
        console.log(result)
    }
});*/