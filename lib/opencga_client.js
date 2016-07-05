var fs = require('fs');
var vm = require('vm');
var request = require('request');
var Session = require('./session.js');
var session;
var cache = {};

_ = require('underscore-node');

// https://nodejs.org/api/vm.html
opencga_path = __dirname + '/jsorolla/src/lib/clients/opencga-client.js';
opencga_config_path = __dirname + '/jsorolla/src/lib/clients/opencga-client-config.js';

opencga_filedata = fs.readFileSync(opencga_path, 'utf8');
opencga_config_filedata = fs.readFileSync(opencga_config_path, 'utf8');

const opencga_script = new vm.Script(opencga_filedata, { filename: opencga_path });
const opencga_config_script = new vm.Script(opencga_config_filedata, { filename: opencga_config_path });

Cookies = {
  set: function() {},
  get: function() {
    if (session && arguments[0] == "opencga_sId") {
      return session.sessionId;
    }

    if (session && arguments[0] == "opencga_userId") {
      return session.userId;
    }
  }
};

RestClient = class RestClient {
  static call(url, options) {
    console.log('call', url, options);
  }

  static callPromise(url, options) {
    var options = options || {},
        request_options = {
          method: options.method || 'GET',
          uri: url,
          json: true
        };

    if (options.method === 'POST' && typeof options.data !== "undefined") {
      request_options.json = options.data;
    }

    return new Promise(function(resolve, reject) {
      console.log('New request', request_options);

      if (cache[request_options.uri]) {
        console.log('Serving from cache');
        resolve(cache[request_options.uri]);
      } else {
        request(request_options, function(error, response, body) {
          if (!error && response.statusCode == 200) {
            console.log('resolving', body);
            if (request_options.method === "GET") {
              cache[request_options.uri] = body.response[0];
            }

            resolve(body.response[0]);
          } else if (!error) {
            console.log('rejecting', body);
            reject(body);
          } else {
            reject("An error occurred when calling to '" + url + "'");
          }
        });
      }
    });
  }
}

opencga_script.runInThisContext();
opencga_config_script.runInThisContext();

// Create OpenCGA config
var config = new OpenCGAClientConfig('squalet.hpc.cam.ac.uk:8080/opencga', 'v1', 'opencga_sId', 'opencga_userId');
var openCGAClient = new OpenCGAClient(config);

if (process.env.SID) {
  session = new Session(process.env.SID, 'user1');
} else {
  var password = process.env.PASSWORD;
  openCGAClient.users().login('user1', {password: password}).then(function(response) {
    var item = response.result[0];
    session = new Session(item.sessionId, item.userId);
  }).catch(function(response) {
    console.log(response.error);
  });
}

module.exports = openCGAClient;
