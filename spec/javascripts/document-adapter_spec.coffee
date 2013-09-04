Ember.ENV.TESTING = true

describe "EmberCouchDBKit.DocumentAdapter" , ->
  beforeEach ->
    DatabaseCleaner.reset()
    new TestEmberApp()

  it "test", ->
    expect(1+1).toBe(2)