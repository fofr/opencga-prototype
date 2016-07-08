var express = require('express');
var router = express.Router();
var openCGAclient = require('../lib/opencga_client.js');
var User = require('./presenters/user');
var sampleAnnotationSummary = require('./processing/sample_summary');

router.get('/login', function (req, res) {
  render(res, 'login');
});

router.post('/login', function (req, res) {
  if (!req.body.username || !req.body.password) {
    res.send('login failed');
  } else {
    promise = openCGAclient.users().login(req.body.username, {password: req.body.password});
    promise.then(function(response) {
      var item = response.response[0].result[0];
      req.session.sid = item.sessionId;
      req.session.userId = item.userId;
      res.redirect('/');
    }).catch(function(response) {
      console.log('Error caught', response, response.error);
    });
  }
});

router.get('/logout', function (req, res) {
  req.session.destroy();
  res.redirect('/login');
});

router.get('/', function (req, res) {
  promise = openCGAclient.users().info(req.session.userId, {sid: req.session.sid});
  promise.then(function(response) {
    var user = response.result[0];
    var projects = response.result[0].projects;

    render(res, 'index', { 'user' : user, 'projects': projects });
  });
});

router.get('/project/:projectId', function (req, res) {
  projectPromise = openCGAclient.projects().info(req.params.projectId, {sid: req.session.sid});
  userPromise = openCGAclient.users().info(req.session.userId, {sid: req.session.sid});

  Promise.all([projectPromise, userPromise]).then(function(responses) {
    var project = responses[0].result[0],
        user = responses[1].result[0],
        studyPromises = [];

    project.studies.forEach(function(study) {
      studyPromises.push(openCGAclient.studies().summary(study.id, {sid: req.session.sid}));
    });

    Promise.all(studyPromises).then(function(responses) {
      render(res, 'project', {
        'project' : project,
        'user' : user,
        'studies': responses.map(function(response) {
          return response.result[0];
        })
      });
    });
  });
});

router.get('/project/:projectId/study/:studyId', function (req, res) {
  studyPromise = openCGAclient.studies().info(req.params.studyId, {sid: req.session.sid});
  projectPromise = openCGAclient.projects().info(req.params.projectId, {sid: req.session.sid});
  userPromise = openCGAclient.users().info(req.session.userId, {sid: req.session.sid});
  filesPromise = openCGAclient.studies().files(req.params.studyId, {sid: req.session.sid});
  samplesPromise = openCGAclient.studies().samples(req.params.studyId, {sid: req.session.sid});
  jobsPromise = openCGAclient.studies().jobs(req.params.studyId, {sid: req.session.sid});
  summaryPromise = openCGAclient.studies().summary(req.params.studyId, {sid: req.session.sid});

  Promise.all([studyPromise, projectPromise, userPromise, filesPromise, samplesPromise, jobsPromise, summaryPromise]).then(function(responses) {
    var study = responses[0].result[0],
        project = responses[1].result[0],
        user = responses[2].result[0],
        files = responses[3].result,
        samples = responses[4].result,
        jobs = responses[5].result,
        summary = responses[6].result[0];

    samples.forEach(function(sample) {
      if (typeof sample.source === "string") {
        var file = files.find(function(f) {
          return f.name === sample.source;
        });

        if (file) {
          sample.fileId = file.id;
        }

      }
    });

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

router.get('/project/:projectId/study/:studyId/samples', function (req, res) {
  var studyPromise = openCGAclient.studies().info(req.params.studyId, {sid: req.session.sid}),
      projectPromise = openCGAclient.projects().info(req.params.projectId, {sid: req.session.sid}),
      userPromise = openCGAclient.users().info(req.session.userId, {sid: req.session.sid}),
      samplesPromise, search_params;

  // TODO: Make this more reliable
  search_params = Object.assign({
    studyId: req.params.studyId,
    sid: req.session.sid}, req.query);
  samplesPromise = openCGAclient.samples().search(search_params);

  Promise.all([studyPromise, projectPromise, userPromise, samplesPromise]).then(function(responses) {
    var study = responses[0].result[0],
        project = responses[1].result[0],
        user = responses[2].result[0],
        samples = responses[3].result,
        filters = sampleAnnotationSummary(samples, req.query),
        activeFilters = {};

    for (var queryParam in req.query) {
      var annotation = queryParam.split('.')[1],
          filterQueryObject = Object.assign({}, req.query);

      delete filterQueryObject[queryParam];
      activeFilters[annotation] = {
        value: req.query[queryParam],
        filterQuery: '?' + serialize(filterQueryObject)
      }
    }

    samples.forEach(function(sample) {
      sample.annotations = {};
      for (let annotation of sample.annotationSets[0].annotations) {
        sample.annotations[annotation.name] = annotation.value;
      }
    });

    render(res, 'samples', {
      'project' : project,
      'study' : study,
      'user' : user,
      'samples': samples,
      'filters': filters,
      'activeFilters': activeFilters
    });
  });

  function serialize(obj) {
    var str = [];
    for (var p in obj) {
      if (obj.hasOwnProperty(p)) {
        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
      }
    }
    return str.join("&");
  }
});

router.get('/project/:projectId/study/:studyId/sample/:sampleId', function (req, res) {
  var studyPromise = openCGAclient.studies().info(req.params.studyId, {sid: req.session.sid}),
      projectPromise = openCGAclient.projects().info(req.params.projectId, {sid: req.session.sid}),
      userPromise = openCGAclient.users().info(req.session.userId, {sid: req.session.sid}),
      samplesPromise = openCGAclient.studies().samples(req.params.studyId, {sid: req.session.sid}),
      samplePromise = openCGAclient.samples().info(req.params.sampleId, {sid: req.session.sid});

  Promise.all([studyPromise, projectPromise, userPromise, samplesPromise, samplePromise]).then(function(responses) {
    var study = responses[0].result[0],
        project = responses[1].result[0],
        user = responses[2].result[0],
        samples = responses[3].result,
        sample = responses[4].result[0];

    render(res, 'sample', {
      'project' : project,
      'study' : study,
      'user' : user,
      'sample': sample,
      'samples': samples
    });
  });
});

router.get('/project/:projectId/study/:studyId/file/:fileId', function (req, res) {
  var studyPromise = openCGAclient.studies().info(req.params.studyId, {sid: req.session.sid}),
      projectPromise = openCGAclient.projects().info(req.params.projectId, {sid: req.session.sid}),
      userPromise = openCGAclient.users().info(req.session.userId, {sid: req.session.sid}),
      filePromise = openCGAclient.files().info(req.params.fileId, {sid: req.session.sid});

  Promise.all([studyPromise, projectPromise, userPromise, filePromise]).then(function(responses) {
    var study = responses[0].result[0],
        project = responses[1].result[0],
        user = responses[2].result[0],
        file = responses[3].result[0];

    render(res, 'file', {
      'project' : project,
      'study' : study,
      'user' : user,
      'file': file
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
      val = {array: val.slice(0,5), total: val.length};
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
