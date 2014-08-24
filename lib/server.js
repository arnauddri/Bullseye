require('longjohn');

var path = require('path'),
  passport = require('passport'),
  express = require('express'),
  routes = require('./routes'),
  app = express();

app.set('view engine', 'jade');
app.use(express.static(path.resolve(__dirname, '../public')));
app.use(passport.initialize());
app.use(passport.session());

routes.mount(app);

var server = app.listen(3000, function(err) {
  if (err)
    console.log('could not start app, err: ', err);
  else
    console.log(new Date() + ', listening on port %d', server.address().port);
});
