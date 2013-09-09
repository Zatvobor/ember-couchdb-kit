# installing rackup
# $ gem install rack thin excon
#
# run server which listen an 80 port
# $ rvmsudo rackup
#
# open application
# $ curl http://localhost/index.html

require 'rubygems'
require 'rack'
require 'excon'

builder = Rack::Builder.new do

  use Rack::CommonLogger


  map '/boards' do
    app = Proc.new { |env|
      con = Excon.new('http://geemus.com', :proxy => 'http://localhost:5984')

      resp = con.request(
        :method => env["REQUEST_METHOD"],
        :body => env["rack.input"],
        :path => env["REQUEST_URI"],
        headers: {"Content-Type" => env["CONTENT_TYPE"]}
      )

      if resp.headers['Transfer-Encoding'] == 'chunked'
        body = Rack::Chunked::Body.new([resp.body])
      else
        body = [resp.body]
      end


      [ resp.status, resp.headers, body ]
    }

    run app
  end

  map '/' do
   run Rack::Directory.new(File.expand_path(".."))
  end

  map '/version' do
    run Proc.new {|env| [200, {"Content-Type" => "text/html"}, ["ember-couchdb-kit example app"]] }
  end
end


Rack::Handler::Thin.run builder, :Port => 3000
