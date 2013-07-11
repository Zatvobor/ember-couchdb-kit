ember-couchdb-adapter
=====================

An Ember.js adapter for Apache CouchDB.

Inspired by [pangratz/ember-couchdb-adapter](https://github.com/pangratz/ember-couchdb-adapter) and contains fixes for working with relations.


There are newbie features:

* document's attachements designed as `hasMany`able models;
* document's revisions designed as `belongsTo` relationship that points back such as corresponding `hasMany` relation;
* natural integration with `_changes` notifications;



License
-------

`ember-couchdb-adapter` source code is released under MIT-License.
Check [MIT-LICENSE](https://github.com/roundscope/ember-couchdb-adapter/blob/master/MIT-LICENSE) for more details.
