var express = require('express');
var router = express.Router();
const mydb = require('../models');

router.post('/newLocation', async function(req, res, next) {

    if(req.session.isLoggedIn === true) {            //handle the request to add a new position (location)-> only if logged in
        let email = req.session.user;
        let locationName = req.body.locationName;
        let latitude = req.body.latitude;
        let longitude = req.body.longitude;

        return mydb.Position.create({email, locationName, latitude, longitude}) //create the new position in the database
            .then((position) => {
                mydb.Position.findAll({
                    where:{
                        email: req.session.user                 //than return all the position that left after deletion
                    }
                }).then((positions) => res.send(positions))
                    .catch((err) => {
                        handleCatch(res); //handleCatch function sends 500 response statues -> redirect to login + logout
                    });
            })
            .catch((err) => {
                handleCatch(res);   //handleCatch function ....^
            })
    }else{
        return res.status(401).send("err"); //if not logged in will respond 401 and redirect to login + logout
    }
});

router.delete('/removeLocation/:id', async(req, res) => {

    const id = parseInt(req.params.id);                  //function to handle remove location using the the location ID
    let condition = {email: req.session.user};          //condition is if the email match the current session

    if(id !== -1)
        condition.id = id       //if the id is different than (-1), we will use the id we got on params
                                         //  otherwise we use (-1) to delete all the locations of the current user
    let prom = mydb.Position.destroy({
        where: condition
    }).then(function(position){})
        .catch(function (err) {
            handleCatch(res); //handleCatch function sends 500 response statues -> redirect to login + logout
        });

    await prom;         //wait for the delete of the desired position/positions
    return mydb.Position.findAll({
        where:{
            email: req.session.user                 //than return all the position that left after deletion
        }
    }).then((positions) => res.send(positions))
        .catch((err) => {
            handleCatch(res); //handleCatch function sends 500 response statues -> redirect to login + logout
        });
});

router.post('/positions', (req, res) => {

    return mydb.Position.findAll({
        where:{                                 //return all the positions of the current user
            email: req.session.user
        }
    }).then((positions) => res.send(positions))
        .catch((err) => {
            handleCatch(res); //handleCatch function sends 500 response statues -> redirect to login + logout
        });
});

function handleCatch(res){
    console.log('***There was an error with the database'); //console log err
    return res.status(500).send("err");//handleCatch function sends 500 response statues -> redirect to login
}                                               //in login page we will get logged out

module.exports = router;