require('child_process').exec = exec;

function exec (cmd, cb) {
  console.log('command:', cmd);
  cb(null, 'Successfully built foo');
} 