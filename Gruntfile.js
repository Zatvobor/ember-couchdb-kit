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
        src: ['spec/*.coffee', 'qunitspec/*.coffee'],
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
    mkdir: {
      all: {
        options: {
          create: ['tmp', 'tmp/src', 'tmp/spec']
        }
      }
    },
    qunit: {
      local: {
        options: {
          urls: ['http://localhost:9997/spec/index.html']
        }
      }
    },
    connect: {
      server: {
        options: {
          base: '.',
          port: 9997,
          keepalive: true
        }
      }
    },
    watch: {
      tests: {
        files: ['src/*.coffee', 'spec/*.coffee', 'spec/index.html'],
        tasks: ['test']
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
    'connect',
    'qunit'
  ]);

  grunt.registerTask('dev', [
    'test',
    'watch'
  ]);
};
