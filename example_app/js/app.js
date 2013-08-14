var App = Ember.Application.create();

App.Store = DS.Store.extend({
  revision: 13,
  adapter: EmberCouchDBKit.DocumentAdapter.create({db: 'boards'})
});

App.Issue = DS.Model.extend({
  text: DS.attr('string'),
  type: DS.attr('string', {defaultValue: 'issue'}),
  board: DS.attr('string')
});

App.Store.registerAdapter('App.Issue', EmberCouchDBKit.DocumentAdapter.extend({db: 'boards'}));

App.IndexRoute = Ember.Route.extend({
  setupController: function(controller, model) {
    issues = App.Issue.find({type: "view", designDoc: 'issues', viewName: "all", options: 'include_docs=true'})
    this.get('controller').set('content', issues);
  },
  renderTemplate: function() {
    this.render();
    this.render('basic',{outlet: 'basic', into: 'index', controller: 'Basic'});
    this.render('intermediate',{outlet: 'intermediate', into: 'index', controller: 'Intermediate'});
    this.render('advanced',{outlet: 'advanced', into: 'index', controller: 'Advanced'});
  }
});

App.IndexController = Ember.ArrayController.extend({
  createIssue: function(fields) {
    issue = App.Issue.createRecord(fields);
    issue.get('store').commit();
  }
});

App.BasicController = App.IndexController.extend( {
  name: 'Basic'
} );

App.IntermediateController = App.IndexController.extend( {
  name: 'Intermediate'
} );

App.AdvancedController = App.IndexController.extend( {
  name: 'Advanced'
} );

App.NewIssueView = Ember.View.extend({
  tagName: "form",
  create: false,
  submit: function(event){
    event.preventDefault();
    if (this.get('create')){
      this.get('controller').send("createIssue", {text: this.get("TextArea.value"), board: this.get('board')} );
    }
    this.toggleProperty('create');
  }
});

App.CancelView = Ember.View.extend({
  tagName: "span",
  click: function(event){
    event.preventDefault();
    this.set('parentView.create',false);
  }
});
