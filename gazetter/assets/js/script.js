//global variables
let userLocation;
let polygon;
let marker; 

//helper functions
function reverseArray(array) {
    if (Array.isArray(array)) {
        return array.reverse().map(reverseArray);
    } else {
        return array;
    }
}

function changeModal(buttonId, message) {
    const button = document.getElementById(buttonId);
    if (button) {
      button.onclick = function() {
            $('#myModal').modal('show');
            $('.modal-body').html(message);
        };
    }
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
            Object.entries(countryInfo).sort()
            .forEach(([country, id]) => {
                const option = document.createElement('option');
                option.text = country;
                option.setAttribute('id', id);
                dropdown.append(option);
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
                    for (const [key, value] of Object.entries(data)) {
                        if (location === key){ 
                            reverseArray(value);
                            const latlngs = value;
                            polygon = L.polygon(latlngs, {color: 'red'}).addTo(map);
                            map.fitBounds(polygon.getBounds());
                        }
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
                            const currencyPairs = []
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
            let time = `${data['hour']}.${data['minute']}`
            if (time < 12.00) {
                time = `${time}am`
            } else {
                time = `${time}pm`
            }
            function updateTimeModal(){
                changeModal('timeButton', `The time here is ${time}`)
            }
            updateTimeModal()
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
            function updateWikiModal() {
                changeModal('wikiButton', `Here are some nearby attractions or historical points you might be interested in: <br> <a href="${wiki1Url}">${wiki1Title}</a><br> <a href="${wiki2Url}">${wiki2Title} </a><br> <a href="${wiki3Url}">${wiki3Title}<a><br> <a href="${wiki4Url}">${wiki4Title}<a><br> <a href="${wiki5Url}">${wiki5Title}<a><br>`)
            }
            updateWikiModal()
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
            // storing json data in variables
            const weatherlocation_lon = data.city.coord.lon; 
            const weatherlocation_lat = data.city.coord.lat; 
            const temperature = data.list[0].main.temp; // Kelvin
            const airhumidity = data.list[0].main.humidity;
            const temperature_min = data.list[0].main.temp_min; // Kelvin
            const temperature_max = data.list[0].main.temp_max; // Kelvin
            const windspeed = data.list[0].wind.speed; // Meter per second
            const winddirection = data.list[0].wind.deg; 
            const cloudcoverage = data.list[0].clouds.all;
            const weatherconditionstring = data.list[0].weather[0].main
            // conversions
            const temperaturecelsius = Math.round((temperature - 273) * 100) / 100;  // Converting Kelvin to Celsius
            const windspeedkmh = Math.round((windspeed * 3.6) * 100) / 100; // Windspeed from m/s in km/h; Round to 2 decimals
            if (winddirection > 348.75 &&  winddirection <= 11.25) {
                winddirectionstring =  "North";
            } else if (winddirection > 11.25 &&  winddirection <= 33.75) {
                winddirectionstring =  "North-Northeast";
            } else if (winddirection > 33.75 &&  winddirection <= 56.25) {
                winddirectionstring =  "Northeast";
            } else if (winddirection > 56.25 &&  winddirection <= 78.75) {
                winddirectionstring =  "East-Northeast";
            } else if (winddirection > 78.75 &&  winddirection <= 101.25) {
                winddirectionstring =  "East";
            } else if (winddirection > 101.25 &&  winddirection <= 123.75) {
                winddirectionstring =  "East-Southeast";
            } else if (winddirection > 123.75 &&  winddirection <= 146.25) {
                winddirectionstring =  "Southeast";
            } else if (winddirection > 146.25 &&  winddirection <= 168.75) {
                winddirectionstring =  "South-Southeast";
            } else if (winddirection > 168.75 &&  winddirection <= 191.25) {
                winddirectionstring =  "South";
            } else if (winddirection > 191.25 &&  winddirection <= 213.75) {
                winddirectionstring =  "South-Southwest";
            } else if (winddirection > 213.75 &&  winddirection <= 236.25) {
                winddirectionstring =  "Southwest";
            } else if (winddirection > 236.25 &&  winddirection <= 258.75) {
                winddirectionstring =  "West-Southwest";
            } else if (winddirection > 258.75 &&  winddirection <= 281.25) {
                winddirectionstring =  "West";
            } else if (winddirection > 281.25 &&  winddirection <= 303.75) {
                winddirectionstring =  "West-Northwest";
            } else if (winddirection > 303.75 &&  winddirection <= 326.25) {
                winddirectionstring =  "Northwest";
            } else if (winddirection > 326.25 &&  winddirection <= 348.75) {
                winddirectionstring =  "North-Northwest";
            } else {
                winddirectionstring =  " - currently no winddata available - ";
            };
            function updateWeatherModal () {
                changeModal('weatherButton', `The current weather: ${weatherconditionstring} <br> Temperature: ${temperaturecelsius}°C <br> Humidity: ${airhumidity}"% <br> Cloud coverage: ${cloudcoverage}% <br> Windspeed: ${windspeedkmh}km/h <br> Wind direction: ${winddirectionstring} <br> Weatherstation Coordinates: ${weatherlocation_lon} , ${weatherlocation_lat}`);
            }
            updateWeatherModal()
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
                    success: ({data}) => {
                        let currency = data.geonames[0]['currencyCode']
                        let capitalCity = data.geonames[0]['capital']
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
                                let conversionRate = data['conversion_rates']
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
                                city: capitalCity,
                                country: selectedCountryId
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
                                        let time = data['hour'] + "." + data['minute']
                                        if (time < 12.00) {
                                            time = time + "am"
                                        } else {
                                            time = time + "pm"
                                        }
                                        function updateTimeModal(){
                                            changeModal('timeButton', `The time here is ${time}`)
                                        }
                                        updateTimeModal()
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
                                        function updateWikiModal() {
                                            changeModal('wikiButton', `Here are some nearby attractions or historical points you might be interested in: <br> <a href="${wiki1Url}">${wiki1Title}</a><br> <a href="${wiki2Url}">${wiki2Title} </a><br> <a href="${wiki3Url}">${wiki3Title}<a><br> <a href="${wiki4Url}">${wiki4Title}<a><br> <a href="${wiki5Url}">${wiki5Title}<a><br>`)
                                        }
                                        updateWikiModal()
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
                                    success: function(result) {
                                        // storing json data in variables
                                        const weatherlocation_lon = data.city.coord.lon; 
                                        const weatherlocation_lat = data.city.coord.lat; 
                                        const temperature = data.list[0].main.temp; // Kelvin
                                        const airhumidity = data.list[0].main.humidity;
                                        const temperature_min = data.list[0].main.temp_min; // Kelvin
                                        const temperature_max = data.list[0].main.temp_max; // Kelvin
                                        const windspeed = data.list[0].wind.speed; // Meter per second
                                        const winddirection = data.list[0].wind.deg; 
                                        const cloudcoverage = data.list[0].clouds.all; 
                                        const weatherconditionstring = data.list[0].weather[0].main 
                                        // recalculating
                                        const temperaturecelsius = Math.round((temperature - 273) * 100) / 100;  // Converting Kelvin to Celsius
                                        const windspeedkmh = Math.round((windspeed * 3.6) * 100) / 100; // Windspeed from m/s in km/h; Round to 2 decimals
                                        if (winddirection > 348.75 &&  winddirection <= 11.25) {
                                            winddirectionstring =  "North";
                                        } else if (winddirection > 11.25 &&  winddirection <= 33.75) {
                                            winddirectionstring =  "North-Northeast";
                                        } else if (winddirection > 33.75 &&  winddirection <= 56.25) {
                                            winddirectionstring =  "Northeast";
                                        } else if (winddirection > 56.25 &&  winddirection <= 78.75) {
                                            winddirectionstring =  "East-Northeast";
                                        } else if (winddirection > 78.75 &&  winddirection <= 101.25) {
                                            winddirectionstring =  "East";
                                        } else if (winddirection > 101.25 &&  winddirection <= 123.75) {
                                            winddirectionstring =  "East-Southeast";
                                        } else if (winddirection > 123.75 &&  winddirection <= 146.25) {
                                            winddirectionstring =  "Southeast";
                                        } else if (winddirection > 146.25 &&  winddirection <= 168.75) {
                                            winddirectionstring =  "South-Southeast";
                                        } else if (winddirection > 168.75 &&  winddirection <= 191.25) {
                                            winddirectionstring =  "South";
                                        } else if (winddirection > 191.25 &&  winddirection <= 213.75) {
                                            winddirectionstring =  "South-Southwest";
                                        } else if (winddirection > 213.75 &&  winddirection <= 236.25) {
                                            winddirectionstring =  "Southwest";
                                        } else if (winddirection > 236.25 &&  winddirection <= 258.75) {
                                            winddirectionstring =  "West-Southwest";
                                        } else if (winddirection > 258.75 &&  winddirection <= 281.25) {
                                            winddirectionstring =  "West";
                                        } else if (winddirection > 281.25 &&  winddirection <= 303.75) {
                                            winddirectionstring =  "West-Northwest";
                                        } else if (winddirection > 303.75 &&  winddirection <= 326.25) {
                                            winddirectionstring =  "Northwest";
                                        } else if (winddirection > 326.25 &&  winddirection <= 348.75) {
                                            winddirectionstring =  "North-Northwest";
                                        } else {
                                            winddirectionstring =  " - currently no winddata available - ";
                                        };
                                        function updateWeatherModal () {
                                            changeModal('weatherButton', `The current weather: ${weatherconditionstring} <br> Temperature: ${temperaturecelsius}°C <br> Humidity: ${airhumidity}% <br> Cloud coverage: ${cloudcoverage}% <br> Windspeed: ${windspeedkmh}km/h <br> Wind direction: ${winddirectionstring} <br> Weatherstation Coordinates: ${weatherlocation_lon} , ${weatherlocation_lat}`);
                                        }
                                        updateWeatherModal()
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