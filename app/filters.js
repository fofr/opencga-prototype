var moment = require('moment'),
    pluralize = require('pluralize');

module.exports = function(env) {
  var filters = {};

  filters.date = function(dateString) {
    return moment(dateString).format('D MMM Y');
  }

  filters.pluralize = function(string, number) {
    return pluralize(string, number);
  }

  return filters;

};
