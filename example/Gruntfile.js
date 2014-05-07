module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    copy: {
      main: {
        files: [
          {expand: true, src: ['index.html'], dest: 'public/'},
          {expand: true, src: ['assets/*'], dest: 'public/'},
          {expand: true, src: ['../dist/ember-couchdb-kit.js'], dest: 'public/dist/'},
          {expand: true, flatten: true, src: ['../bower_components/jquery/jquery.js'], dest: 'public/vendor/assets/javascripts/'},
          {expand: true, flatten: true, src: ['../bower_components/handlebars/handlebars.js'], dest: 'public/vendor/assets/javascripts/'},
          {expand: true, flatten: true, src: ['../bower_components/ember/ember.js'], dest: 'public/vendor/assets/javascripts/'},
          {expand: true, flatten: true, src: ['../bower_components/ember-data/ember-data.js'], dest: 'public/vendor/assets/javascripts/'}
        ]
      }
    },

    concat: {
      options: {
        separator: ';'
      },
      dist: {
        src: ['src/app.js', 'src/models.js', 'src/routes.js', 'src/controllers.js', 'src/views.js', 'src/*.js'],
        dest: 'public/app.js'
      }
    },

    express: {
      server: {
        options: {
          port: 9001,
          bases: ['public'],
          debug: true
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-express');

  grunt.registerTask('build', ['copy', 'concat']);
  grunt.registerTask('server', ['build', 'express', 'express-keepalive']);
};