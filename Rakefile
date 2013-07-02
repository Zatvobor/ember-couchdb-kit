APPNAME = 'ember-couchdb-adapter'

require 'colored'
require 'rack/asset_compiler'
require 'rake-pipeline'
require 'net/http'

require 'guard/jasmine/task'

task :test do
  puts "test"
end

task :ember_update do
  [{name: "ember-data.js", url: "http://cloud.github.com/downloads/emberjs/data/ember-data-latest.js"},
   {name: "ember.js", url: "http://cloud.github.com/downloads/emberjs/ember.js/ember-latest.js"},
   {name: "handlebars.js", url: "https://raw.github.com/wycats/handlebars.js/1.0.0/dist/handlebars.js"},
   {name: "jquery.js", url: "http://code.jquery.com/jquery-1.10.1.js"}
  ].each do |lib|
    resp = Net::HTTP.get_response(URI.parse(lib[:url]))
    path = File.join(File.dirname(__FILE__), "vendor/assets/javascripts/#{lib[:name]}")
    open(path, "wb") do |file|
      file.write(resp.body)
    end
  end
end

begin
  require 'jasmine'
  load 'jasmine/tasks/jasmine.rake'
rescue LoadError
  task :jasmine do
    abort "Jasmine is not available. In order to run jasmine, you must: (sudo) gem install jasmine"
  end
end

Guard::JasmineTask.new
