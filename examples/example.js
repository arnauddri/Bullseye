'use strict';
var Job = require('../lib/job');
var Queue = require('../lib/queue');
var express = require('express');

var firstQueue = new Queue('firstQueue', 6379, '127.0.0.1');
var secondQueue = new Queue('secondQueue', 6379, '127.0.0.1');
var thirdQueue = new Queue('thirdQueue', 6379, '127.0.0.1');

function create() {
  var randomName = ['tobi', 'loki', 'jane', 'manny'][Math.random() * 4 | 0];

  firstQueue.add({item0: randomName, item1: randomName, item2: randomName, item3: randomName, item4: randomName, item5: randomName , item6: randomName , item7: randomName , item8: randomName });
  secondQueue.add({username: randomName});
  thirdQueue.add({number: Math.random() * 100000 | 0});

  setTimeout(create, Math.random() * 10000 | 0);
}

create();

firstQueue.process(function (job, done) {
  var index = Math.random() * 4 | 0;
  if (index % 2 === 0) throw new Error('failed job');
  done();
});

secondQueue.process(function (job, done) {
  var index = Math.random() * 4 | 0;
  if (index % 2 === 0) throw new Error('failed job');
  done();
});

thirdQueue.process(function (job, done) {
  var index = Math.random() * 4 | 0;
  if (index % 2 === 0) throw new Error('failed job');
  done();
});

// start the UI
var app = express();
app.use(require('../lib/http/'));
console.log('UI started on port 3000');