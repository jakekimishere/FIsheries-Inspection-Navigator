#!/usr/bin/env node
/**
 * Compare APP_CACHE_NAME on main vs origin/gh-pages to detect stale deploys.
 * Run: npm run pages:check
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const bundlePath = 'js/config/appBundle.js';

function readCacheFromFile(filePath) {
    const text = fs.readFileSync(filePath, 'utf8');
    const match = text.match(/APP_CACHE_NAME\s*=\s*['"]([^'"]+)['"]/);
    return match ? match[1] : null;
}

function readCacheFromGit(ref, filePath) {
    try {
        const text = execSync(`git show ${ref}:${filePath}`, {
            cwd: root,
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe']
        });
        const match = text.match(/APP_CACHE_NAME\s*=\s*['"]([^'"]+)['"]/);
        return match ? match[1] : null;
    } catch {
        return null;
    }
}

function main() {
    const localPath = path.join(root, bundlePath);
    const localCache = readCacheFromFile(localPath);
    const remoteCache = readCacheFromGit('origin/gh-pages', bundlePath);

    console.log('FIN GitHub Pages deploy check\n');
    console.log(`  Local (working tree): ${localCache || 'not found'}`);
    console.log(`  origin/gh-pages:      ${remoteCache || 'not found (fetch origin?)'}`);

    if (!localCache) {
        console.error('\nCould not read APP_CACHE_NAME from local appBundle.js');
        process.exit(1);
    }

    if (!remoteCache) {
        console.warn('\nCould not read gh-pages branch. Run: git fetch origin gh-pages');
        process.exit(0);
    }

    if (localCache === remoteCache) {
        console.log('\nOK — gh-pages matches local cache version.');
        process.exit(0);
    }

    console.warn('\nSTALE — gh-pages is behind local. Push to main and wait for Actions deploy.');
    console.warn(`  Expected: ${localCache}`);
    console.warn(`  Deployed: ${remoteCache}`);
    process.exit(1);
}

main();
