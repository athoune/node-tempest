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

The triangle folder in examples contains an http server with ruby
(sequential ruby, no event machine here) and nodejs workers.

Clients
-------

 * Node
 * [Ruby](https://github.com/athoune/ruby-tempest)

Licence
-------

MIT.
