// Steps for the scripts' scenarios. Each scenario works in its own temp folder ({root} in compared output):
// the fixture is copied there, the script under test is copied into {root}/scripts/, and node_modules is linked,
// so a script finds its packages and its relative paths (../dist) exactly as it does in the repo.
import { execFile } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { After, Before, Given, Then, When } from "@cucumber/cucumber";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

Before(function () {
  this.root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "script-test-")));
  fs.symlinkSync(path.join(repo, "node_modules"), path.join(this.root, "node_modules"));
});

After(function () {
  fs.rmSync(this.root, { recursive: true, force: true });
});

Given("the fixture {string}", function (name) {
  fs.cpSync(path.join(repo, "scripts", "test", "fixtures", name), this.root, { recursive: true });
});

Given("the file {string} contains:", function (file, doc) {
  const p = path.join(this.root, file);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, `${doc}\n`);
});

Given("the file {string} is removed", function (file) {
  fs.rmSync(path.join(this.root, file));
});

When("the script {string} runs", function (script) {
  fs.mkdirSync(path.join(this.root, "scripts"), { recursive: true });
  fs.copyFileSync(path.join(repo, "scripts", script), path.join(this.root, "scripts", script));
  return new Promise((resolve) => {
    execFile(
      process.execPath,
      [path.join("scripts", script)],
      { cwd: this.root, encoding: "utf8" },
      (err, stdout, stderr) => {
        this.code = err ? err.code : 0;
        this.out = `${stdout}${stderr}`.trimEnd().replaceAll(this.root, "{root}");
        resolve();
      },
    );
  });
});

Then("it exits with {int} and prints:", function (code, doc) {
  if (this.out !== doc || this.code !== code) {
    throw new Error(
      `exit code ${this.code} (expected ${code})\n--- actual ---\n${this.out}\n--- expected ---\n${doc}\n--- end ---`,
    );
  }
});

Then("it exits with {int} and the output contains:", function (code, doc) {
  if (!this.out.includes(doc) || this.code !== code) {
    throw new Error(
      `exit code ${this.code} (expected ${code})\n--- actual ---\n${this.out}\n--- expected to contain ---\n${doc}\n--- end ---`,
    );
  }
});
