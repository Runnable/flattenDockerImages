var express = require('express');
var app = express();

app.get('/images/:repo/history', function (req, res, next) {
  res.json([
    { Id: '1' },
    { Id: '2' },
    { Id: '3' },
    { Id: '4' },
    { Id: '5' },
    { Id: '6' },
    { Id: '7' },
    { Id: '8' },
    { Id: '9' }
  ]);
});

app.get('/images/:id/json', function (req, res, next) {
  res.json({
    id: req.params.id
  });
});

app.post('/images/:id/tag', function (req, res, next) {
  res.send(201);
});

app.all('*', function (req, res, next) {
  console.log('Docker request:', req.method, req.url);
  next();
});

app.listen(4243);