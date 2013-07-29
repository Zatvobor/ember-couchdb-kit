module EmberCouchdbKit
  module Generators
    class InstallGenerator < ::Rails::Generators::Base

      desc "This generator installs ember-couchdb-kit into vendor/assets/javascripts"
      source_root File.expand_path('../../../../../src', __FILE__)

      def copy
        path = File.expand_path('../../../../../src/*.coffee', __FILE__)
        Dir.glob(path).each do |package|
          filename = package.split("/").last
          vendored_file = "vendor/assets/javascripts/#{filename}"
          remove_file(vendored_file)
          copy_file(filename, vendored_file)
        end
        puts "Please add into your application.js  ->  //= require ember-couchdb-kit"
      end
    end
  end
end
