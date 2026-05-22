/**
 * Application script inventory — keep in sync with index.html load order.
 * Used by service-worker.js (importScripts) for offline precaching.
 */
const APP_CACHE_NAME = 'fin-fisheries-v4';

const APP_SCRIPT_URLS = [
    './fish-images.js',
    './js/config/regulationMeta.js',
    './species-data.js',
    './update-checker.js',
    './REGULATION_DATES_CONFIG.js',
    './SPECIES_GROUPS_CONFIG.js',
    './js/utils/helpers.js',
    './js/utils/dateManager.js',
    './js/core/stateBridge.js',
    './js/state/stateManager.js',
    './js/utils/navigation.js',
    './js/validation/validators.js',
    './js/ui/speciesGrid.js',
    './js/ui/questionRenderer.js',
    './js/ui/assessmentSteps.js',
    './js/ui/reportGenerator.js',
    './js/legacy/assessmentEngine.js',
    './app/main.js'
];

const APP_STATIC_URLS = [
    './',
    './index.html',
    './styles.css',
    './manifest.json',
    './regulation-updates.json',
    './sw-register.js',
    './icon-192.png',
    './icon-512.png'
];

const APP_CACHE_URLS = [...APP_STATIC_URLS, ...APP_SCRIPT_URLS];
