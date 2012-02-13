var url = require('url');

//Poor man rooting
var route = function() {
    var routes = [];
    for (var i = 0; i < arguments.length; i++) {
        routes.push(arguments[i]);
    }
    var routing = function(req, resp) {
        var first = url.parse(req.url).pathname.split('/')[1];
        for (var j = 0; j < routes.length; j++) {
            if (routes[j][0] === first || j == routes.length - 1) {
                routes[j][1](req, resp);
                continue;
            }
        }
    };
    return routing; //currying powered
};

exports.route = route;

var work = function(cluster, queue) {
    cpt = 0;

    var handle = function(req, res) {
        //TODO handling /info url
        if (req.headers['content-length']) {
            var size = parseInt(req.headers['content-length'], 10);
            var b = new Buffer(size);
            var copied = 0;
            req.on('data', function(data) {
                data.copy(b, copied);
                copied += data.length;
                if (copied === size) {
                    work_with_body(req, res, b);
                }
            });
        } else {
            work_with_body(req, res);
        }
    };

    var work_with_body = function(req, res, body) {
        cpt += 1;
        args = {
            headers: req.headers,
            method: req.method,
            url: req.url
        };
        if (body !== undefined) {
            args['body'] = body.toString('utf8');
        }
        var job = cluster.work(queue, 'url', [args], cluster.self(),
                function() {});
        cluster.on('id:url:' + job, function(args) {
            //status, headers, body) {
            res.writeHead(args[0], args[1]);
            res.end(args[2]);
        });
    };

    return handle;
};

exports.work = work;
