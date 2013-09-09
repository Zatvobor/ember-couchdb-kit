namespace :jasmine do
  require 'rubygems'
  require 'rack'
  require 'excon'
  require 'jasmine/config'

  Jasmine.load_configuration_from_yaml

  task :require do
    require 'jasmine'
  end

  task :require_json do
    begin
      require 'json'
    rescue LoadError
      puts "You must have a JSON library installed to run jasmine:ci. Try \"gem install json\""
      exit
    end
  end


  task :server => 'jasmine:require' do
    port = 8888
    puts 'your tests are here:'
    puts "  http://localhost:#{port}/"
    app = Jasmine::Application.app(Jasmine.config)

    app.map('/doc'){run Proc.new { |env|
      con = Excon.new('http://geemus.com', :proxy => 'http://localhost:5984')
      uri = env["REQUEST_URI"].sub("http://localhost:8888/",'')
      resp = con.request(:method => env["REQUEST_METHOD"], :body => env["rack.input"], :path => uri, headers: {"Content-Type" => "application/json"})

      if resp.headers['Transfer-Encoding'] == 'chunked'
        body = Rack::Chunked::Body.new([resp.body])
      else
        body = [resp.body]
      end


      [ resp.status, resp.headers, body ]
    }
    }

    Jasmine::Server.new(port, app).start
  end

end

desc 'Run specs via server'
task :jasmine => %w(jasmine:server)