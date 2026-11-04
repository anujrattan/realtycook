#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { execSync } from "node:child_process";

execSync("npx next build", { stdio: "inherit" });

const outDir = "out";
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

if (existsSync("public")) {
  cpSync("public", outDir, { recursive: true });
}

mkdirSync(`${outDir}/_next`, { recursive: true });
cpSync(".next/static", `${outDir}/_next/static`, { recursive: true });

cpSync(".next/server/app/index.html", `${outDir}/index.html`);
if (existsSync(".next/server/app/index.rsc")) {
  cpSync(".next/server/app/index.rsc", `${outDir}/index.txt`);
}

for (const route of ["landing1", "crm"]) {
  if (existsSync(`.next/server/app/${route}.html`)) {
    mkdirSync(`${outDir}/${route}`, { recursive: true });
    cpSync(`.next/server/app/${route}.html`, `${outDir}/${route}/index.html`);
  }
  if (existsSync(`.next/server/app/${route}.rsc`)) {
    cpSync(`.next/server/app/${route}.rsc`, `${outDir}/${route}/index.txt`);
  }
}

if (existsSync(".next/server/app/_not-found.html")) {
  cpSync(".next/server/app/_not-found.html", `${outDir}/404.html`);
}

console.log("✓ Prepared Cloudflare Pages static output in ./out");
