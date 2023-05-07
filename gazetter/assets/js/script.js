//global variables
let userLocation;
let polygon;
let marker; 

//helper functions
//swaps longitude and latitude values 
function reverseArray(array) {
    if (Array.isArray(array)) {
        return array.reverse().map(reverseArray);
    } else {
        return array;
    }
}
//updates modal content
function changeModal(buttonId, message) {
    const button = document.getElementById(buttonId);
    if (button) {
      button.onclick = function() {
            $('#myModal').modal('show');
            $('.modal-body').html(message);
        };
    }
}
//loads all weather data for all renders
const convertWeatherData = data => {
    const weatherlocation_lon = data.coord.lon; 
    const weatherlocation_lat = data.coord.lat; 
    const temperature = data.main.temp; // Kelvin
    const airhumidity = data.main.humidity;
    const windspeed = data.wind.speed; // Meter per second
    const winddirection = data.wind.deg; 
    const cloudcoverage = data.clouds.all;
    const weatherconditionstring = data.weather[0].main
    // recalculating
    const temperaturecelsius = Math.round((temperature - 273) * 100) / 100;  // Converting Kelvin to Celsius
    const windspeedkmh = Math.round((windspeed * 3.6) * 100) / 100; // Windspeed from m/s in km/h; Round to 2 decimals
    const windDirections = [
      "North", "North-Northeast", "Northeast", "East-Northeast",
      "East", "East-Southeast", "Southeast", "South-Southeast",
      "South", "South-Southwest", "Southwest", "West-Southwest",
      "West", "West-Northwest", "Northwest", "North-Northwest"
    ];
    const directionIndex = Math.floor((winddirection + 11.25) / 22.5);
    const winddirectionstring = windDirections[directionIndex % 16]; 
    changeModal('weatherButton', `The current weather: ${weatherconditionstring} <br> Temperature: ${temperaturecelsius}°C <br> Humidity: ${airhumidity}% <br> Cloud coverage: ${cloudcoverage}% <br> Windspeed: ${windspeedkmh}km/h <br> Wind direction: ${winddirectionstring} <br> Weatherstation Coordinates: ${weatherlocation_lon} , ${weatherlocation_lat}`)
}
//update TimeModal
const updateTime = data => {
    const time = `${data['hour']}.${data['minute']}`;
    const suffix = time < 12 ? 'am' : 'pm';
    const formattedTime = `${time}${suffix}`;
    changeModal('timeButton', `The time here is ${formattedTime}`)    
}
//update Wiki Modal
const updateWiki = data => {
    wiki1Title = data[0]['title']
    wiki1Url = data[0]['wikipediaUrl']
    wiki2Title = data[1]['title']
    wiki2Url = data[1]['wikipediaUrl']
    wiki3Title = data[2]['title']
    wiki3Url = data[2]['wikipediaUrl']
    wiki4Title = data[3]['title']
    wiki4Url = data[3]['wikipediaUrl']
    wiki5Title = data[4]['title']
    wiki5Url = data[4]['wikipediaUrl']
    changeModal('wikiButton', `Here are some nearby attractions or historical points you might be interested in: <br> <a href="${wiki1Url}">${wiki1Title}</a><br> <a href="${wiki2Url}">${wiki2Title} </a><br> <a href="${wiki3Url}">${wiki3Title}<a><br> <a href="${wiki4Url}">${wiki4Title}<a><br> <a href="${wiki5Url}">${wiki5Title}<a><br>`)
}
  
