'use strict';

import { dirname, join } from 'path';
import when from 'when';
import { fileURLToPath } from 'url';
import { spawning } from 'node-sys';

const __filename = fileURLToPath(
  import.meta.url);
const __dirname = dirname(__filename);

let archiveTypePattern = /: [A-Z,7]*$/g;

const isInt = function isInt(x) {
  return !isNaN(x) && eval(x).toString().length == parseInt(eval(x)).toString().length;
};

Unar.defaultListFilter = function (s) {
  return s && s != '' &&
    s.indexOf('\r') == -1 &&
    s.indexOf('\n') == -1 &&
    !s.match(archiveTypePattern);
};

/**
 * Unar
 *
 * @param {String} archiveFile
 * @param {String} optionsTarget
 * @param {String|Array|Object} unpackOptions
 * @param {Object} options
 *
 * @returns {Promise} Promise
 * @see http://unarchiver.c3.cx/commandline
 */
export const unpack = Unar.unpack = function (archiveFile, optionsTarget, unpackOptions = {}, options) {
  return new when.promise((resolve, reject, progress) => {
    options = options || {
      forceOverwrite: true,
      noDirectory: true
    };
    if (typeof optionsTarget === 'string') {
      options.targetDir = optionsTarget;
      if (typeof unpackOptions === 'string' || Array.isArray(unpackOptions))
        options.files = unpackOptions;
      else if (typeof unpackOptions === 'object')
        options = Object.assign(options, unpackOptions);
    } else if (typeof optionsTarget === 'object') {
      options = Object.assign(options, optionsTarget);
    }

    options.quiet = false;
    if (!archiveFile)
      archiveFile = options.archiveFile;
    if (!archiveFile)
      return reject("Error: archiveFile or options.archiveFile missing.");

    // Unar command:
    let ar = [(process.platform != "linux") ? join(__dirname, 'unar') : 'unar'];

    // Archive file (source):
    //ar.push('SOURCEFILE');
    ar.push(archiveFile);

    // -output-directory (-o) <string>: The directory to write the contents of the archive to. Defaults to the current directory.
    ar.push('-o');
    let targetDir = options.targetDir;
    if (!targetDir)
      targetDir = process.cwd();
    ar.push(targetDir);

    // -force-overwrite (-f): Always overwrite files when a file to be unpacked already exists on disk. By default, the program asks the user if possible, otherwise skips the file.
    if (options.forceOverwrite)
      ar.push('-f');

    // -force-rename (-r): Always rename files when a file to be unpacked already exists on disk.
    if (options.forceRename)
      ar.push('-r');

    // -force-skip (-s): Always skip files when a file to be unpacked already exists on disk.
    if (options.forceSkip)
      ar.push('-s');

    // -force-directory (-d): Always create a containing directory for the contents of the unpacked archive. By default, a directory is created if there is more than one top-level file or folder.
    if (options.forceDirectory)
      ar.push('-d');

    // -no-directory (-D): Never create a containing directory for the contents of the unpacked archive.
    if (options.noDirectory)
      ar.push('-D');

    // -no-recursion (-nr): Do not attempt to extract archives contained in other archives. For instance, when unpacking a .tar.gz file, only unpack the .gz file and not its contents.
    if (options.noRecursion)
      ar.push('-nr');

    // -copy-time (-t): Copy the file modification time from the archive file to the containing directory, if one is created.
    if (options.copyTime)
      ar.push('-t');

    // -quiet (-q): Run in quiet mode.
    if (options.quiet)
      ar.push('-q');

    // -password (-p) <string>: The password to use for decrypting protected archives.
    if (options.password) {
      ar.push('-p');
      ar.push(options.password);
    }
    // -password-encoding (-E) <name>: The encoding to use for the password for the archive, when it is not known. If not specified, then either the encoding given by the -encoding option or the auto-detected encoding is used.
    if (options.passwordEncoding) {
      ar.push('-E');
      ar.push(options.passwordEncoding);
    }

    // -encoding (-e) <encoding name>: The encoding to use for filenames in the archive, when it is not known. If not specified, the program attempts to auto-detect the encoding used. Use "help" or "list" as the argument to give
    if (options.encoding) {
      ar.push('-e');
      ar.push(options.encoding);
    }

    if (options.indexes) {
      // -indexes (-i): Instead of specifying the files to unpack as filenames or wildcard patterns, specify them as indexes, as output by lsar.
      if (Array.isArray(options.indexes)) {
        options.indexes.forEach(function (idx) {
          ar.push('-i');
          ar.push('' + idx); // string!
        });
      } else if (isInt(options.indexes)) {
        return reject('options.indexes must be an array of integer, but it is: ' + JSON.stringify(options.indexes))
      }
    } else if (options.files) {
      if (Array.isArray(options.files)) {
        options.files.forEach(function (s) {
          ar.push(s);
        });
      } else {
        ar.push(options.files);
      }
    }

    let run = ar.shift();
    let files = [];
    let type = '';
    let directory = '';
    const onprogress = (data) => {
      let file = null;
      data = data.output;
      if (data.includes('No files extracted') || data.includes('Opening file failed')) {
        child.kill('SIGKILL');
        return reject('Error: No files extracted');
      } else if (data) {
        data = data.split(/(\r?\n)/g);
        if (!data[0].includes('OK.'))
          type = data[0];
        if (data[0].includes('OK.') || type) {
          data = data[2];
          if (data) {
            if (data.includes('Successfully')) {
              directory = data.split('to "')[1];
              directory = directory.split('"')[0];
            } else {
              file = data.split('  ')[1];
              if (file)
                files.push(file);
            }
          }
        }
        if (file) {
          progress(file);
        }
        return { type: type, files: files, directory: directory };
      }
    };

    return spawning(run, ar, onprogress)
      .then((result) => {
        return resolve(result);
      })
      .catch((err) => {
        return reject(err);
      });
  }); // unar.unpack
}

