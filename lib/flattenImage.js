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

function flattenImage (imageName, repo, layerCount, cb) {
  // variables
  var history;
  var short;
  var baseImage;
  var tempLayerDest = 'tempLayerDest' + Math.random();
  var build;
  var id = imageName;
  var redelete = [];

  // default layerCount
  layerCount = layerCount || 5;

  async.series([
    function getHistory (cb) {
      docker.historyImage(imageName, function gotHistory (err, hist) {
        if (err) {
          cb(err);
        } else {
          history = hist;
          if (history.length < layerCount + 2) {
            short = true;
            console.log('short stack', history.length);
          }
          console.log('history', history.length)
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
      console.log('base', baseImage);
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
      exec('mkdir ' + join(__dirname, tempLayerDest), cb);
    },  
    function cloneLayers (cb) {
      if (short) {
        cb();
      }
      async.eachSeries(history, function cloneLayer (layer, cb) {
        console.log('clone layer', layer);
        copyLayer(join('/var/lib/docker/graph/', layer, '/layer/'),
          join(__dirname, tempLayerDest), tempLayerDest, 
          function (err, listToReDelete) {
            if (err) {
              cb(err);
            } else if (listToReDelete.length) {
              redelete = redelete.concat(listToReDelete.map(function (file) {
                return file.replace(/.*\/layer\//, '/');
              }).filter(function (file) {
                return !/^\/run\//.test(file);
              }));
              cb();
            } else {
              cb();
            }
          });
      }, cb);
    },
    function writeDockerFile (cb) {
      if (short) {
        cb();
      }
      var text = 'FROM ' + baseImage + '\r\n';
      if (redelete.length) {
        text += 'RUN rm -rf ' + redelete.join(' ') + '\r\n';
      }
      text += 'ADD . /\r\n';
      console.log('dockerfile', text);
      write(join(__dirname, tempLayerDest, 'layer/Dockerfile'), text, cb);
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
        console.error('build error:', build);
        cb(new Error(build));
      }
    },
    function removeTemp (cb) {
      if (short) {
        cb();
      }
      exec('rm -rf ' + join(__dirname, tempLayerDest), cb);
    },
    function tagImage (cb) {
      docker.tagImage({
        id: id,
        queryParams: {
          repo: repo
        }
      }, cb);
    },
    // skip
    function pushImage (cb) {
      exec('docker push ' + repo, cb);
    }
  ], cb);
}

if (module.parent == null) {
  var imageName = process.argv[2];
  var repo = process.argv[3] || ('registry.runnable.com/runnable/' + uuid());
  var layerCount = ~~process.argv[4];
  if (imageName == null) {
    throw new Error('image name required');
  }
  flattenImage(imageName, repo, layerCount, function gotRepo (err, repo) {
    if (err) {
      console.error(err);
    } else {
      console.log('new repo:', repo);
    }
  });
}