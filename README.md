ember-couchdb-kit
=================

An `ember-data` kit for Apache CouchDB.

Inspired by [pangratz/ember-couchdb-adapter](https://github.com/pangratz/ember-couchdb-adapter) and contains fixes for working with relations and many others necessary things (check source docs for more details).

There are some of these:

* document's attachements designed as `hasMany`able models;
* document's revisions designed as `belongsTo` relationship that points back such as corresponding `hasMany` relation;
* natural integration with `_changes` notifications;


jasmine specs ready to go though `rake jasmine:ci` convenience

License
-------

`ember-couchdb-kit` source code is released under MIT-License.
Check [MIT-LICENSE](https://github.com/roundscope/ember-couchdb-kit/blob/master/MIT-LICENSE) for more details.
