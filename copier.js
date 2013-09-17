var fs = require('fs');
var sh = require('execSync');
var path = require('path');

// recursive list maker
var getListToCopyAndDelete = function (root, dstDir, listToCp, listToDelete) {

  var files = fs.readdirSync(root);

  files.forEach(function (file) {
    if (file.indexOf(".wh.") != -1) {
      var fullPath = path.join(dstDir, file.substring(4));
      var fullPath2 = path.join(dstDir, file);
      listToDelete.push(fullPath);
      listToDelete.push(fullPath2);
    } else {
      var fullPath = path.join(root, file);
      var dstDirFullPath = path.join(dstDir, file);

      try {
        if(!fs.statSync(fullPath).isDirectory()) {
          listToCp.push(fullPath);
        } else {
          getListToCopyAndDelete(fullPath, dstDirFullPath, listToCp, listToDelete);
        }
      }
      catch (e) {
        // skipping
        console.log("skipping", fullPath);
      }

    }
  });
};

var deleteThisList = function (listToDelete, dstDir) {
  listToDelete.forEach(function (file) {
    // console.log(file);
    sh.run('rm -rf ' + file);
  });
};

var doAUFSRecursiveCopySync = function (srcDir, dstDir) {
  var listToCp = [];
  var listToDelete = [];

  getListToCopyAndDelete(srcDir,dstDir, listToCp,listToDelete);

  // do the copy
  sh.run('cd ' + dstDir + ' && cp -r ' + srcDir + ' .');

  deleteThisList(listToDelete, dstDir);
};

// doAUFSRecursiveCopySync("/var/lib/docker/graph/cd196fd0ebaaaafedbf2ff1333314a1e106ff9bd4b56d37812306d51e2fdf356/layer/","/var/lib/docker/containers/d80b6d04b509c33cfe4b661299dc1852a78fc3031f8c64a67a83c12f5cb8568c/rootfs/");

module.exports.doAUFSRecursiveCopySync = doAUFSRecursiveCopySync;