/**
 * Lsar
 *
 * @param {String} archiveFile
 * @param {Object} options
 *
 * @returns {Promise} Promise
 * @see http://unarchiver.c3.cx/commandline
 */
export const list = Unar.list = function (archiveFile, options) {
  return new Promise((resolve, reject) => {
    if (!archiveFile)
      archiveFile = options.archiveFile;
    if (!archiveFile)
      return reject("Error: archiveFile or options.archiveFile missing.");

    if (!options)
      options = {};

    // lsar command:
    let ar = [(process.platform != "linux") ? join(__dirname, 'lsar') : 'lsar'];

    // Archive file (source):
    //ar.push('SOURCEFILE');
    ar.push(archiveFile);

    // -no-recursion (-nr): Do not attempt to extract archives contained in other archives. For instance, when unpacking a .tar.gz file, only unpack the .gz file and not its contents.
    if (options.noRecursion)
      ar.push('-nr');

    // -password (-p) <string>: The password to use for decrypting protected archives.
    if (options.password) {
      ar.push('-p');
      ar.push(options.password);
    }
    // -password-encoding (-E) <name>: The encoding to use for the password for the archive, when it is not known. If not specified, then either the encoding given by the -encoding option or the auto-detected encoding is used.
    if (options.passwordEncoding) {
      ar.push('-E');
      ar.push(options.passwordEncoding);
    }

    // -encoding (-e) <encoding name>: The encoding to use for filenames in the archive, when it is not known. If not specified, the program attempts to auto-detect the encoding used. Use "help" or "list" as the argument to give
    if (options.encoding) {
      ar.push('-e');
      ar.push(options.encoding);
    }

    // -print-encoding (-pe): Print the auto-detected encoding and the confidence factor after the file list
    if (options.printEncoding) {
      ar.push('-pe');
      ar.push(options.printEncoding);
    }

    // -json (-j): Print the listing in JSON format.
    if (options.json)
      ar.push('-j');

    // -json-ascii (-ja): Print the listing in JSON format, encoded as pure ASCII text.
    if (options.jsonAscii)
      ar.push('-ja');

    let run = ar.shift();
    return spawning(run, ar)
      .then((result) => {
        let lines = result.split(/(\r?\n)/g);
        if (lines.length > 0) {
          let files = lines.filter(Unar.defaultListFilter);
          if (lines[2]) {
            files.shift();
            return resolve(files);
          }
        }
        return reject('Error: no files found in ' + archiveFile + ' archive.');
      })
      .catch((err) => {
        return reject('Error: ' + err);
      });
  }); // unar.list
}

function Unar() { }

export default Unar;
