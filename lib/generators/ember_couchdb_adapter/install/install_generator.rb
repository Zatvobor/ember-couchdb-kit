module EmberCouchdbAdapter
  module Generators
    class InstallGenerator < ::Rails::Generators::Base

      desc "This generator installs ember adapter for couchdb"
      source_root File.expand_path('../../../../../src', __FILE__)

      def copy
        %w(couchdb-adapter.coffee couchdb-attachment-adapter.coffee couchdb-revs-adapter.coffee
          ember-couchdb-kit.coffee).each do |file|
          remove_file "vendor/assets/javascripts/#{file}"
          copy_file "#{file}", "vendor/assets/javascripts/#{file}"
        end
      end
    end
  end
end