var moment = require('moment'),
    pluralize = require('pluralize'),
    slug = require('slug');

module.exports = function(env) {
  var filters = {};

  filters.date = function(dateString) {
    return moment(dateString).format('D MMM Y');
  }

  filters.pluralize = function(string, number) {
    return pluralize(string, number);
  }

  filters.slug = function(string) {
    return slug(string);
  }

  filters.objectLength = function(obj) {
    return Object.keys(obj).length;
  }

  return filters;

};
