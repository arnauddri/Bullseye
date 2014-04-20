var _ = require('lodash'),
    async = require('async'),
    redis = require('redis'),
    client = redis.createClient(process.env.POST || 6379, process.env.HOST || 'localhost');

function listQueueNames(done) {
  client.keys('bull:*:id', function (err, keys) {
    var queueNames = _.map(keys, function (key) {
      return key.replace(/^bull:|:id$/g, '');
    });

    done(null, queueNames);
  });
}

exports.list = function (done) {
  listQueueNames(function (err, queueNames) {
    if (err)
      return done(err);

    async.mapSeries(queueNames, function (name, done) {
      async.parallel({
        wait: function (done) {
          client.llen(toBullKey(name, 'wait'), done);
        },

        active: function (done) {
          client.llen(toBullKey(name, 'active'), done);
        },

        completed: function (done) {
          client.scard(toBullKey(name, 'completed'), done);
        },

        failed: function (done) {
          client.scard(toBullKey(name, 'failed'), done);
        }
      }, function (err, results) {
        if (err)
          return done(err);

        done(null, {
          name: name,
          wait: results.wait,
          active: results.active,
          completed: results.completed,
          failed: results.failed
        });
      });
    }, done);
  });
};

function toBullKey(name, type) {
  return 'bull:' + name + ':' + type;
}