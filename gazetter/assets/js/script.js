//global variables
let userLocation;
let map;
let polygon = null;

//helper functions
function reverseArray(array) {
    if (Array.isArray(array)) {
      return array.reverse().map(reverseArray);
    } else {
      return array;
    }
  }

  function selectedInfo(obj) {
    let chosenInfo = []
    for (const [key, value] of Object.entries(obj)) {
        if (key === "capital" || key === "continentName" || key === "currencyCode" || key === "population") {
            chosenInfo.push([key, value])
        }
    } return chosenInfo
  }

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


//getting permission to use user's location
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(loadUser);
  } else {
    alert("Geolocation is not enabled. Select a country to get started.");
  }

  //rendering map and modals based on user location
  function loadUser(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    //finding country based on lat & long
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
            //adding info modal
            $.ajax({
                url: "http://api.geonames.org/countryInfoJSON",
                type: "GET",
                dataType: "json",
                data: {
                  username: "kerriemcivor92",
                  country: userLocation
                },
                success: function(result) {
                  const info = result.geonames[0];
                  console.log(selectedInfo(info))
                  },
                error: function(jqXHR) {
                  console.log(jqXHR.responseText);
                }
              })
            //adding weather modal
            $.ajax({
                url: "https://api.openweathermap.org/data/2.5/forecast",
                type: "GET",
                dataType: "json",
                data: {
                    lat: latitude,
                    lon: longitude,
                    appid: "3e9073c5971886742de9190acd88d5ec",
                },
                success: function(result) {
                    console.log(result)
                },
                error: function(jqXHR) {
                    console.log(jqXHR.responseText);
                  }
            })
            },
        error: function(jqXHR) {
            console.log(jqXHR.responseText);
        }
    })}

    const initialBorderSet = (location) => {
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
                        reverseArray(value);
                        let latlngs = value;
                        polygon = L.polygon(latlngs, {color: 'red'}).addTo(map);
                        map.fitBounds(polygon.getBounds());
                        }
                  }
                }
            }
    })
}

//Setting renders for all other drop down options
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
                map.removeLayer(polygon)
                const data = result.data;
                //adding country info modal
                $.ajax({
                    url: "http://api.geonames.org/countryInfoJSON",
                    type: "GET",
                    dataType: "json",
                    data: {
                      username: "kerriemcivor92",
                      country: selectedCountryId
                    },
                    success: function(result) {
                      const info = result.geonames[0];
                      //fix this
                      console.log(capitalCity)
                      console.log(info);
                      console.log(selectedInfo(info))
                    },
                    error: function(jqXHR) {
                      console.log(jqXHR.responseText);
                    }
                  });
                //call to openweather api
                  //adding weather modal
            $.ajax({
                url: "https://api.openweathermap.org/data/2.5/forecast",
                type: "GET",
                dataType: "json",
                data: {
                    q: 'test',
                    appid: "3e9073c5971886742de9190acd88d5ec",
                },
                success: function(result) {
                    console.log(result)
                },
                error: function(jqXHR) {
                    console.log(jqXHR.responseText);
                  }
            }) 
                for (const [key, value] of Object.entries(data)) {
                    if (selectedCountryId === key){ 
                        let coordinates = value
                        let reversedArrays = reverseArray(coordinates);
                        let latlngs = reversedArrays;
                        polygon = L.polygon(latlngs, {color: 'red'}).addTo(map);
                        map.fitBounds(polygon.getBounds());
                        }
                    }
            }
        },
        error: function(jqXHR) {
            console.log(jqXHR.responseText);
    }
})
})

