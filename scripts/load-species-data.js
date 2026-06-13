/**
 * Load split species-data modules into a Node vm sandbox (validators / smoke tests).
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SPECIES_DATA_FILES = [
    'species-data/01-648-core.js',
    'species-data/02-635-hms.js',
    'species-data/03-648-midatlantic.js',
    'species-data/04-648-northeast.js',
    'species-data/05-648-small-pelagic.js',
    'species-data/06-648-pelagic-mollusks.js',
    'species-data/07-648-zooplankton.js',
    'species-data/08-648-micro.js',
    'species-data/09-648-butterfish.js',
    'species-data/10-635-billfish-general.js',
    'species-data/11-misc-placeholders.js',
    'species-data/12-648-groundfish.js',
    'species-data/13-648-late-species.js',
    'species-data/15-648-monkfish.js',
    'LOCATION_CHECKLIST_CONFIG.js',
    'species-data/14-init.js'
];

function loadSpeciesData(sandbox = { console }) {
    const root = path.join(__dirname, '..');
    const parts = [];
    for (const rel of SPECIES_DATA_FILES) {
        const filePath = path.join(root, rel);
        if (!fs.existsSync(filePath)) {
            throw new Error(`Missing species data module: ${rel}`);
        }
        parts.push(fs.readFileSync(filePath, 'utf8'));
    }
    const combined = parts.join('\n\n');
    const wrapped = `(function() {\n${combined}\nreturn SPECIES_DATA;\n})()`;
    const bundlePath = path.join(root, 'species-data', '__bundle__.js');
    const SPECIES_DATA = vm.runInNewContext(wrapped, sandbox, { filename: bundlePath });
    if (!SPECIES_DATA || typeof SPECIES_DATA !== 'object') {
        throw new Error('SPECIES_DATA not defined after loading modules');
    }
    sandbox.SPECIES_DATA = SPECIES_DATA;
    return SPECIES_DATA;
}

module.exports = { SPECIES_DATA_FILES, loadSpeciesData };
