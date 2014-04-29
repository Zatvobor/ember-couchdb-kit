'use strict';

module.exports = function (grunt) {

  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    coffee: {
      compileSources: {
        expand: true,
        flatten: true,
        src: ['src/*.coffee'],
        dest: 'src/js/',
        ext: '.js'
      },
      compileSpecs: {
        expand: true,
        flatten: true,
        src: ['spec/coffeescripts/*.coffee'],
        dest: 'spec/javascripts/',
        ext: '.js'
      }
    },
    concat: {
      options: {
        separator: ';'
      },
      dist: {
        src: [
          'src/js/ember-couchdb-kit.js',
          'src/js/document-adapter.js',
          'src/js/attachment-adapter.js',
          'src/js/revs-adapter.js',
          'src/js/registry.js',
          'src/js/changes-feed.js'
        ],
        dest: 'dist/ember-couchdb-kit.js'
      }
    },
    uglify: {
      minify_distribution: {
        files: {
          'dist/ember-couchdb-kit.min.js': ['dist/ember-couchdb-kit.js']
        }
      }
    },
    karma: {
      unit: {
        options: {
          frameworks: ['jasmine'],
          browsers: ['PhantomJS'],
          captureTimeout: 60000,
          keepalive: true,
          autoWatch: true,
          singleRun: false,
          files: [
            'bower_components/jquery/jquery.js',
            'bower_components/handlebars/handlebars.js',
            'bower_components/ember/ember.js',
            'bower_components/ember-data/ember-data.js',
            'dist/ember-couchdb-kit.js',
            'spec/javascripts/env.js',
            'spec/javascripts/*_spec.js'
          ]
        }
      }
    },
    clean: [
      'dist/*.js',
      'spec/javascripts/*.js',
      'src/js/*.js'
    ]
  });

  grunt.registerTask('build', [
    'clean',
    'coffee:compileSources',
    'coffee:compileSpecs',
    'concat:dist',
    'uglify:minify_distribution'
  ]);

  grunt.registerTask('test', [
    'build',
    'karma:unit'
  ]);
};
