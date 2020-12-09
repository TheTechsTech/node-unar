'use strict';
const expect = require('chai').expect,
  unpackAll = require('../index.js'),
  unpack = unpackAll.unpack,
  list = unpackAll.list,
  unpackOnly = unpackAll.unpackOnly;

let archive = 'test/attr.7z';
let archiveBlank = 'test/blank.zip';
let options = {
  targetDir: 'tmp',
  indexes: [0],
  forceOverwrite: true,
  noDirectory: true,
  quiet: false
}

describe('Method: `list`', function () {
  it('should return an error on lsar error', function (done) {
    list('??', options)
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
      .then((files) => {
        expect(files).to.be.a('string');
        done();
      });
  });

  it('should output each file extracted `options` null', function (done) {
    unpack(archive, null)
      .then((files) => {
        expect(files).to.be.a('string');
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
      .progress((text) => {
        expect(text).to.be.a('string');
        done();
      });
  });

  it('should return output on fulfill `options` null', function (done) {
    unpack(archive, null)
      .progress((text) => {
        expect(text).to.be.a('string');
        done();
      });
  });
});

describe('Method: `unpack` only', function () {
  it('should return an error on if missing file or directory to unpack from archive', function (done) {
    unpack(archive, 'tmp', null)
      .catch((err) => {
        expect(err).to.be.a('string');
        done();
      });
  });

  it('should return an error on archive have no files or nothing extracted', function (done) {
    unpack(archiveBlank, 'tmp', ['normal file.txt', 'read-only file.txt'])
      .catch((err) => {
        expect(err).to.be.a('string');
        done();
      });
  });

  it('should not output any other file than what is supplied', function (done) {
    unpack(archive, './tmp', ['normal file.txt', 'read-only file.txt'])
      .then((files) => {
        expect(files).to.not.contain('system file.txt');
        expect(files).to.have.string('read-only file.txt');
        expect(files).to.have.string('normal file.txt');
        done();
      }).catch((err) => {
        console.log('------------------' + err);
        expect(err).to.be.a('string');
        done();
      });
  });

  it('should return output on progress', function (done) {
    unpack(archive, 'tmp', 'read-only file.txt')
      .progress((data) => {
        console.log(data);
        expect(data).to.be.a('string');
        done();
      }).catch((files) => {
        console.log(files);
      });
  });
});
