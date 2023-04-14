//global variables
let userLocation;
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
    } 
    return chosenInfo
}

//modal functionality
const modalButtons = document.querySelectorAll('[data-toggle="modal"]');
const closeButtons = document.querySelectorAll('.modal .btn-secondary');
const modal = document.querySelectorAll('.modal')

modalButtons.forEach(button => {
  button.addEventListener('click', () => {
    const modal = document.querySelector(button.dataset.target);
    modal.classList.add('show');
    modal.style.display = 'block';
  });
});

closeButtons.forEach(button => {
  button.addEventListener('click', () => {
    const modal = button.closest('.modal');
    modal.classList.remove('show');
    modal.style.display = 'none';
  });
});

//adding map
const map = L.map('map').fitWorld();
const tile = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', 
    {
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
        const countryInfo = response.data;
        const dropdown = document.getElementById("countryList");
  
        Object.entries(countryInfo)
          .sort()
          .forEach(([country, id]) => {
            const option = document.createElement("option");
            option.text = country;
            option.setAttribute('id', id);
            dropdown.add(option);
          });
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
    //time modal
    $.ajax({
        url: "../php/getTime",
        method: "POST",
        dataType: "json",
        data: {
            latitude: latitude,
            longitude: longitude}
        ,
        success: function(response) {

        },
        error: function() {
            console.log("A error occurred accessing the post array");
        }
    });
    //adding wikipedia modal
    $.ajax({
        url: "http://api.geonames.org/findNearbyWikipediaJSON",
        type: "GET",
        data: {
          lat: latitude,
          lng: longitude,
          username: "kerriemcivor92"
        },
        success: function(result) {
          const info = result.geonames;
          console.log(info)
        },
        error: function(jqXHR) {
            console.log(jqXHR.responseText);
        }
        })
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
                  const chosenInfo = selectedInfo(info)
                  const currency = chosenInfo[3][1]
                  $.ajax({
                    url: "https://v6.exchangerate-api.com/v6/73bfb2bd0bc1523f98690351/latest/" + currency,
                    type: "GET",
                    dataType: "json",
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
    })
}

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
                const data = result.data;
                //removing original polygon and adding new polygon
                map.removeLayer(polygon)
                for (const [key, value] of Object.entries(data)) {
                    if (selectedCountryId === key){ 
                        let coordinates = value
                        let reversedArrays = reverseArray(coordinates);                        
                        let latlngs = reversedArrays;
                        polygon = L.polygon(latlngs, {color: 'red'}).addTo(map);
                        map.fitBounds(polygon.getBounds());
                    }
                }
                //adding country info modal
                $.ajax({
                    url: "http://api.geonames.org/countryInfoJSON",
                    type: "GET",
                    dataType: "json",
                    data: {
                      username: "kerriemcivor92",
                      country: selectedCountryId,
                    },
                    success: function(result) {
                        const info = result.geonames[0];
                        const chosenInfo = selectedInfo(info)
                        const capitalCity = chosenInfo[0][1]
                        const currency = chosenInfo[3][1]
                        console.log(chosenInfo)
                        console.log(info)
                        //time modal
                        $.ajax({
                            url: "https://world-time-by-api-ninjas.p.rapidapi.com/v1/worldtime",
                            method: "GET",
                            dataType: "json",
                            data: {
                                city: capitalCity
                            },
                            headers: {
                                "X-RapidAPI-Key": "b0b6fd23e7msh1c298d942139507p1be034jsn6bbebb61879d",
                                "X-RapidAPI-Host": "world-time-by-api-ninjas.p.rapidapi.com"
                            },
                           success: function(response) {
                               console.log(response);
                            },
                            error: function(jqXHR) {
                                console.log(jqXHR.responseText);
                            }
                        });
                        //adding currency exchange
                        $.ajax({
                            url: "https://v6.exchangerate-api.com/v6/73bfb2bd0bc1523f98690351/latest/" + currency,
                            type: "GET",
                            dataType: "json",
                            success: function(result) {
                                console.log(result)
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
                                q: capitalCity,
                                appid: "3e9073c5971886742de9190acd88d5ec",
                            },
                            success: function(result) {
                                console.log(result)
                                cityLatitude = result.city.coord.lat
                                console.log(cityLatitude)
                                cityLongitude = result.city.coord.lon
                                console.log(cityLongitude)

                                
                                //wikipedia modal
                                $.ajax({
                                    url: "http://api.geonames.org/findNearbyWikipediaJSON",
                                    type: "GET",
                                    data: {
                                        lat: cityLatitude,
                                        lng: cityLongitude,
                                        username: "kerriemcivor92"
                                    },
                                    success: function(result) {
                                      const info = result.geonames;
                                      console.log(info)
                                    },
                                    error: function(jqXHR) {
                                        console.log(jqXHR.responseText);
                                    }
                                    })
                            },
                            error: function(jqXHR) {
                                console.log(jqXHR.responseText);
                            }
                        }) 
                    },
                    error: function(jqXHR) {
                      console.log(jqXHR.responseText);
                    }
                });
            }
        },
        error: function(jqXHR) {
            console.log(jqXHR.responseText);
        }
    })
});