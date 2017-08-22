var paths = require('../paths');
var swPrecache = require('sw-precache');
var $ = require('gulp-load-plugins')();
var gulp = require('gulp');
gulp.task('generate-service-worker', function (callback) {
    // swPrecache.write(paths.output + '/service-worker.js', {
    //     staticFileGlobs: [paths.source + '/**/*.{js,html,css,png,jpg,gif,svg,eot,ttf,woff}'],
    //     stripPrefix: paths.output
    // }, callback);


    var config = {
        cacheId: 'practical-aurelia',
        /*
        dynamicUrlToDependencies: {
          'dynamic/page1': [
            path.join(rootDir, 'views', 'layout.jade'),
            path.join(rootDir, 'views', 'page1.jade')
          ],
          'dynamic/page2': [
            path.join(rootDir, 'views', 'layout.jade'),
            path.join(rootDir, 'views', 'page2.jade')
          ]
        },
        */
        // If handleFetch is false (i.e. because this is called from generate-service-worker-dev), then
        // the service worker will precache resources but won't actually serve them.
        // This allows you to test precaching behavior without worry about the cache preventing your
        // local changes from being picked up during the development cycle.
        handleFetch: false,
        // logger: $.util.log,
        runtimeCaching: [{
            // See https://github.com/GoogleChrome/sw-toolbox#methods
            urlPattern: /runtime-caching/,
            handler: 'cacheFirst',
            // See https://github.com/GoogleChrome/sw-toolbox#options
            options: {
                cache: {
                    maxEntries: 1,
                    name: 'runtime-cache'
                }
            }
        }],
        staticFileGlobs: [
            paths.output + '/**/**.css',
            paths.output + '/**/**.html',
            paths.output + '/images/**.*',
            paths.output + '/**/**.js',
            // 'jspm_packages/**/*.js',
            // 'jspm_packages/**/*.css',

        ],
        stripPrefix: paths.output,
        // verbose defaults to false, but for the purposes of this demo, log more.
        verbose: true
    };

    swPrecache.write(paths.output + 'service-worker.js', config, callback);
});
