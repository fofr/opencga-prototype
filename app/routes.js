var express = require('express');
var router = express.Router();
var openCGAclient = require('../lib/opencga_client.js');
var User = require('./presenters/user');

router.get('/', function (req, res) {
  promise = openCGAclient.users().info();
  promise.then(function(response) {
    var user = new User(response);
    var projects = response.result[0].projects;

    res.render('index', { 'user' : user, 'projects': projects });
  });
});

router.get('/project/:id', function (req, res) {
  promise = openCGAclient.projects().info(req.params.id);
  promise.then(function(response) {
    var project = response.result[0];
    res.render('project', {
      'project' : project,
      'studies' : project.studies
    });
  });
});

router.get('/project/:projectId/study/:studyId', function (req, res) {
  studyPromise = openCGAclient.studies().info(req.params.studyId);
  projectPromise = openCGAclient.projects().info(req.params.projectId);
  Promise.all([studyPromise, projectPromise]).then(function(responses) {
    var project = responses[1].result[0],
        study = responses[0].result[0];

    res.render('study', {
      'project' : project,
      'study' : study
    });
  });
});

// add your routes here
module.exports = router;
