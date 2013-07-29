module EmberCouchdbAdapter
  module Generators
    class InstallGenerator < ::Rails::Generators::Base

      desc "This generator installs ember-couchdb-kit into vendor/assets/javascripts"
      source_root File.expand_path('../../../../../src', __FILE__)

      def copy
        %w(document-adapter attachment-adapter revs-adapter changes-feed ember-couchdb-kit).each do |package|
          filename      = "#{package}.coffee"
          vendored_file = "vendor/assets/javascripts/#{filename}"

          remove_file(vendored_file)
          copy_file(filename, vendored_file)
        end
      end
    end
  end
end
