var http = require('http'),
    cluster_lib = require('../../lib/cluster');

//front and dispatch computer

// unique job id? by Redis?
// compute once a job asked many times
// cache job result
// handle missed response.

cluster_lib.createCluster(function() {
    http.createServer(cluster_lib.http.work(this, 'tempest')).
        listen(1337, '127.0.0.1');
});

