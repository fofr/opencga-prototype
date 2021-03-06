var fs = require('fs');
var vm = require('vm');
var request = require('request');
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
  get: function() { return; }
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
      if (cache[request_options.uri]) {
        console.log('Cache: ', request_options.uri);
        resolve(cache[request_options.uri]);
      } else {
        request(request_options, function(error, response, body) {
          if (!error && response.statusCode == 200) {
            if (request_options.method === "GET") {
              cache[request_options.uri] = body.response[0];
            }

            if(/login/.test(request_options.uri)) {
              resolve(body);
            } else {
              resolve(body.response[0]);
            }
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

module.exports = {OpenCGAClient: OpenCGAClient, OpenCGAClientConfig: OpenCGAClientConfig};
