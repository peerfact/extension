const gulp = require('gulp');
const zip = require('gulp-zip');
const watch = require('gulp-watch');
 
gulp.task('default', () => {
	return gulp.src(['src/*', 'lib/*', 'Chrome/*', 'assets/*'])
		.pipe(gulp.dest('dist/dev'));
});
 
gulp.task('prod', () => {
	return gulp.src(['src/*', 'lib/*', 'Chrome/*', 'assets/*'])
		.pipe(zip('peerfact.zip'))
		.pipe(gulp.dest('dist'));
});
 
gulp.task('watch', () => {
	return gulp.src(['src/*', 'lib/*', 'Chrome/*', 'assets/*'])
		.pipe(watch('src/*'))
		.pipe(gulp.dest('dist/dev'));
});