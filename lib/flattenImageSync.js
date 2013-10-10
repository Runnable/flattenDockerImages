#!/usr/bin/env node

var run = require('execSync').run;
var exec = require('execSync').exec;
var copyLayer = require('./copyLayerSync');
var write = require('fs').writeFileSync;
var join = require('path').join;

module.exports = flattenImage;

function flattenImage (imageName, layerCount) {
  // default layerCount
  layerCount = layerCount || 5;

  // get history
  var historyRaw = exec('docker history ' + imageName).stdout;

  // file off rough edges
  var history = historyRaw.split('\n');
  history.pop();
  history.shift();
  history = history.map(function grabName (line) {
    return line.split(' ')[0];
  });

  // find base
  var baseImage = history[layerCount];

  // slice off layers to compress
  history = history.slice(0, layerCount);
  history = history.map(function grabFullId (name) {
    var data = JSON.parse(exec('docker inspect ' + name).stdout);
    return data[0].id;
  });
  history = history.reverse();

  // set directorie
  var tempLayerDest = 'tempLayerDest/';
  run('rm -rf ' + tempLayerDest);
  run('mkdir ' + tempLayerDest);

  // clone layers
  history.forEach(function cloneLayer (layer) {
    copyLayer(join('/var/lib/docker/graph/', layer, '/layer/'),
      join(__dirname, tempLayerDest));
  });

  // write docker file
  write(join(__dirname, 'tempLayerDest/layer/Dockerfile'),
    'FROM ' + baseImage + '\r\nADD . /\r\n');

  var build = exec('docker build ' + 
    join(__dirname, 'tempLayerDest/layer/')).stdout;

  var id = /^Successfully built (.+)$/m.exec(build)[1];
  return id;
}

if (module.parent == null) {
  var imageName = process.argv[2];
  var layerCount = ~~process.argv[3];
  if (imageName == null) {
    throw new Error('image name required');
  }
  console.log('new imageId:', flattenImage(imageName, layerCount));
}