'use strict';
var Job = require('../../job');
var Queue = require('../../queue');


/**
 * Get job by :id.
 */

exports.getJobs = function (req, res) {
    Queue.range(function(err, jobs){
		if (err) throw err;

		res.send(jobs);
    });
};
