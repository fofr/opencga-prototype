var express = require('express');
var router = express.Router();
var openCGAclient = require('../lib/opencga_client.js');
var User = require('./presenters/user');

router.get('/', function (req, res) {
  openCGAclient.users().info().then(function(response) {
    var user = new User(response);
    res.render('index', { 'user' : user });
  });
});

// add your routes here
module.exports = router;
