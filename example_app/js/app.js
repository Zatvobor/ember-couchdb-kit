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

DS.JSONTransforms.array = {
  serialize: function(value) {
    return Ember.isNone(value) ? [] : value ;
  },
  deserialize: function(value) {
    return Ember.isNone(value) ? [] : value ;
  }
};

App.Position = DS.Model.extend({
  pos: DS.attr('array')
});


//App.Store.registerAdapter('App.Issue', EmberCouchDBKit.DocumentAdapter.extend({db: 'boards'}));

App.Boards = ['common', 'intermediate', 'advanced'];



// Routes

App.IndexRoute = Ember.Route.extend({

  setupController: function(controller, model) {
    this._feed();
  },

  renderTemplate: function() {
    this.render();
    this.render('board',{outlet: 'common', into: 'index', controller: 'common'});
    this.render('board',{outlet: 'intermediate', into: 'index', controller: 'intermediate'});
    this.render('board',{outlet: 'advanced', into: 'index', controller: 'advanced'});
  },

  _feed: function(){
    // create a CouchDB `/_change` feed listener
    feed = EmberCouchDBKit.ChangesFeed.create({ db: 'boards', content: {"include_docs": true, "timeout":1000}});
    // all upcoming changes are passed to `_handleChanges` callback through `longpool` strategy
    feed.longpoll(this._handleChanges, this);
  },

  _handleChanges: function(data){
    indexController = this.controllerFor("index");
    store = indexController.get('store')
    data.forEach(function(obj){
      if ((obj.doc.text)&&(obj.doc.type =='issue')&&(obj.doc.board)){
        App.Boards.forEach(function(type) {
          if (!(obj.doc._deleted)&&(indexController.get('controllers.%@'.fmt(type)).get('content').mapProperty('id').indexOf(obj.doc._id) >= 0)){
            App.Issue.find(obj.doc._id).reload();
          }else{
            store.adapterForType(App.Issue).load(store, App.Issue, obj.doc);
            if (obj.doc.board == type){
              issue = App.Issue.find(obj.doc._id);
              indexController.get('controllers.%@'.fmt(type)).get('content').pushObject(issue);
            }
          }
        });
      }
    }); // forEach
  } // _callback fuction
});



// Conttrollers

App.IndexController = Ember.ArrayController.extend({
  createIssue: function(fields) {
    issue = App.Issue.createRecord(fields);
    issue.get('store').commit();
    issue = App.Position.createRecord();
    issue.get('store').commit();
  },
  saveMessage: function(model) {
    model.save();
  },
  needs: App.Boards
});

App.CommonController       = App.IndexController.extend({ name: 'common' });
App.IntermediateController = App.IndexController.extend({ name: 'intermediate' });
App.AdvancedController     = App.IndexController.extend({ name: 'advanced' });



//  Views

App.NewIssueView = Ember.View.extend({
  tagName: "form",
  create: false,
  _save:  function(event) {
    event.preventDefault();
    if (this.get('create')){
      this.get('controller').send("createIssue", {text: this.get("TextArea.value"), board: this.get('controller.name')} );
    }
    this.toggleProperty('create');
  },
  submit: function(event){
    this._save(event);
  },
  keyDown: function(event){
    if(event.keyCode == 13){
      this._save(event);
    }
  }
});

App.FocusedTextArea = Ember.TextArea.extend({
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

App.IssueView = Ember.View.extend({
  tagName: "form",
  edit: false,
  submit: function(event){
    event.preventDefault();
    if (this.get('edit')){
      this.get('controller').send('saveMessage', this.get("context"));
    }
    this.toggleProperty('edit');
  },
  attributeBindings: 'draggable',
  draggable: 'true',
  dragStart: function(event) {
    event.dataTransfer.setData('Text', this.get('elementId'));
  },
  dragEnter: function(event) {
    event.preventDefault();
  },
  dragOver: function(event) {
    event.preventDefault();
  },
  drop: function(event) {
    var viewId = event.dataTransfer.getData('Text');
    var view = Ember.View.views[viewId];
    var model = view.get('context');
    view.get('controller.content').removeObject(model);
    this.get('controller.content').addObject(model);
    model.set('board', this.get('controller.name'));
    this.get('controller').send('saveMessage', model);
    event.preventDefault();
  }
});
