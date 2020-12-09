#!/usr/bin/env node

'use strict'

import fs from 'fs-extra';
import { join } from 'path';
import StreamZip from 'node-stream-zip';
import { wget } from "node-wget-fetch";
import _installer from 'system-installer';
const system_installer = _installer.installer;

const unarAppFile = (process.platform == "darwin") ? 'unarMac.zip' : 'unarWindows.zip';
const unarAppUrl = 'https://cdn.theunarchiver.com/downloads/';

const cwd = process.cwd();
const url = unarAppUrl + unarAppFile;
const source = join(cwd, unarAppFile);

if ((process.platform == "win32") || (process.platform == "darwin")) {
  getExtractUnar(url, source, cwd)
    .then(function () {
      fs.unlink(source, (err) => {
        if (err) console.error(err);
      });
      if (process.platform == 'win32')
        fs.removeSync(join(cwd, '__MACOSX'));
      if (process.platform != "win32") {
        var chmod = ['unar', 'lsar'];
        chmod.forEach(function (s) {
          fs.chmodSync(join(cwd, s), 755)
        });
      }
      console.log('Unar installed successful');
    })
    .catch(function (err) {
      console.log(err);
    });
} else {
  system_installer('unar')
    .then(function () {
      console.log('Unar installed successful');
    })
    .catch(function (err) {
      console.error(err);
    });
}

function getExtractUnar(urlSource, fileSource, destination) {
  console.log('Downloading ' + urlSource);
  return new Promise(function (resolve, reject) {
    wget(urlSource, fileSource)
      .then((info) => {
        const unzip = new StreamZip({
          file: fileSource,
          storeEntries: true
        });
        unzip.on('ready', () => {
          unzip.extract(null, destination, (err, count) => {
            unzip.close();
            if (err) {
              return reject(err);
            }

            return resolve(count);
          });
        });
      })
      .catch((err) => console.log('Error downloading file: ' + err));
  });
}
