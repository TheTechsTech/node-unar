'use strict';

import chai from 'chai';
import { list, unpack } from '../index.js';

const expect = chai.expect,
  archive = 'test/attr.7z',
  archiveBlank = 'test/blank.zip',
  options = {
    targetDir: 'tmp',
    indexes: [0],
    forceOverwrite: true,
    noDirectory: true,
    quiet: true
  };

describe('Method: `list`', function () {
  it('should return an error on lsar error', function (done) {
    list('??', { targetDir: 'tmp', quiet: false })
      .catch((err) => {
        expect(err).to.be.a('string');
        done();
      });
  });

  it('should return an error on if missing source file', function (done) {
    list(null, options)
      .catch((err) => {
        expect(err).to.be.a('string');
        done();
      });
  });

  it('should return an error on archive have no files', function (done) {
    list(archiveBlank, options)
      .catch((err) => {
        expect(err).to.be.a('string');
        done();
      });
  });

  it('should return list of files by index', function (done) {
    list(archive, options)
      .then((files) => {
        expect(files[options.indexes]).to.be.a('string');
        done();
      });
  });

  it('should return list of files by index `options` null', function (done) {
    list(archive, null)
      .then((files) => {
        expect(files[options.indexes]).to.be.a('string');
        done();
      });
  });
});

describe('Method: `unpack`', function () {
  it('should return an error on unar error', function (done) {
    unpack('???', options)
      .catch((err) => {
        expect(err).to.be.a('string');
        done();
      });
  });

  it('should return an error on if missing source file', function (done) {
    unpack(null, options)
      .catch((err) => {
        expect(err).to.be.a('string');
        done();
      });
  });

  it('should return an error on archive have no files or nothing extracted', function (done) {
    unpack(archiveBlank, options)
      .progress((files) => {
        console.log('should not be displayed ' + files);
        //expect(directory).to.be.a('string');
        //done();
      })
      .then((directory) => {
        console.log('should not be displayed ' + directory);
        //expect(directory).to.be.a('string');
        done();
      })
      .catch((err) => {
        expect(err).to.be.a('string');
        done();
      });
  });

  it('should output each file extracted', function (done) {
    unpack(archive, {
      targetDir: 'tmp',
      forceOverwrite: true,
      noDirectory: true,
      quiet: false
    })
      .then((directory) => {
        expect(directory).to.be.a('string');
        done();
      });
  });

  it('should output each file extracted `options` null', function (done) {
    unpack(archive, null)
      .then((directory) => {
        expect(directory).to.be.a('string');
        done();
      });
  });

  it('should return output on fulfill', function (done) {
    unpack(archive, {
      targetDir: 'tmp',
      forceOverwrite: true,
      noDirectory: true,
      quiet: false
    })
      .progress((files) => {
        expect(files).to.be.a('array');
        done();
      });
  });

  it('should return output on fulfill `options` null', function (done) {
    unpack(archive, null)
      .progress((files) => {
        expect(files).to.be.a('array');
        done();
      });
  });
});

describe('Method: `unpack` only', function () {

  it('should return output on progress', function (done) {
    unpack(archive, 'tmp', 'attr/read-only file.txt')
      .progress((files) => {
        expect(files).to.be.a('array');
        done();
      });
  });

  it('should not output any other file than what is supplied on progress and successful', function (done) {
    unpack(archive, 'tmp', ['attr/normal file.txt', 'attr/read-only file.txt'], { quiet: false })
      .progress((files) => {
        expect(files).to.not.contain('system file.txt');
        expect(files).to.contain('read-only file.txt');
        expect(files).to.contain('normal file.txt');
      }).then((directory) => {
        expect(directory).to.be.a('string');
        done();
      });
  });

});
