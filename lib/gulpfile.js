const fs = require('fs');
const path = require('path');
const gulp = require('gulp');
const log = require('fancy-log');
const less = require('gulp-less');
const minifyCSS = require('gulp-csso');
const autoprefixer = require('gulp-autoprefixer');
const plumber = require('gulp-plumber');
const iconfont = require('gulp-iconfont');
const iconfontCss = require('gulp-iconfont-css');
const mdpack = require('mdpack');
const buildHome = require('./tasks/home');
const root = process.cwd();

function build() {
  const metadata = JSON.parse(fs.readFileSync(path.resolve(root, 'postMap.json'), 'utf8'));
  const myInfo = JSON.parse(fs.readFileSync(path.resolve(root, 'my.json'), 'utf8'));

  fs.readdirSync(path.resolve(root, '_posts'))
  .filter(m => fs.statSync(path.resolve(root, '_posts', m)).isDirectory())
  .forEach((year) => {
    fs.readdirSync(path.resolve(root, '_posts', year))
      .forEach((post) => {
        const filename = post.split('.md')[0];
        const _meta = metadata.post.find(_m => _m.filename === filename).metadata;
        const mdConfig = {
          entry: path.resolve(root, '_posts', year, post),
          output: {
            path: path.resolve(root, 'blog', year, filename),
            name: 'index'
          },
          format: ['html'],
          plugins: [
            new mdpack.plugins.mdpackPluginRemoveHead()
          ],
          template: path.resolve(__dirname, 'tasks/template.html'),
          resources: {
            markdownCss: '/static/css/markdown.css',
            highlightCss: '/static/css/highlight.css',
            title: _meta.title,
            author: _meta.author,
            type: _meta.type,
            intro: _meta.intro,
            homepage: myInfo.homepage,
            name: myInfo.name
          }
        };
        mdpack(mdConfig);
      });
  });
}

gulp.task('css', () => {
  log('Compile less.');
  return gulp.src(path.resolve(root, 'static/less/*.less'))
    .pipe(plumber())
    .pipe(less())
    .pipe(minifyCSS())
    .pipe(autoprefixer({
      browsers: ['last 2 versions'],
      cascade: false
    }))
    .pipe(gulp.dest(path.resolve(root, 'static/css')));
});

gulp.task('cssDev', () => {
  log('Starting watch less files...');
  return gulp.watch(path.resolve(root, 'static/less/*.less'), ['css']);
});

gulp.task('mdDev', () => {
  log('Starting watch markdown files...');
  return gulp.watch(path.resolve(root, '_posts/**/*.md'), ['home', 'blog']);
});

gulp.task('home', buildHome);

gulp.task('blog', build);

gulp.task('default', ['build']);

// dev mode
gulp.task('dev', ['cssDev', 'mdDev']);

gulp.task('build', ['css', 'home', 'blog']);

gulp.task('fonts', () => {
  console.log('Task: [Generate icon fonts and stylesheets and preview html]');
  return gulp.src([path.resolve(root, 'static/iconfonts/svgs/**/*.svg')])
    .pipe(iconfontCss({
      fontName: 'icons',
      path: 'css',
      targetPath: 'icons.css',
      cacheBuster: Math.random()
    }))
    .pipe(iconfont({
      fontName: 'icons',
      prependUnicode: true,
      fontHeight: 1000,
      normalize: true
    }))
    .pipe(gulp.dest(path.resolve(root, 'static/iconfonts/icons')));
});
          