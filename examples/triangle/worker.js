var cluster_lib = require('../../lib/cluster');

//Working computer

var cluster = cluster_lib.createCluster();
cluster.queues.push('tempest');
var cpt = 0;

cluster.worker.on('url', function(args, respond_to, job_id) {
    cpt++;
    //got a new task to do, lets answer
    cluster.answer(respond_to, 'url', job_id,
        [200, {}, 'Hello world! #' + cpt], function(err, resp) { });
});

cluster.work_loop();
console.log('Worker is started', cluster.self());
