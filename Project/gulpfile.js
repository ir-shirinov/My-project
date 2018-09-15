"use strict";


var autoprefixer = require("autoprefixer");
var browserSync = require("browser-sync").create();
var del = require("del");
var gulp = require("gulp");
var csso = require("gulp-csso");
var include = require("gulp-file-include");
var htmlmin = require('gulp-htmlmin');
var imagemin = require("gulp-imagemin");
var plumber = require("gulp-plumber");
var postcss = require("gulp-postcss");
var rename = require("gulp-rename");
var sass = require("gulp-sass");
var svgstore = require("gulp-svgstore");
var uglify = require('gulp-uglify');
var webp = require("gulp-webp");
var pump = require('pump');
var run = require("run-sequence");
var cheerio = require('gulp-cheerio');

var path = {
    build: { //Тут мы укажем куда складывать готовые после сборки файлы
        html: 'build/',
        js: 'build/js/',
        script : 'build/js/script.min.js',
        css: 'build/css/',
        img: 'build/img/',
        fonts: 'build/fonts/'
    },
    src: { //Пути откуда брать исходники
        html: '*.html', //Синтаксис src/*.html говорит gulp что мы хотим взять все файлы с расширением .html
        js: 'js/script.js',//В стилях и скриптах нам понадобятся только main файлы
        style: 'scss/style.scss',
        img: 'src/img/**/*.*', //Синтаксис img/**/*.* означает - взять все файлы всех расширений из папки и из вложенных каталогов
        imgsprite : 'img/**/sprite-*.svg', //файлы для svg спрайтов
        imgorigin : 'original-img/**/*.{png,jpg,svg}', //оригиналы изображений безсжатия
        imgwebp: 'original-img/**/webp-*.{png,jpg}' //файлы для webp
        fonts: 'src/fonts/**/*.*'
    },
    watch: { //Тут мы укажем, за изменением каких файлов мы хотим наблюдать
        html: "['/**/*.html', '!/build/**/*.html']",
        js: 'js/**/*.js',
        style: "sass/**/*.{scss,sass}",
        img: 'img/**/*.*',
        fonts: 'fonts/**/*.*'
    },
    site: "./build" // Папка для сервера
};

gulp.task("server", function() {
  browserSync.init({
    server: path.site,
    notify: false,
    open: true,
    cors: true,
    ui: false
  });

  gulp.watch(path.watch.style, ["style"]);
  gulp.watch(path.watch.html, ["html"]);
  gulp.watch(path.watch.js, ["js", "compress"]).on("change", browserSync.reload);
  gulp.watch(path.watch.img, ["copy"]).on("change", browserSync.reload);
});


gulp.task("html", function(){
  return gulp.src(path.src.html)
    .pipe(fileinclude({
      prefix: '@@',
      basepath: '@file'
    }))
    .pipe(gulp.dest(path.build.html))
    .pipe(htmlmin({collapseWhitespace: true}))
    .pipe(rename(function (path) {
      path.basename += ".min";
    }))
    .pipe(gulp.dest(path.build.html))
    .pipe(browserSync.stream());
})

gulp.task("js", function(){
  return gulp.src(path.src.js)
    .pipe(fileinclude({
      prefix: '@@',
      basepath: '@file'
    }))
    .pipe(gulp.dest(path.build.js))
    .pipe(rename(function (path) {
      path.basename += ".min";
    }))
    .pipe(gulp.dest(path.build.js))
})


gulp.task("compressjs", function (done) {
  pump([
        gulp.src(path.build.script),
        uglify(),
        gulp.dest(path.build.js)
    ],
    done
  );
});

gulp.task("style", function() {
  gulp.src(path.src.style)
    .pipe(plumber())
    .pipe(sass())
    .pipe(postcss([
      autoprefixer()
    ]))
    .pipe(gulp.dest(path.build.css))
    .pipe(csso())
    .pipe(rename(function (path) {
      path.basename += ".min";
    }))
    .pipe(gulp.dest(path.build.css))
    .pipe(browserSync.stream());
});

gulp.task("sprite", function(){
  return gulp.src(path.src.imgsprite)
    .pipe(cheerio({
            run: function ($) {
                $('[fill]').removeAttr('fill');
            },
            parserOptions: { xmlMode: true }
    }))
    .pipe(svgstore({
      inlineSvg: true
    }))
    .pipe(rename("sprite.svg"))
    .pipe(gulp.dest(path.build.img));
})


gulp.task("copy", function(){
  return gulp.src([
    path.src.fonts,
    path.src.img
  ], {
    base: "."
  })
  .pipe(gulp.dest(path.site));
})

gulp.task("clean", function(){
  return del(path.site);
  })

gulp.task("images", function() {
  return gulp.src(path.src.imgorigin)
    .pipe(imagemin([
      imagemin.optipng({optimizationLevel: 3}),
      imagemin.jpegtran({progressive: true}),
      imagemin.svgo()
    ]))
    .pipe(gulp.dest(path.build.img));
});

gulp.task("webp", function(){
  return gulp.src(path.src.imgwebp)
    .pipe(webp({quality:90}))
    .pipe(gulp.dest("img/"));
});

gulp.task("build", function(done) {
  run(
    "clean",
    "copy",
    "js",
    "compressjs",
    "style",
    "sprite",
    "html",
    done
  );
});

gulp.tasl("imagemin", function(done){
  run(
    "images",
    "webp",
    done
  );
});
