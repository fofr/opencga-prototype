var express = require('express');
var router = express.Router();
var openCGAclient = require('../lib/opencga_client.js');
var User = require('./presenters/user');

router.get('/', function (req, res) {
  promise = openCGAclient.users().info();
  promise.then(function(response) {
    var user = response.result[0];
    var projects = response.result[0].projects;

    res.render('index', { 'user' : user, 'projects': projects });
  });
});

router.get('/project/:projectId', function (req, res) {
  projectPromise = openCGAclient.projects().info(req.params.projectId);
  userPromise = openCGAclient.users().info();

  Promise.all([projectPromise, userPromise]).then(function(responses) {
    var project = responses[0].result[0],
        user = responses[1].result[0];

    res.render('project', {
      'project' : project,
      'user' : user
    });
  });
});

router.get('/project/:projectId/study/:studyId', function (req, res) {
  studyPromise = openCGAclient.studies().info(req.params.studyId);
  projectPromise = openCGAclient.projects().info(req.params.projectId);
  userPromise = openCGAclient.users().info();
  filesPromise = openCGAclient.studies().files(req.params.studyId);

  Promise.all([studyPromise, projectPromise, userPromise, filesPromise]).then(function(responses) {
    var study = responses[0].result[0],
        project = responses[1].result[0],
        user = responses[2].result[0];
        files = responses[3].result;

    res.render('study', {
      'project' : project,
      'study' : study,
      'user' : user,
      'files': files
    });
  });
});

// add your routes here
module.exports = router;
