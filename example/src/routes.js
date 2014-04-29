
// Routes

App.IndexRoute = Ember.Route.extend({

  setupController: function(controller, model) {
    this._setupPositionHolders();
    this._position();
    this._issue();
  },

  renderTemplate: function() {
    this.render();
    // link particular controller with its outlet
    var self = this;
    App.Boards.forEach(function(label) {
       self.render('board',{outlet: label, into: 'index', controller: label});
    });
  },

  _setupPositionHolders: function() {
    var self = this;
    App.Boards.forEach(function(type) {
      self.get('store').find('position', type).then(
        function(position){
          // set issues into appropriate controller through position model
          self.controllerFor(type).set('position', position);
        }, 
        function(position){
          // create position documents (as a part of first time initialization)
          if (position.status === 404){
            self.get('store').createRecord('position', { id: type }).save().then(function(position){
              self.controllerFor(type).set('position', position);
            });
          }
        }
      );
    });
  },

  _position: function(){
    // create a CouchDB `/_change` listener which serves an position documents
    params = { include_docs: true, filter: 'issues/only_positions'};
    position = EmberCouchDBKit.ChangesFeed.create({ db: 'boards', host: App.Host, content: params });

    // all upcoming changes are passed to `_handlePositionChanges` callback through `fromTail` strategy
    var self = this;
    position.fromTail(function(){
      position.longpoll(self._handlePositionChanges, self);
    });
  },

  _handlePositionChanges: function(data) {
    var self = this;
    data.forEach(function(obj){
      var position = self.controllerFor(obj.doc._id).get('position');
      // we should reload particular postion model in case of update is received from another user
      if (position.get('_data.rev') != obj.doc._rev)
        position.reload();
    });
  },

  _issue: function() {
    // create a CouchDB `/_change` issue listener which serves an issues
    var params = { include_docs: true, filter: 'issues/issue'};
    var issue = EmberCouchDBKit.ChangesFeed.create({ db: 'boards', host: App.Host, content: params });

    // all upcoming changes are passed to `_handleIssueChanges` callback through `fromTail` strategy
    var self = this;
    issue.fromTail(function(){
      issue.longpoll(self._handleIssueChanges, self);
    });
  },

  _handleIssueChanges: function(data) {
    var self = this;
    // apply received updates
    data.forEach(function(obj){
      issue = self.get('store').all('issue').toArray().find(function(i) {
        return i.get('id') === obj.doc._id;
      });
      if(issue != undefined && issue.get('_data.rev') != obj.doc._rev){
        issue.reload();
      }
    });
  }
});
