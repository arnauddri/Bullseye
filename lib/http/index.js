'use strict';
/**
 * Module dependencies.
 */

var express = require('express');
var stylus = require('stylus');
var redis = require('redis');
var	client = redis.createClient();
var _ = require('underscore');
var nib = require('nib');
var routes = require('./routes');
var user = require('./routes/user');
var json = require('./routes/json');
var provides = require('./middleware/provides');
var http = require('http');
var path = require('path');

var app = express();

// stylus config

function compile(str, path) {
    return stylus(str)
        .set('filename', path)
        .use(nib());
}

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.set('title', 'Bullseye Dashboard');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(stylus.middleware({ src: __dirname + '/public', compile: compile }));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// JSON api

app.get('/jobs', provides('json'), json.getJobs);

// Routes

app.get('/', function (req, res) {
	client.keys('bull:*:id', function (err, keys) {
	    if (err) return console.log(err);

	    keys = _.map(keys, function(i){ return i.substr(5, i.length - 5); });
	    keys = _.map(keys, function(i){ return i.substr(0, i.indexOf(':')); });
	    keys = _.uniq(keys,false,function(i){ return i[0]; });

	    if (keys.length > 0) res.redirect('/queue/' + keys[0]);

	    res.send('No queue');
	});
});

app.get('/queue/:queue_name', function (req, res) {
    (app.path() === '/') ? res.redirect('/queues') : res.redirect('/queue/' + req.params.queue_name + '/active?limit=100');
});

app.get('/queue/:queue_name/active', routes.jobs('active'));
app.get('/queue/:queue_name/wait', routes.jobs('wait'));
app.get('/queue/:queue_name/failed', routes.jobs('failed'));
app.get('/queue/:queue_name/completed', routes.jobs('completed'));

app.get('/retry/:queue_name/:state/:job', routes.retry());

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
