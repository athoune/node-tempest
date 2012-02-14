var http = require('../lib/http');

describe('routing', function() {
    it('should route to /info', function(done) {
        var route = http.route(
            ['info', function(req, res) { done(); }],
            ['*', function(req, res) {}]);
        route({url: '/info/details'});
    });
    it('should route to default', function(done) {
        var route = http.route(
            ['info', function(req, res) { }],
            ['*', function(req, res) { done()}]);
        route({url: '/beuha/aussi'});
    });
});
