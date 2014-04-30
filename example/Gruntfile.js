module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    copy: {
      main: {
        files: [
          {expand: true, src: ['index.html'], dest: 'public/'},
          {expand: true, src: ['assets/*'], dest: 'public/'},
          {expand: true, src: ['../dist/*.js'], dest: 'public/dist/', filter: 'isFile'},
          {expand: true, src: ['../vendor/assets/javascripts/*.js'], dest: 'public/vendor/', filter: 'isFile'}
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

  grunt.registerTask('server', ['copy', 'concat', 'express', 'express-keepalive']);
};