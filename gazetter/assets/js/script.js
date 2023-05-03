//global variables
let userLocation;
let polygon = null;
let marker = null;

//helper function
function reverseArray(array) {
    if (Array.isArray(array)) {
        return array.reverse().map(reverseArray);
    } else {
        return array;
    }
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
    const initialBorderSet = (location) => {
        //adding markers
        marker = L.marker([latitude, longitude]).addTo(map);
        marker.bindPopup(`You are currently in ${userLocation}`).openPopup()
        $.ajax({
            url: "assets/php/getCountryBorders.php",
            type: "GET",
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

    //finding country based on lat & long
    $.ajax({
        url: "assets/php/getCountryFromGeolocation.php",
        type: "GET",
        dataType: "json",
        data: {
            latitude: latitude,
            longitude: longitude
        },
        success: function(result) {
            userLocation = result['data']
            initialBorderSet(userLocation)
            //info ajax
            $.ajax({
                url: "assets/php/countryInfo.php",
                type: "GET",
                dataType: "json",
                data: {
                  country: userLocation
                },
                success: function(result) {
                    let currency = result.data.geonames[0]['currencyCode']
                    //currency
                    $.ajax({
                        url: "assets/php/exchangeRate.php",
                        type: "GET",
                        dataType: "json",
                        data: {
                        currency: currency
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
            });
        },
        error: function(jqXHR) {
            console.log(jqXHR.responseText);
        }
    })

    //time modal
    $.ajax({
        url: 'assets/php/worldtime.php',
        method: "GET",
        dataType: "json",
        data: {
            lat: latitude,
            lon: longitude
        },
        success: function(result) {
            console.log(result)
        },
        error: function(jqXHR) {
            console.log(jqXHR);
        }
    });

    
    //wikipedia
    $.ajax({
        url: "assets/php/wikipedia.php",
        type: "POST",
        dataType: 'json',
        data: {
          lat: latitude,
          lng: longitude,
        },
        success: function(result) {
          console.log(result)
          
        },
        error: function(jqXHR) {
            console.log(jqXHR.responseText);
        }
    })

    //adding weather modal
    $.ajax({
        url: "assets/php/weather.php",
        type: "GET",
        dataType: "json",
        data: {
            lat: latitude,
            lon: longitude,
        },
        success: function(result) {
            console.log(result)
        },
        error: function(jqXHR) {
            console.log(jqXHR.responseText);
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
                if (marker) {
                    map.removeLayer(marker)
                }
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
                    url: "assets/php/countryInfo.php",
                    type: "GET",
                    dataType: "json",
                    data: {
                      country: selectedCountryId
                    },
                    success: function(result) {
                        let currency = result.data.geonames[0]['currencyCode']
                        let capitalCity = result.data.geonames[0]['capital']
                        if (capitalCity.includes(" ")) {
                            let capitalArray = capitalCity.split(" ")
                            console.log(capitalArray)

                        }
                        console.log(capitalCity)
                        console.log(selectedCountryId)
                        //currency
                        $.ajax({
                            url: "assets/php/exchangeRate.php",
                            type: "GET",
                            dataType: "json",
                            data: {
                            currency: currency
                            },
                            success: function(result) {
                                console.log(result)
                            },
                            error: function(jqXHR) {
                                console.log(jqXHR.responseText);
                            }
                        })
                        //lat & lngs
                        $.ajax({
                            url: 'assets/php/coords.php',
                            method: "GET",
                            dataType: "json",
                            data: {
                                city: capitalCity,
                                country: selectedCountryId
                            },
                            success: function(result) {
                                let latitude = result.data[0]['latitude']
                                console.log(latitude)
                                let longitude = result.data[0]['longitude']
                                console.log(longitude)
                                //adding markers
                                marker = L.marker([latitude, longitude]).addTo(map);
                                marker.bindPopup(`The capital of ${selectedCountryId} is ${capitalCity}`).openPopup()
                                //time modal
                                $.ajax({
                                    url: 'assets/php/worldtime.php',
                                    method: "GET",
                                    dataType: "json",
                                    data: {
                                        lat: latitude,
                                        lon: longitude
                                    },
                                    success: function(result) {
                                        console.log(result)
                                    },
                                    error: function(jqXHR) {
                                        console.log(jqXHR);
                                    }
                                });
                                 //wikipedia
                                $.ajax({
                                    url: "assets/php/wikipedia.php",
                                    type: "POST",
                                    dataType: 'json',
                                    data: {
                                        lat: latitude,
                                        lng: longitude,
                                    },
                                    success: function(result) {
                                        console.log(result)
          
                                    },
                                    error: function(jqXHR) {
                                      console.log(jqXHR.responseText);
                                    }
                                })
                                //weather
                                $.ajax({
                                    url: "assets/php/weather.php",
                                    type: "GET",
                                    dataType: "json",
                                    data: {
                                        lat: latitude,
                                        lon: longitude,
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
                                console.log(jqXHR);
                            }
                        
                        });
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