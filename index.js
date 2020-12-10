'use strict';

// see http://unarchiver.c3.cx/commandline
// unar and lsar
import { dirname, join } from 'path';
import { exec } from 'child_process';
import when from 'when';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(
  import.meta.url);
const __dirname = dirname(__filename);
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

function quote(xs) {
  return array_map(xs, function (s) {
    return String(s).replace(/([#!$&'(),;<=>?@\[\\\]^`{|}])/g, '\\$1');
  }).join(' ');
};
//

let archiveTypePattern = /: [A-Z,7]*$/g;

let escapeFileName = function (s) {
  return '"' + s + '"';
};

const isInt = function isInt(x) {
  return !isNaN(x) && eval(x).toString().length == parseInt(eval(x)).toString().length;
};

unar.defaultListFilter = function (s) {
  return s && s != '' &&
    s.indexOf('\r') == -1 &&
    s.indexOf('\n') == -1 &&
    !s.match(archiveTypePattern);
};

export const unpack = unar.unpack = function (archiveFile, optionsTarget, unpackOptions = {}, options) {
  return new when.promise((resolve, reject, progress) => {
    options = options || {
      forceOverwrite: true,
      noDirectory: true,
      quiet: true
    };
    if (typeof optionsTarget == 'string') {
      options.targetDir = optionsTarget;
      if (typeof unpackOptions == 'string' || Array.isArray(unpackOptions))
        options.files = unpackOptions;
      else if (unpackOptions)
        options = Object.assign(options, unpackOptions);
    } else if (optionsTarget) {
      options = optionsTarget;
    }

    if (!archiveFile)
      archiveFile = options.archiveFile;
    if (!archiveFile)
      return reject("Error: archiveFile or options.archiveFile missing.");

    // Unar command:
    let ar = [(process.platform != "linux") ? join(__dirname, 'unar') : 'unar'];

    // Archive file (source):
    ar.push('SOURCEFILE');
    //ar.push(archiveFile);

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
        console.error('options.indexes must be an array of integer, but it is: ' + JSON.stringify(options.indexes))
      }
    } else if (options.files) {
      if (Array.isArray(options.files)) {
        options.files.forEach(function (s) {
          ar.push(escapeFileName(s));
        });
      } else {
        ar.push(escapeFileName(options.files));
      }
    }

    let cmd = quote(ar).replace('SOURCEFILE', escapeFileName(archiveFile));
    if (!options.quiet)
      console.info('cmd', cmd);
    exec(cmd, function (err, stdout, stderr) {
      if (err || (stderr && stderr.length > 0))
        return reject('Error: ' + (err || stderr));

      if (stdout && stdout.length > 0 && (stdout.indexOf('No files extracted') > -1)) {
        return reject('Error: No files extracted');
      }

      let lines = stdout.split(/(\r?\n)/g);
      lines.filter(unar.defaultListFilter);
      lines.shift();
      lines.pop();
      lines.pop();
      lines.pop();

      stdout = [];
      lines.forEach((byFile) => {
        let file = byFile.split('  ')[1];
        if (file)
          stdout.push(file);
      });

      progress(stdout);
      return resolve(targetDir);
    });
  }); // unar.unpack
}

export const list = unar.list = function (archiveFile, options) {
  return new Promise((resolve, reject) => {
    if (!archiveFile)
      archiveFile = options.archiveFile;
    if (!archiveFile)
      return reject("Error: archiveFile or options.archiveFile missing.");

    if (!options)
      options = {};

    // lsar command:
    let lsar = options.lsar;
    if (!lsar)
      lsar = (process.platform != "linux") ? join(__dirname, 'lsar') : 'lsar';
    let ar = [lsar];

    // Archive file (source):
    ar.push('SOURCEFILE');

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

    let cmd = quote(ar).replace('SOURCEFILE', escapeFileName(archiveFile));
    if (!options.quiet)
      console.info('cmd', cmd);
    exec(cmd, function (err, stdout, stderr) {
      if (err || (stderr && stderr.length > 0))
        return reject('Error: ' + (err || stderr));

      let lines = stdout.split(/(\r?\n)/g);
      if (lines.length > 0) {
        let files = lines.filter(unar.defaultListFilter);
        if (lines[2]) {
          files.shift();
          return resolve(files);
        }
      }

      return reject('Error: no files found in archive. ' + stderr);
    });
  }); // unar.list
}

function unar() { }

export default unar;