//adding map
const map = L.map('map').fitWorld();
const tile = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', 
    {
        maxZoom: 5,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

//adding buttons
const populationButton = L.easyButton('fa fa-users', function(btn, map) {}, { id: 'populationButton' }).addTo(map);
const currencyButton = L.easyButton('fa fa-usd', function(btn, map) {}, { id: 'currencyButton' }).addTo(map);
const wikiButton = L.easyButton('fa-wikipedia-w', function(btn, map) {}, { id: 'wikiButton' }).addTo(map);
const timeButton = L.easyButton('fa fa-clock-o', function(btn, map) {}, { id: 'timeButton' }).addTo(map);
const weatherButton = L.easyButton('fa-sun-o', function(btn, map) {}, { id: 'weatherButton' }).addTo(map);

//populating the select box*/
$.ajax({
    url: "assets/php/getCountryName.php",
    type: "GET",
    dataType: "json",
    success: ({ status, data: countryInfo }) => {
        if (status.name === 'ok') {
            const dropdown = $('#countryList');
            dropdown.append(Object.entries(countryInfo)
              .sort()
              .map(([country, id]) => `<option id="${id}">${country}</option>`)
              .join('')
            );
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
function loadUser({ coords: { latitude, longitude } }) {
    const initialBorderSet = location => {
        //adding markers
        marker = L.marker([latitude, longitude]).addTo(map);
        marker.bindPopup(`You are currently in ${userLocation}`).openPopup()
        $.ajax({
            url: "assets/php/getCountryBorders.php",
            type: "GET",
            dataType: "json",
            data: {location},
            success: ({status, data}) => {
                if (status.name === "ok") {
                    const value = data[location];
                    if (value) {
                      polygon = L.polygon(reverseArray(value), { color: 'red' }).addTo(map);
                      map.fitBounds(polygon.getBounds());
                    }
                  }                  
            },
            error: jqXHR => console.log(jqXHR.responseText),
        })
    }
    //finding country based on lat & long
    $.ajax({
        url: "assets/php/getCountryFromGeolocation.php",
        type: "GET",
        dataType: "json",
        data: { latitude, longitude },
        success: ({data}) => {
            userLocation = data;
            initialBorderSet(userLocation)
            //info ajax
            $.ajax({
                url: "assets/php/countryInfo.php",
                type: "GET",
                dataType: "json",
                data: {
                    country: userLocation
                },
                success: ({data}) => {
                    const currency = data.geonames[0]['currencyCode']
                    const population = data.geonames[0]['population']
                    function updatePopulationModal () {
                        changeModal('populationButton', `The population is ${population} people!`);
                    }
                    updatePopulationModal()
                    //currency
                    $.ajax({
                        url: "assets/php/exchangeRate.php",
                        type: "GET",
                        dataType: "json",
                        data: { currency },
                        success: ({data}) => {
                            const conversionRate = data['conversion_rates']
                            let currencyPairs = []
                            for (const key in conversionRate) {
                                currencyPairs.push(key + ": " + conversionRate[key] + '<br>')
                            }
                            currencyPairs = currencyPairs.join(" ")
                            function updateCurrencyModal() {
                                changeModal('currencyButton', `The currency in ${userLocation} is ${currency} and the exchange rates are as follows: <br> ${currencyPairs}.`)
                            }
                            updateCurrencyModal()
                        },
                        error: (jqXHR) => {
                            console.log(jqXHR.responseText);
                        }
                    })
                },
                error: (jqXHR) => {
                    console.log(jqXHR.responseText);
                }
            });
        },
        error: (jqXHR) => {
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
        success: ({data}) => {
            updateTime(data)
        },
        error: (jqXHR) => {
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
        success: ({data}) => {
            updateWiki(data)
        },
        error: (jqXHR) => {
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
        success: ({data}) => {
            convertWeatherData(data);     
        },
        error: (jqXHR) => {
            console.log(jqXHR.responseText);
        }
    })
}

//Setting renders for all other drop down options
const selectList = document.getElementById('countryList')
selectList.addEventListener("change", function() {
    const selectedCountry = selectList.options[selectList.selectedIndex]
    let selectedCountryId = selectedCountry.id
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
                const value = data[selectedCountryId];
                if (value) {
                    const latlngs = reverseArray(value);
                    polygon = L.polygon(latlngs, { color: 'red' }).addTo(map);
                    map.fitBounds(polygon.getBounds());
                }
                //adding country info modal
                $.ajax({
                    url: "assets/php/countryInfo.php",
                    type: "GET",
                    dataType: "json",
                    data: {
                      country: selectedCountryId
                    },
                    success: ({data}) => {
                        let currency = data.geonames[0]['currencyCode']
                        let capitalCity = data.geonames[0]['capital']
                        //edge cases - data not avaialable in API
                        if (data.geonames[0]['countryName'] === "Western Sahara") {
                            capitalCity = "Laayoune"
                        }
                        if (data.geonames[0]['countryName'] === "Palestine") {
                            capitalCity = "Ramallah"
                        }
                        if (data.geonames[0]['countryName'] === "Israel") {
                            capitalCity = "Jerusalem"
                        }
                        formatedCapital = encodeURIComponent(capitalCity)
                        let population = data.geonames[0]['population']
                        function updatePopulationModal () {
                            changeModal('populationButton', `The population is ${population} people!`);
                        }
                        updatePopulationModal()
                        //currency
                        $.ajax({
                            url: "assets/php/exchangeRate.php",
                            type: "GET",
                            dataType: "json",
                            data: { currency },
                            success: ({data}) => {
                                const conversionRate = data['conversion_rates']
                                let currencyPairs = []
                                for (const key in conversionRate) {
                                    currencyPairs.push(key + ": " + conversionRate[key] + '<br>')
                                }
                                currencyPairs = currencyPairs.join(" ")
                                function updateCurrencyModal() {
                                    changeModal('currencyButton', `The currency in ${selectedCountryId} is ${currency} and the exchange rates are as follows: <br> ${currencyPairs}.`)
                                }
                                updateCurrencyModal()
                            },
                            error: (jqXHR) => {
                                console.log(jqXHR.responseText);
                            }
                        })
                        //lat & lngs
                        $.ajax({
                            url: 'assets/php/coords.php',
                            method: "GET",
                            dataType: "json",
                            data: {
                                city: formatedCapital,
                            },
                            success: ({data}) => {
                                let latitude = data[0]['latitude']
                                let longitude = data[0]['longitude']
                                //adding markers
                                marker = L.marker([latitude, longitude]).addTo(map);
                                marker.bindPopup(`The capital city is ${capitalCity}`).openPopup()
                                //time modal
                                $.ajax({
                                    url: 'assets/php/worldtime.php',
                                    method: "GET",
                                    dataType: "json",
                                    data: {
                                        lat: latitude,
                                        lon: longitude
                                    },
                                    success: ({data}) => {
                                        updateTime(data)
                                    },
                                    error: (jqXHR) => {
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
                                    success: ({data}) => {
                                        updateWiki(data)
                                    },
                                    error: (jqXHR) => {
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
                                    success: ({data}) => {
                                        convertWeatherData(data);
                                    },
                                    error: (jqXHR) => {
                                        console.log(jqXHR.responseText);
                                    }
                                })
                            },
                            error: (jqXHR) => {
                                console.log(jqXHR);
                            }
                        });
                    },
                    error: (jqXHR) => {
                      console.log(jqXHR.responseText);
                    }
                });
            }
        },
        error: (jqXHR) => {
            console.log(jqXHR.responseText);
        }
    })
});