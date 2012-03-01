Tempest
=======

Prototype of a slow latency cluster mixing sequential and async technology.
Every communication uses the redis protocol and a real Redis is the orchestrator.

Technology
----------

Every communication use connected redis communication. This connections can be multiplexed.
Serialization is now JSON, but tnetstring or msgpack are more compact and more quick.
It targets to mix sequential and async technology.
It can be different language flavor (ruby and event machine, python and gevent)
or completely different languages.

It's a tribute to [mongrel2](http://mongrel2.org/), with redis protocol replacing zeromq.

Pattern for the web
-------------------

A front server accept and keep open http connection.
It's async, it can handles lots of opened connections.
The process wich handle the connection listen events, one or more, before closing the connection.
The front can read and modify the session cookie.

### Working queue

The process _rpush_ the query.
It's a fire and forget, it got no direct answer.
Redis keep a list of action with the id of the process.
Some workers _blpop_ the Redis, and ask for works to do.
Workers can directly speak to the process, with one or more answer.
Workers can use sequential technology, even web technology with a little gateway between _rack_ ou _wsgi_ interface.
You can mix technology and try horrible things like mixing go, dart and php workers.
Choose a programing language wich handle redis communication.

When you choose a sequential technology, try to work quickly, you are blocking the queue.

![Workers](https://github.com/athoune/node-tempest/raw/master/worker.png)

### Pub/sub

The http front open a connection and start an _Event Source_ answer.
It starts to _suscribe_ to a Redis channel and wait.

Any event source can _publish_ to this channel.
The message travels to the web client as an event source event.

![Pubsub](https://github.com/athoune/node-tempest/raw/master/pubsub.png)

### More complex patterns

Each node can directly speak to another node. You can route your answer, parralely or sequentialy, mixing technology.
You can ask webservice with em-ruby and finaly answer with rails.

File upload can be handled by the front, putting the file in the file system,
or directly in a distributed server like [GridFS](http://www.mongodb.org/display/DOCS/GridFS+Specification),
and passing a simple token to the web worker.

Code
----

### Front

The front is a [Connect 2](https://github.com/senchalabs/connect) application :

```javascript
var http = require('http'),
    connect = require('connect'),
    cluster = require('tempest');

cluster.createCluster(function() {
    var app = connect(). // it's a Connect application
        use(connect.favicon()). // favicon is nice
        use('/sub', cluster.sub(this)). // sub url for subscribing
        use(cluster.work(this, 'tempest')); // other url are handled by workers
    http.createServer(app).listen(1337);
});
```

### Worker

Worker can be made with node, ruby, or with YOUR language.

You can launch many workers, they will rush to answer.

```javascript
var cluster_lib = require('tempest');

var cluster = cluster_lib.createCluster();
var cpt = 0;

// The front trigger an 'url' event.
cluster.worker.on('url', function(args, respond_to, job_id) {
    cpt++;
    //got a new task to do, lets answer
    cluster.answer(respond_to, 'url', job_id, [
        200, // http code
        {}, // headers
        'Hello world! #' + cpt // body
       ]);
});

cluster.work_loop();
```

Test with _curl_, _ab_ or _siege_.

    curl http://localhost:1337/

### Subscribe

Simple subscribe with _EventSource_.

Publish to redis:

    redis 127.0.0.1:6379> publish test "[\"Bob\"]"

Subscribe to an url:

```javascript
var EventSource = require('eventsource');

var es = new EventSource('http://localhost:1337/sub/test');

es.onmessage = function(message) {
    console.log(message.data);
};

es.onerror = function() {
    console.log('ERROR!');
};
```

It's a node client example, it should work in a browser too.

Clients
-------

 * Node
 * [Ruby](https://github.com/athoune/ruby-tempest)
 * [Python](https://github.com/athoune/py-tempest)

Features
--------

 * √ Workers
 * √ EventSource subscribe
 * √ Big picture
 * _ Unit tests
 * _ Client side javascript example for EventSource
 * _ Standard session usable from worker, shared auth
 * _ Priority working queue
 * _ Worker raw answer (for streaming big data)
 * _ WebSocket connection
 * _ More clients
 * _ Process angels to handle crash
 * _ Erlang server with CowBoy

Licence
-------

MIT © 2012 Mathieu Lecarme.
