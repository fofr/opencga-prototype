var sampleAnnotationSummary = function(samples) {
  var summary = {},
      sampleAnnotations;

  sampleAnnotations = samples.map(function(sample) {
    return sample.annotationSets[0].annotations;
  });

  sampleAnnotations.forEach(function(sampleAnnotation) {
    sampleAnnotation.forEach(function(annotation) {
      if (annotation.name !== 'id' && annotation.name !== 'name') {
        summary[annotation.name] = summary[annotation.name] || {};
        summary[annotation.name][annotation.value] = summary[annotation.name][annotation.value] + 1 || 1;
      }
    });
  });

  return summary;
}

module.exports = sampleAnnotationSummary;
