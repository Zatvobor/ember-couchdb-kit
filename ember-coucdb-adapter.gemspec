Gem::Specification.new do |s|
  s.name        = "ember-couchdb-adapter"
  s.version     = "0.0.1"
  s.platform    = Gem::Platform::RUBY
  s.authors     = ["Roundscope"]
  s.email       = ["info@roundscope.com"]
  s.homepage    = "https://github.com/roundscope/ember-couchdb-adapter"
  s.summary     = "Use Ember with Couchdb"
  s.description = "This gem provides couchdb adapter for ember"
  s.license     = "MIT License"

  s.required_rubygems_version = ">= 1.3.6"

  s.add_dependency "railties", ">= 3.0", "< 5.0"
  s.add_dependency "thor",     ">= 0.14", "< 2.0"

  s.files        = `git ls-files`.split("\n")
  s.require_path = 'lib'
end
