var http = require('http'),
    cluster = require('../../lib/cluster');

//front and dispatch computer

// unique job id? by Redis?
// compute once a job asked many times
// cache job result
// handle missed response.

cluster.createCluster(function() {
    http.createServer(
        cluster.http.route(
            ['info', function(req, res) {
                res.end('info');
            }],
            ['*', cluster.http.work(this, 'tempest')]
        )).listen(1337, '127.0.0.1');
});

