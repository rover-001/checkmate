// check.mjs for bugfix-05-date-timezone
import { join } from "node:path";
import { chdir } from "node:process";

const workdir = process.argv[2] || process.cwd();
chdir(workdir);

import { execSync } from "node:child_process";
// Force timezone that diverges from UTC to expose local timezone bug
execSync("node test.js", { stdio: "inherit", env: { ...process.env, TZ: "America/New_York" } });
