//global variables
let userLocation;
let polygon;
let marker; 

//helper functions
//error function
function handleAjaxError(jqXHR) {
    console.log(jqXHR.responseText);
}

//swaps longitude and latitude values 
const reverseArray = array => Array.isArray(array) ? array.map(reverseArray).reverse() : array;

//updates modal content
const changeModal = (buttonId, message) => {
    const button = document.getElementById(buttonId);
    button?.addEventListener('click', () => {
      $('#myModal').modal('show');
      $('.modal-body').html(message);
    });
};

//loads all weather data for all renders
const convertWeatherData = ({coord: {lon: weatherlocation_lon, lat: weatherlocation_lat}, main: {temp: temperature, humidity: airhumidity}, wind: {speed: windspeed, deg: winddirection}, clouds: {all: cloudcoverage}, weather: [{main: weatherconditionstring}]}) => {
    // Recalculating
    const temperaturecelsius = Math.round((temperature - 273) * 100) / 100; // Converting Kelvin to Celsius
    const windspeedkmh = Math.round((windspeed * 3.6) * 100) / 100; // Windspeed from m/s in km/h; Round to 2 decimals
    const windDirections = ["North", "North-Northeast", "Northeast", "East-Northeast", "East", "East-Southeast", "Southeast", "South-Southeast", "South", "South-Southwest", "Southwest", "West-Southwest", "West", "West-Northwest", "Northwest", "North-Northwest"];
    const directionIndex = Math.floor((winddirection + 11.25) / 22.5);
    const winddirectionstring = windDirections[directionIndex % 16];
    changeModal('weatherButton', `The current weather: ${weatherconditionstring} <br> Temperature: ${temperaturecelsius}°C <br> Humidity: ${airhumidity}% <br> Cloud coverage: ${cloudcoverage}% <br> Windspeed: ${windspeedkmh}km/h <br> Wind direction: ${winddirectionstring} <br> Weatherstation Coordinates: ${weatherlocation_lon}, ${weatherlocation_lat}`);
};

//update football
const updateFootball = (data) => {
    if (data.countries === null) {
        changeModal('footballButton', "Unfortunately this country doesn't compete at an international level...yet!")
    return;
    }
        Object.values(data).forEach((array) => {
          for (let league of array) {
            if (league.strGender === 'Male' && league.intDivision === "99" || league.strGender === 'Male' && league.intDivision === '1') {
              const leagueName = league.strLeague;
              const website = league.strWebsite;
              const description = league.strDescriptionEN.substring(0, 600);
              const image = league.strBadge + '/tiny';
              changeModal('footballButton', `<img src=${image} style="max-width: 98%; max-height: 400px;"><br><br>${leagueName} <br><br>${description}...<a href=${website}>Find out more</a>`);
            }}
        });
}

//add photo
const addPhoto = data => {
    const result = (data.hits[0])
    const image = result.webformatURL;
    changeModal('cameraButton', `A little glimspe of the life & country...<br><br><img src=${image} alt="Preview Image" style="max-width: 98%; max-height: 400px;">`)
}
  
//update Wiki Modal
const updateWiki = ({query: {pages}}) => {
    const {extract, title, fullurl: url} = pages[Object.keys(pages)[0]];
    const shortenedExtract = extract.substring(0, 600);
    changeModal('wikiButton', `${title} <br><br> ${shortenedExtract}...<br><br>Read more here: <a href=${url}>Wiki Page<a>`);
};  

//add commas to population
function addCommas(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}  

//add airports
const airports = data => {
    data.forEach(({ name, latitude, longitude }) => {
      L.marker([latitude, longitude], { icon: plane })
        .addTo(map)
        .on('click', function() {
          this.bindPopup(name).openPopup();
        });
    });
}  

//remove markers
function removeAllMarkersAndPopups() {
    map.eachLayer(function (layer) {
      if (layer instanceof L.Marker || layer instanceof L.Popup) {
        map.removeLayer(layer);
      }
    });
}
  
