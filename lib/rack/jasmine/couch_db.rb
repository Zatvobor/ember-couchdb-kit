module Rack
  module Jasmine
    class CouchDB
      def initialize(app)
        @app, @content_type = app
      end

      def call(env)
        status, headers, body = @app.call(env)
        puts body.inspect
        headers = Rack::Utils::HeaderHash.new(headers)
        headers['Cache-Control'] ||= "max-age=0, private, must-revalidate"
        headers['Pragma'] ||= "no-cache"
        [status, headers, body]
      end
    end
  end
end