var express = require('express');
var router = express.Router();
var openCGAclient = require('../lib/opencga_client.js');
var User = require('./presenters/user');

router.get('/', function (req, res) {
  promise = openCGAclient.users().info();
  promise.then(function(response) {
    var user = response.result[0];
    var projects = response.result[0].projects;

    render(res, 'index', { 'user' : user, 'projects': projects });
  });
});

router.get('/project/:projectId', function (req, res) {
  projectPromise = openCGAclient.projects().info(req.params.projectId);
  userPromise = openCGAclient.users().info();

  Promise.all([projectPromise, userPromise]).then(function(responses) {
    var project = responses[0].result[0],
        user = responses[1].result[0];

    render(res, 'project', {
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
  samplesPromise = openCGAclient.studies().samples(req.params.studyId);
  jobsPromise = openCGAclient.studies().jobs(req.params.studyId);
  summaryPromise = openCGAclient.studies().summary(req.params.studyId);

  Promise.all([studyPromise, projectPromise, userPromise, filesPromise, samplesPromise, jobsPromise, summaryPromise]).then(function(responses) {
    var study = responses[0].result[0],
        project = responses[1].result[0],
        user = responses[2].result[0],
        files = responses[3].result,
        samples = responses[4].result,
        jobs = responses[5].result,
        summary = responses[6].result[0];

    render(res, 'study', {
      'project' : project,
      'study' : study,
      'user' : user,
      'files': files,
      'samples': samples,
      'jobs': jobs,
      'summary': summary
    });
  });
});


function render(res, template, params) {
  var params = params || {},
      objects = [];

  Object.keys(params).forEach(function(key) {
    var val = params[key],
        o;

    if (Array.isArray(val)) {
      val = {array: val};
    }

    try {
      o = {
        key: key,
        json: JSON.stringify(val, function(key, value) {
          if (typeof value === "string") {
            return value.replace(/"/g, '\\\"');
          }
          return value;
        })
      };

      objects.push(o);
    } catch (ex) {
      console.log('Could not parse JSON for ' + key);
      console.log(ex);
    }
  });

  params.json_objects = objects;
  res.render(template, params);
}

module.exports = router;
