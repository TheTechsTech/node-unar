'use strict';

import chai from 'chai';
import Unar from '../index.js';
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
      .catch((err) => {
        expect(err).to.be.a('string');
        done();
      });
  });

  it('should output on progress with `files`, target `directory`, archive `type` extracted on success', function (done) {
    unpack(archive, {
      targetDir: 'tmp',
      forceOverwrite: true,
      noDirectory: true,
      quiet: false
    })
      .progress((files) => {
        expect(files).to.be.a('string');
      })
      .then((result) => {
        expect(result).to.be.a('object');
        expect(result.type).to.be.a('string');
        expect(result.files).to.be.a('array');
        expect(result.directory).to.be.a('string');
        done();
      });
  });

  it('should output `files`, target `directory`, archive `type` extracted `options` null', function (done) {
    unpack(archive, null)
      .progress((files) => {
        expect(files).to.be.a('string');
      })
      .then((result) => {
        expect(result).to.be.a('object');
        expect(result.type).to.be.a('string');
        expect(result.files).to.be.a('array');
        expect(result.directory).to.be.a('string');
        done();
      });
  });
});

describe('Method: `unpack` only', function () {

  it('should return output on progress', function (done) {
    unpack(archive, 'tmp', 'attr/system file.txt')
      .then((result) => {
        expect(result.files).to.contain('attr/system file.txt');
        expect(result.files).to.not.contain('att/normal file.txt');
        done();
      });
  });

  it('should not output any other file than what is supplied successful', function (done) {
    unpack(archive, 'tmp', ['attr/normal file.txt', 'attr/read-only file.txt'])
      .progress((files) => {
        expect(files).to.be.a('string');
      }).then((result) => {
        expect(result.files).to.not.contain('system file.txt');
        expect(result.files).to.contain('attr/read-only file.txt');
        expect(result.files).to.contain('attr/normal file.txt');
        done();
      });
  });

});

describe('Function: `Unar`', function () {
  it('should instanced itself like a class', function () {
    const unar = new Unar();
    expect(unar).to.be.an.instanceof(Unar);
  });

  it('should respond to commands as methods', function () {
    expect(Unar).itself.to.respondTo('defaultListFilter');
    expect(Unar).itself.to.respondTo('unpack');
    expect(Unar).itself.to.respondTo('list');
  });
});
