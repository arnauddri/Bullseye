var _ = require('lodash'),
    async = require('async'),
    Util = require('./util');

function listQueueNames(done) {
  Util.getRedisClient().keys('bull:*:id', function (err, keys) {
    var queueNames = _.map(keys, function (key) {
      return key.replace(/^bull:|:id$/g, '');
    });

    done(null, _.sortBy(queueNames));
  });
}

exports.list = function (done) {
  listQueueNames(function (err, queueNames) {
    if (err)
      return done(err);

    async.mapSeries(queueNames, function (name, done) {
      async.parallel({
        wait: function (done) {
          Util.getRedisClient().llen(toBullKey(name, 'wait'), done);
        },

        active: function (done) {
          Util.getRedisClient().llen(toBullKey(name, 'active'), done);
        },

        completed: function (done) {
          Util.getRedisClient().scard(toBullKey(name, 'completed'), done);
        },

        failed: function (done) {
          Util.getRedisClient().scard(toBullKey(name, 'failed'), done);
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