// check.mjs for bugfix-01-off-by-one
import { join } from "node:path";
import { chdir } from "node:process";

const workdir = process.argv[2] || process.cwd();
chdir(workdir);

import { execSync } from "node:child_process";
execSync("node test.js", { stdio: "inherit" });
