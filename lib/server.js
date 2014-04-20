require('longjohn');

var path = require('path'),
    express = require('express'),
    routes = require('./routes'),
    app = express();

app.set('view engine', 'jade');
app.use(express.static(path.resolve(__dirname, '../public')));

routes.mount(app);

var server = app.listen(3000, function() {
  console.log('Listening on port %d', server.address().port);
});