require 'rake-pipeline'
require 'rake-pipeline/middleware'
require 'rack-rewrite'

use Rack::Rewrite do
  rewrite %r{^(.*)\/$}, '$1/index.html'
end

run Rack::Directory.new('.')

require 'rack/coffee_compiler'

use Rack::CoffeeCompiler,
    :source_dir => 'app/coffeescripts',
    :url => '/javascripts',
    :alert_on_error => true  # Generates a window.alert on compile error.  Defaults to (RACK_ENV != 'production')