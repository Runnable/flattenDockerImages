var async = require('async');
var fs = require('fs');
var exec = require('child_process').exec;
var join = require('path').join;

function doAUFSRecursiveCopy (srcDir, dstDir, tempLayerDest, cb) {
  var listToDelete = [];

  async.series([
    function getList (cb) {
      getListToDelete(srcDir, dstDir, listToDelete, cb);
    },
    function copyFiles (cb) {
      exec('cd ' + dstDir + ' && cp -r ' + srcDir + ' .', cb);
    },
    function deleteFiles (cb) {
      deleteThisList(listToDelete, dstDir, tempLayerDest, cb);
    }
  ], cb);
}

// recursive list maker
function getListToDelete (root, dstDir, listToDelete, cb) {
  var files;

  async.series([
    function readFiles (cb) {
      fs.readdir(root, function filesRead (err, data) {
        if (err) {
          cb(err);
        } else {
          files = data;
          cb();
        }
      });
    },
    function processFiles (cb) {
      async.eachSeries(files, function eachFile (file, cb) {
        if (/^\.wh\./.test(file)) {
          listToDelete.push(join(dstDir, file.substring(4)));
          listToDelete.push(join(dstDir, file));
          cb();
        } else {
          var fullPath = join(root, file);
          fs.stat(fullPath, function (err, stats) {
            if (err) {
              cb();
            } else if (stats.isDirectory()) {
              var dstDirFullPath = join(dstDir, file);
              getListToDelete(fullPath, dstDirFullPath, listToDelete, cb);
            } else {
              cb();
            }
          });
        }
      }, cb);
    }
  ], cb);
}

function deleteThisList (listToDelete, dstDir, tempLayerDest, cb) {
  async.eachSeries(listToDelete, function deleteFile (file, cb) {
    file = file.replace(tempLayerDest, join(tempLayerDest, 'layer'));
    //exec('rm -rf ' + file, cb);
  }, cb);
}

module.exports = doAUFSRecursiveCopy;