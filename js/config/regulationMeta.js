/**
 * Single source of truth for regulation data version and app metadata.
 * When NOAA rules change: update dataLastUpdated here, then species-data.js.
 */
const REGULATION_META = {
    appVersion: '1.0.0',
    dataLastUpdated: '2026-05-21',
    region: 'northeast',
    dataFiles: [
        'species-data.js',
        'REGULATION_DATES_CONFIG.js',
        'SPECIES_GROUPS_CONFIG.js',
        'regulation-updates.json'
    ],
    primarySources: [
        '50 CFR Part 648 — Northeast multispecies, scallop, flounder',
        '50 CFR Part 635 — Atlantic highly migratory species',
        'NOAA Greater Atlantic / HMS bulletins and compliance guides'
    ]
};

/** @deprecated Use REGULATION_META — kept for existing scripts */
const APP_VERSION = REGULATION_META.appVersion;
/** @deprecated Use REGULATION_META — kept for existing scripts */
const DATA_LAST_UPDATED = REGULATION_META.dataLastUpdated;

if (typeof window !== 'undefined') {
    window.REGULATION_META = REGULATION_META;
    window.APP_VERSION = APP_VERSION;
    window.DATA_LAST_UPDATED = DATA_LAST_UPDATED;
}
