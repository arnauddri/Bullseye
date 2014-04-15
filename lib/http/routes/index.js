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

        client.keys('bull:*:id', function (err, keys) {
            if (err) return console.log(err);

            var queue_name = req.params.queue_name;
            var limit = (req.query.limit) ? req.query.limit : 1;

            if (req.query.more) limit = limit + 1;

            keys = _.map(keys, function(i){ return i.substr(5, i.length - 5); });
            keys = _.map(keys, function(i){ return i.substr(0, i.indexOf(':')); });
            keys = _.uniq(keys,false,function(i){ return i[0]; });

            var queue = Queue(req.params.queue_name, client.port, client.host);

            var queueLength = [];

            async.map(keys, function(queueName){
                console.log('tset');
                queue = Queue(queueName, client.port, client.host);

                queue.getJobs('completed').then(function (jobs) {
                    jobs = (jobs) ? jobs : {};
                    console.log(jobs.length);
                    queueLength.push(jobs.length);
                });

            }, function(err, results){

                console.log('test');            
                queue.getJobs(state).then(function (jobs) {
                    jobs = (jobs) ? jobs : {};
                    var jobKeys = [];
                    if (jobs.length > 0) jobKeys = Object.keys(jobs[0].data);

                    res.render('jobs/list', {
                        jobs: _.first(jobs, limit), state: state, job_keys: jobKeys, queue: req.params.queue_name, queue_list: keys
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
                    res.redirect('/queue/' + req.params.queue_name + '/' + req.params.state);
                });
            });
        });
    };
};
