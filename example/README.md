Simple application which brings all features together

Online version
==============

* http://jsfiddle.net/nLMwt/13/show/


Installation
============

```
bundle install
```

setup application related design docs

```
curl -X PUT http://localhost:5984/boards
```

```
curl -X PUT http://localhost:5984/boards/_design/issues -H 'Content-Type: application/json' -d '
{
   "_id": "_design/issues",
   "language": "javascript",
   "filters": {
     "only_positions": "function(doc, req) { if(doc.type == \"position\") { return true; } }",
     "issue": "function(doc, req) {if(doc.type == \"issue\") { return true; } }"
   }
}'
```

Run
===

```
rackup
curl http://localhost:3000/version
# => 200, ember-couchdb-kit example app
open -a safari http://localhost:3000/example/index.html
```
