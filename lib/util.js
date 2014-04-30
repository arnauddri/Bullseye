var redis = require('redis');

var redisHost = process.argv[2] || 'localhost';
var redisPort = parseInt(process.argv[3], 10) || 6379;
var redisClient = redis.createClient(redisPort, redisHost);

exports.getRedisClient = function() {
  return redisClient;
};

exports.redisHost = function() {
  return redisHost;
};

exports.redisPort = function() {
  return redisPort;
};
