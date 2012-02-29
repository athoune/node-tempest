Tempest
=======

Prototype of a slow latency cluster mixing sequential and async technology.
Every communication uses the redis protocol and a real Redis is the orchestrator.

Communications
--------------

### One to one

Each node is a server, a node can speak to a node, and even a process.

### Queue

Nodes can poll a common queue. It's a way to distribute works.

### Pub/sub

Nodes listen a channel, each publication is handled by each listener.

Examples
--------

The triangle folder in examples contains some patterns.

The front is a _Connect_ 2 application :

```javascript
var http = require('http'),
    connect = require('connect'),
    cluster = require('tempest');

cluster.createCluster(function() {
    var app = connect(). // it's a Connect application
        use(connect.favicon()). // favicon is nice
        use('/sub', cluster.sub(this)). // sub url for susbscring
        use(cluster.work(this, 'tempest')); // other url are handled by workers
    http.createServer(app).listen(1337);
});
```

### Worker

Worker can be done with node, ruby, or with YOUR language.

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
console.log('Worker is started', cluster.self());
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
 * _ Unit tests
 * _ Standard session usable from worker, shared auth
 * _ Priority working queue
 * _ Worker raw answer (for streaming big data)
 * _ WebSocket connection
 * _ More clients
 * _ Erlang server with CowBoy

Licence
-------

MIT.
