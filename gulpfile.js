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

gulp.task('copyHTML',function(){
    return gulp.src('./source/**/*.html')
      .pipe(gulp.dest('./public/'))
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

  gulp.task('babel', function () {
    return gulp.src(['./source/javascripts/**/*.js'])
      .pipe($.plumber())
      .pipe($.sourcemaps.init())
      .pipe($.concat('all.js'))
      .pipe($.babel({
        presets: ['es2015']
      }))
      .pipe(
          $.if(options.env === 'production', $.uglify({
            compress: {
              drop_console: true
            }
          })
        )
      )
      .pipe($.sourcemaps.write('.'))
      .pipe(gulp.dest('./public/js'))
      .pipe(browserSync.reload({
        stream: true
      }));
  });

gulp.task('bower', function() {
    return gulp.src(mainBowerFiles())
    .pipe(gulp.dest('./.tmp/vendors'));
    cb(err);
});

gulp.task('vendorJs', ['bower'], function () {
    return gulp.src([
      './.tmp/vendors/**/**.js',
      './node_modules/bootstrap/dist/js/bootstrap.bundle.min.js'
    ])
    .pipe($.order([
      'jquery.js'
    ]))
    .pipe($.concat('vendor.js'))
    .pipe($.if(options.env === 'production', $.uglify()))
    .pipe(gulp.dest('./public/js'))
  })

  gulp.task('sass', function () {
    // PostCSS AutoPrefixer
    var processors = [
      autoprefixer({
        browsers: ['last 5 version'],
      })
    ];
  
    return gulp.src(['./source/stylesheets/**/*.sass', './source/stylesheets/**/*.scss'])
      .pipe($.plumber())
      .pipe($.sourcemaps.init())
      .pipe($.sass({ 
        outputStyle: 'nested',
        includePaths: ['./node_modules/bootstrap/scss']
      })
        .on('error', $.sass.logError))
      .pipe($.postcss(processors))
      .pipe($.if(options.env === 'production', $.minifyCss())) // 假設開發環境則壓縮 CSS
      .pipe($.sourcemaps.write('.'))
      .pipe(gulp.dest('./public/css'))
      .pipe(browserSync.reload({
        stream: true
      }));
  });

  gulp.task('image-min', () =>
    gulp.src('./source/images/*')
        .pipe($.if(options.env === 'production',$.imagemin()))
        .pipe(gulp.dest('./public/images'))
);

  gulp.task('browser-sync', function() {
    browserSync.init({
        server: {baseDir: "./public"},
        reloadDebounce: 2000
    });
});

gulp.task('watch', function () {
    gulp.watch(['./source/stylesheets/**/*.sass', './source/stylesheets/**/*.scss'], ['sass']);
    gulp.watch(['./source/**/*.jade'], ['jade']);
    gulp.watch(['./source/js/**/*.js'], ['babel']);
  });

  gulp.task('deploy', function() {
    return gulp.src('./public/**/*')
      .pipe($.ghPages());
  });

  gulp.task('build', gulpSequence('clean', 'jade', 'sass', 'babel', 'vendorJs', 'imageMin'))
  gulp.task('default', ['jade', 'sass', 'babel', 'vendorJs', 'browser-sync', 'image-min', 'watch']);