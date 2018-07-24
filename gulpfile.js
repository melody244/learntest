var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
// var jade = require('gulp-jade');
// var sass = require('gulp-sass');
// var plumber = require('gulp-plumber');
// var postcss = require('gulp-postcss');
var autoprefixer = require('autoprefixer');
var browserSync = require('browser-sync').create();
var mainBowerFiles = require('main-bower-files');
var minimist = require('minimist');
var gulpSequence = require('gulp-sequence');

var envOptions = {
    string: 'env',
    default: { env: 'develop'}
}
var options = minimist(process.argv.slice(2), envOptions)

gulp.task('clean', function () {
    return gulp.src(['./.tmp', './public'], {read: false})
        .pipe($.clean());
});

gulp.task('copyJS',function(){
    return gulp.src('./source/js/package/*.js')
      .pipe($.if(options.env === 'production',$.uglify({
        compress:{
            drop_console: true
        }
    })))
      .pipe(gulp.dest('./public/js'))
})

gulp.task('copyCSS',function(){
    return gulp.src('./source/scss/theme/*.css')
      .pipe($.if(options.env === 'production', $.cleanCss()))
      .pipe(gulp.dest('./public/css'))
})

gulp.task('jade', function() {
    // var YOUR_LOCALS = {};
   
    gulp.src('./source/**/*.jade')
      .pipe($.plumber())
      .pipe($.jade({
        pretty: true
      }))
      .pipe(gulp.dest('./public/'))
      .pipe(browserSync.stream());
  });

  gulp.task('sass', function () {
    var plugins = [
        autoprefixer({browsers: ['last 3 version', '> 5%', 'ie 8']})
    ];

    return gulp.src('./source/scss/*.scss')
      .pipe($.plumber())
      .pipe($.sourcemaps.init())
      .pipe($.sass().on('error', $.sass.logError))
       //編譯完成css
      .pipe($.postcss(plugins))
      .pipe($.if(options.env === 'production', $.cleanCss()))
      .pipe($.sourcemaps.write('.'))
      .pipe(gulp.dest('./public/css'))
      .pipe(browserSync.stream());
  });

  gulp.task('babel', () =>
    gulp.src('./source/js/*.js')
        .pipe($.sourcemaps.init())
        .pipe($.babel({
            presets: ['env']
        }))
        .pipe($.concat('all.js'))
        .pipe($.if(options.env === 'production',$.uglify({
            compress:{
                drop_console: true
            }
        })))
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest('./public/js'))
);

gulp.task('bower', function() {
    return gulp.src(mainBowerFiles())
        .pipe(gulp.dest('./.tmp/vendors'))
});

// gulp.task('vendorJs', ['bower'], function() {
//     return gulp.src('./.tmp/vendors/**/**.js')
//     .pipe($.concat('vendors.js'))
//     .pipe($.if(options.env === 'production',$.uglify()))
//     .pipe(gulp.dest('./public/js'))
// })

  gulp.task('browser-sync', function() {
    browserSync.init({
        server: {baseDir: "./public"},
        reloadDebounce: 2000
    });
});

gulp.task('image-min', () =>
    gulp.src('./source/images/*')
        .pipe($.if(options.env === 'production',$.imagemin()))
        .pipe(gulp.dest('./public/images'))
);

  gulp.task('watch', function () {
    gulp.watch('./source/scss/**/*.scss', ['sass']);
    gulp.watch('./source/**/*.jade', ['jade']);
    gulp.watch('./source/js/**/*.js', ['babel']);
  });

  gulp.task('deploy', function() {
    return gulp.src('./public/**/*')
      .pipe($.ghPages());
  });

  gulp.task('build', gulpSequence('clean', 'jade', 'copyJS', 'copyCSS', 'sass', 'babel'))
  gulp.task('default', ['jade', 'copyJS', 'copyCSS', 'sass', 'babel', 'browser-sync', 'image-min', 'watch']);