//adding map
const map = L.map('map').fitWorld();
map.zoomControl.remove();
const tile = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', 
    {
        //maxZoom: 10,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

//adding buttons
const infoButton = L.easyButton('fa fa-info-circle', function(btn, map) {}, { id: 'infoButton' }).addTo(map);
const currencyButton = L.easyButton('fa fa-usd', function(btn, map) {}, { id: 'currencyButton' }).addTo(map);
const wikiButton = L.easyButton('fa-wikipedia-w', function(btn, map) {}, { id: 'wikiButton' }).addTo(map);
const weatherButton = L.easyButton('fa-sun-o', function(btn, map) {}, { id: 'weatherButton' }).addTo(map);
const footballButton = L.easyButton('fa-futbol-o', function(btn, map) {}, { id: 'footballButton' }).addTo(map);
const cameraButton = L.easyButton('fa-camera-retro', function(btn, map) {}, { id: 'cameraButton' }).addTo(map);

//extra markers
const thumbtack = L.ExtraMarkers.icon({
    icon: 'fa-thumb-tack',
    prefix: 'fa',
    extraClasses: 'fa-1x',
    iconColor: 'blue'
});

const plane = L.ExtraMarkers.icon({
    icon: 'fa-plane',
    prefix: 'fa',
    extraClasses: 'fa-1x',
    iconColor: 'black'
});
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
navigator.geolocation ? navigator.geolocation.getCurrentPosition(loadUser) : alert("Geolocation is not enabled. Select a country to get started.");

//rendering map and modals based on user location
function loadUser({ coords: { latitude, longitude } }) {
    const initialBorderSet = location => {
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
            error: handleAjaxError
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
            //load major cities
            $.ajax({
                url: "assets/php/cities.php",
                type: "GET",
                dataType: "json",
                data: {
                    countryCode: userLocation
                },
                success: ({data}) => {
                    data.data.forEach(city => {
                        const {name: cityName, latitude: cityLatitude, longitude: cityLongitude} = city;
                        const marker = L.marker([cityLatitude, cityLongitude], {icon: thumbtack}).addTo(map).bindPopup(cityName);
                        marker.on('click', () => {
                            marker.openPopup();
                        });
                    });
                     
                },
                error: handleAjaxError
            })
            //info ajax
            $.ajax({
                url: "assets/php/countryInfo.php",
                type: "GET",
                dataType: "json",
                data: {
                    country: userLocation
                },
                success: ({data}) => {
                    const { countryCode, capital, continent} = data.geonames[0];
                    const country = data.geonames[0]['countryName']
                    const currency = data.geonames[0]['currencyCode'];
                    const formattedCountry = encodeURIComponent(country);
                    let population = addCommas(data.geonames[0].population);
                    //airports
                    $.ajax({
                        url: "assets/php/airports.php",
                        type: "POST",
                        dataType: 'json',
                        data: {
                            country: countryCode
                        },
                        success: ({data}) => {
                            airports(data)
                        },
                        error: handleAjaxError
                    })
                    //photos
                    $.ajax({
                        url: "assets/php/photos.php",
                        type: "POST",
                        dataType: 'json',
                        data: {
                            country: formattedCountry
                        },
                        success: ({data}) => {
                            addPhoto(data)
                        },
                        error: handleAjaxError
                    })
                     //football
                    $.ajax({
                        url: "assets/php/football.php",
                        type: "POST",
                        dataType: 'json',
                        data: {
                            country: formattedCountry
                        },
                        success: ({data}) => {
                           updateFootball(data);
                        },
                        error: handleAjaxError
                    })
                    //wikipedia
                    $.ajax({
                        url: "assets/php/wikipedia.php",
                        type: "POST",
                        dataType: 'json',
                        data: {
                            country: formattedCountry
                        },
                        success: ({data}) => {
                            updateWiki(data);
                        },
                        error: handleAjaxError
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
                        const time = `${data['hour']}.${data['minute']}`;
                        const suffix = time < 12 ? 'am' : 'pm';
                        const formattedTime = `${time}${suffix}`;
                        const infoModal = () => {
                            let flagurl=`https://flagsapi.com/${countryCode}/shiny/64.png`;
                            changeModal('infoButton', `<img src=${flagurl}> <br> ${country} is a country in ${continent} and the capital city is ${capital}. <br>The population of ${country} is ${population} people! <br> The current time in ${country} is ${formattedTime}`);
                        }
                        infoModal()   
                    },
                    error: handleAjaxError
                })
                //currency
                $.ajax({
                    url: "assets/php/exchangeRate.php",
                    type: "GET",
                    dataType: "json",
                    data: { currency },
                    success: ({data}) => {
                        const conversionRate = data['conversion_rates'];
                        const dropdownElement = 'Please select your currency below to see the conversion rate:<br><br><select id="currencyList">' +
                        Object.entries(conversionRate)
                        .map(([key, conversion]) => `<option value="${key}">${key} = ${conversion}</option>`)
                        .join('') + '</select>';
                        changeModal('currencyButton', dropdownElement);
                    },
                    error: handleAjaxError
                })
            },
            error: handleAjaxError
            });
        },
        error: handleAjaxError
    });
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
        error: handleAjaxError
    })
}

