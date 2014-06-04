var passport = require('passport'),
    BasicStrategy = require('passport-http').BasicStrategy,
    path = require('path'),
    _ = require('lodash'),
    Queue = require('bull'),
    queues = require('./queues'),
    util = require('./util');

passport.use('sas', new BasicStrategy(function (username, password, done) {
  var authorized = username === 'front' && password === 'Fronttest123';
  done(null, authorized);
}));

var states = [
  {key: 'wait', name: 'Queued', isList: true, canRetry: false, canRemove: false},
  {key: 'active', name: 'Active', isList: true, canRetry: true, canRemove: false},
  {key: 'failed', name: 'Failed', isList: false, canRetry: true, canRemove: false},
  {key: 'completed', name: 'Completed', isList: false, canRetry: false, canRemove: true}
];

exports.mount = function (app) {

  app.all('*', function (req, res, next) {
    if (req.cookies && req.cookies['front-bulleyes'] === 'fr0ntverified1234') {
      return next();
    }

    passport.authenticate('sas', {session: false})(req, res, function () {
      res.cookie('front-bulleyes', 'fr0ntverified1234', {maxAge: 3600});
      next();
    });
  });

  app.get('/', function (req, res) {
    queues.list(function (err, queues) {
      if (err)
        return res.send(500, err.message);

      var firstQueue = _(queues).first();

      if (firstQueue)
        res.redirect(path.join('/queues', firstQueue.name, 'failed'));
      else
        res.send('No queues');
    });
  });

  app.all('/queues/:name*', function (req, res, next) {
    var queueName = req.params.name;

    queues.list(function (err, queues) {
      if (err)
        return res.send(400, err.message);

      req.queues = queues;
      req.queue = _(queues).findWhere({name: queueName});

      if (!req.queue)
        return res.send(404, 'Queue not found');

      req.queue.url = '/queues/' + queueName;
      req.bull = new Queue(queueName, util.redisPort(), util.redisHost());

      res.once('finish', function () {
        req.bull.close();
      });

      next();
    });
  });

  app.get('/queues/:name/:state?', function (req, res) {
    var state = _(states).findWhere({key: req.params.state}),
        limit = parseInt(req.query.limit, 10) || 100;

    if (!state)
      return res.send(400, 'invalid state');

    req.bull.getJobs(state.key, state.isList, 0, limit).then(function (jobs) {
      jobs = jobs || [];

      res.locals.isSelected = function (queue, s) {
        return queue.name === req.queue.name && s.key === state.key;
      };

      res.locals.prettyDate = function (ts) {
        if (!_.isFinite(ts))
          return 'unknown';

        var elapsed = Math.floor((Date.now() - ts) / 1000);

        if (elapsed < 5)
          return 'now';
        else if (elapsed < 60)
          return elapsed + 's';
        else if (elapsed < 3600)
          return Math.floor(elapsed / 60) + 'm';
        else if (elapsed < 86400)
          return Math.floor(elapsed / 3600) + 'h';
        else
          return Math.floor(elapsed / 86400) + 'd';
      };

      res.locals.states = states;

      res.render('list', {
        queue: req.queue,
        state: state,
        nextPageUrl: req.path + '?limit=' + (limit + 100),
        queues: req.queues,
        jobs: jobs,
        hasMore: jobs.length < req.queue[state.key]
      });
    }).error(function (err) {
      res.send(500, err.message);
    });
  });

  app.all('/queues/:name/jobs/:job_id*', function (req, res, next) {
    Queue.Job.fromId(req.bull, req.params.job_id).then(function (job) {
      req.job = job;
      next();
    }).error(function (err) {
      res.send(500, err.message);
    });
  });

  app.post('/queues/:queue_name/jobs/:job_id/retry', function (req, res) {
    req.job.retry().then(function () {
      res.send(200);
    }).error(function (err) {
      res.send(500, err.message);
    });
  });

  app.delete('/queues/:queue_name/jobs/:job_id', function (req, res) {
    req.job.remove().then(function () {
      res.send(200);
    }).error(function (err) {
      res.send(500, err.message);
    });
  });

  app.post('/queues/:queue_name/retry_all/:state', function (req, res) {
    var state = _(states).findWhere({key: req.params.state});

    if (!state || !state.canRetry)
      return res.send(400, 'invalid state');

    req.bull.getJobs(state.key, state.isList).then(function (jobs) {
      if (jobs && jobs.length !== 0)
        return jobs.map(function (job) {
          return job.retry();
        });
    }).then(function () {
      res.send('OK');
    }).error(function (err) {
      res.send(500, err.message);
    });
  });

  app.post('/queues/:queue_name/remove_all/:state', function (req, res) {
    var state = _(states).findWhere({key: req.params.state});

    if (!state || !state.canRemove)
      return res.send(400, 'invalid state');

    req.bull.getJobs(state.key, state.isList).then(function (jobs) {
      if (jobs && jobs.length !== 0)
        return jobs.map(function (job) {
          return job.remove();
        });
    }).then(function () {
      res.send('OK');
    }).error(function (err) {
      res.send(500, err.message);
    });
  });

  /*
   * DEBUG
   */

  app.all('/debug*', function (req, res, next) {
    req.queue = new Queue('test', util.redisPort(), util.redisHost());

    res.once('finish', function () {
      req.queue.close();
    });

    next();
  });

  app.get('/debug/add-dummy', function (req, res) {
    req.queue.add({msg: 'this is a test job - ' + _.random(1000)}).then(function () {
      res.send('OK');
    });
  });

  app.get('/debug/stall-dummy', function (req, res) {
    req.queue.process(function () {
      // don't do anything with the job so it stays active
      res.send('OK');
    });
  });

  app.get('/debug/complete-dummy', function (req, res) {
    req.queue.process(function (job, jobDone) {
      jobDone();
    });

    req.queue.once('completed', function () {
      res.send('OK');
    });
  });

  app.get('/debug/fail-dummy', function (req, res) {
    req.queue.process(function (job, jobDone) {
      jobDone(new Error('some error occurred'));
    });

    req.queue.once('failed', function () {
      res.send('OK');
    });
  });
};