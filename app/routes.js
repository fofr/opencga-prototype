var express = require('express');
var router = express.Router();
var OpenCGA = require('../lib/opencga_client.js');
var sampleAnnotationSummary = require('./processing/sample_summary');

// http://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable
function humanFileSize(bytes) {
  var thresh = 1000;

  if (bytes < 10) {
    return null;
  }

  if (Math.abs(bytes) < thresh) {
      return bytes + ' B';
  }
  var units = ['KB','MB','GB','TB','PB','EB','ZB','YB'],
      u = -1;

  do {
      bytes /= thresh;
      ++u;
  } while(Math.abs(bytes) >= thresh && u < units.length - 1);

  return bytes.toFixed(u > 1 ? 1 : 0) + ' ' + units[u];
}

// Authentication and Authorization Middleware
var auth = function(req, res, next) {
  res.locals.params = {};

  if (req.session && req.session.sid && req.session.userId) {
    var config = new OpenCGA.OpenCGAClientConfig(req.session.server, 'v1', 'opencga_sId', 'opencga_userId');
    var client = new OpenCGA.OpenCGAClient(config);

    res.locals.client = client;

    userPromise = client.users().info(req.session.userId, {sid: req.session.sid});
    userPromise.then(function(response) {
      res.locals.params.user = response.result[0];
      return next();
    }).catch(next);
  } else {
    res.redirect('/login');
  }
};

var project = function(req, res, next) {
  getResource(req, res, next, {
    param: 'project',
    clientType: 'projects',
    clientMethod: 'info',
    id: req.params.projectId
  });
};

var study = function(req, res, next) {
  getResource(req, res, next, {
    param: 'study',
    clientType: 'studies',
    clientMethod: 'info',
    id: req.params.studyId,
    responseCallback: function(response) {
      response.result[0].fileSize = humanFileSize(response.result[0].diskUsage);
    }
  });
};

var files = function(req, res, next) {
  getResource(req, res, next, {
    param: 'files',
    clientType: 'studies',
    clientMethod: 'files',
    id: req.params.studyId,
    returnArray: true,
    responseCallback: function(response) {
      response.result.forEach(function(result) {
        result.pathParts = result.path.split('/');
        result.fileSize = humanFileSize(result.diskUsage);
      });
    }
  });
};

var jobs = function(req, res, next) {
  getResource(req, res, next, {
    param: 'jobs',
    clientType: 'studies',
    clientMethod: 'jobs',
    id: req.params.studyId,
    returnArray: true
  });
};

var samples = function(req, res, next) {
  getResource(req, res, next, {
    param: 'samples',
    clientType: 'studies',
    clientMethod: 'samples',
    id: req.params.studyId,
    returnArray: true
  });
};

var getResource = function(req, res, next, options) {
  var options = options || {};
  res.locals.params = res.locals.params || {};
  promise = res.locals.client[options.clientType]()[options.clientMethod](options.id, {sid: req.session.sid});
  promise.then(function(response) {
    if (typeof options.responseCallback === "function") {
      options.responseCallback(response);
    }

    if (options.returnArray) {
      res.locals.params[options.param] = response.result;
    } else {
      res.locals.params[options.param] = response.result[0];
    }

    return next();
  }).catch(next);
};

router.get('/login', function (req, res, next) {
  render(res, 'login');
});

router.post('/login', function (req, res, next) {
  if (!req.body.username || !req.body.password || !req.body.server) {
    render(res, 'login', {
      error: "Please provide a username, password and server",
      server: req.body.server,
      username: req.body.username
    });
  } else {
    // Strip trailing slash and protocol from user entry
    var server = req.body.server.replace(/\/$/, "").replace(/.*?:\/\//g, "");
    var config = new OpenCGA.OpenCGAClientConfig(server, 'v1', 'opencga_sId', 'opencga_userId');
    var client = new OpenCGA.OpenCGAClient(config);

    promise = client.users().login(req.body.username, {password: req.body.password});
    promise.then(function(response) {
      var item = response.response[0].result[0];
      req.session.sid = item.sessionId;
      req.session.userId = item.userId;
      req.session.server = server;
      res.redirect('/');
    }).catch(function(response) {
      console.log('Error caught', response, response.error);
      render(res, 'login', {
        error: typeof response ==="string" ? response : response.error,
        server: req.body.server,
        username: req.body.username
      });
    });
  }
});

router.get('/logout', function (req, res, next) {
  req.session.destroy();
  res.redirect('/login');
});

router.get('/', auth, function (req, res, next) {
  render(res, 'index');
});

router.get('/project/:projectId', auth, project, function (req, res, next) {
  var project = res.locals.params.project,
      studyPromises = [];

  project.studies.forEach(function(study) {
    studyPromises.push(res.locals.client.studies().summary(study.id, {sid: req.session.sid}));
  });

  Promise.all(studyPromises).then(function(responses) {
    render(res, 'project', {
      'studies': responses.map(function(response) {
        response.result[0].fileSize = humanFileSize(response.result[0].diskUsage);
        return response.result[0];
      })
    });
  }).catch(next);
});

router.get('/project/:projectId/study/:studyId', auth, project, study, function (req, res, next) {
  var promise = res.locals.client.studies().summary(req.params.studyId, {sid: req.session.sid});
  promise.then(function(response) {
    render(res, 'study', { 'summary': response.result[0] });
  }).catch(next);;
});

router.get('/project/:projectId/study/:studyId/files', auth, project, study, files, function (req, res, next) {
  render(res, 'files');
});

router.get('/project/:projectId/study/:studyId/jobs', auth, project, study, jobs, function (req, res, next) {
  render(res, 'jobs');
});

router.get('/project/:projectId/study/:studyId/samples', auth, project, study, function (req, res, next) {
  var study = res.locals.params.study,
      variableSets = study.variableSets,
      promise, search_params;

  // TODO: Make this more reliable
  search_params = Object.assign({
    studyId: req.params.studyId,
    sid: req.session.sid}, req.query);

  if (variableSets && variableSets.length > 0) {
    search_params['variableSetId'] = variableSets[0].id;
  }

  promise = res.locals.client.samples().search(search_params);

  promise.then(function(response) {
    var samples = response.result,
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
      var sets = sample.annotationSets;
      sample.annotations = {};

      if (sets && sets.length > 0) {
        for (let annotation of sets[0].annotations) {
          sample.annotations[annotation.name] = annotation.value;
        }
      }
    });

    render(res, 'samples', {
      'samples': samples,
      'filters': filters,
      'activeFilters': activeFilters
    });
  }).catch(next);

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

router.get('/project/:projectId/study/:studyId/sample/:sampleId', auth, project, study, samples, function (req, res, next) {
  var promise = res.locals.client.samples().info(req.params.sampleId, {sid: req.session.sid});
  promise.then(function(response) {
    render(res, 'sample', { 'sample': response.result[0] });
  }).catch(next);;
});

router.get('/project/:projectId/study/:studyId/file/:fileId', auth, project, study, function (req, res, next) {
  var promise = res.locals.client.files().info(req.params.fileId, {sid: req.session.sid});
  promise.then(function(response) {
    render(res, 'file', { 'file': response.result[0] });
  }).catch(next);;
});

function render(res, template, params) {
  var params = Object.assign(res.locals.params || {}, params),
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
      console.log('Could not parse JSON for ' + key, ex);
    }
  });

  params.json_objects = objects;
  res.render(template, params);
}

module.exports = router;
