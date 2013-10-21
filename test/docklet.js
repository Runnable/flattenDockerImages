require('./fixtures/fs');
require('./fixtures/docker');
require('./fixtures/exec');
var flattenImage = require('../');

describe('docklet interface', function () {
  it('should flatten an image', function (done) {
    flattenImage('beep', 'boop', 5, {}, done);
  });
});