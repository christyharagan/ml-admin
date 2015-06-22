var gulp = require('gulp')
var mocha = require('gulp-mocha')

gulp.task('test', ['compile'], function() {
  return gulp.src('./dist/test/**/*.js', { read: false })
    .pipe(mocha());
})
