var fs = require('fs');

fs.readdir = function (dir, cb) {
  // console.log('dir:', dir);
  if (dir === '/var/lib/docker/graph/5/layer/') {
    cb(null, [
      '/var',
      '/.wh..wh.aufs'
    ]);
  } else if (dir === '/var/lib/docker/graph/5/layer/var') {
    cb(null, [
      'www'
    ]);
  } else if (dir === '/var/lib/docker/graph/5/layer/var/www') {
    cb(null, [
      'index.php',
      '.wh.index.html',
      'cssDir'
    ]);
  } else if (dir === '/var/lib/docker/graph/5/layer/var/www/cssDir') {
    cb(null, [
      'style.css'
    ]);
  } else if (dir === '/var/lib/docker/graph/4/layer/') {
    cb(null, [
      'index.php'
    ]);
  } else if (dir === '/var/lib/docker/graph/3/layer/') {
    cb(null, [
      'index.php'
    ]);
  } else if (dir === '/var/lib/docker/graph/2/layer/') {
    cb(null, [
      'index.php'
    ]);
  } else if (dir === '/var/lib/docker/graph/1/layer/') {
    cb(null, [
      'index.php'
    ]);
  } else {
    cb(new Error('not implemented ' + dir));
  }
};

fs.stat = function (dir, cb) {
  // console.log('stat:', dir);
  cb(null, {
    isDirectory: function () {
      if (/Dir$/.test(dir)) {
        return true;
      }
      if (/var$/.test(dir)) {
        return true;
      }
      if (/www$/.test(dir)) {
        return true;
      }
      return false;
    }
  });
};

fs.exists = function (file, cb) {
  // console.log('exists:', file);
  var exists = true;
  if (/index.html/.test(file)) {
    exists = false;
  } 
  if (/\/\.wh\.aufs/.test(file)) {
    exists = false;
  }
  cb(exists);
};

fs.writeFile = function (file, data, cb) {
  // console.log('write:', file, data);
  cb();
};