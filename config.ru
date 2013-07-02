require 'rake-pipeline'
require 'rake-pipeline/middleware'
require 'rack-rewrite'
require 'rack'
require 'rack/lobster'
require 'bundler/setup'
Bundler.require

#project_root = File.dirname(__FILE__)
#
#assets = Sprockets::Environment.new(project_root) do |env|
#  env.logger = Logger.new(STDOUT)
#end
#
#assets.append_path(File.join(project_root, 'assets'))
#
#session = Rack::Test::Session.new(Rack::MockSession.new(assets))
#session.get('application.js')
#puts session.last_response.body
run Rack::Lobster.new
