var nameSpace = (function () {       //namespace
window.onload = (event) => {   //function to clear the form every page load
    clearForm();
};
document.addEventListener('DOMContentLoaded',function(){            //Listeners
    loadedActions();
}, false);
function loadedActions(){                   //a function to take several actions when the dom is loaded
    document.body.style.backgroundImage = "url('images/weather.jpg')";      //to create the background image
    document.body.style.backgroundSize = "100%";
}
function clearForm(){               //when the window.onload => initiate this function
    document.getElementById('reg-form').reset();
}
})();   //namespace closure
