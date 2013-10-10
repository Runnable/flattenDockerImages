#!/usr/bin/env node

var async = require('async');
var exec = require('child_process').exec;
var copyLayer = require('./copyLayer');
var write = require('fs').writeFile;
var join = require('path').join;
var docker = require('docker.js')({
  host: "http://localhost:4243"
});
var uuid = require('node-uuid');

module.exports = flattenImage;

function flattenImage (imageName, layerCount, cb) {
  // variables
  var history;
  var short;
  var baseImage;
  var tempLayerDest = 'tempLayerDest' + Math.random();
  var build;
  var id = imageName;
  var repo;

  // default layerCount
  layerCount = layerCount || 5;

  async.series([
    function getHistory (cb) {
      docker.historyImage(imageName, function gotHistory (err, hist) {
        if (err) {
          cb(err);
        } else {
          history = hist;
          if (history.length < 10) {
            short = true;
            console.log('short stack', history.length);
          }
          cb();
        }
      })
    },
    function cleanHistory (cb) {
      if (short) {
        cb();
      }
      history = history.map(function pluckId (layer) {
        return layer.Id;
      });
      cb();
    },
    function findBase (cb) {
      if (short) {
        cb();
      }
      baseImage = history[layerCount];
      cb();
    },
    function sliceHistory (cb) {
      if (short) {
        cb();
      }
      history = history.slice(0, layerCount);
      async.map(history, function grabFullId (name, cb) {
        docker.inspectImage(name, function inspected (err, image) {
          if (err) {
            cb(err);
          } else {
            cb(null, image.id);
          }
        });
      }, function (err, mappedHistory) {
        if (err) {
          cb(err);
        } else {
          history = mappedHistory.reverse();
          cb();
        }
      });
    },
    function makeTemp (cb) {
      if (short) {
        cb();
      }
      exec('mkdir ' + tempLayerDest, cb);
    },  
    function cloneLayers (cb) {
      if (short) {
        cb();
      }
      async.eachSeries(history, function cloneLayer (layer, cb) {
        copyLayer(join('/var/lib/docker/graph/', layer, '/layer/'),
          join(__dirname, tempLayerDest), tempLayerDest, cb);
      }, cb);
    },
    function writeDockerFile (cb) {
      if (short) {
        cb();
      }
      write(join(__dirname, tempLayerDest, 'layer/Dockerfile'),
        'FROM ' + baseImage + '\r\nADD . /\r\n', cb);
    },
    function buildImage (cb) {
      if (short) {
        cb();
      }
      exec('docker build ' + join(__dirname, tempLayerDest, 'layer/'),
        function builtImage (err, stdout) {
          if (err) {
            cb(err);
          } else {
            build = stdout;
            cb();
          }
        });
    },
    function findId (cb) {
      if (short) {
        cb();
      }
      try {
        id = /^Successfully built (.+)$/m.exec(build)[1];
        cb();
      } catch (err) {
        cb(err);
      }
    },
    function removeTemp (cb) {
      if (short) {
        cb();
      }
      exec('rm -rf ' + tempLayerDest, cb);
    },
    function tagImage (cb) {
      repo = 'registry.runnable.com/runnable/' + uuid();
      docker.tagImage({
        id: id,
        queryParams: {
          repo: repo
        }
      }, cb);
    },
    function pushImage (cb) {
      exec('docker push ' + repo, cb);
    }
  ], function (err) {
    if (err) {
      cb(err);
    } else {
      cb(null, repo);
    }
  });
}

if (module.parent == null) {
  var imageName = process.argv[2];
  var layerCount = ~~process.argv[3];
  if (imageName == null) {
    throw new Error('image name required');
  }
  flattenImage(imageName, layerCount, function gotRepo (err, repo) {
    if (err) {
      console.error(err);
    } else {
      console.log('new repo:', repo);
    }
  });
}