//Setting renders for all other drop down options
const selectList = document.getElementById('countryList')
selectList.addEventListener("change", function() {
    //removing polygon and markers
    removeAllMarkersAndPopups();
    map.removeLayer(polygon);
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
                const value = result.data[selectedCountryId];
                const latlngs = reverseArray(value);
                polygon = L.polygon(latlngs, { color: 'red' }).addTo(map);
                map.fitBounds(polygon.getBounds());
                //adding country info modal
                $.ajax({
                    url: "assets/php/countryInfo.php",
                    type: "GET",
                    dataType: "json",
                    data: {
                      country: selectedCountryId
                    },
                    success: ({data}) => {
                        const { currencyCode: currency, capital, countryName: country, continentName: continent, countryCode } = data.geonames[0];
                        const formattedCountry = encodeURIComponent(country);
                         //airports
                        $.ajax({
                            url: "assets/php/airports.php",
                            type: "POST",
                            dataType: 'json',
                            data: {
                                country: countryCode
                            },
                            success: ({data}) => {
                                airports(data)
                            },
                            error: handleAjaxError
                        })
                        $.ajax({
                            url: "assets/php/photos.php",
                            type: "POST",
                            dataType: 'json',
                            data: {
                                country: formattedCountry
                            },
                            success: ({data}) => {
                                addPhoto(data)
                            },
                            error: handleAjaxError
                        })
                        //football
                        $.ajax({
                            url: "assets/php/football.php",
                            type: "POST",
                            dataType: 'json',
                            data: {
                                country: formattedCountry
                            },
                            success: ({data}) => {
                                updateFootball(data)
                            },
                            error: handleAjaxError
                        })
                        //wiki
                        $.ajax({
                            url: "assets/php/wikipedia.php",
                            type: "POST",
                            dataType: 'json',
                            data: {
                                country: formattedCountry
                            },
                            success: ({data}) => {
                                updateWiki(data)
                            },
                            error: handleAjaxError
                        })
                        //edge cases - data not avaialable in API
                        if (data.geonames[0]['countryName'] === "Western Sahara") {
                            capital = "Laayoune"
                        }
                        if (data.geonames[0]['countryName'] === "Palestine") {
                            capital = "Ramallah"
                        }
                        if (data.geonames[0]['countryName'] === "Israel") {
                            capital = "Jerusalem"
                        }
                        formatedCapital = encodeURIComponent(capital)
                        let population = addCommas(data.geonames[0]['population']);
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
                                let capitalMarker = L.marker([latitude, longitude], {icon: thumbtack}).addTo(map) 
                                capitalMarker.bindPopup(`The capital city is ${capital}`).openPopup()
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
                                        const time = `${data['hour']}.${data['minute']}`;
                                        const suffix = time < 12 ? 'am' : 'pm';
                                        const formattedTime = `${time}${suffix}`;
                                        const infoModal = () => {
                                            let flagurl=`https://flagsapi.com/${countryCode}/shiny/64.png`;
                                            changeModal('infoButton', `<img src=${flagurl}> <br> ${country} is a country in ${continent} and the capital city is ${capital}. <br>The population of ${country} is ${population} people! <br> The current time in ${country} is ${formattedTime}`);
                                        }
                                        infoModal() 
                                    },
                                    error: handleAjaxError
                                });
                                //currency
                                $.ajax({
                                    url: "assets/php/exchangeRate.php",
                                    type: "GET",
                                    dataType: "json",
                                    data: { currency },
                                    success: ({data}) => {
                                        const conversionRate = data['conversion_rates'];
                                        const dropdownElement = 'Please select your currency below to see the conversion rate:<br><br><select id="currencyList">' +
                                        Object.entries(conversionRate)
                                        .map(([key, conversion]) => `<option value="${key}">${key} = ${conversion}</option>`)
                                        .join('') + '</select>';
                                        changeModal('currencyButton', dropdownElement);
                                    },
                                    error: handleAjaxError
                                })
                                //major cities/areas
                                $.ajax({
                                    url: "assets/php/cities.php",
                                    type: "GET",
                                    dataType: "json",
                                    data: {
                                        countryCode: selectedCountryId
                                    },
                                    success: ({data}) => {
                                        data.data.forEach(city => {
                                            const { name, latitude, longitude } = city;
                                            L.marker([latitude, longitude], { icon: thumbtack })
                                            .addTo(map)
                                            .on('click', function() {
                                                this.bindPopup(name).openPopup();
                                            });
                                        });
                                    },
                                    error: handleAjaxError
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
                                    error: handleAjaxError
                                })
                            },
                            error: handleAjaxError
                        });
                    },
                    error: handleAjaxError
                });
            }
        },
        error: handleAjaxError
    })
});