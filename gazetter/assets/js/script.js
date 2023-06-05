function onLoad () {
    //global variables
    let polygon;
    let selectList;

    //helper functions
    //error function
    function handleAjaxError(jqXHR) {
        console.log(jqXHR.responseText);
    };

    //swaps longitude and latitude values 
    const reverseArray = array => Array.isArray(array) ? array.map(reverseArray).reverse() : array;

    //add commas
    function addCommas(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };
  
    //remove markers
    function removeAllLayers() {
        map.eachLayer(function (layer) {
            if ( layer instanceof L.Polygon ) {
                map.removeLayer(layer);
            }
        });
        airplaneMarkers.clearLayers();
        cityMarkers.clearLayers();
    };
  
    //adding map
    const tile = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });
    const tile2 = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
	    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    });
    const map = L.map('map', {minZoom:3, layers: [tile]}).fitWorld();


    //adding layers & clusters
    const airplaneMarkers = L.markerClusterGroup();
    const cityMarkers = L.markerClusterGroup();
    //add airports
    const airports = data => {
        // Create a new layer for the markers
        data.forEach(({ name, latitude, longitude }) => {
        const markerLatLng = L.latLng(latitude, longitude);
        const marker = L.marker(markerLatLng, {
            icon: L.ExtraMarkers.icon({
                icon: 'fa fa-plane',
                markerColor: 'blue',
                prefix: 'fa',
                iconAnchor: [12, 24]
            })
        });
        marker.bindTooltip(name);
        airplaneMarkers.addLayer(marker);
        });
    };
    //add cities
    const cities = data => {
        data.data.forEach(city => {
            const { name, latitude, longitude } = city;
            const cityMarker = L.marker([latitude, longitude], { icon: L.ExtraMarkers.icon({
                icon: 'fa fa-thumbtack',
                prefix: 'fa',
                markerColor: 'red',
                iconAnchor: [12, 24] 
            }) 
        });
        cityMarker.bindTooltip(name);
        cityMarkers.addLayer(cityMarker)
        });
    };
    const baseMaps = {
        "Open Street Maps": tile,
        "Topography View": tile2
    };
    const overlayMaps = {
        "Airports": airplaneMarkers,
        "Major Areas": cityMarkers
    };
    const layerControl = L.control.layers(baseMaps, overlayMaps).addTo(map);

    //adding buttons
    const infoButton = L.easyButton('fa fa-info-circle', function(btn, map) {$('#info').modal('toggle');}, { id: 'infoButton' }).addTo(map);
    const currencyButton = L.easyButton('fa fa-usd', function(btn, map) {$('#currency').modal('toggle');}, { id: 'currencyButton' }).addTo(map);
    const wikiButton = L.easyButton('fa-brands fa-wikipedia-w', function(btn, map) {$('#wiki').modal('toggle');}, { id: 'wikiButton' }).addTo(map);
    const weatherButton = L.easyButton('fa-solid fa-cloud-sun-rain', function(btn, map) {$('#weather').modal('toggle');}, { id: 'weatherButton' }).addTo(map);
    const footballButton = L.easyButton('fa-duotone fa-futbol', function(btn, map) {$('#football').modal('toggle');}, { id: 'footballButton' }).addTo(map);
    const cameraButton = L.easyButton('fa-camera-retro', function(btn, map) {$('#gallery').modal('toggle');}, { id: 'cameraButton' }).addTo(map);

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
            };
        },
        error: handleAjaxError
    });

    // Function to load user's location and update dropdown list
    function loadUser({ coords: { latitude, longitude } }) {
        $.ajax({
            url: "assets/php/getCountryFromGeolocation.php",
            type: "GET",
            dataType: "json",
            data: { latitude, longitude },
            success: ({ data }) => {
                let countryCode = data;
                // Update dropdown list with the selected country
                let selectList = document.getElementById('countryList');
                selectList.id = countryCode;
                for (let i = 0; i < selectList.options.length; i++) {
                    if (selectList.options[i].id === countryCode) {
                        selectList.selectedIndex = i;
                        break;
                    }
                };
                selectList.dispatchEvent(new Event('change'));
                },
                error: handleAjaxError
        });
    };

    // Check if geolocation is enabled and load user's location if available
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(loadUser);
    } else {
        alert("Geolocation is not enabled. Select a country to get started.");
    }

    selectList = document.getElementById('countryList');
    selectList.addEventListener("change", function() {
        removeAllLayers();
        // Get the selected country from the dropdown list
        const selectedCountry = selectList.options[selectList.selectedIndex];
        let selectedCountryId = selectedCountry.id;
        $.ajax({
            url: "assets/php/getCountryBorders.php",
            type: "POST",
            dataType: "json",
            data: {
                selectedCountryId: selectedCountryId
            },
            success: function(result) {
                if (result.status.name === "ok") {
                    const value = result.data[selectedCountryId];
                    const latlngs = reverseArray(value);
                    polygon = L.polygon(latlngs, { color: 'red', fill: false }).addTo(map);
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
                            let { currencyCode: currency, capital, countryName: country, continentName: continent, countryCode } = data.geonames[0];
                            const formattedCountry = encodeURIComponent(country);
                            //edge cases - data not avaialable in API
                            switch (data.geonames[0]['countryName']) {
                                case "Western Sahara":
                                  capital = "Laayoune";
                                  break;
                                case "Palestine":
                                  capital = "Ramallah";
                                  break;
                                case "Israel":
                                  capital = "Jerusalem";
                                  break;
                            }                              
                            formatedCapital = encodeURIComponent(capital);
                            population = numeral(data.geonames[0]['population']).format('0,0');
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
                                            const time = `${data['hour']}` +`:` + `${data['minute']}`;
                                            const suffix = time < 12 ? 'am' : 'pm';
                                            const formattedTime = `${time}${suffix}`;
                                            let flag = document.getElementById('flag');
                                            flag.src = `https://flagsapi.com/${countryCode}/shiny/64.png`;
                                            let infotext = document.getElementById('infotext')
                                            infotext.innerHTML = `${country} is located in ${continent} and has a Capital City of ${capital}.<br><br>
                                                The population is ${population} people!<br><br>
                                                The time in ${country} is ${formattedTime}.`;
                                        },
                                        error: handleAjaxError
                                    });
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
                                    });
                                    //photos
                                    $.ajax({
                                        url: "assets/php/photos.php",
                                        type: "POST",
                                        dataType: 'json',
                                        data: {
                                            country: formattedCountry
                                        },
                                        success: ({data}) => {
                                            const result1 = (data.hits[0]);
                                            const gallery1 = document.getElementById('gallery1');
                                            gallery1.src =  result1.webformatURL;
                                            const result2 = (data.hits[1]);
                                            const gallery2 = document.getElementById('gallery2');
                                            gallery2.src = result2.webformatURL;
                                            const result3 = (data.hits[2]);
                                            const gallery3 = document.getElementById('gallery3');
                                            gallery3.src = result3.webformatURL;
                                            const result4 = (data.hits[3]);
                                            const gallery4 = document.getElementById('gallery4');
                                            gallery4.src = result4.webformatURL;
                                            const result5 = (data.hits[4]);
                                            const gallery5 = document.getElementById('gallery5');
                                            gallery5.src = result5.webformatURL;   
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
                                            let image;
                                            let footballImage = document.getElementById('footballImage');
                                            let team = document.getElementById('team');
                                            let descriptionElement = document.getElementById('description');
                                            let continueLink = document.getElementById('continue');
                                            if (data.countries === null) {
                                                footballImage.src = "./assets/img/football.jpg";
                                                team.innerHTML = country;
                                                descriptionElement.innerHTML = "Unfortunately this country doesn't compete at an international level...yet!"
                                                continueLink.innerHTML = "";
                                                footballImage.classList.remove("w-100");
                                                footballImage.classList.add("w-25");                                    
                                                return;
                                            };
                                            Object.values(data).forEach((array) => {
                                                for (let league of array) {
                                                    if (league.strGender === 'Male' && league.intDivision === "99" || league.strGender === 'Male' && league.intDivision === '1') {
                                                        const leagueName = league.strLeague;
                                                        const website = "https://" + league.strWebsite;
                                                        const description = league.strDescriptionEN.substring(0, 600);
                                                        continueLink.innerHTML = "Continue Reading";
                                                        if (league.strBanner) {
                                                            image = league.strBanner;
                                                            footballImage.classList.add("w-100");
                                                        } else {
                                                            image = league.strBadge + "/preview";
                                                            footballImage.classList.remove("w-100");
                                                            footballImage.classList.add("w-25");
                                                        }
                                                        footballImage.src = image;
                                                        team.innerHTML = leagueName;
                                                        descriptionElement.innerHTML = description + "...";
                                                        continueLink.href = website;
                                                    }
                                                }
                                            });
                                        },
                                        error: handleAjaxError
                                    });
                                    //wiki
                                    $.ajax({
                                        url: "assets/php/wikipedia.php",
                                        type: "POST",
                                        dataType: 'json',
                                        data: {
                                            country: formattedCountry
                                        },
                                        success: ({ data }) => {
                                            const { query: { pages } } = data;
                                            const { extract, fullurl: url } = pages[Object.keys(pages)[0]];
                                            const shortenedExtract = `${extract.substring(0, 600)}...`;
                                            const wikiSummary = document.getElementById("wikiText");
                                            wikiSummary.innerHTML = shortenedExtract;
                                            const wikiurl = document.getElementById("wikiUrl");
                                            wikiurl.href = url;
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
                                            const resultElement = document.getElementById('result');
                                            const convertAmount = () => {
                                                const selectedCurrency = selectElement.value;
                                                const selectedKey = selectElement.options[selectElement.selectedIndex].text; 
                                                const amount = parseFloat(inputElement.value);
                                                let convertedAmount = (amount * selectedCurrency).toFixed(2);
                                                convertedAmount = addCommas(convertedAmount)
                                                resultElement.innerHTML = `${amount} ${selectedKey} converts to ${convertedAmount} ${currency}`;
                                            };
                                            buttonElement.addEventListener('click', convertAmount);
                                        },               
                                        error: handleAjaxError
                                    });
                                    //major cities/areas
                                    $.ajax({
                                        url: "assets/php/cities.php",
                                        type: "GET",
                                        dataType: "json",
                                        data: {
                                            countryCode: selectedCountryId
                                        },
                                        success: ({data}) => {
                                            cities(data);
                                        },
                                        error: handleAjaxError
                                    });
                                    //weather
                                    $.ajax({
                                        url: "assets/php/weather.php",
                                        type: "GET",
                                        dataType: "json",
                                        data: {
                                            lat: latitude,
                                            lon: longitude,
                                        },
                                        success: ({ data }) => {
                                            let firstLoop = true;
                                            let savedData = null;
                                            let counter = 0;                                    
                                            const { DateTime } = luxon;
                                            let currentDate = DateTime.now();
                                            for (let i = 0; i < 28; i++) {
                                                if (firstLoop) {
                                                    let datestamp = data.list[i]['dt_txt'];
                                                    datestamp = datestamp.split(" ");
                                                    const date = currentDate.toFormat('ccc d LLLL'); // Format the increased date
                                                    const timestamp = datestamp[1];
                                                    if ((timestamp === "15:00:00" || timestamp === "12:00:00" || timestamp === "21:00:00" || timestamp === "00:00:00") && savedData === null) {
                                                        let temp = data.list[i].main.temp;
                                                        const temperature = Math.round((temp - 273) * 100) / 100;
                                                        let description = data.list[i].weather[0].main;
                                                        savedData = { date, temperature, description };
                                                        let today = document.getElementById("today");
                                                        today.innerHTML = date;
                                                        let todayImg = document.getElementById("todayImg");
                                                        let todayTemp = document.getElementById("todayTemp");
                                                        todayTemp.innerHTML = temperature + "°C";
                                                        let todayCondition = document.getElementById("todayCondition");
                                                        todayCondition.innerHTML = description;
                                                        if (todayCondition === "Clear") {
                                                            todayImg.src = "/gazetter/sun192x192.png";
                                                        } else if (todayCondition === "Rain") {
                                                            todayImg.src = "/gazetter/rain192x192.png"
                                                        } else {
                                                            todayImg.src = "/gazetter/cloud192x192.png";
                                                        }
                                                        firstLoop = false;
                                                    }
                                                } else {
                                                    let datestamp = data.list[i]['dt_txt'];
                                                    datestamp = datestamp.split(" ");
                                                    const timestamp = datestamp[1];
                                                    if (timestamp === "15:00:00") {
                                                        currentDate = currentDate.plus({ days: 1 }); // Increase the date by 1 day in each iteration
                                                        const date = currentDate.toFormat('ccc d LLLL'); // Format the increased date
                                                        let temp = data.list[i].main.temp;
                                                        const temperature = Math.round((temp - 273) * 100) / 100;
                                                        counter++;
                                                        let condition1 = data.list[i].weather[0].main;
                                                        if (counter === 1) {
                                                            let date1 = document.getElementById("date1");
                                                            date1.innerHTML = date;
                                                            let temp1 = document.getElementById("temp1");
                                                            temp1.innerHTML = temperature + "°C";
                                                            let img1 = document.getElementById("img1")
                                                            if (condition1 === "Clear") {
                                                                img1.src = "/gazetter/sun32x32.png";
                                                            } else if (condition1 === "Rain") {
                                                                img1.src = "/gazetter/rain32x32.png";
                                                            } else {
                                                                img1.src = "/gazetter/cloud32x32.png";
                                                            }
                                                        } else if (counter === 2) {
                                                            let condition2 = data.list[i].weather[0].main;
                                                            let date2 = document.getElementById("date2");
                                                            date2.innerHTML = date;
                                                            let temp2 = document.getElementById("temp2");
                                                            temp2.innerHTML = temperature + "°C";
                                                            let img2 = document.getElementById("img2");
                                                            if (condition2 === "Clear") {
                                                                img2.src = "/gazetter/sun32x32.png";
                                                            } else if (condition2 === "Rain") {
                                                                img2.src = "/gazetter/rain32x32.png";
                                                            } else {
                                                                img2.src = "/gazetter/cloud32x32.png";
                                                            }
                                                        } else if (counter === 3) {
                                                            let condition3 = data.list[i].weather[0].main;
                                                            let date3 = document.getElementById("date3");
                                                            date3.innerHTML = date;
                                                            let temp3 = document.getElementById("temp3");
                                                            temp3.innerHTML = temperature + "°C";
                                                            let img3 = document.getElementById("img3")
                                                            if (condition3 === "Clear") {
                                                                img3.src = "/gazetter/sun32x32.png";
                                                            } else if (condition3 === "Rain") {
                                                                img3.src = "/gazetter/rain32x32.png"
                                                            } else {
                                                                img3.src = "/gazetter/cloud32x32.png";
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        },
                                        error: handleAjaxError
                                    });
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
};

