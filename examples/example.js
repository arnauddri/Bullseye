'use strict';
var Job = require('../lib/job');
var Queue = require('../lib/queue');
var express = require('express');

var queue = new Queue('test', 6379, '127.0.0.1');
var queues = new Queue('gege', 6379, '127.0.0.1');

// queue.empty().then(function(){
//   console.log('queue emptied');
// });

function create() {
  var randomName = ['tobi', 'loki', 'jane', 'manny'][Math.random() * 4 | 0];
  // var job = Job.create(queue, 1, {username: randomName});
  queue.add({username: randomName, test: 'yoyo'});
  queues.add({username: randomName});

    queue.on('complete',function () {
        console.log(' Job complete');
    }).on('failed',function () {
            console.log(' Job failed');
        });

    setTimeout(create, Math.random() * 2000 | 0);
}

// create();

queue.process(function (job, done) {
  // var error = new Error('failed job');
  // throw error;
  done();
});

queues.process(function (job, done) {
  var error = new Error('failed job');
  throw error;
  done();
});

// start the UI
var app = express();
app.use(require('../lib/http/'));
console.log('UI started on port 3000');