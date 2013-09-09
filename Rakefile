begin
  require 'jasmine'
  #load 'jasmine/tasks/jasmine.rake'
  Dir.glob('lib/tasks/jasmine.rake').each { |r| import r }
rescue LoadError
  task :jasmine do
    abort "Jasmine is not available. In order to run jasmine, you must: (sudo) gem install jasmine"
  end
end