Simple application which brings all features together

Online version
==============

* http://jsfiddle.net/nLMwt/16/show (old version!)


Installation
============

```
npm install
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
grunt example-app-server
# curl http://localhost:9001/
open -a safari http://127.0.0.1:9001/index.html
```




==============

