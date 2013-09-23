var http = require("http");
var util = require('util');
var async = require('async');
var dockerjs = require('docker.js');
var wrench = require('wrench');
var execSync = require('exec-sync');
var copier = require("./copier");
var fs = require("fs");
var walk = require("walk");
var spawn = require('child_process').spawn;
var N =  process.argv[3] || 5;
var theImage = process.argv[2];

var baseImage = "";

var docker = dockerjs({
  host: "http://localhost:4243"
});

if (!process.argv[2]) {
  console.log("PLEASE PROVIDE AN IMAGE ID");
  process.exit(-1);
}


var doDockerRequest = function (url, cb) {
    var options = {
      host: 'localhost',
      path: url,
      port: 4243
    };

    callback = function(response) {
      var str = '';

      //another chunk of data has been recieved, so append it to `str`
      response.on('data', function (chunk) {
        str += chunk;
      });

      //the whole response has been recieved, so we just print it out here
      response.on('end', function () {
        if (str.indexOf("does not exist") != -1)
          cb('error');
        else
          cb(JSON.parse(str));
      });
    }
    http.request(options, callback).end();
};

// get Graph path
var getGraphPath = function (imageId, cb) {
  doDockerRequest('/images/' + imageId + '/json', function (imageDetail) {
    if (imageDetail != 'error') {
      cb('/var/lib/docker/graph/' +
        imageDetail.id +
        '/layer/');
    } else {
      cb('error');
    }
  });
};

var getListOfLayerLocations = function (imageId, cb) {
  var result = [];
  var lastImageId = undefined;
  doDockerRequest('/images/' + theImage +'/history', function (images) {
      if (images == 'error') {
        console.log("Error returned from query");
      }
      else {
        console.log("Base IMAGE IS", images[N].Id);
        baseImage = images[N].Id;
        var filteredImages = images.slice(0, N);
        async.eachSeries(filteredImages, function (image, callback) {
          getGraphPath(image.Id, function (path){
            // console.log(image.Id, path);
            lastImageId = image.Id;
            result.push(path);
            callback();
          });
        }, function (err) {
          if (err)
            { throw err; }
          else
            // only way to Callback is if we dont have an err
            // better to be safe than sorry
            cb(result, lastImageId);
        });
      }
  });
};

var tempLayerDest = "tempLayerDest/";

execSync("rm -rf " + tempLayerDest);
execSync("rm -rf temp");

execSync("mkdir " + tempLayerDest);
execSync("mkdir temp");

// doDockerRequest('/')
getListOfLayerLocations(theImage, function(list, lastImageId) {
  // trim the list to N and reverse it
  list = list.reverse();

  list.forEach(function (layer) {
    console.log("Copying", layer);
    copier.doAUFSRecursiveCopySync(layer,"/home/ubuntu/flattenDockerImages/" + tempLayerDest);
    console.log("");
  });

  // compress the folder
  // execSync("tar -zcvf layer.tar.gz " + tempLayerDest + "layer/");

  // execSync("mv layer.tar.gz temp/");

  fs.writeFile("tempLayerDest/layer/Dockerfile", "FROM " + baseImage + "\r\nADD . /\r\n", function(err) {
    if(err) {
        console.log(err);
    } else {

      build = spawn('docker', ['build', '.'], {cwd:"tempLayerDest/layer/"});

      build.stdout.on('data', function (data) {
        console.log('stdout: ' + data);
      });

      build.stderr.on('data', function (data) {
        console.log('stderr: ' + data);
      });

      build.on('close', function (code) {
        console.log('child process exited with code ' + code);
        // deleteWhiteoutsForSure();
      });

    }
  });
});

fs.stat(tempLayerDest + "/layer", function(err, list) {
  console.log(list);
});



// var deleteWhiteoutsForSure = function () {
//   var walk = function(dir, done) {
//     var results = [];
//     fs.readdir(dir, function(err, list) {
//       if (err) return done(err);
//       var i = 0;
//       (function next() {
//         var file = list[i++];
//         if (!file) return done(null, results);
//         file = dir + '/' + file;
//         fs.stat(file, function(err, stat) {
//           if (stat && stat.isDirectory()) {
//             walk(file, function(err, res) {
//               results = results.concat(res);
//               next();
//             });
//           } else {
//             results.push(file);
//             next();
//           }
//         });
//       })();
//     });
//   };

//   walk (tempLayerDest, function (err, results) {
//     console.log(results);
//   });
// };


// deleteWhiteoutsForSure();
