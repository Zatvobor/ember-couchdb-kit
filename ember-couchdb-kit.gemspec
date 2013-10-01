Gem::Specification.new do |s|
  s.name        = "ember-couchdb-kit"
  s.version     = "0.8"
  s.platform    = Gem::Platform::RUBY
  s.authors     = ["Roundscope contributors"]
  s.email       = ["hi@roundscope.com"]
  s.homepage    = "https://github.com/roundscope/ember-couchdb-kit"
  s.summary     = "An ember-data kit for Apache CouchDB"
  s.description = "This gem provides conveniences for working with Apache CouchDB"
  s.license     = "MIT License"

  s.required_rubygems_version = ">= 1.3.6"

  s.add_dependency "railties", ">= 3.0", "< 5.0"
  s.add_dependency "thor",     ">= 0.14", "< 2.0"

  s.files        = `git ls-files`.split("\n")
  s.require_path = 'lib'
end
