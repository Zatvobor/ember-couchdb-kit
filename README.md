ember-couchdb-kit
=================

Versions:

* `v0.7` works with `ember rc.6.1` and `ember-data 0.13`
* `v0.8` works with `ember 1.0.0` and `ember-data 1.0.0-beta.2`

An `ember-data` kit for Apache CouchDB.

We love a CouchDB and its RESTful and many other core things such as MVCC, attachments and /_changes. These all brings your data and application flow together as well.

Inspired by [pangratz/ember-couchdb-adapter](https://github.com/pangratz/ember-couchdb-adapter) and contains many fixes and newbie features.

There are some of these:

* natural `find/create/deleteRecord` functions;
* ability to work with `views`;
* document's attachements designed as `hasMany` relation;
* document's revisions designed as `belongsTo` relationship that points back such as corresponding `belongsTo` relation;
* ability to work with `/_changes`;


Check source code for more details. In additional, you could find more in `/example` application and find out how to use `ember-couchdb-kit` on practice.


Ready to use as a regular JS assets
-----------------------------------

An `ember-couchdb-kit` ships both with compiled js assets and coffee sources. 
Compiled assets plased in `dist/**.js` folder.


Ready to install as a regular gem
---------------------------------

```
gem "ember-couchdb-kit", git: "git@github.com:roundscope/ember-couchdb-kit.git"
```

Rails aware generator for vendoring packages into application vendor/assets/javascripts placeholder

```
./bin/rails g ember_couchdb_kit:install
```

Add into your application.js
```
//= require ember-couchdb-kit
```


Learn through specs
-------------------

```
rake jasmine
```

```
open -a safari http://localhost:8888
```

License
-------

`ember-couchdb-kit` source code is released under MIT-License.
Check [MIT-LICENSE](https://github.com/roundscope/ember-couchdb-kit/blob/master/MIT-LICENSE) for more details.
