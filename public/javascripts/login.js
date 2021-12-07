var nameSpace = (function () {       //namespace
document.addEventListener('DOMContentLoaded',function(){            //Listeners
    loadedActions();
}, false);
function loadedActions(){                   //a function to take several actions when the dom is loaded
    document.body.style.backgroundImage = "url('images/weather.jpg')";     //to create the background image
    document.body.style.backgroundSize = "100%";
}
})();   //namespace closure