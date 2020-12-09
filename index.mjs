'use strict';

// see http://unarchiver.c3.cx/commandline
// unar and lsar
import { join } from 'path';
import { exec } from 'child_process';
import { tmpdir } from 'os';
import when from 'when';

const hasOwn = Object.prototype.hasOwnProperty;

/**
 * Create a new array by applying `callback` to each element in `xs`.
 *
 * @param {*} xs
 * @param {*} callback
 *
 * @returns Array
 */
function array_map(xs, callback) {
  if (xs.array_map) return xs.array_map(callback);
  let res = [];
  for (let i = 0; i < xs.length; i++) {
    let x = xs[i];
    if (hasOwn.call(xs, i)) res.push(callback(x, i, xs));
  }

  return res;
};

// from http://github.com/substack/node-shell-quote, needed to remove more escaping
function quote(xs) {
  return array_map(xs, function (s) {
    return String(s).replace(/([#!"$&'(),;<=>?@\[\\\]^`{|}])/g, '\\$1');
  }).join(' ');
};
//

let archiveTypePattern = /: [A-Z,7]*$/g;

let escapeFileName = function (s) {
  return '"' + s + '"';
  //if (isWindows()) return '"'+s+'"';
  //// '"'+cmd.replace(/(["\s'$`\\])/g,'\\$1')+'"'
  //return s;
};

const isInt = function isInt(x) {
  return !isNaN(x) && eval(x).toString().length == parseInt(eval(x)).toString().length;
};


unpackAll.defaultListFilter = function defaultListFilter(s) {
  return s && s != '' &&
    s.indexOf('\r') == -1 &&
    s.indexOf('\n') == -1 &&
    !s.match(archiveTypePattern);
};

function exec_unar(runCmd, extractDir, doCallback) {
  exec(runCmd, function (err, stdout, stderr) {
    if (err) return doCallback(Error(err), null);
    if (stderr && stderr.length > 0) return doCallback(Error('Error: ' + stderr), null);
    if (stdout && stdout.length > 0) {
      if (stdout.indexOf('No files extracted') >= 1) return doCallback(Error('Error: No files extracted'), null);
    }
    return doCallback(null, extractDir, stdout);
  });
}

function _unpack(archiveFile, options, callback) {
  if (!callback) return new Error('No callback function');
  if (!archiveFile) archiveFile = options.archiveFile;
  if (!archiveFile) return callback(Error("Error: archiveFile or options.archiveFile missing."), null);
  if (!options) options = {};

  // Unar command:
  let unar = options.unar;
  if (!unar) unar = (process.platform != "linux") ? join(__dirname, 'unar') : 'unar';
  let ar = [unar];

  // Archive file (source):
  ar.push('SOURCEFILE');
  //ar.push(archiveFile);

  // -output-directory (-o) <string>: The directory to write the contents of the archive to. Defaults to the current directory.
  ar.push('-o');
  var targetDir = options.targetDir;
  if (!targetDir) targetDir = join(tmpdir(), 'tmp');
  ar.push(targetDir);

  // -force-overwrite (-f): Always overwrite files when a file to be unpacked already exists on disk. By default, the program asks the user if possible, otherwise skips the file.
  if (options.forceOverwrite) ar.push('-f');

  // -force-rename (-r): Always rename files when a file to be unpacked already exists on disk.
  if (options.forceRename) ar.push('-r');

  // -force-skip (-s): Always skip files when a file to be unpacked already exists on disk.
  if (options.forceSkip) ar.push('-s');

  // -force-directory (-d): Always create a containing directory for the contents of the unpacked archive. By default, a directory is created if there is more than one top-level file or folder.
  if (options.forceDirectory) ar.push('-d');

  // -no-directory (-D): Never create a containing directory for the contents of the unpacked archive.
  if (options.noDirectory) ar.push('-D');

  // -no-recursion (-nr): Do not attempt to extract archives contained in other archives. For instance, when unpacking a .tar.gz file, only unpack the .gz file and not its contents.
  if (options.noRecursion) ar.push('-nr');

  // -copy-time (-t): Copy the file modification time from the archive file to the containing directory, if one is created.
  if (options.copyTime) ar.push('-t');

  // -quiet (-q): Run in quiet mode.
  if (options.quiet) ar.push('-q');

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
      console.error('options.indexes must be an array of integer, but it is: ' + JSON.stringify(options.indexes))
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

  if (!options.quiet) console.info('command', quote(ar));

  let cmd = quote(ar).replace('SOURCEFILE', escapeFileName(archiveFile));
  if (!options.quiet) console.info('cmd', cmd);
  exec_unar(cmd, targetDir, callback);
}; // unpackAll.unpack

function _unpackOnly(archiveFile, unpackDir, unpackOnly, callback) {
  if (!callback) return new Error('No callback function');
  if (!archiveFile) return callback(Error("Error: archiveFile missing."), null);
  if (!unpackDir) return callback(Error("Error: target Directory missing."), null);
  if (!unpackOnly) return callback(Error("Error: files or directory to extract form archive missing."), null);

  // Unar command:
  let unar = (process.platform != "linux") ? join(__dirname, 'unar') : 'unar';
  let ar = [unar];

  // Archive file (source):
  ar.push('SOURCEFILE');
  //ar.push(archiveFile);

  // -output-directory (-o) <string>: The directory to write the contents of the archive to. Defaults to the current directory.
  ar.push('-o');
  ar.push(unpackDir);

  // -force-overwrite (-f): Always overwrite files when a file to be unpacked already exists on disk. By default, the program asks the user if possible, otherwise skips the file.
  ar.push('-f');

  // -no-directory (-D): Never create a containing directory for the contents of the unpacked archive.
  ar.push('-D');

  // -copy-time (-t): Copy the file modification time from the archive file to the containing directory, if one is created.
  ar.push('-t');

  if (unpackOnly) {
    if (Array.isArray(unpackOnly)) {
      unpackOnly.forEach(function (s) {
        ar.push(s);
      });
    } else {
      ar.push(unpackOnly);
    }
  }

  let cmd = quote(ar).replace('SOURCEFILE', escapeFileName(archiveFile));
  console.info('cmd', cmd);
  exec_unar(cmd, unpackDir, callback);
}; // unpackAll.unpackonly

function _list(archiveFile, options, callback) {
  if (!callback) return new Error('No callback function');
  if (!archiveFile) archiveFile = options.archiveFile;
  if (!archiveFile) return callback(Error("Error: archiveFile or options.archiveFile missing."), null);

  if (!options) options = {};

  // Usar command:
  let lsar = options.lsar;
  if (!lsar) lsar = (process.platform != "linux") ? join(__dirname, 'lsar') : 'lsar';
  let ar = [lsar];

  // Archive file (source):
  ar.push('SOURCEFILE');

  // -no-recursion (-nr): Do not attempt to extract archives contained in other archives. For instance, when unpacking a .tar.gz file, only unpack the .gz file and not its contents.
  if (options.noRecursion) ar.push('-nr');

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
  if (options.json) ar.push('-j');

  // -json-ascii (-ja): Print the listing in JSON format, encoded as pure ASCII text.
  if (options.jsonAscii) ar.push('-ja');

  let cmd = quote(ar).replace('SOURCEFILE', escapeFileName(archiveFile));
  if (!options.quiet) console.info('cmd', cmd);
  exec(cmd, function (err, stdout, stderr) {
    if (err) return callback(Error(err), null);
    if (stderr && stderr.length > 0) return callback(Error('Error: ' + stderr), null);

    let lines = stdout.split(/(\r?\n)/g);
    if (lines.length > 0) {
      let files = lines.filter(unpackAll.defaultListFilter);
      return callback(null, files);

    } else {
      return callback(Error('Error: no files found in archive. ' + stderr), null);
    }
  });
}; // unpackAll.list

function unpackAll() { }

export const list = unpackAll.list = function (archiveFile, options) {
  return new when.promise((resolve, reject, progress) => {
    _list(archiveFile, options, (err, files, text) => {
      if (err) {
        reject(err);
      } else if (text) {
        progress(text);
      } else {
        resolve(files);
      }
    });
  });
}

export const unpack = unpackAll.unpack = function (archiveFile, options) {
  return new when.promise((resolve, reject, progress) => {
    _unpack(archiveFile, options, (err, files, text) => {
      if (err) {
        reject(err);
      } else if (text) {
        progress(text);
      } else {
        resolve(files);
      }
    });
  });
}

export const unpackOnly = unpackAll.unpackOnly = function (archiveFile, unpackDir, unpackOnly) {
  return new when.promise((resolve, reject, progress) => {
    _unpackOnly(archiveFile, unpackDir, unpackOnly, (err, files, text) => {
      if (err) {
        reject(err);
      } else if (text) {
        progress(text);
      } else {
        resolve(files);
      }
    });
  });
}

export default unpackAll;
