var async = require('async');
var fs = require('fs');
var exec = require('child_process').exec;
var join = require('path').join;

function doAUFSRecursiveCopy (srcDir, dstDir, tempLayerDest, cb) {
  var listToDelete = [];
  var listToReDelete = [];

  async.series([
    function getList (cb) {
      getListToDelete(srcDir, dstDir, listToDelete, cb);
    },
    function copyFiles (cb) {
      exec('cd ' + dstDir + ' && cp -r ' + srcDir + ' .', cb);
    },
    function deleteFiles (cb) {
      deleteThisList(listToDelete, listToReDelete, dstDir, tempLayerDest, cb);
    }
  ], function (err) {
    if (err) {
      cb(err);
    } else {
      cb(null, listToReDelete.map(function (file) {
        return file.replace(tempLayerDest, '');
      }).filter(function (file) {
        return /^\.wh\./.test(file);
      }));
    }
  });
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
        var fullPath = join(root, file);
        if (/^\.wh\./.test(file)) {
          listToDelete.push(join(dstDir, file.substring(4)));
          listToDelete.push(join(dstDir, file));
          cb();
        } else {
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

function deleteThisList (listToDelete, listToReDelete, dstDir, tempLayerDest, cb) {
  async.eachSeries(listToDelete, function deleteFile (file, cb) {
    file = file.replace(tempLayerDest, join(tempLayerDest, 'layer'));
    fs.exists(file, function fileExists (exists) {
      if (exists) {
        exec('rm -rf ' + file, cb);
      } else {
        listToReDelete.push(file);
        cb();
      }
    });
  }, cb);
}

module.exports = doAUFSRecursiveCopy;
