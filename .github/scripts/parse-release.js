#!/usr/bin/env node

const fs = require('fs');

const prBody = process.env.PR_BODY || '';
const lines = prBody.replace(/\r\n/g, '\n').split('\n');

const packagePattern = /^([a-zA-Z][a-zA-Z0-9-]*)@(\d+\.\d+\.\d+)$/;

let inBetClient = false;
let version = null;
const devs = new Set();

for (const line of lines) {
  const trimmed = line.trim();
  const packageMatch = trimmed.match(packagePattern);

  if (packageMatch) {
    if (packageMatch[1] === 'bet-client') {
      inBetClient = true;
      version = packageMatch[2];
    } else if (inBetClient) {
      break;
    }
    continue;
  }

  if (inBetClient) {
    for (const match of trimmed.matchAll(/Thanks @([a-zA-Z0-9-]+)!/g)) {
      devs.add(match[1]);
    }
  }
}

if (!inBetClient || !version) {
  console.log('bet-client section not found in PR body, skipping');
  process.exit(0);
}

const devsArray = Array.from(devs);
const devsFormatted = devsArray.map(d => `@${d}`).join(' ');
const devsJson = JSON.stringify(devsArray);

const githubOutput = process.env.GITHUB_OUTPUT;
if (githubOutput) {
  fs.appendFileSync(githubOutput, `found=true\n`);
  fs.appendFileSync(githubOutput, `app=bet-client\n`);
  fs.appendFileSync(githubOutput, `version=${version}\n`);
  fs.appendFileSync(githubOutput, `devs_formatted=${devsFormatted}\n`);
  fs.appendFileSync(githubOutput, `devs_json=${devsJson}\n`);
}

console.log(`app: bet-client@${version}`);
console.log(`devs: ${devsFormatted}`);
