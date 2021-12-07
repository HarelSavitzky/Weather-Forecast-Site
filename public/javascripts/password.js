var nameSpace = (function () {       //namespace
document.addEventListener('DOMContentLoaded',function(){            //Listeners
    loadedActions();
    document.getElementById("submitPassId").addEventListener('click', function () { //listener for password clock
        submitPassClick();});
}, false);
function loadedActions(){                   //a function to take several actions when the dom is loaded
    document.body.style.backgroundImage = "url('images/weather.jpg')";      //to create the background image
    document.body.style.backgroundSize = "100%";
}
var displayErrorList = false;   //globals
function submitPassClick(){
    $('form').submit(function(e){e.preventDefault();});

    let password = document.getElementById("passwordId").value.trim();//a function to handle the "submit" button click
    let passwordConfirmation = document.getElementById("passworConfirmationdId").value.trim();
    let errorList = document.getElementById("errors");
    let dynamicList;//create dynamic list for the errors
    dynamicList = validatePassword(password, passwordConfirmation, dynamicList);//validating the password
                                                                    //if not, creates error list dynamicly
    if(displayErrorList === true){      //display the errors
        document.getElementById("pass-form").reset();
        errorList.innerHTML = dynamicList;
        errorList.style.display = "block";
    }else{
        errorList.style.display = "none";   //or submit the password => send the request to the server
        document.getElementById("pass-form").submit();     //using the form submition
        document.getElementById("pass-form").reset();
    }
}
function validatePassword(password, passwordConfirmation, dynamicList){ //function to validate the input of the passwords
    displayErrorList = false;                                           //and to create the errors if needed
    if(password.length !== 0 && passwordConfirmation.length !== 0) {
        if (password.length >= 8 && passwordConfirmation.length >= 8) {             //check that the password is not empty
            if (password !== passwordConfirmation) {                                   //+ check that its 8 or more characters
                dynamicList = "<p class='error-color'>Passwords dont match, please retype them</p>"
                displayErrorList = true;
            }
        } else {
            dynamicList = "<p class='error-color'>Password most contain at least 8 characters</p>"
            displayErrorList = true;
        }
    }else{
        dynamicList = "<p class='error-color'>Password cant be empty</p>"
        displayErrorList = true;
    }
    return dynamicList;
}
})();   //namespace closure