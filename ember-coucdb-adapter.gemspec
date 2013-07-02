require File.expand_path('../lib/ember-couchdb-adapter/rails/version', __FILE__)

Gem::Specification.new do |s|
  s.name        = "ember-couchdb-adapter"
  s.version     = EmberCouchdbAdapter::Rails::VERSION
  s.platform    = Gem::Platform::RUBY
  s.authors     = ["roundscope"]
  s.email       = ["info@roundscope.com"]
  s.homepage    = "https://github.com/roundscope"
  s.summary     = "Use Ember with Couchdb"
  s.description = "This gem provides couchdb adapter for ember"
  s.license     = "Apache2"

  s.required_rubygems_version = ">= 1.3.6"

  s.add_dependency "railties", ">= 3.0", "< 5.0"
  s.add_dependency "thor",     ">= 0.14", "< 2.0"

  s.files        = `git ls-files`.split("\n")
  s.executables  = `git ls-files -- bin/*`.split("\n").map { |f| File.basename(f) }
  s.require_path = 'lib'
end