var App = Ember.Application.create();



// Models

App.Store = DS.Store.extend({
  revision: 13,
  adapter: EmberCouchDBKit.DocumentAdapter.create({db: 'boards'})
});

App.Issue = DS.Model.extend({
  text: DS.attr('string'),
  type: DS.attr('string', {defaultValue: 'issue'}),
  board: DS.attr('string')
});

App.Position = DS.Model.extend({
  issues: DS.hasMany('App.Issue', {embeded: true}),
  type: DS.attr('string', {defaultValue: 'position'})
});


App.Boards = ['common', 'intermediate', 'advanced'];



// Routes

App.IndexRoute = Ember.Route.extend({

  setupController: function(controller, model) {
    this._feed();
    //this._setupPosition();
    self = this;
    App.Boards.forEach(function(type) {
      controller = self.controllerFor(type);

      controller.set('position', App.Position.find(type));
      //
      controller.addObserver('content', controller, function() {
        controller = self.controllerFor(type);

        controller.get('position').set('issues', controller.get('content'));
        controller.get('position.store').commit();
      });
      //
      controller.get('position').one('didLoad', function() {
        issues = self.controllerFor(type).get('position.issues');
        self.controllerFor(type).set('content', issues);
      });
    });
  },

  renderTemplate: function() {
    this.render();
    this.render('board',{outlet: 'common', into: 'index', controller: 'common'});
    this.render('board',{outlet: 'intermediate', into: 'index', controller: 'intermediate'});
    this.render('board',{outlet: 'advanced', into: 'index', controller: 'advanced'});
  },

  _setupPosition: function() {
    App.Boards.forEach(function(type) {
      doc = App.Position.find(type);
      if (!(doc.get('isLoaded'))){
        issue = App.Position.createRecord({ id: type });
        issue.get('store').commit();
      }
    });
  },

  _feed: function(){
    // create a CouchDB `/_change` feed listener
    feed = EmberCouchDBKit.ChangesFeed.create({ db: 'boards', content: {"include_docs": true, "timeout":1000}});
    // all upcoming changes are passed to `_handleChanges` callback through `longpool` strategy
    //feed.longpoll(this._handleChanges, this);
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
  } // _callback function
});



// Conttrollers

App.IndexController = Ember.ArrayController.extend({
  createIssue: function(fields) {
    issue = App.Issue.createRecord(fields);
    issue.get('store').commit();
    issue.on('didCreate', function() {
      position = App.Position.find(fields.board);
      position.get('issues').pushObject(issue);
      position.get('transaction').commit();
    });
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
  
  attributeBindings: ['draggable'],
  
  draggable: 'true',
  
  dragStart: function(event) {
    event.dataTransfer.setData('id', this.get('elementId'));
  },
  
  dragEnter: function(event) {
    event.preventDefault();
    event.target.style.opacity = '0.4';
  },
  
  dragOver: function(event) {
    event.preventDefault();
  },
  dragLeave: function(event) {
    event.preventDefault();
    event.target.style.opacity = '1';
  },
  
  drop: function(event) {
    var viewId = event.dataTransfer.getData('id');
    var view = Ember.View.views[viewId];
    var newModel = view.get('context');
    var oldModel = this.get('context');
    var position = this.get('controller.content').toArray().indexOf(oldModel)
    view.get('controller.content').removeObject(newModel);
    thisArray = this.get('controller.content').toArray().insertAt(position, newModel);
    this.set('controller.content.content', thisArray.getEach('_reference'));
    this.set('controller.position.issues.content', thisArray.getEach('_reference'));
    this.get('controller.position').save();

    if(view.get('controller.name') !== this.get('controller.name')){
      newModel.set('board', this.get('controller.name'));
      newModel.get('store').commit();
      viewArray = view.get('controller.content').toArray();
      view.set('controller.content.content', viewArray.getEach('_reference'));
      view.set('controller.position.issues.content', viewArray.getEach('_reference'));
      view.get('controller.position').save();
    }
    event.preventDefault();
    
    event.target.style.opacity = '1';
  }
});  
