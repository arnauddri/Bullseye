'use strict';
var _ = require('underscore');
var async = require('async');
var Job = require('../../job');
var redis = require("redis"),
    client = redis.createClient();
var Queue = require('../../queue');


/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Express' });
};

/**
 * Serve the index page.
 */

exports.jobs = function (state) {
    return function (req, res) {

        client.keys('bull:*:id', function (err, queueNames) {
            if (err) return console.log(err);

            var limit = (req.query.limit) ? req.query.limit : 100;

            queueNames = _.map(queueNames, function(i){ return i.substr(5, i.length - 5); });
            queueNames = _.map(queueNames, function(i){ return i.substr(0, i.indexOf(':')); });
            queueNames = _.uniq(queueNames, false, function(i){ return i[0]; });

            var queue = new Queue(req.params.queue_name, client.port, client.host);
            var queueCount = {};

            async.mapSeries(queueNames, function(queueName, done){

                Queue(queueName, client.port, client.host).countJobs(function(jobCount){
                    queueCount[queueName] = jobCount;
                    done();
                });

            }, function (err) {
                if (err) throw err;

                var isList = (state === 'wait') ? true : false;

                queue.getJobs(state, isList).then(function (jobs) {
                    jobs = (jobs) ? jobs : {};
                    var jobKeys = [];
                    if (jobs.length > 0) jobKeys = Object.keys(jobs[0].data);

                    res.render('jobs/list', {
                        jobs: _.first(jobs, limit), state: state, job_keys: jobKeys, queue: req.params.queue_name, queue_list: queueNames, queue_count: queueCount
                    });
                });

            });
        });
    };
};

/**
 * Retry
 */

exports.retry = function (state) {
    return function (req, res) {
        var queue = Queue(req.params.queue_name, client.port, client.host);

        Job.fromId(queue, req.params.job).then(function(storedJob){

            storedJob.move().then(function () {
                queue.getJobs(state).then(function (jobs) {
                    jobs = (jobs) ? jobs : {};
                    res.redirect('/queue/' + req.params.queue_name + '/' + req.params.state + '?limit=100');
                });
            });
        });
    };
};
