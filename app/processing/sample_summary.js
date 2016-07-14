var sampleAnnotationSummary = function(samples, queryParams) {
  var summary = {},
      sampleAnnotations;

  sampleAnnotations = samples.filter(function(sample) {
    return sample.annotationSets && sample.annotationSets.length > 0;
  }).map(function(sample) {
    return sample.annotationSets[0].annotations;
  });

  sampleAnnotations.forEach(function(sampleAnnotation) {
    sampleAnnotation.forEach(function(annotation) {
      var name = annotation.name,
          value = annotation.value,
          filterQuery = {};

      if (name !== 'id' && name !== 'name') {
        filterQuery['annotation.' + name] = value;
        summary[name] = summary[name] || {};
        summary[name][value] = summary[name][value] || {
          count: 0,
          active: false,
          filterQuery: '?' + serialize(Object.assign(filterQuery, queryParams))
        };
        summary[name][value].count = summary[name][value].count + 1;

        if (queryParams['annotation.' + name] && queryParams['annotation.' + name] == value) {
          summary[name][value].active = true;
        }
      }
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

  return summary;
}

module.exports = sampleAnnotationSummary;
