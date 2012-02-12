var events = require('events'),
    util = require('util'),
    redis = require('redis'),
    redisd = require('redis-protocol');

var REDIS = 'localhost:6379';

/**
 * A node in a cluster
 *
 * While initializing, a node connect to the central redis server,
 * fetch an id and get its last used id.
 *
 * @constructor
 * @param {function} cb The callback triggered when the node is ready.
 */
var Cluster = function(cb) {
    this._clients = {};
    //Use JSON, tnetstrings or any serialization
    this.serialize = JSON.stringify;
    this.unserialize = JSON.parse;
    this.worker = new events.EventEmitter();
    this.queues = [];
    this._id = 0;
    var that = this;
    this.server = redisd.createServer(function(command) {
        if (command[0] == 'info') {
            this.encode('redis_version:2.4.5');
        } else {
            var cmd = command[0];
            var pid = command[1];
            var values = command[2];
            that.emit('id:' + cmd + ':' + pid, JSON.parse(values));
            this.singleline('OK');
        }
    });
    this.server.listen();
    this.server_id(function(id) {
        that._server_id = id;
        //FIXME not in the right place, never triggered.
        that.server.on('listening', function() {
            that.client(REDIS).set('server.' + id + '.server', that.self);
        });
        that._server_name_id = 'server.' + id + '.id';
        that.client(REDIS).get(that._server_name_id, function(err, msg) {
            if (msg === null) {
                that._id = 0;
            } else {
                that._id = parseInt(msg, 10);
            }
            if (cb) cb.call(that);
        });
    });
};

util.inherits(Cluster, events.EventEmitter);

/**
 * Fetch a node id.
 * @param {function} cb A callback for handling the id.
 */
Cluster.prototype.server_id = function(cb) {
    this.client(REDIS).incr('cluster.ids', function(err, msg) {
        cb(msg);
    });
};

/**
 * Node's name.
 * @return {string} Name of this node.
 */
Cluster.prototype.self = function() {
    var s = this.server.address();
    return [s.address, s.port].join(':');
};

Cluster.prototype.unique_id = function() {
    var s = this.server.address();
    return [s.address, s.port, this._id++].join(':');
};

/**
 * Next job id
 *
 * @return {int} Next job id.
 */
Cluster.prototype.next_id = function() {
    return this._id++;
};

/**
 * Lazy build a client connection to a redis server.
 *
 * @param {string} key The name of the target server.
 * @return {RedisClient} A redis client connected to a server.
 */
Cluster.prototype.client = function(key) {//lazy clients
    if (this._clients[key] == undefined) {
        console.log('new client to', key);
        var kv = key.split(':');
        this._clients[key] = redis.createClient(kv[1], kv[0], {
            max_attempts: 4
        });
        var that = this;
        this._clients[key].on('error', function(error) {
            console.warn('Client error', error, error.stack);
            that._clients[key].end();
            delete that._clients[key];
            //[FIXME] disconnecting client is a drama.
        });
    }
    return this._clients[key];
};

/**
 * Send a command
 *
 * @param {string} who The target.
 * @param {string} what The command.
 * @param {list} arg Arguments.
 * @param {function} callback The callback for the redis communication.
 */
Cluster.prototype.call = function(who, what, arg, callback) {
    this.client(who).send_command(what, [this.serialize(arg)], callback);
};

/**
 * Answer a question
 *
 * @param {string} who The target.
 * @param {string} what The command.
 * @param {int} job_id Question's id.
 * @param {list} arg Answer's arguments.
 * @param {function} callback The callback for the redis communication.
 */
Cluster.prototype.answer = function(who, what, job_id, arg, callback) {
    this.client(who).send_command(what, ['' + job_id, this.serialize(arg)],
            callback);
};

/**
 * Send a task to a queue.
 *
 * @param {string} queue Queue name.
 * @param {string} action The command.
 * @param {list} args Arguments.
 * @param {string} respond_to Answer to it.
 * @param {function} callback The callback for the redis communication.
 * @return {int} The id of this job.
 */
Cluster.prototype.work = function(queue, action, args, respond_to, callback) {
    var job_id = this.next_id();
    this.client(REDIS).multi()
        .incr(this._server_name_id)
        .rpush(queue, this.serialize([action, args, respond_to, job_id]))
        .exec(callback);
    return job_id;
};

Cluster.prototype.asyncCall = function(who, what, arg, callback) {
    //response node is provided, simple direct response should be OK
    //or something like that.
    this.redis.send_command(what, [this.serialize([arg, this.self()])],
            function(err, resp) {
                if (err) console.warn(err);
            });
// register the callback with its id
// callback can be call more than one time
};

/**
 * Poll a queue and execute fetched jobs.
 */
Cluster.prototype.work_loop = function() {
    //[TODO] Raise error if no queue.
    //[TODO] A "next" callback to finish then accept a new task?
    var w = this;
    this.client(REDIS).blpop(this.queues, 0, function(err, resp) {
        if (err) {
            console.log(err);
        }
        if (resp) {
            var args = JSON.parse(resp[1]);
            var f = args.shift();
            w.worker.emit(f, args[0], args[1], args[2]);
        }
        if (resp) {
            process.nextTick(function() {
                w.work_loop();
            });
        } else {
            //the queue is empty, don't flood redis
            setTimeout(function() {
                w.work_loop();
            }, 1000);
        }
    });

};

/**
 * Create a new cluster.
 *
 * @param {function} cb The callback triggered when the node will be ready.
 * @return {Cluster} The new Cluster object.
 */
exports.createCluster = function(cb) {
    var cluster = new Cluster(cb);
    return cluster;
};

exports.http = require('./http');
