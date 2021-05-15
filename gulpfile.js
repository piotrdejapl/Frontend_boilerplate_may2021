const { src, dest, series, watch } = require('gulp');
const browserSync = require('browser-sync').create();
const scss = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const autoprefixer = require('autoprefixer')
const postcss = require('gulp-postcss');
const debug = require('gulp-debug');
var $ = require('gulp-load-plugins')();
const sharpResponsive = require("gulp-sharp-responsive");
const imagemin = require('gulp-imagemin');
const imageminPngquant = require('imagemin-pngquant');
const srcset = require('gulp-responsive-imgzz');
const replace = require('gulp-replace');


// File paths
const files = { 
    scssPath: './app/scss/**/*.scss',
    jsPath: './app/js/**/*.js',
    imgPath: './app/img/*.+(jpg|png|gif|jpeg|svg)',
    htmlPath: './app/*.html'
}


// scss Task
function scssTask(done) {
    src(files.scssPath)
    .pipe(sourcemaps.init())
    .pipe(scss({
        /* outputStyle: 'compressed', */
        includePaths: ['node_modules/susy/sass']
    }).on('error', scss.logError))
    .pipe(
      postcss([
        autoprefixer({ grid: true, browserslistrc: ["> 5%", "last 4 versions"] })
      ])
    )
    .pipe(sourcemaps.write('.'))
    .pipe(dest('./dist/css'))
    .pipe(browserSync.stream());    
    done();
}


// JS task
function jsTask(){
    return src([
        files.jsPath
        //,'!' + 'includes/js/jquery.min.js', // to exclude any specific files
        ])
        .pipe(dest('./dist/js')
    );
}



// cache busting Task
var cbString = new Date().getTime();
function cacheBustTask(){
    return src(['./dist/index.html'])
        .pipe(replace(/cb=\d+/, 'cb=' + cbString))
        .pipe(dest('./dist'));
}



// image Task
function imgTask() {
      return src(files.imgPath)
    .pipe(sharpResponsive({
        formats: [
        // jpeg
        { width: 640, format: "jpeg", rename: { suffix: "-sm" } },
        { width: 768, format: "jpeg", rename: { suffix: "-md" } },
        { width: 1024, format: "jpeg", rename: { suffix: "-lg" } },
        ],
        includeOriginalFile: true,            
    }))
     .pipe($.cached('./dist/img'))
    .pipe(imagemin([
        imagemin.gifsicle({interlaced: true}),
        imagemin.mozjpeg({quality: 75, progressive: true}),
        imageminPngquant([[0.8, 0.9]]),
        imagemin.svgo({
            plugins: [
                {removeViewBox: true},
                {cleanupIDs: false}
            ]
        })
    ], {
        verbose: true
    }))       
    .pipe(dest('./dist/img'))
    .pipe(debug({title: 'pliki-przeniesone:'}))    
}




// SrcSet Task
function srcSet() {
      return src(files.htmlPath)
    .pipe(srcset({
      suffix: {
        '480w': '-sm',
        '768w': '-md',
        '1024w': '-lg'
      }
    })
    )
    .on('error', function(e) {
      console.log(e.message);
    })
    .pipe(dest('./dist'));
}



// Watch Task
function watchTask() {
    browserSync.init({
        server: {
            baseDir: 'dist/'
        },
        browser: "Chrome"        
    });
    watch(files.scssPath, series(scssTask, cacheBustTask));        
    watch(files.jsPath).on('change', series(jsTask,browserSync.reload, cacheBustTask));    
    watch(files.imgPath, imgTask);    
    watch(files.htmlPath).on('change', series(srcSet,browserSync.reload));
}




exports.default = watchTask;