var redis = require('redis');

var REDIS = 'localhost:6379';

var sub = function(cluster) {
    var conf = REDIS.split(':');

    var handle = function(req, res) {
        var channel = req.url.substring(1);
        res.writeHead(200, {'Content-Type': 'text/event-stream'});
        var client = redis.createClient(conf[1], parseInt(conf[0], 10));
        client.subscribe(channel);
        client.on('message', function(chan, message_raw) {
            var message = cluster.unserialize(message_raw);
            if (message[0] == '$unsubscribe') {
                client.unsubscribe();
                client.end();
                res.end('event: end\ndata: \n\n');
                console.log('end');
            } else {
                var data;
                if (message.length > 1) {
                    res.write('event: ');
                    res.write(message[0]);
                    res.write('\n');
                    data = message[1];
                } else {
                    data = message[0];
                }
                res.write('data: ');
                res.write(data);
                res.write('\n\n');
            }
        });
    };

    return handle;
};

exports.sub = sub;
