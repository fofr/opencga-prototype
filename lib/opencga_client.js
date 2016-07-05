var fs = require('fs');
var vm = require('vm');
var request = require('request');

// https://nodejs.org/api/vm.html
opencga_path = __dirname + '/jsorolla/src/lib/clients/opencga-client.js';
opencga_config_path = __dirname + '/jsorolla/src/lib/clients/opencga-client-config.js';

opencga_filedata = fs.readFileSync(opencga_path, 'utf8');
opencga_config_filedata = fs.readFileSync(opencga_config_path, 'utf8');

const opencga_script = new vm.Script(opencga_filedata, { filename: opencga_path });
const opencga_config_script = new vm.Script(opencga_config_filedata, { filename: opencga_config_path });

Cookies = {
  set: function() {
    console.log('set cookies', arguments);
  },
  get: function() {
    console.log('get cookies', arguments);
  }
};

RestClient = class RestClient {
  static call(url, options) {
    console.log('call', url, options);
  }

  static callPromise(url, options) {
    var request_options = {
      method: options.method || 'GET',
      uri: url
    };

    if (typeof options.data !== "undefined") {
      request_options.json = options.data;
    }

    return new Promise(function(resolve, reject) {
      request(request_options, function(error, response, body) {
        if (!error && response.statusCode == 200) {
          resolve(body);
        } else if (!error) {
          console.log('rejecting', body);
          reject(body);
        } else {
          reject("An error occurred when calling to '" + url + "'");
        }
      });
    });
  }
}

opencga_script.runInThisContext();
opencga_config_script.runInThisContext();

module.exports = {
  RestClient: RestClient,
  OpenCGAClientConfig: OpenCGAClientConfig,
  OpenCGAClient: OpenCGAClient,
  OpenCGAParentClass: OpenCGAParentClass,
  Users: Users,
  Projects: Projects,
  Studies: Studies,
  Files: Files,
  Jobs: Jobs,
  Individuals: Individuals,
  Samples: Samples,
  Variables: Variables,
  Cohorts: Cohorts,
  Panels: Panels
}
