#!/usr/bin/env node

var async = require('async');
var exec = require('child_process').exec;
var copyLayer = require('./copyLayer');
var write = require('fs').writeFile;
var join = require('path').join;
var docker = require('docker.js')({
  host: "http://localhost:4243"
});

module.exports = flattenImage;

function flattenImage (imageName, layerCount, cb) {
  // variables
  var history;
  var baseImage;
  var tempLayerDest = 'tempLayerDest/';
  var build;
  var id;

  // default layerCount
  layerCount = layerCount || 5;

  async.series([
    function getHistory (cb) {
      docker.historyImage(imageName, function gotHistory (err, hist) {
        if (err) {
          cb(err);
        } else {
          history = hist;
          cb();
        }
      })
    },
    function cleanHistory (cb) {
      history = history.map(function pluckId (layer) {
        return layer.Id;
      });
      cb();
    },
    function findBase (cb) {
      baseImage = history[layerCount];
      cb();
    },
    function sliceHistory (cb) {
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
    function removeTemp (cb) {
      exec('rm -rf ' + tempLayerDest, cb);
    },
    function makeTemp (cb) {
      exec('mkdir ' + tempLayerDest, cb);
    },  
    function cloneLayers (cb) {
      async.eachSeries(history, function cloneLayer (layer, cb) {
        copyLayer(join('/var/lib/docker/graph/', layer, '/layer/'),
          join(__dirname, tempLayerDest), cb);
      }, cb);
    },
    function writeDockerFile (cb) {
      write(join(__dirname, 'tempLayerDest/layer/Dockerfile'),
        'FROM ' + baseImage + '\r\nADD . /\r\n', cb);
    },
    function buildImage (cb) {
      exec('docker build ' + join(__dirname, 'tempLayerDest/layer/'),
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
      try {
        id = /^Successfully built (.+)$/m.exec(build)[1];
        cb();
      } catch (err) {
        cb(err);
      }
    }
  ], function (err) {
    if (err) {
      cb(err);
    } else {
      cb(null, id);
    }
  });
}

if (module.parent == null) {
  var imageName = process.argv[2];
  var layerCount = ~~process.argv[3];
  if (imageName == null) {
    throw new Error('image name required');
  }
  flattenImage(imageName, layerCount, function gotId (err, id) {
    if (err) {
      console.error(err);
    } else {
      console.log('new imageId:', id);
    }
  });
}