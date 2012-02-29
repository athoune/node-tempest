var EventSource = require('eventsource');

/*
 * with redis-cli :
 * redis 127.0.0.1:6379> publish test "[\"Bob\"]"
 *
 */
es = new EventSource('http://localhost:1337/sub/test');

es.onmessage = function(message) {
    console.log(message.data);
};

es.onerror = function() {
    console.log('ERROR!');
};
