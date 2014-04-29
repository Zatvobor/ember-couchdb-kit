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
        src: ['src/*.js'],
        dest: 'public/app.js'
      }
    },
    
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
      },
      dist: {
        files: {
          'public/app.min.js': ['<%= concat.dist.dest %>']
        }
      }
    },

    express: {
      server: {
        options: {
          port: 9001,
          bases: ['public'],
          debug: true
          //livereload: true, // if you just specify `true`, default port `35729` will be used
          //serverreload: true
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  //grunt.loadNpmTasks('grunt-contrib-jshint');
  //grunt.loadNpmTasks('grunt-contrib-qunit');
  //grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-express');

  //grunt.registerTask('test', ['jshint', 'qunit']);
  
  //grunt.registerTask('default', ['jshint', 'qunit', 'concat', 'uglify']);
  //grunt.registerTask('default', ['concat', 'uglify']);
  

  //grunt.registerTask('default', ['copy', 'concat', 'uglify', 'express', 'express-keepalive']);
  grunt.registerTask('example-app-server', ['copy', 'concat', 'uglify', 'express', 'express-keepalive']);

};
