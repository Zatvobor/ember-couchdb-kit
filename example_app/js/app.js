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

App.Boards = ['common', 'intermediate', 'advanced'];

App.IndexRoute = Ember.Route.extend({
  setupController: function(controller, model) {
    self = this;
    App.Boards.forEach(function(type) {
      self.controllerFor(type).set('content', []);
    });
    this.feed()
  },
  feed: function(){
    feed = EmberCouchDBKit.ChangesFeed.create({ db: 'boards', content: {"include_docs": true, "timeout":1000}});
    feed.longpoll(this.callback, this);
  },
  callback: function(data){
    indexController = this.controllerFor("index");
    store = indexController.get('store')
    data.forEach(function(obj){
      if ((obj.doc.text)&&(obj.doc.type =='issue')&&(obj.doc.board)){ 
        store.adapterForType(App.Issue).load(store, App.Issue, obj.doc);
        App.Boards.forEach(function(type) {
          if (obj.doc.board == type){
            issue = App.Issue.find(obj.doc._id);
            indexController.get('controllers.%@'.fmt(type)).get('content').pushObject(issue);
          }      
        });
      }
    })
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
  },
  needs: App.Boards
});

App.CommonController = App.IndexController.extend({
  name: 'common'
});

App.IntermediateController = App.IndexController.extend({
  name: 'intermediate'
});

App.AdvancedController = App.IndexController.extend({
  name: 'advanced'
});

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

App.FocusTextArea = Ember.TextArea.extend({
    attributeBindings: ['autofocus'],
    autofocus: 'autofocus'
});

App.CancelView = Ember.View.extend({
  tagName: "span",
  click: function(event){
    event.preventDefault();
    this.set('parentView.create',false);
  }
});
