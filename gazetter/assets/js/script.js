function onLoad () {
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
const changeModal = (buttonId, title, message) => {
    const buttonElement = document.getElementById(buttonId);
    buttonElement?.addEventListener('click', () => {
      const modalTitleElement = document.querySelector('.modal-title');
      modalTitleElement.textContent = title;
      $('.modal-body').html(message);
      $('#myModal').modal('show');
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
    changeModal('weatherButton', 'Weather', `The current weather: ${weatherconditionstring} <br> Temperature: ${temperaturecelsius}°C <br> Humidity: ${airhumidity}% <br> Cloud coverage: ${cloudcoverage}% <br> Windspeed: ${windspeedkmh}km/h <br> Wind direction: ${winddirectionstring} <br> Weatherstation Coordinates: ${weatherlocation_lon}, ${weatherlocation_lat}`);
};

//update currency
function updateCurrencyModal(data) {
    // Update dropdown list
    const currencyList = document.getElementById('currencyList');
    currencyList.innerHTML = Object.keys(data['conversion_rates'])
      .map(key => `<option value="${key}">${key}</option>`)
      .join('');
  
    // Convert amount on button click
    const convertButton = document.getElementById('convertButton');
    convertButton.addEventListener('click', () => {
      const selectedCurrency = currencyList.value;
      const amount = parseFloat(document.getElementById('amountInput').value);
      const conversionRate = data['conversion_rates'][selectedCurrency];
      const convertedAmount = amount * conversionRate;
      document.getElementById('conversionResult').innerText = convertedAmount;
    });
  }
  

//update football
const updateFootball = (data) => {
    if (data.countries === null) {
        changeModal('footballButton', "Football Teams", "Unfortunately this country doesn't compete at an international level...yet!")
    return;
    }
        Object.values(data).forEach((array) => {
          for (let league of array) {
            if (league.strGender === 'Male' && league.intDivision === "99" || league.strGender === 'Male' && league.intDivision === '1') {
                const leagueName = league.strLeague;
                const website = league.strWebsite;
                const description = league.strDescriptionEN.substring(0, 600);
                const image = league.strBadge + "/preview";
                changeModal('footballButton', `${leagueName}`, `<img src=${image} style="max-width: 98%; max-height: 400px;"><br><br>${description}...<a href=${website} target="_blank">Find out more</a>`);
            }}
        });
}

//add photo
const addPhoto = data => {
    const result = (data.hits[0])
    const image = result.webformatURL;
    changeModal('cameraButton', 'Gallery Image', `<img src=${image} alt="Preview Image" style="max-width: 98%; max-height: 400px;">`)
}
  
//update Wiki Modal
const updateWiki = ({query: {pages}}) => {
    const {extract, title, fullurl: url} = pages[Object.keys(pages)[0]];
    const shortenedExtract = extract.substring(0, 600);
    changeModal('wikiButton', `${title}`, `${shortenedExtract}...<br><br>Read more here: <a href=${url} target="_blank">Wiki Page<a>`);
};  

//add commas to population
function addCommas(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}  

//add airports
const airports = data => {
    data.forEach(({ name, latitude, longitude }) => {
      const markerLatLng = L.latLng(latitude, longitude);
      L.marker(markerLatLng, {
        icon: L.ExtraMarkers.icon({
          icon: 'fa-plane',
          markerColor: 'blue',
          prefix: 'fa',
          iconAnchor: [12, 24] // Adjust the icon anchor point based on your custom icon
        })
      })
      .addTo(map)
      .bindPopup(name, { autoClose: false })
      .on('click', function() {
        this.openPopup();
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
const map = L.map('map', {minZoom:5}).fitWorld();
const tile = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
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
                            changeModal('infoButton', `${country}`, `<img src="${flagurl}"> <br> ${country} is a country in ${continent} and the capital city is ${capital}. <br>The population of ${country} is ${population} people! <br> The current time in ${country} is ${formattedTime}`);
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
                    success: ({ data }) => {
                        const conversionRate = data['conversion_rates'];
                        const selectElement = document.getElementById('currencyList');
                        const inputElement = document.getElementById('amountInput');
                        selectElement.innerHTML = Object.keys(conversionRate).map(key => `<option value="${conversionRate[key]}">${key}</option>`).join('');
                        const buttonElement = document.getElementById('convertButton');
                        const resultElement = document.getElementById('conversionResult');
                        const convertAmount = () => {
                            const selectedCurrency = selectElement.value;
                            const selectedKey = selectElement.options[selectElement.selectedIndex].text; 
                            const amount = parseFloat(inputElement.value);
                            let convertedAmount = (amount * selectedCurrency).toFixed(2);
                            resultElement.textContent = `${amount} ${selectedKey} = ${convertedAmount} ${currency} `;
                          };
                        buttonElement.addEventListener('click', convertAmount);
                        changeModal('currencyButton','Conversion Rate', ['Select your currency:<br><br>', selectElement, '<br><br>Amount:<br><br>', inputElement, '<br><br>', buttonElement, '<br><br>', resultElement]);
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
                                            changeModal('infoButton', `${country}`, `<img src="${flagurl}"> <br> ${country} is a country in ${continent} and the capital city is ${capital}. <br>The population of ${country} is ${population} people! <br> The current time in ${country} is ${formattedTime}`);
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
                                    success: ({ data }) => {
                                        const conversionRate = data['conversion_rates'];
                                        const selectElement = document.getElementById('currencyList');
                                        const inputElement = document.getElementById('amountInput');
                                        selectElement.innerHTML = Object.keys(conversionRate).map(key => `<option value="${conversionRate[key]}">${key}</option>`).join('');
                                        const buttonElement = document.getElementById('convertButton');
                                        const resultElement = document.getElementById('conversionResult');
                                        const convertAmount = () => {
                                            const selectedCurrency = selectElement.value;
                                            const selectedKey = selectElement.options[selectElement.selectedIndex].text; 
                                            const amount = parseFloat(inputElement.value);
                                            let convertedAmount = (amount * selectedCurrency).toFixed(2);
                                            resultElement.textContent = `${amount} ${selectedKey} = ${convertedAmount} ${currency} `;
                                          };
                                        buttonElement.addEventListener('click', convertAmount);
                                        changeModal('currencyButton','Conversion Rate', ['Select your currency:<br><br>', selectElement, '<br><br>Amount:<br><br>', inputElement, '<br><br>', buttonElement, '<br><br>', resultElement]);
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
}