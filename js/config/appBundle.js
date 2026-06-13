/**
 * Application script inventory — keep in sync with index.html load order.
 * Used by service-worker.js (importScripts) for offline precaching.
 */
const APP_CACHE_NAME = 'fin-fisheries-v37';

/** Must match scripts/load-species-data.js SPECIES_DATA_FILES */
const SPECIES_DATA_URLS = [
    './species-data/01-648-core.js',
    './species-data/02-635-hms.js',
    './species-data/03-648-midatlantic.js',
    './species-data/04-648-northeast.js',
    './species-data/05-648-small-pelagic.js',
    './species-data/06-648-pelagic-mollusks.js',
    './species-data/07-648-zooplankton.js',
    './species-data/08-648-micro.js',
    './species-data/09-648-butterfish.js',
    './species-data/10-635-billfish-general.js',
    './species-data/11-misc-placeholders.js',
    './species-data/12-648-groundfish.js',
    './species-data/13-648-late-species.js',
    './species-data/15-648-monkfish.js',
    './LOCATION_CHECKLIST_CONFIG.js',
    './species-data/14-init.js'
];

const APP_SCRIPT_URLS = [
    './fish-images.js',
    './js/config/regulationMeta.js',
    ...SPECIES_DATA_URLS,
    './update-checker.js',
    './REGULATION_DATES_CONFIG.js',
    './GROUND_FISH_TRIP_LIMITS_CONFIG.js',
    './SMB648_POLICY_CONFIG.js',
    './SALMON648_POLICY_CONFIG.js',
    './SCALLOP648_POLICY_CONFIG.js',
    './SURFCLAM648_POLICY_CONFIG.js',
    './SUMMERFLOUNDER648_POLICY_CONFIG.js',
    './SCUP648_POLICY_CONFIG.js',
    './BSB648_POLICY_CONFIG.js',
    './BLUEFISH648_POLICY_CONFIG.js',
    './HERRING648_POLICY_CONFIG.js',
    './DOGFISH648_POLICY_CONFIG.js',
    './REDFCRAB648_POLICY_CONFIG.js',
    './TILEFISH648_POLICY_CONFIG.js',
    './SKATE648_POLICY_CONFIG.js',
    './LOBSTER697_POLICY_CONFIG.js',
    './PROHIB697_POLICY_CONFIG.js',
    './MPS24_POLICY_CONFIG.js',
    './DOLPHIN622_POLICY_CONFIG.js',
    './CMP622_POLICY_CONFIG.js',
    './FORAGE648_POLICY_CONFIG.js',
    './NMS648_POLICY_CONFIG.js',
    './MONKFISH648_POLICY_CONFIG.js',
    './FISHERY_QUOTA_STATUS_CONFIG.js',
    './HMS_TUNAS_POLICY_CONFIG.js',
    './HMS_HMS_POLICY_CONFIG.js',
    './SPECIES_GROUPS_CONFIG.js',
    './js/utils/helpers.js',
    './js/utils/dateManager.js',
    './js/core/stateBridge.js',
    './js/state/stateManager.js',
    './js/utils/navigation.js',
    './js/config/multispeciesFlow.js',
    './js/validation/assessmentViolations.js',
    './js/validation/speciesViolationChecks.js',
    './js/validation/violationChecker.js',
    './js/validation/validators.js',
    './js/ui/speciesPolicyAdvisor.js',
    './js/ui/speciesGrid.js',
    './js/ui/questionRenderer.js',
    './js/ui/assessmentSteps.js',
    './js/ui/groupedAssessmentSections.js',
    './js/ui/reportBuilder.js',
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
