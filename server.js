fs       = require('fs');
http     = require('http');
connect  = require('connect');
app      = connect();
dispatch = require('dispatch');

app.use(dispatch({
  'GET /' : function(req, res, next) {
    res.setHeader('Content-Type', 'text/html');
    renderUI(function(err, html) {
      if (err !== null) return next(err);
      res.end(html);
    });
  }
}));

template = fs.readFileSync('template.html');
function renderUI(cb) {
  return cb(noErr, template);
}

port   = process.env.PORT != null ? process.env.PORT : 4000;
server = http.createServer(app);
server.listen(port, function() {
  console.log("app running on port: " + port);
});

noErr = null;
