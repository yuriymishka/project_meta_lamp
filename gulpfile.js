let project_folder = 'dist';  //Оригинальный, чистый файл
let source_folder ='#src';  //Исходник

let path ={               
    build:{                        //выгрузка готовых файлов
        html: project_folder+'/',
        css: project_folder+'/css/',
        js: project_folder+'/js/',
        img: project_folder+'/img/',
        fonts: project_folder+'/fonts/',
    },
    src:{                        //смотрит исходные файлы
        html: [source_folder+'/*.html', '!' + source_folder+'/_*.html'],    //** - слушает все подпапки *.- конкретный файл
        css: source_folder+'/sass/style.sass',
        js: source_folder+'/js/script.js',
        img: source_folder+'/img/**/*.{jpg,png,svg,gif,ico,webp}',
        fonts: source_folder+'/fonts/*.ttf',
    },
    watch:{       //слушает постоянно и отлавливает налету 
        html: source_folder+'/**/*.html',
        css: source_folder+'/sass/**/*.{sass,scss,css}',
        js: source_folder+'/js/**/*.js',
        img: source_folder+'/img/**/*.{jpg,png,svg,gif,ico,webp}/',
    },
    clean: "./" + project_folder + "/" //удаление папки каждый раз при запуске gulp
}

let{src,dest} = require('gulp'),            //объявление переменных
    gulp = require("gulp"),
    browsersync = require("browser-sync").create(),
    fileinclude = require("gulp-file-include"),
    del = require("del"),
    sass = require("gulp-sass"),
    autoprefixer = require("gulp-autoprefixer"),
    media_group = require("gulp-group-css-media-queries"),
    css_clean = require("gulp-clean-css"),
    rename = require("gulp-rename"),
    uglify = require("gulp-uglify-es").default,
    imagemin = require("gulp-imagemin"),
    webp = require("gulp-webp"),
    webp_html = require('gulp-webp-html'),
    webpcss = require('gulp-webpcss');
    

function browserSync() {              //настройка browser sync
    browsersync.init({
        server:{
            baseDir: "./" + project_folder + "/"
        },
        port:3000,
        notify: false
    })
}

function html() {                                       //копирует html из #src в dist, создавая при этом папку dist
    return src(path.src.html)
        .pipe(fileinclude())                          //сборщик html  (подключение: @@include('header.html'))
        .pipe(webp_html())                            //автоматически подключает изображения
        .pipe(dest(path.build.html))
        .pipe(browsersync.stream())                    //обновляет браузер между делом                             
}

function css() {                                       //копирует css из #src в dist, создавая при этом папку dist
    return src(path.src.css)
        .pipe(
            sass({
                outputStyle: 'expanded'                 //делает обработанный файл не сжатым, а развёрнутым
            })
        )
        .pipe(
            autoprefixer({
                overrideBrowserslist: ["last 5 versions"],       //автопрефиксер
                cascade: true
            })
        )
        .pipe(media_group())                                //настройка группировки медиа запросов
        .pipe(webpcss())                                    //интеграция webp в css код, работает в паре с webpcss.js
        .pipe(dest(path.build.css))                          //выгрузка полного css файла
        .pipe(css_clean())                                  //сжатие чистого css файла
        .pipe(                                              //его переименовывание
            rename({
                extname: ".min.css"
            })
        )
        .pipe(dest(path.build.css))
        .pipe(browsersync.stream())
}

function js() {                                       
    return src(path.src.js)
        .pipe(fileinclude())
        .pipe(dest(path.build.js))                          
        .pipe(uglify())                                  //сжатие js
        .pipe(                                              
            rename({
                extname: ".min.js"
            })
        )
        .pipe(dest(path.build.js))
        .pipe(browsersync.stream())                                                 
}

function images() {                                       
    return src(path.src.img)
        .pipe(
            webp({
                quality: 70
            })
        )
        .pipe(dest(path.build.img))
        .pipe(src(path.src.img))                          
        .pipe(
            imagemin({                                              //сжатие Img
                progressive: true,
                svgoPlugins: [{ removeViewBox: false }],
                intrplaced: true,
                optimisationLevel: 3, // 0 to 7 
            })
        )
        .pipe(dest(path.build.img))                          
        .pipe(browsersync.stream())                                                 
}


function clean() {                                //удаляет папку чтобы избавиться от возможных лишних файлов                     
    return del(path.clean);
}

function watchFiles(params) {                          //настройка слежки
    gulp.watch([path.watch.html], html);
    gulp.watch([path.watch.css], css);
    gulp.watch([path.watch.js], js);
    gulp.watch([path.watch.img], images);   
}

let build = gulp.series(clean, gulp.parallel(js, css, html, images));                   //выполнение последовательных процессов
let watch = gulp.parallel(build,watchFiles,browserSync);    //выполнение параллельных процессов

exports.images = images;
exports.js = js;
exports.css = css;
exports.build = build;
exports.html = html;
exports.watch = watch;
exports.default = watch;