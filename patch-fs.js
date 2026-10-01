const fs = require("fs");

function convertError(err, p) {
  if (err && err.code === "EISDIR") {
    const e = new Error(`EINVAL: invalid argument, readlink '${p}'`);
    e.code = "EINVAL";
    e.errno = -4071;
    e.syscall = "readlink";
    e.path = p;
    return e;
  }
  return err;
}

const origReadlinkSync = fs.readlinkSync;
fs.readlinkSync = function (p, options) {
  try {
    return origReadlinkSync.call(fs, p, options);
  } catch (err) {
    throw convertError(err, p);
  }
};

const origReadlink = fs.readlink;
fs.readlink = function (p, options, callback) {
  if (typeof options === "function") {
    callback = options;
    options = undefined;
  }
  return origReadlink.call(fs, p, options, (err, linkString) => {
    callback(convertError(err, p), linkString);
  });
};

if (fs.promises && fs.promises.readlink) {
  const origPromisesReadlink = fs.promises.readlink;
  fs.promises.readlink = async function (p, options) {
    try {
      return await origPromisesReadlink.call(fs.promises, p, options);
    } catch (err) {
      throw convertError(err, p);
    }
  };
}
