var fs = require('fs');
var sh = require('execSync');
var path = require('path');

// recursive list maker
var getListToCopyAndDelete = function (root, dstDir, listToCp, listToDelete) {
  var files = fs.readdirSync(root);
  files.forEach(function (file) {
    // if its a whiteout file add it to the delete list
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

  // do the copy using simple CP so that uncopiable directories
  // such as kernel messages are not CP'd
  sh.run('cd ' + dstDir + ' && cp -r ' + srcDir + ' .');

  deleteThisList(listToDelete, dstDir);
};

module.exports.doAUFSRecursiveCopySync = doAUFSRecursiveCopySync;

