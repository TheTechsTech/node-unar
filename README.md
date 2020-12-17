# node-unar

[![NPM](https://nodei.co/npm/node-unar.png)](https://nodei.co/npm/node-unar/)

[![Dependencies Status][david-image]][david-url] [![Node.js CI](https://github.com/techno-express/node-unar/workflows/Node.js%20CI/badge.svg)](https://github.com/techno-express/node-unar/actions) [![codecov](https://codecov.io/gh/techno-express/node-unar/branch/main/graph/badge.svg?token=1HI1BHK6B2)](https://codecov.io/gh/techno-express/node-unar) [![Maintainability][codeclimate-image]][codeclimate-url][![Release][npm-image]][npm-url]

> ESM front-end to **unar** and **lsar** a command line tool. The universal [un-archiver/unpacker](http://unarchiver.c3.cx/commandline) to a lot of formats: `.zip, zipx, rar, 7z, tar, gzip, bzip2, lzma, cab, msi, cpio, xar, exe`, [etc...](http://unarchiver.c3.cx/formats).

The necessary cli tool **lsar** and **unar**, will be downloaded to package directory at install time, for `Windows` amd `macOS`. If your host is `Linux`, [node-sys](https://github.com/techno-express/node-sys) will be used to install **unar** onto your system.

## Usage

```js
//ESM Node JS v12+
import { list, unpack } from 'node-unar';

// list only:
list(archiveFile, options)
  .then((fileListArray) => {
  })
  .catch((anyError) => {
  });;

// unpack:
unpack(archiveFile, options | outputDirectory)
  .progress((eachFle) => {
  })
  .then((results) => {
    let type = results.type;
    let fileList = results.files;
    let outputDirectory = results.directory;
  })
  .catch((anyError) => {
  });

// unpack: only requested files/directories
unpack(archiveFile, outputDirectory, file | [files], options)
  .progress((eachFle) => {
  })
  .then((results) => {
    let type = results.type;
    let fileList = results.files;
    let outputDirectory = results.directory;
  })
  .catch((anyError) => {
  });
```

### Examples

#### Example: unpack file

```js
//ESM Node JS v12+
import  { unpack } from 'node-unar';

unpack('test/abc.rar', 'out')
  .progress((files) => {
    console.log('files', files);
  })
  .then((results) => {
    console.log('Archive type: ', results.type);
    console.log('Archive files', results.files);
    console.log('Archive output directory', results.directory);
  })
  .catch((err) => {
    console.error(err);
  });
});
```

#### Example: list content

```js
//ESM Node JS v12+
import { list } from 'node-unar';

list('test/abc.rar')
  .then((files) => {
    console.log('files', files);
  })
  .catch((err) => {
    console.error(err);
  });
```

### Options

Key       | Possible values        | Comment
--------- | -----------------------|-------------------------------------------------
quiet     | true/false (default)   | true will reduce logging for unpacking
targetDir | \<String>              | The directory to write the contents of the archive to. Defaults to the current directory.
files     | \<String>              | Only unpack this list of files or directories.
forceOverwrite | true/false (default)  | if null, tmp dir will created automatically
forceDirectory | true/false/undefined  | Always create a containing directory for the contents of the unpacked archive. By default, a directory is created if there is more than one top-level file or folder.
noDirectory | true/false/undefined     | Never create a containing directory for the contents of the unpacked archive.
noRecursion | true/false/undefined     | Do not attempt to extract archives contained in other archives. For instance, when unpacking a .tar.gz file, only unpack the .gz file and not its contents.
copyTime | true/false/undefined        | Copy the file modification time from the archive file to the containing directory, if one is created.
password | \<String>                   | The password to use for decrypting protected archives.
passwordEncoding | \<String>           | The encoding to use for the password for the archive, when it is not known. If not specified, then either the encoding given by the -encoding option or the auto-detected encoding is used.
encoding | \<String>                   | The encoding to use for filenames in the archive, when it is not known. If not specified, the program attempts to auto-detect the encoding used. Use "help" or "list" as the argument to give

[david-url]: https://david-dm.org/techno-express/node-unar
[david-image]: http://img.shields.io/david/techno-express/node-unar.svg
[codeclimate-url]: https://codeclimate.com/github/techno-express/node-unar/maintainability
[codeclimate-image]: https://api.codeclimate.com/v1/badges/0d6a0bc69a8ea29c7de9/maintainability
[npm-url]: https://www.npmjs.org/package/node-unar
[npm-image]: http://img.shields.io/npm/v/node-unar.svg
