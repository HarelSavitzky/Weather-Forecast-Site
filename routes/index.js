var express = require('express');
var router = express.Router();
const mydb = require('../models');

                                        //main get handler => gets us to the home page (registration)
router.get('/', function(req, res, next) {
    handleLoggedIn(res, req);
    res.render('registration', { registerErrMessage: '' });
});
                                        //link to my readme
router.get('/readme', function(req, res, next) {
    res.render('readme');
});
                                        //logout handler =>used to logout link
router.get('/logout', function(req, res, next) {
    req.session.isLoggedIn = false;
    res.render('login', {loginErrMessage : '', loginSuccessful : ''});                      //leave in weather if not logged out
});
                                        //registration handler =>gets us to registration page
router.get('/registration', function(req, res, next) {
    handleLoggedIn(res, req);  //if logged in ->move to weather site
    res.render('registration',{registerErrMessage : ''});
});
                                        //password handler => will get us directly to registration page
router.get('/password', function(req, res, next) {
    handleLoggedIn(res, req);//if logged in ->move to weather site
    return res.render('registration', { registerErrMessage: '' });
});
                                        //login "get" handler will get us to the login page
router.get('/login', function(req, res, next) {
    handleLoggedIn(res, req);//if logged in ->move to weather site
    res.render('login',{loginErrMessage : '', loginSuccessful : ''});
});
                                        //weather page will be protected, access only to loggeed in users
router.get('/weather', function(req, res, next) {
    if(!req.session.isLoggedIn){
        return res.render('login',{loginErrMessage : '', loginSuccessful : ''}); //if session not active -> not logged in ->move to registration page
    }
    res.render('weather', {userLoggedIn :  req.session.user + ' is logged in'}); //grant access only if login =>checked by session
});


//----------------------------------------------FORM REQUEST HANDLERS---------------------------------------------------------------

//function to handle the submition of the call from registration page => will move to password page if validates properly
router.post('/password', function(req, res, next) {

    req.session.email = req.body.email;     //get the inputs from the body
    req.session.first_name = req.body.first_name;
    req.session.last_name = req.body.last_name;

    mydb.Account.findOne({
        where: {                        //check if the email is registered
            email: req.session.email
        }
    }).then(function(account){
        if(!account){   //if not registered
            var date = new Date();               //define cookie expiration time
            date.setTime(date.getTime() + (60 * 1000));
            res.cookie('passwordCookie','idk', {expires : date});   //create cookie for 60 seconds-
            return res.render('password'); //is render because you can only get there from this form submition
        }else{
            res.render('registration', {registerErrMessage : 'This email is already registered, please enter another email'});
        }                                                                 //if email in use
    });
});

//function to handle submit press of the password page => we ask to move to login page
router.post('/login', function(req, res, next) {

    if(req.cookies.passwordCookie === undefined){       //if the cookie is expired
        res.render('registration', { registerErrMessage: 'You exceeded the time limit to enter a password, please try again' });//go back to registration
    }else{                                   //else
        mydb.Account.findOne({
            where: {                        //check again if the email is already registered
                email: req.session.email    //in case someone completed the registration before you
            }                                       //(using the same email)
        }).then(function(account){
            if(!account){                   //if not registered
                let email =  req.session.email;
                let firstName = req.session.first_name;             //take the data of the last form
                let lastName = req.session.last_name;               //(saved on the current session)
                let password = req.body.password_one;       //and the password that was just varified

                return mydb.Account.create({email, firstName, lastName, password})//and create the account on the database
                    .then((account) => {
                        res.render('login', {loginErrMessage : '', loginSuccessful : 'You are registered'}); //move to login page succesfuly
                    })
                    .catch((err) => {                                   //handle the problem with creating the account
                        console.log('***There was an error creating the account')
                        return res.status(400).send(err)
                    })
            }else{          //if email is already registered =>go back to registration page with the error message
                res.render('registration', {registerErrMessage : 'This email is already registered, please enter another email'});
            }
        });
    }
});
//a handler to varify the login page and move us to the weather site if verified successfuly
router.post('/weather', function(req, res, next) {

    mydb.Account.findOne({
        where: {                        //check if the email exist on the database
            email: req.body.loginEmail
        }
    }).then(function(email){
        if(!email){                                             //if not display a message and reload login [age
            res.render('login', {loginErrMessage : 'This email is not registered, please try to retype email', loginSuccessful : ''});
        }else{
            mydb.Account.findOne({        //if exist see that password match the email
                where: {
                    email: req.body.loginEmail ,
                    password: req.body.loginPassword
                }
            }).then(function(password){
                if(!password){                           //if dosent match reload and display a message
                    res.render('login', {loginErrMessage : 'Password doesnt match email', loginSuccessful : ''});
                }else{                                  //if password match
                    req.session.user = req.body.loginEmail; //create a username for the session (using the email)
                    req.session.isLoggedIn = true;          //and verify logged in === TRUE
                    res.render('weather', {userLoggedIn :  req.session.user + ' is logged in'});
                }           //complete log in and move to weather site with the email presented and the logout option near it
            });
        }
    });
});

function handleLoggedIn(res, req){  //function to check if the user isLogged in, if so ->move to weather site
    if(req.session.isLoggedIn === true){
        res.render('weather', {userLoggedIn :  req.session.user + ' is logged in'});
    }
}
module.exports = router;