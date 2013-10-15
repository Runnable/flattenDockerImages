var express = require('express');
var app = express();

// app.post('build', express.bodyParser(), function (req, res, next) {
//   res.send('built');
// });

// app.post('images/:name/push', express.bodyParser(), function (req, res, next) {
//   res.send('pushed');
// });

// app.post('containers/create', express.bodyParser(), function (req, res, next) {
//   res.json(201, {
//     "Id": "e90e34656806",
//     "Warnings": []
//   });
// });

// app.post('containers/:id/stop', function (req, res, next) {
//   res.send('stopped');
// });

// app.post('commit', function (req, res, next) {
//   res.json(201, {
//     "Id": "596069db4bf5"
//   });
// });

// app.del('containers/:id', function (req, res, next) {
//   res.send(204);
// });

// app.post('containers/:id/start', function (req, res, next) {
//   res.send('started');
// });

// app.get('containers/:id/json', function (req, res, next) {
//   res.json({
//     "Id": "4fa6e0f0c6786287e131c3852c58a2e01cc697a68231826813597e4994f1d6e2",
//     "Created": "2013-05-07T14:51:42.041847+02:00",
//     "Path": "date",
//     "Args": [],
//     "Config": {
//       "Hostname": "4fa6e0f0c678",
//       "User": "",
//       "Memory": 0,
//       "MemorySwap": 0,
//       "AttachStdin": false,
//       "AttachStdout": true,
//       "AttachStderr": true,
//       "PortSpecs": null,
//       "Tty": false,
//       "OpenStdin": false,
//       "StdinOnce": false,
//       "Env": null,
//       "Cmd": [
//         "date"
//       ],
//       "Dns": null,
//       "Image": "base",
//       "Volumes": {},
//       "VolumesFrom": "",
//       "WorkingDir":""
//     },
//     "State": {
//       "Running": false,
//       "Pid": 0,
//       "ExitCode": 0,
//       "StartedAt": "2013-05-07T14:51:42.087658+02:01360",
//       "Ghost": false
//     },
//     "Image": "b750fe79269d2ec9a3c593ef05b4332b1d1a02a62b4accb2c21d589ff2f5f2dc",
//     "NetworkSettings": {
//       "IpAddress": "",
//       "IpPrefixLen": 0,
//       "Gateway": "",
//       "Bridge": "",
//       "PortMapping": {
//         "Tcp": {
//           "80": 42382,
//           "15000": 42383 
//         }
//       }
//     },
//     "SysInitPath": "/home/kitty/go/src/github.com/dotcloud/docker/bin/docker",
//     "ResolvConfPath": "/etc/resolv.conf",
//     "Volumes": {}
//   })
// });

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
  res.send(200);
});

app.all('*', function (req, res, next) {
  console.log('Docker request:', req.method, req.url);
  next();
});

app.listen(4243);