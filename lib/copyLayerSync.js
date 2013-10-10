var fs = require('fs');
var run = require('execSync').run;
var join = require('path').join;

function doAUFSRecursiveCopy (srcDir, dstDir) {
  var listToDelete = [];

  // console.log("The dstDir is", dstDir);
  getListToDelete(srcDir, dstDir, listToDelete);

  // do the copy using simple CP so that uncopiable directories
  // such as kernel messages are not CP'd
  run('cd ' + dstDir + ' && cp -r ' + srcDir + ' .');

  // console.log("Going to delete", listToDelete);
  deleteThisList(listToDelete, dstDir);
}

// recursive list maker
function getListToDelete (root, dstDir, listToDelete) {
  var files = fs.readdirSync(root);
  files.forEach(function eachFile (file) {
    // if its a whiteout file add it to the delete list
    if (/^\.wh\./.test(file)) {
      listToDelete.push(join(dstDir, file.substring(4)));
      listToDelete.push(join(dstDir, file));
    } else {
      var fullPath = join(root, file);
      try {
        if (fs.statSync(fullPath).isDirectory()) {
          var dstDirFullPath = join(dstDir, file);
          getListToDelete(fullPath, dstDirFullPath, listToDelete);
        }
      } catch (e) {}
    }
  });
}

function deleteThisList (listToDelete, dstDir) {
  listToDelete.forEach(function (file) {
    // console.log(file);
    file = file.replace('tempLayerDest', 'tempLayerDest/layer');
    // console.log("deleting", file);

    // try to delete that file, if not file exists just ignore it for now
    run('rm -rf ' + file);
  });
}

module.exports = doAUFSRecursiveCopy;

