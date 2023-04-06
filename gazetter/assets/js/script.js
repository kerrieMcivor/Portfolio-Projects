//global variables
let userLocation;
let map;
let polygon = null;
console.log(polygon)

//map loaded, no loader
/*document.getElementById('map').onload = function () {
    document.getElementById('map').style.display = "block";
    document.getElementById('loader').style.display = "hide";
}
//error function for map failing to load
document.getElementById('map').onerror = function () {
    console.log("Failed to load map");
    document.getElementById('loader').style.display = "none";
}*/

//adding map
map = L.map('map').fitWorld();
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 5,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

//populating the select box*/
$.ajax({
    url: "assets/php/getCountryName.php",
    type: "GET",
    dataType: "json",
    success: function(response) {
        if (response.status.name === "ok") {
            let countryInfo = response.data;
            let sortedCountries = []
            for (const country in countryInfo) {
                sortedCountries.push([country, countryInfo[country]])
            };
            sortedCountries.sort()
            const dropdown = document.getElementById("countryList");
            for (let i = 0; i < sortedCountries.length; i++) {
                const option = document.createElement("option");
                option.text = sortedCountries[i][0];
                option.setAttribute('id', sortedCountries[i][1])
                dropdown.add(option);
            }
        }
    },
    error: function(jqXHR) {
        console.log(jqXHR.responseText);
    }
});


//initial page render using user's location
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(loadUser);
  } else {
    alert("Geolocation is not enabled. Select a country to get started.");
  }

  function loadUser(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    $.ajax({
        url: "assets/php/getCountryFromGeoLocation.php",
        type: "POST",
        dataType: "json",
        data: {
            latitude: latitude,
            longitude: longitude
        },
        success: function(result) {
            userLocation = result['data']
            initialBorderSet(userLocation)
        },
        error: function(jqXHR) {
            console.log(jqXHR.responseText);
        }})
    }

    initialBorderSet = (location) => {
    $.ajax({
        url: "assets/php/getCountryBorders.php",
        type: "POST",
        dataType: "json",
        data: {
            location: location
        },
        success: function(result) {
            if (result.status.name === "ok") {
                const data = result.data;
                for (const [key, value] of Object.entries(data)) {
                    if (location === key){ 
                        let latlngs = value;
                        polygon = L.polygon(latlngs, {color: 'red'}).addTo(map);
                        console.log(polygon)
                        map.fitBounds(polygon.getBounds());
                        }
                  }
                }
            }
    })
}

console.log(map)
//Setting borders
const selectList = document.getElementById('countryList')
selectList.addEventListener("change", function() {
    const selectedCountry = selectList.options[selectList.selectedIndex]
    const selectedCountryId = selectedCountry.id
    $.ajax({
        url: "assets/php/getCountryBorders.php",
        type: "POST",
        dataType: "json",
        data: {
            selectedCountryId: $("#countryList").val()
        },
        success: function(result) {
            if (result.status.name === "ok") {
                    console.log(polygon)
                    console.log("test")
                map.removeLayer(polygon)
                const data = result.data;
                for (const [key, value] of Object.entries(data)) {
                    if (selectedCountryId === key){ 
                        let latlngs = value;
                        polygon = L.polygon(latlngs, {color: 'red'}).addTo(map);
                        console.log(polygon)
                        map.fitBounds(polygon.getBounds());
                        }
                  }
                }
            },
        error: function(jqXHR) {
            console.log(jqXHR.responseText);
    }
})
});

