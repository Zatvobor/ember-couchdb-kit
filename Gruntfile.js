'use strict';

module.exports = function (grunt) {

  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    coffee: {
      compileSources: {
        expand: true,
        flatten: true,
        src: ['src/*.coffee'],
        dest: 'tmp/src/',
        ext: '.js'
      },
      compileSpecs: {
        expand: true,
        flatten: true,
        src: ['spec/*.coffee'],
        dest: 'tmp/spec/javascripts/',
        ext: '.js'
      }
    },
    concat: {
      options: {
        separator: ';'
      },
      dist: {
        src: [
          'tmp/src/ember-couchdb-kit.js',
          'tmp/src/document-adapter.js',
          'tmp/src/attachment-adapter.js',
          'tmp/src/revs-adapter.js',
          'tmp/src/registry.js',
          'tmp/src/changes-feed.js'
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
            'tmp/spec/javascripts/env.js',
            'tmp/spec/javascripts/*_spec.js'
          ]
        }
      }
    },
    mkdir: {
      all: {
        options: {
          create: ['tmp', 'tmp/src', 'tmp/spec']
        }
      }
    },
    clean: ['dist/*.js', 'tmp/src/*.js', 'tmp/spec/*.js']
  });

  grunt.registerTask('build', [
    'clean',
    'mkdir',
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
