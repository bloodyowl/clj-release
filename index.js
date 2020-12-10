let fs = require("fs");
let path = require("path");
let prompts = require("prompts");
const semverGt = require("semver/functions/gt");
let chalk = require("chalk");
let { spawnSync } = require("child_process");
let cwd = process.cwd();

let defProjectRe = /(\(defproject \S+ ")([^"]+)(")/;

async function main() {
  console.log(chalk.green("clj-version"));
  let projectCljPath = path.join(cwd, "project.clj");
  if (!fs.existsSync(projectCljPath)) {
    console.error("No project.clj found");
    return process.exit(1);
  }
  let projectClj = fs.readFileSync(projectCljPath, "utf8");
  let match = projectClj.match(defProjectRe);
  if (!match) {
    console.error("Couldn't parse project.clj");
    return process.exit(1);
  }
  let currentVersion = match[2];
  console.log(`Current version: ${currentVersion}`);
  let response = await prompts({
    type: "text",
    name: "version",
    message: "  New version:",
  });
  let nextVersion = response.version;
  if (!response.version) {
    return process.exit(1);
  }
  try {
    if (!semverGt(nextVersion, currentVersion)) {
      console.error(
        `${chalk.red(
          "ERROR"
        )} ${currentVersion} cannot be added after ${nextVersion}`
      );
      return process.exit(1);
    }
  } catch (_) {
    console.error(`${chalk.red("ERROR")} ${nextVersion} couln't be parsed`);
    return process.exit(1);
  }
  let nextProjectClj = projectClj.replace(defProjectRe, `$1${nextVersion}$3`);
  fs.writeFileSync(projectCljPath, nextProjectClj, "utf8");
  spawnSync(`git add project.clj`);
  spawnSync(`git commit -m "v${nextVersion}"`);
  spawnSync(`git tag -a ${nextVersion} -m "${nextVersion}"`);
  console.log(chalk.green("Done!"));
}

exports.main = main;
