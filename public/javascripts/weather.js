var nameSpace = (function () {       //namespace

document.addEventListener('DOMContentLoaded',function(){            //Listeners
    loadedActions();
    document.getElementById('add-button').addEventListener("click", createClick);
    document.getElementById("remove-button").addEventListener('click', function () {
        deleteOption();});
    document.getElementById("remove-all-button").addEventListener('click', function () {
        deleteAllOption();});
    document.getElementById("forecast-button").addEventListener('click', function () {
        forecastPressed();});
    document.getElementById("dropDownID").addEventListener('click', function () {
        dropDownButton();});
    document.getElementById("clear-forecast-button").addEventListener('click', function () {
        clearForecastButton();});
    document.getElementById("icon-def-button").addEventListener('click', function () {
        iconDefinitionDisplay();});
    document.getElementById("back-button").addEventListener('click', function () {
        backButtonPressed();});
}, false);

var displayErrorList = false;   //globals
var locationsArray = [];
var forecastPressedBool = false;

class Location{             //a class for first containing the location input from the text boxes
    constructor(id, name, latitud, longitud) {
        this.m_id = id;
        this.m_name = name;
        this.m_latitud = latitud;
        this.m_longitud = longitud;
    }
}
function loadedActions(){                   //a function to take several actions when the dom is loaded
    document.body.style.backgroundImage = "url('images/weather.jpg')";     //to remove unnecessary items from the html
    document.body.style.backgroundSize = "100%";
    document.getElementById('remove-button').disabled = true;
    document.getElementById('remove-all-button').disabled = true;
    document.getElementById('forecast-button').disabled = true;
    document.getElementById('icon-def-button').disabled = true;
    document.getElementById('clear-forecast-button').disabled = true;
    loadDropDownFromDB();
}

function dropDownButton(){                  //a function to handle the press on the dropDown button
    var sel = document.getElementById('dropDownID');        //color it/disable it etc...
    var forecastButton =  document.getElementById("forecast-button");
    var deleteButton = document.getElementById('remove-button');

    if(sel.length === 1){
        document.getElementById('remove-all-button').disabled = true;
    }else{
        document.getElementById('remove-all-button').disabled = false;
    }
    if(sel.selectedIndex === 0){             //disable buttons
        forecastButton.disabled = true;
        forecastButton.style.backgroundColor = "grey";
        deleteButton.disabled = true;
        deleteButton.style.backgroundColor = "grey";
    }else{
        forecastButton.disabled = false;    //enable buttons
        forecastButton.style.backgroundColor = "#39cdf9";
        deleteButton.disabled = false;
        deleteButton.style.backgroundColor = "#dc3545";
    }
}

function createClick(){
    $('form').submit(function(e){e.preventDefault();});   //needed for canceling the submission

    let locationName = document.getElementById("locationNameId").value.trim();//a function to handle the "create" button click
    let locationLatitud = document.getElementById("latitudeID").value.trim();//validating the input and adding a new location if valid,
    let locationlongitud = document.getElementById("longitudeId").value.trim(); //if not, creates error list dynamicly
    let newLocation = new Location(0, locationName, locationLatitud, locationlongitud);
    let myForm = document.getElementById("my-form");
    let errorList = document.getElementById("errors");
    let dynamicList = "<br><h3>Please correct the following problems:</h3><br><ul>";//create dynamic list for the errors
    dynamicList = validateNewLocation(newLocation, dynamicList);

    if(displayErrorList === true){  //display the errors
        dynamicList += "</ul><br>";
        errorList.innerHTML = dynamicList;
        errorList.style.display = "block";
    } else{
        SubmitFormAsAjax(myForm, function(locations) {  //callback function, initiated after add-fetch
            reBuildDropdown(locations); //function to delete and rebuild the data and the DropDown on client side
            errorList.style.display = "none";   //or add the location to the dropDown
            myForm.reset();
        });
    }
}
function deleteLocationFromDB(id){  //a function to delete single/all locations and return the updated positions DATABASE
    fetch('/removeLocation/' + id,{method: 'DELETE'} )
        .then(
            function (response) {
                if (response.status !== 200) {          // handle the error
                    console.log('Looks like there was a problem.');
                    response.status;
                    return;
                }else if(response.status === 500) { //if theres a problem with the database->move to login and logout
                    window.location = "/login";
                }
                response.json().then(function (data) {  //handle the response => convert to json
                    if (data.error){
                        console.log('Looks like there was a problem.');
                    }else{
                        reBuildDropdown(data);//function to delete and rebuild the data and the DropDown on client side
                        dropDownButton();//function to enable/disable buttons according to needed
                    }
                });
            })
        .catch(function (err) {         //handle error
            console.log('Fetch Error :', err);
        });
}
function reBuildDropdown(locations){    //function to delete and rebuild the data and the DropDown on client side
    clearDropdownLocations();               //clear the dropdown
    locations.forEach(function(location,index){          //forEach to build dropdown again
        let tempLocation = new Location(location.id ,location.locationName, location.latitude, location.longitude);
        insertLocationToDropdown(tempLocation);})
}
function SubmitFormAsAjax(formObject, callback, errorCallback)//a function to use ajax when we add a new location
{
    let formData = new FormData(formObject); //(the form of the locations)
    let action = formObject.action;
    let body = null;                               //variables definition
    let headers = {};

    if(formObject.method.toLowerCase() === 'get'){  //if method is get - convert to queryparams
    const qs = [...formData.entries()]  //array of arrays
        .map(x => `${encodeURIComponent(x[0])}=${encodeURIComponent(x[1])}`)    //array of strings
        .join('&');                                  //join array to one string
    action += action.indexOf('?') < 0 ? '?' : '&';  //add to url using the right condition
    action += qs;

    }else{                                                //else-> convert params to json:
        var object = {};                                  //forEach loop to convert the data to object
        formData.forEach(function(value, key){
            object[key] = value;
         });
         body = JSON.stringify(object);        //convert the object to json
         headers = {
        "Content-Type": "application/json; charset=utf-8"
        };
    }
    fetch(action, {             //fetch the locations (positions) + adding the new one
       method: formObject.method,       //using the specified method and delivering json to the server
       body: body,
       headers: headers
    }).then(function (response) {
        if (response.ok) {                               //if the response is ok -> go to the callback function
            if(callback)
                response.json().then(callback);
        }else if(response.status === 401){  //if theres a problem with the database->move to login and logout
            window.location = "/login";
        }else if(errorCallback)                       //if not, return error callback
            Promise.reject(response).then(errorCallback);
    }).catch(function (error)
    {
        if(errorCallback)
            errorCallback(error);
    });
}
 function loadDropDownFromDB(){    //a function to fetch all the positions DATABASE of the current  user when we enter the site
    fetch('/positions',{method: 'POST'} )
        .then(
            function (response) {
                if (response.status !== 200) {   // handle the error
                    console.log('Looks like there was a problem.');
                    response.status;
                    return;
                }else if(response.status === 500) { //if theres a problem with the database->move to login and logout
                    window.location = "/login";
                }
                response.json().then(function (data) {  //handle the reponse =>convert to json
                    if (data.error){
                        console.log('Looks like there was a problem.');
                    }else{
                        data.forEach(function(location,index){      //forEach to build dropdown
                            let tempLocation = new Location(location.id ,location.locationName, location.latitude, location.longitude);
                            insertLocationToDropdown(tempLocation);
                        })
                    }
                });
            })
        .catch(function (err) { //handle error
            console.log('Fetch Error :', err);
        });
}
function deleteAllOption(){ //when the delete all button pressed, call - deleteLocationFromDB() - function
    deleteLocationFromDB(-1);                                       //with the parameter: -1
}
function deleteOption(){            //a function that is activate when pressing the "delete location" button
    let sel = document.getElementById('dropDownID');    // call - deleteLocationFromDB() - function
    deleteLocationFromDB(sel.options[sel.selectedIndex].value); //  with the current option ID
}
function clearDropdownLocations(){                  // a function to clear the dropdown on the client side
    locationsArray.splice(0, locationsArray.length);
    document.getElementById('dropDownID').innerHTML = "<option>Choose</option>";
}
function getForecastData(current) { //function to fetch the weather forecast from the site

    document.getElementById('loadingGif').style.display = "block";
    fetch('http://www.7timer.info/bin/api.pl?lon='+current.longitud+'&lat='+current.latitud+'&product=civillight&output=json')
        .then(
            function (response) { // handle the error
                if (response.status !== 200) {
                    document.querySelector("#data").innerHTML = 'Looks like there was a problem. Status Code: ' +
                        response.status;
                    return;
                }
                response.json().then(function (data) { // handle the response and send another for fetching the forecast image
                    var imgPromise = loadImage('http://www.7timer.info/bin/astro.php? lon='+current.longitud+'&lat='+current.latitud+'&ac=0&lang=en&unit=metric&output=internal&tzshift=0');
                    imgPromise.then(function (img){
                        document.getElementById("forecastImage").appendChild(document.createElement('br'));
                        document.getElementById("forecastImage").appendChild(img);
                        enableGreyButtons();
                    })
                        .catch(function(img){
                            let errorImg = document.createElement('img');       //if picture from site isnt loaded, load a error picture
                            let br = document.createElement('br');
                            errorImg.src ='error.png';
                            document.getElementById("forecastImage").appendChild(br);
                            document.getElementById("forecastImage").appendChild(errorImg);
                            enableGreyButtons();
                        });
                    if(forecastPressedBool === true) {  //if the forecast is currently displayed, and the display forecast button is pressed again
                        clearLastForecast();            //remove last content before building the new one
                    }
                    let currentDate = new Date();  //get the current date
                    let forecastTable = document.getElementById('forecastTable');
                    let header = document.createElement("H3"); //creating headline for the forecast for the specific location
                    let text = document.createTextNode("The weather forecast for " + current.name + " is:");
                    header.appendChild(text);
                    forecastTable.appendChild(header);
                    document.getElementById('loadingGif').style.display = "none";
                    document.getElementById('scrollId').style.display = "block";
                    for(let i = 0; i < 7; i++) {    // a loop to create all seven slots of the forecast
                        buildDayForecast(getCurrDay(currentDate.getDay() + i + 1), getWeatherPic(data.dataseries[i].weather),data.dataseries[i].temp2m ,data.dataseries[i].wind10m_max )
                    }                       //first argument is from the "getCurrDay" function  that gets a number and retrives a day, second argument is returned from "getWeatherPic" function
                    activeForecastButtons();                    //and it is the URL for the specific picture of the weather, rest of the argument are simply the data from the json
                }); // "activeForecastButtons" to display the 2 new buttons when the forecast shows up
            })
        .catch(function (err) {
            console.log('Fetch Error :', err);
        });
};
function enableGreyButtons(){           //function to enable the grey buttons that show up when forecast is displayed
    document.getElementById('icon-def-button').disabled = false;
    document.getElementById('clear-forecast-button').disabled = false;
}
function disableGreyButtons(){          //function to disable the grey buttons that show up when forecast is displayed
    document.getElementById('icon-def-button').disabled = true;
    document.getElementById('clear-forecast-button').disabled = true;
}
function backButtonPressed(){   //a function that activates when the "Back To Forecast Page" button is pressed
    document.getElementById('forecastTable').style.display = "block";  //removes the chart and the current button
    document.getElementById('personal-info-block').style.display = "block"; //from the display
    document.getElementById('buttons').style.display = "block";         //and display back all the elements that
    document.getElementById('icon-def-button').style.display = "block"; //was before the "icon definition" button is pressed
    document.getElementById('clear-forecast-button').style.display = "block";
    document.getElementById('forecastImage').style.display = "block";
    document.getElementById('scrollId').style.display = "block";
    document.getElementById('iconDefImage').style.display = "none";
}
function iconDefinitionDisplay(){           //a function that activates when the "icon definition" button is pressed
    document.getElementById('forecastTable').style.display = "none"; //remove everything from the screen
    document.getElementById('personal-info-block').style.display = "none";  //except from the main header
    document.getElementById('buttons').style.display = "none";             //and shows the icon definition chart
    document.getElementById('icon-def-button').style.display = "none";  //with all the necessary information
    document.getElementById('clear-forecast-button').style.display = "none";//and creates a button to go back...
    document.getElementById('forecastImage').style.display = "none";
    document.getElementById('scrollId').style.display = "none";
    document.getElementById('iconDefImage').style.display = "block";
}
function activeForecastButtons(){           //when the forecast button is pressed and the weather shows up
    document.getElementById('icon-def-button').style.display = "block"; //activate the clear forecast button
    document.getElementById('clear-forecast-button').style.display = "block"; //and the icon definition button
}
function getWeatherPic(string){
    switch (string){                // a function that gets the weather as string and return the image address needed
        case('clear'):
            return 'http://www.7timer.info/img/misc/about_civil_clear.png';
        case('pcloudy'):
            return 'http://www.7timer.info/img/misc/about_civil_pcloudy.png';
        case('mcloudy'):
            return 'http://www.7timer.info/img/misc/about_civil_mcloudy.png';
        case('cloudy'):
            return 'http://www.7timer.info/img/misc/about_civil_cloudy.png';
        case('humid'):
            return 'http://www.7timer.info/img/misc/about_civil_fog.png';
        case('lightrain'):
            return 'http://www.7timer.info/img/misc/about_civil_lightrain.png';
        case('oshower'):
            return 'http://www.7timer.info/img/misc/about_civil_oshower.png';
        case('ishower'):
            return 'http://www.7timer.info/img/misc/about_civil_ishower.png';
        case('lightsnow'):
            return 'http://www.7timer.info/img/misc/about_civil_lightsnow.png';
        case('rain'):
            return 'http://www.7timer.info/img/misc/about_civil_rain.png';
        case('snow'):
            return 'http://www.7timer.info/img/misc/about_civil_snow.png';
        case('rainsnow'):
            return 'http://www.7timer.info/img/misc/about_civil_rainsnow.png';
        case('ts'):
            return 'http://www.7timer.info/img/misc/about_civil_tstorm.png';
        case('tsrain'):
            return 'http://www.7timer.info/img/misc/about_civil_tsrain.png';
    }
}
function getCurrDay(num){
    if(num > 7){
        num-=7;             // a function that gets the number of the day and return it by string
    }
    switch(num){
        case(1):
            return 'Sunday';
        case(2):
            return 'Monday';
        case(3):
            return 'Tuesday';
        case(4):
            return 'Wednesday';
        case(5):
            return 'Thursday';
        case(6):
            return 'Friday';
        case(7):
            return 'Saturday';
    }
}
function buildDayForecast(day, weatherImg, temperature, wind){  //function to create forecast of each day, one by one
    let stat = ['Temperature: ', 'Wind Speed: '];           //the stats and the data that should be displayed
    let data = [temperature.min + ' - ' + temperature.max, wind];
    let forecastTable = document.getElementById('forecastTable'); //all the elements that should be built
    let br = document.createElement("br");                        //in order to create each day forecast
    let mainDiv = document.createElement('div');
    let picDiv = document.createElement('div'); //one div especially for the picture to present it well
    mainDiv.className = 'weather-block';            //implementing the class that created for the design
    let weatherPic = document.createElement('img');
    weatherPic.src = weatherImg;
    picDiv.appendChild(weatherPic);
    let span = document.createElement('span');  //used several spans for different text sizes
    span.style.fontSize = '30px';
    span.style.fontWeight = 'bold';
    let dayHead = document.createTextNode(day);
    span.appendChild(dayHead);  //create the day head
    mainDiv.appendChild(span);
    mainDiv.append(picDiv);     //insert the image
    mainDiv.append(br);
    for(let i = 0; i < stat.length; i++){   //loop for adding the stats and data
        let secondSpan = document.createElement('span');//another span for another text style (inside the same div)
        secondSpan.style.fontSize = '16px';
        secondSpan.style.fontWeight = 'bold';
        let statNode = document.createTextNode(stat[i]);
        secondSpan.appendChild(statNode);
        mainDiv.appendChild(secondSpan);
        let para = document.createElement('p')
        para.style.fontSize = '14px';
        let dataNode = document.createTextNode(data[i]);
        para.appendChild(dataNode);
        mainDiv.appendChild(para);  //append the new paragraph of the designed stats and data of the weather
    }
    forecastTable.appendChild(mainDiv); //append the single day forecast created, to the main forecast that holds all the 7 of them
    forecastTable.style.display = "block";
}
function loadImage(url){    //function to load the image that was sent back from the server
    return new Promise(function(resolve, reject) {
        var img = new Image();
        img.src = url;
        img.onload = function() { resolve(img) }
        img.onerror = function(e) { reject(e) }
    });
}
function insertLocationToDropdown(newLocation){   //function to insert the current location that was entered into a location array
    let locationData = {'id' : newLocation.m_id, 'name' : newLocation.m_name, 'latitud' : newLocation.m_latitud, 'longitud' : newLocation.m_longitud};
    locationsArray.push(locationData);
    let myLocations = document.getElementById('dropDownID');
    let newOption = new Option(newLocation.m_name, newLocation.m_id); //and create a new option and adding it to the
    myLocations.add(newOption, undefined);                             //dropDown list
    document.getElementById('remove-all-button').disabled = false;
}
function clearLastForecast(){
    document.getElementById('scrollId').style.display = "none";
    document.getElementById('forecastTable').innerHTML = "";    //function to clear last forecast
    document.getElementById('forecastImage').innerHTML = "";    //in case the forecast display pressed again
}
function clearForecastButton(){
    disableGreyButtons();
    clearLastForecast();                                             //a function to clear the forecast using the
    document.getElementById('icon-def-button').style.display = "none";//"clear forecast" button
    document.getElementById('clear-forecast-button').style.display = "none"; //(does more than "clearLastForecast" function
                                                                                         //thats why using it---
}
function forecastPressed(){             //if the display forecast button pressed, this function will be initiated
    document.getElementById('scrollId').style.display = "none";
    let sel = document.getElementById('dropDownID');
    if(sel.selectedIndex !== 0) {
        forecastPressedBool = true;
        let opt = parseInt(sel.options[sel.selectedIndex].value); //we will check which index is pressed
        let current = getCurrentLocation(opt); //than call a function that will return the location from the locations array
        getForecastData(current);           // that we created. and send it to "getForecastData" function to fetch the data
    }
}
function getCurrentLocation(opt){   //the function that gets the id and return the location object
    var current = undefined;    //from the objects array (locations array) each object holds the data (id, name,long,lat..)
    locationsArray.forEach(function(item,index){
        if(item.id === opt){
            current = item;
        }
    })
    return current;
}

function validateNewLocation(newLocation, dynamicList){ //function to validate the input of the location
    displayErrorList = false;                              //and to create the error list if needed

    if(isNaN(newLocation.m_name)) {
        if (newLocation.m_name.length !== 0) {                          //Location name validation
            if (locationsArray.length !== 0) {                        //check that its not empty and that there are no 2 similar names
                for (let i = 0; i < locationsArray.length; i++) {
                    if (newLocation.m_name === locationsArray[i].name) {
                        dynamicList += "<li>There is already a location with this name, please choose a new name</li>"
                        displayErrorList = true;
                        break;
                    }
                }
            }
        } else {
            dynamicList += "<li>Please enter a location name</li>"
            displayErrorList = true;
        }
    }else{
        dynamicList += "<li>Location name cant be a number</li>"
        displayErrorList = true;
    }
    if(newLocation.m_latitud.length !== 0){                 //Latitude validation
        if(newLocation.m_latitud <= 90 && newLocation.m_latitud >= (-90)){
        }else{
            dynamicList += "<li>Latitude must be in the range of [90,-90]</li>"
            displayErrorList = true;
        }
    }else{
        dynamicList += "<li>please enter a Latitude</li>"
        displayErrorList = true;
    }

    if(newLocation.m_longitud.length !== 0){            //Longitude validation
        if(newLocation.m_longitud <= 180 && newLocation.m_longitud >= (-180)){
        }else{
            dynamicList += "<li>Longitude must be in the range of [180,-180]</li>"
            displayErrorList = true;
        }
    }else{
        dynamicList += "<li>Please enter a Longitud</li>"
        displayErrorList = true;
    }
    return dynamicList;
}
})();   //namespace closure