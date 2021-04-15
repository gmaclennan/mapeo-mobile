const path = require("path");
const tmp = require("tmp");
const test = require("tape");
const collect = require("collect-stream");
const Storage = require("../lib/upgrade-storage");
const fs = require("fs");
const mkdirp = require("mkdirp");

test("set an apk + read it", t => {
  t.plan(6);

  const expected = {
    hash: "78ad74cecb99d1023206bf2f7d9b11b28767fbb9369daa0afa5e4d062c7ce041",
    size: 10,
    version: "1.2.3",
    hashType: "sha256",
    platform: "android",
    arch: ["arm64-v8a"],
    id: "78ad74cecb99d1023206bf2f7d9b11b28767fbb9369daa0afa5e4d062c7ce041",
  };

  const dir = tmp.dirSync().name;
  const storage = new Storage(dir);
  const apkPath = path.join(__dirname, "static", "fake.apk");

  storage.setApkInfo(apkPath, "1.2.3", err => {
    t.error(err);
    storage.getAvailableUpgrades((err, options) => {
      t.error(err);
      t.equals(options.length, 1);
      scrub(options);
      t.deepEquals(options[0], expected);

      collect(storage.createReadStream(options[0].hash), (err, data) => {
        t.error(err);
        t.equals("fake data\n", data.toString());
      });
    });
  });
});

test("write + clear an older upgrade", t => {
  t.plan(11);

  const expected = {
    hash: "810ff2fb242a5dee4220f2cb0e6a519891fb67f2f828a6cab4ef8894633b1f50",
    size: 8,
    version: "3.0.0",
    hashType: "sha256",
    platform: "android",
    arch: ["arm64-v8a"],
    id: "810ff2fb242a5dee4220f2cb0e6a519891fb67f2f828a6cab4ef8894633b1f50",
  };

  const dir = tmp.dirSync().name;
  const storage = new Storage(dir, {
    version: "4.0.0",
    arch: "arm64-v8a",
    platform: "android",
  });

  const ws = storage.createApkWriteStream(
    "foo.apk",
    "3.0.0",
    expected.hash,
    err => {
      t.error(err);
      storage.getAvailableUpgrades((err, options) => {
        t.error(err);
        scrub(options);
        t.equals(options.length, 1);
        t.deepEquals(options[0], expected);

        collect(storage.createReadStream(options[0].hash), (err, data) => {
          t.error(err);
          t.equals("testdata", data.toString());

          storage.clearOldApks(err => {
            t.error(err);
            fs.stat(path.join(dir, "foo.apk"), (err, stat) => {
              t.ok(!!err);
              t.equals(err.code, "ENOENT");
              storage.getAvailableUpgrades((err, options) => {
                t.error(err);
                t.equals(options.length, 0);
              });
            });
          });
        });
      });
    }
  );
  ws.end("testdata");
});

test("write + ensure a newer upgrade isn't wiped", t => {
  t.plan(10);

  const expected = {
    hash: "810ff2fb242a5dee4220f2cb0e6a519891fb67f2f828a6cab4ef8894633b1f50",
    size: 8,
    version: "3.0.0",
    hashType: "sha256",
    platform: "android",
    arch: ["arm64-v8a"],
    id: "810ff2fb242a5dee4220f2cb0e6a519891fb67f2f828a6cab4ef8894633b1f50",
  };

  const dir = tmp.dirSync().name;
  const storage = new Storage(dir, {
    version: "1.0.0",
    arch: "arm64-v8a",
    platform: "android",
  });

  const ws = storage.createApkWriteStream(
    "foo.apk",
    "3.0.0",
    expected.hash,
    err => {
      t.error(err);
      storage.getAvailableUpgrades((err, options) => {
        t.error(err);
        scrub(options);
        t.equals(options.length, 1);
        t.deepEquals(options[0], expected);

        collect(storage.createReadStream(options[0].hash), (err, data) => {
          t.error(err);
          t.equals("testdata", data.toString());

          storage.clearOldApks(err => {
            t.error(err);
            fs.access(path.join(dir, "foo.apk"), err => {
              t.error(err);
              storage.getAvailableUpgrades((err, options) => {
                t.error(err);
                t.equals(options.length, 1);
              });
            });
          });
        });
      });
    }
  );
  ws.end("testdata");
});

test("a failed write does not appear as an upgrade option", t => {
  t.plan(4);

  const dir = tmp.dirSync().name;
  const storage = new Storage(dir, {
    version: "4.0.0",
    arch: "arm64-v8a",
    platform: "android",
  });

  const ws = storage.createApkWriteStream("foo.apk", "3.0.0", "???", err => {
    t.ok(err instanceof Error);
    t.notOk(fs.existsSync(path.join(dir, "foo.apk")));
    storage.getAvailableUpgrades((err, options) => {
      t.error(err);
      t.equals(options.length, 0);
    });
  });

  ws.write(Buffer.alloc(10000000));
  setTimeout(() => {
    ws.emit("error", new Error("write error?"));
  }, 100);
});

test("a successful write with the wrong hash does not appear as an upgrade option", t => {
  t.plan(4);

  const dir = tmp.dirSync().name;
  const storage = new Storage(dir, {
    version: "4.0.0",
    arch: "arm64-v8a",
    platform: "android",
  });

  const ws = storage.createApkWriteStream(
    "foo.apk",
    "3.0.0",
    "fakehash",
    err => {
      t.ok(err instanceof Error);
      t.notOk(fs.existsSync(path.join(dir, "foo.apk")));
      storage.getAvailableUpgrades((err, options) => {
        t.error(err);
        t.equals(options.length, 0);
      });
    }
  );

  ws.end("testdata");
});

test("leftover files in the upgrade temp dir get wiped on init", t => {
  t.plan(2);

  const dir = tmp.dirSync().name;
  mkdirp.sync(path.join(dir, "tmp"));
  const filepath = path.join(dir, "tmp", "somefile");

  try {
    fs.writeFileSync(filepath, Buffer.alloc(16));
  } catch (err) {
    t.error(err);
  }
  t.ok(fs.existsSync(filepath), "file created ok");

  const storage = new Storage(dir, {
    version: "4.0.0",
    arch: "arm64-v8a",
    platform: "android",
  });
  t.notOk(fs.existsSync(filepath), "file does not exist");
});

// Wipes the 'filename' property.
function scrub(options) {
  options.forEach(o => delete o.filename);
}