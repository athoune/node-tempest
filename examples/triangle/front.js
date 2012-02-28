var http = require('http'),
    connect = require('connect'),
    cluster = require('../../lib/cluster');

//front and dispatch computer

// unique job id? by Redis?
// compute once a job asked many times
// cache job result
// handle missed response.

cluster.createCluster(function() {
    var app = connect().
        use(connect.favicon()).
        use(cluster.work(this, 'tempest'));
    http.createServer(app).listen(1337);
});

