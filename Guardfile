# A sample Guardfile
# More info at https://github.com/guard/guard#readme

guard 'coffeescript', input: 'src', output: 'dist' do
  watch(%r{src/(.+\.coffee)})
end

guard 'coffeescript', input: 'spec/coffeescripts', output: 'spec/javascripts' do
  watch(%r{spec/coffeescripts(.+\.coffee)})
end
