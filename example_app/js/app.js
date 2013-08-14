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
    self = this;
    ['common', 'intermediate', 'advanced'].forEach(function(type) {
       options = 'key="%@"&include_docs=true'.fmt(type);
       issues = App.Issue.find({type: "view", designDoc: 'issues', viewName: "all_by_board", options: options});
       self.controllerFor(type).set('content', issues);
    });
  },
  renderTemplate: function() {
    this.render();

    this.render('board',{outlet: 'common', into: 'index', controller: 'common'});
    this.render('board',{outlet: 'intermediate', into: 'index', controller: 'intermediate'});
    this.render('board',{outlet: 'advanced', into: 'index', controller: 'advanced'});
  }
});

App.IndexController = Ember.ArrayController.extend({
  createIssue: function(fields) {
    issue = App.Issue.createRecord(fields);
    issue.get('store').commit();
  }
});

App.CommonController = App.IndexController.extend( {
  name: 'common'
} );

App.IntermediateController = App.IndexController.extend( {
  name: 'intermediate'
} );

App.AdvancedController = App.IndexController.extend( {
  name: 'advanced'
} );


App.NewIssueView = Ember.View.extend({
  tagName: "form",
  create: false,
  submit: function(event){
    event.preventDefault();
    if (this.get('create')){
      this.get('controller').send("createIssue", {text: this.get("TextArea.value"), board: this.get('controller.name')} );
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
