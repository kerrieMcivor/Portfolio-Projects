//using php array to add options to select box
$.ajax({
    url: "assets/php/php.php",
    type: 'POST',
    dataType: 'json',
    data: {
        countryName: 'hello',
    },
    success: function(result) {
        console.log(result)
    }
});