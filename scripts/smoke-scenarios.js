#!/usr/bin/env node
/**
 * Node smoke tests for assessment violations and quota config.
 * Run: node scripts/smoke-scenarios.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');

const { loadSpeciesData } = require('./load-species-data');

function loadSandbox() {
    const sandbox = { console, window: null };
    sandbox.window = sandbox;
    const load = (rel) => {
        const filePath = path.join(root, rel);
        vm.runInNewContext(fs.readFileSync(filePath, 'utf8'), sandbox, { filename: filePath });
    };
    load('REGULATION_DATES_CONFIG.js');
    load('SCALLOP648_POLICY_CONFIG.js');
    load('SURFCLAM648_POLICY_CONFIG.js');
    load('SUMMERFLOUNDER648_POLICY_CONFIG.js');
    load('SCUP648_POLICY_CONFIG.js');
    load('BSB648_POLICY_CONFIG.js');
    load('BLUEFISH648_POLICY_CONFIG.js');
    load('HERRING648_POLICY_CONFIG.js');
    load('DOGFISH648_POLICY_CONFIG.js');
    load('REDFCRAB648_POLICY_CONFIG.js');
    load('TILEFISH648_POLICY_CONFIG.js');
    load('SKATE648_POLICY_CONFIG.js');
    load('LOBSTER697_POLICY_CONFIG.js');
    load('PROHIB697_POLICY_CONFIG.js');
    load('MPS24_POLICY_CONFIG.js');
    load('DOLPHIN622_POLICY_CONFIG.js');
    load('CMP622_POLICY_CONFIG.js');
    load('FORAGE648_POLICY_CONFIG.js');
    load('NMS648_POLICY_CONFIG.js');
    load('MONKFISH648_POLICY_CONFIG.js');
    load('SMB648_POLICY_CONFIG.js');
    load('SALMON648_POLICY_CONFIG.js');
    load('FISHERY_QUOTA_STATUS_CONFIG.js');
    load('HMS_TUNAS_POLICY_CONFIG.js');
    load('HMS_HMS_POLICY_CONFIG.js');
    load('GROUND_FISH_TRIP_LIMITS_CONFIG.js');
    sandbox.SPECIES_DATA = loadSpeciesData(sandbox);
    load('js/validation/assessmentViolations.js');
    load('js/validation/speciesViolationChecks.js');
    load('js/ui/speciesPolicyAdvisor.js');
    return sandbox;
}

function assert(name, condition, detail) {
    if (!condition) {
        throw new Error(`${name}${detail ? `: ${detail}` : ''}`);
    }
    console.log(`  ✓ ${name}`);
}

function main() {
    const errors = [];
    console.log('Smoke scenarios...\n');

    try {
        const sb = loadSandbox();
        const { AssessmentViolations: AV, SPECIES_DATA, getCommercialPossessionLimit, getHerringAreaLimitLb, checkSpeciesViolations } = sb;

        // Prohibited: Atlantic angel shark
        const angel = SPECIES_DATA['atlantic-angel-shark'];
        const angelV = AV.evaluateAssessmentQuestionViolations('atlantic-angel-shark', angel, { numberOfFish: 1, permitType: 'recreational' });
        assert('atlantic angel shark retention violation', angelV.length > 0, angelV.join('; '));

        // Atlantic salmon EEZ
        const salmon = SPECIES_DATA['atlantic-salmon'];
        const salmonV = AV.evaluateAssessmentQuestionViolations('atlantic-salmon', salmon, { numberOfFish: 1, permitType: 'recreational' });
        assert('atlantic salmon EEZ prohibition', salmonV.length > 0);

        // Herring area 1B over limit
        const herring = SPECIES_DATA['atlantic-herring'];
        const herringV = AV.evaluateAssessmentQuestionViolations('atlantic-herring', herring, {
            permitType: 'commercial',
            fishingArea: 'area-1b',
            possessionAmount: 2500,
            dateOfCatch: '2026-05-21'
        });
        assert('herring 1B 2500 lb exceeds 2000', herringV.length > 0, herringV.join('; '));

        // King mackerel bag
        const king = SPECIES_DATA['king-mackerel'];
        const kingV = AV.evaluateAssessmentQuestionViolations('king-mackerel', king, { permitType: 'recreational', numberOfFish: 5 });
        assert('king mackerel over bag', kingV.length > 0);

        // BFT June commercial
        const bft = SPECIES_DATA['bluefin-tuna'];
        const bftV = AV.evaluateAssessmentQuestionViolations('bluefin-tuna', bft, {
            permitType: 'commercial-general',
            numberOfFish: 5,
            dateOfCatch: '2026-06-15'
        });
        assert('BFT June general over 3 fish', bftV.length > 0, bftV.join('; '));

        // Skate wing season 1
        const skate = SPECIES_DATA['thorny-skate'];
        const skateV = AV.evaluateAssessmentQuestionViolations('thorny-skate', skate, {
            permitType: 'commercial',
            possessionAmount: 5000,
            dateOfCatch: '2026-06-01'
        });
        assert('thorny skate over 4000 lb wings (season 1)', skateV.length > 0, skateV.join('; '));

        assert('herring 1B config 2000 lb', getHerringAreaLimitLb('area-1b', new Date('2026-05-21')) === 2000);

        const bftLim = getCommercialPossessionLimit('bluefin-tuna', 'commercial-general', { dateOfCatch: '2026-06-15' });
        assert('BFT June limit is 3', bftLim.count === 3, `got ${bftLim.count}`);

        const purse = getCommercialPossessionLimit('bluefin-tuna', 'commercial-purse-seine', {});
        assert('BFT purse seine closed', purse.prohibited && purse.count === 0);

        const bftRec3 = AV.evaluateAssessmentQuestionViolations('bluefin-tuna', bft, {
            permitType: 'recreational',
            numberOfFish: 3
        });
        assert('BFT recreational angler over 2 fish', bftRec3.length > 0, bftRec3.join('; '));

        const bftRec2 = AV.evaluateAssessmentQuestionViolations('bluefin-tuna', bft, {
            permitType: 'recreational',
            numberOfFish: 2
        });
        assert('BFT recreational angler 2 fish within limit', bftRec2.length === 0, bftRec2.join('; '));

        const yfTrap = AV.evaluateAssessmentQuestionViolations('yellowfin-tuna', SPECIES_DATA['yellowfin-tuna'], {
            permitType: 'commercial-trap',
            numberOfFish: 1
        });
        assert('yellowfin trap retention prohibited', yfTrap.length > 0, yfTrap.join('; '));

        const mako = SPECIES_DATA['shortfin-mako-shark'];
        const makoV = AV.evaluateAssessmentQuestionViolations('shortfin-mako-shark', mako, {
            permitType: 'recreational',
            numberOfFish: 1
        });
        assert('shortfin mako any on board prohibited', makoV.length > 0, makoV.join('; '));

        const swordfish = SPECIES_DATA['swordfish'];
        const sfOver = AV.evaluateAssessmentQuestionViolations('swordfish', swordfish, {
            permitType: 'recreational',
            numberOfFish: 5
        });
        assert('swordfish recreational over 4 per vessel', sfOver.length > 0, sfOver.join('; '));

        const sfOk = AV.evaluateAssessmentQuestionViolations('swordfish', swordfish, {
            permitType: 'recreational',
            numberOfFish: 4
        });
        assert('swordfish recreational 4 within limit', sfOk.length === 0, sfOk.join('; '));

        const sfHeadOver = AV.evaluateAssessmentQuestionViolations('swordfish', swordfish, {
            permitType: 'recreational-headboat',
            numberOfFish: 16
        });
        assert('swordfish headboat over 15 per vessel', sfHeadOver.length > 0, sfHeadOver.join('; '));

        const sfHeadOk = AV.evaluateAssessmentQuestionViolations('swordfish', swordfish, {
            permitType: 'recreational-headboat',
            numberOfFish: 15
        });
        assert('swordfish headboat 15 within limit', sfHeadOk.length === 0, sfHeadOk.join('; '));

        const blacknose = SPECIES_DATA['blacknose-shark'];
        const bnNorth = AV.evaluateAssessmentQuestionViolations('blacknose-shark', blacknose, {
            permitType: 'recreational',
            numberOfFish: 1,
            catchLatitudeZone: 'north'
        });
        assert('blacknose north of 34N prohibited', bnNorth.length > 0, bnNorth.join('; '));

        const bnSouth = AV.evaluateAssessmentQuestionViolations('blacknose-shark', blacknose, {
            permitType: 'recreational',
            numberOfFish: 1,
            catchLatitudeZone: 'south'
        });
        assert('blacknose south of 34N one fish ok', bnSouth.length === 0, bnSouth.join('; '));

        assert('HMS shark policy profile', typeof sb.getHmsPolicyProfile === 'function' && sb.getHmsPolicyProfile('blue-shark')?.headline);
        assert('HMS prohibited shark profile', sb.getHmsPolicyProfile('dusky-shark')?.level === 'prohibited');

        const mack = SPECIES_DATA['atlantic-mackerel'];
        const mackRec = AV.evaluateAssessmentQuestionViolations('atlantic-mackerel', mack, {
            permitType: 'recreational',
            numberOfFish: 26
        });
        assert('atlantic mackerel recreational over 25', mackRec.length > 0, mackRec.join('; '));

        const lfOver = AV.evaluateAssessmentQuestionViolations('longfin-squid', SPECIES_DATA['longfin-squid'], {
            permitType: 'smb1b-longfin-tier2',
            possessionAmount: 5001
        });
        assert('longfin tier 2 over 5000 lb', lfOver.length > 0, lfOver.join('; '));

        const bfOver = AV.evaluateAssessmentQuestionViolations('butterfish', SPECIES_DATA['butterfish'], {
            permitType: 'smb6-butterfish-moratorium',
            possessionAmount: 5001,
            meshSize: 'small-mesh'
        });
        assert('butterfish SMB6 small mesh over 5000 lb', bfOver.length > 0, bfOver.join('; '));

        assert('SMB648 policy profile', typeof sb.getSmb648PolicyProfile === 'function' && sb.getSmb648PolicyProfile('longfin-squid')?.headline);

        assert('salmon EEZ prohibited policy', sb.getSalmon648PolicyProfile('atlantic-salmon')?.level === 'prohibited');

        assert('scallop648 policy profile', typeof sb.getScallop648PolicyProfile === 'function' && sb.getScallop648PolicyProfile('atlantic-sea-scallop')?.headline);

        const scallop = SPECIES_DATA['atlantic-sea-scallop'];
        const scRec = checkSpeciesViolations('atlantic-sea-scallop', scallop, {
            'permit-type': 'recreational',
            possessionAmount: 10,
            'possession-type': 'shucked'
        });
        assert('scallop recreational retention prohibited', scRec.length > 0, scRec.join('; '));

        const scIfq = checkSpeciesViolations('atlantic-sea-scallop', scallop, {
            'permit-type': 'lagc-ifq',
            possessionAmount: 601,
            'possession-type': 'shucked'
        });
        assert('LAGC IFQ over 600 lb shucked', scIfq.some(m => /exceeds.*limit/i.test(m)), scIfq.join('; '));

        const scInc = checkSpeciesViolations('atlantic-sea-scallop', scallop, {
            'permit-type': 'lagc-incidental',
            possessionAmount: 41,
            'possession-type': 'shucked'
        });
        assert('LAGC incidental over 40 lb shucked', scInc.some(m => /exceeds.*limit/i.test(m)), scInc.join('; '));

        const scDas = checkSpeciesViolations('atlantic-sea-scallop', scallop, {
            'permit-type': 'la-full',
            possessionAmount: 50000,
            'possession-type': 'shucked',
            'on-scallop-das': 'yes',
            fishingArea: 'open-area'
        });
        assert('LA on DAS unlimited possession ok', !scDas.some(m => /exceeds.*limit/i.test(m)), scDas.join('; '));

        const scLim = getCommercialPossessionLimit('atlantic-sea-scallop', 'lagc-ifq', { 'possession-type': 'shucked' });
        assert('LAGC IFQ commercial limit 600 lb', scLim.count === 600, `got ${scLim.count}`);

        assert('surf clam648 policy profile', typeof sb.getSurfClam648PolicyProfile === 'function' && sb.getSurfClam648PolicyProfile('surf-clam')?.headline);

        const surfClam = SPECIES_DATA['surf-clam'];
        const scRecOver = checkSpeciesViolations('surf-clam', surfClam, {
            'permit-type': 'recreational',
            possessionAmount: 3
        });
        assert('surf clam recreational over 2 bushels', scRecOver.some(m => /exceeds.*limit/i.test(m)), scRecOver.join('; '));

        const scCommOk = checkSpeciesViolations('surf-clam', surfClam, {
            'permit-type': 'commercial',
            possessionAmount: 500
        });
        assert('surf clam commercial 500 bushels ok', !scCommOk.some(m => /exceeds.*limit/i.test(m)), scCommOk.join('; '));

        const scRecLim = getCommercialPossessionLimit('surf-clam', 'recreational', {});
        assert('surf clam recreational limit 2 bushels', scRecLim.count === 2, `got ${scRecLim.count}`);

        assert(
            'scallop location checklist merged',
            SPECIES_DATA['atlantic-sea-scallop']?.regulations?.assessmentQuestions?.location_locScallopClosedArea?.section === 'location-checklist'
        );

        const scLoc = AV.evaluateAssessmentQuestionViolations('atlantic-sea-scallop', SPECIES_DATA['atlantic-sea-scallop'], {
            'permit-type': 'la-full',
            locScallopClosedArea: 'yes'
        });
        assert('scallop closed area attestation', scLoc.some(m => /closed.*rotational/i.test(m)), scLoc.join('; '));

        const scLagcSkip = AV.evaluateAssessmentQuestionViolations('atlantic-sea-scallop', SPECIES_DATA['atlantic-sea-scallop'], {
            'permit-type': 'la-full',
            locScallopLagcClosedAccess: 'yes'
        });
        assert('scallop LAGC-only question skipped for LA', !scLagcSkip.some(m => /LAGC fishing/i.test(m)), scLagcSkip.join('; '));

        const clLoc = AV.evaluateAssessmentQuestionViolations('surf-clam', SPECIES_DATA['surf-clam'], {
            'permit-type': 'commercial',
            locBostonFoulGround: 'yes'
        });
        assert('surf clam Boston Foul Ground', clLoc.some(m => /Boston Foul Ground/i.test(m)), clLoc.join('; '));

        const smbLoc = AV.evaluateAssessmentQuestionViolations('longfin-squid', SPECIES_DATA['longfin-squid'], {
            'permit-type': 'smb1a-longfin-tier1',
            locCanyonBottomTrawl: 'yes'
        });
        assert('SMB canyon bottom trawl', smbLoc.some(m => /Canyon/i.test(m)), smbLoc.join('; '));

        assert('NMS648 policy profile', typeof sb.getNms648PolicyProfile === 'function' && sb.getNms648PolicyProfile('atlantic-cod')?.headline);

        assert(
            'NMS location checklist merged',
            SPECIES_DATA['atlantic-cod']?.regulations?.assessmentQuestions?.location_nmsRegulatedMeshArea?.type === 'choice'
        );

        const codRecOutside = AV.evaluateAssessmentQuestionViolations('atlantic-cod', SPECIES_DATA['atlantic-cod'], {
            'permit-type': 'recreational',
            locNmsRecCodOutsideGom: 'yes',
            numberOfFish: 1
        });
        assert('rec cod outside GOM RMA', codRecOutside.some(m => /outside GOM RMA/i.test(m)), codRecOutside.join('; '));

        const codSectorLoa = AV.evaluateAssessmentQuestionViolations('atlantic-cod', SPECIES_DATA['atlantic-cod'], {
            'permit-type': 'multispecies-commercial',
            vesselCategory: 'sector',
            locNmsSectorNoLoa: 'yes'
        });
        assert('sector missing LOA attestation', codSectorLoa.some(m => /missing required LOA/i.test(m)), codSectorLoa.join('; '));

        const codSectorSkip = AV.evaluateAssessmentQuestionViolations('atlantic-cod', SPECIES_DATA['atlantic-cod'], {
            'permit-type': 'multispecies-commercial',
            vesselCategory: 'common-pool',
            locNmsSectorNoLoa: 'yes'
        });
        assert('sector LOA question skipped for common pool', !codSectorSkip.some(m => /missing required LOA/i.test(m)), codSectorSkip.join('; '));

        assert(
            'NMS exempted fishery checklist merged',
            SPECIES_DATA['pollock']?.regulations?.assessmentQuestions?.location_locNmsSmallMeshArea?.question
        );

        const whitingEx = AV.evaluateAssessmentQuestionViolations('pollock', SPECIES_DATA['pollock'], {
            'permit-type': 'multispecies-commercial',
            locNmsRaisedFootropeWhiting: 'yes'
        });
        assert('raised footrope whiting violation', whitingEx.some(m => /Raised Footrope/i.test(m)), whitingEx.join('; '));

        assert('MONKFISH648 policy profile', typeof sb.getMonkfish648PolicyProfile === 'function' && sb.getMonkfish648PolicyProfile('monkfish')?.headline);

        assert(
            'monkfish species data loaded',
            SPECIES_DATA['monkfish']?.regulations?.assessmentQuestions?.permitType?.options?.length >= 8
        );

        assert(
            'monkfish location checklist merged',
            SPECIES_DATA['monkfish']?.regulations?.assessmentQuestions?.location_locMonkfishCanyonClosure?.section === 'location-checklist'
        );

        const monkCanyon = AV.evaluateAssessmentQuestionViolations('monkfish', SPECIES_DATA['monkfish'], {
            'permit-type': 'monkfish-cat-a',
            onMonkfishDas: 'yes',
            locMonkfishCanyonClosure: 'yes'
        });
        assert('monkfish canyon closure on DAS', monkCanyon.some(m => /Canyon/i.test(m)), monkCanyon.join('; '));

        const monkOffshoreSkip = AV.evaluateAssessmentQuestionViolations('monkfish', SPECIES_DATA['monkfish'], {
            'permit-type': 'monkfish-cat-a',
            locMonkfishOffshoreDas: 'yes'
        });
        assert('monkfish offshore question skipped for Cat A', !monkOffshoreSkip.some(m => /offshore monkfish DAS/i.test(m)), monkOffshoreSkip.join('; '));

        const monkNfma = AV.evaluateAssessmentQuestionViolations('monkfish', SPECIES_DATA['monkfish'], {
            'permit-type': 'monkfish-cat-c',
            locMonkfishNfmaNoLetter: 'yes'
        });
        assert('monkfish NFMA without letter', monkNfma.some(m => /NFMA fishing without/i.test(m)), monkNfma.join('; '));

        assert('SUMMERFLOUNDER648 policy profile', typeof sb.getSummerFlounder648PolicyProfile === 'function' && sb.getSummerFlounder648PolicyProfile('summer-flounder')?.conservationEquivalency);

        assert(
            'summer flounder location checklist merged',
            SPECIES_DATA['summer-flounder']?.regulations?.assessmentQuestions?.location_locSfSeaTurtleTed?.section === 'location-checklist'
        );

        const sfTed = AV.evaluateAssessmentQuestionViolations('summer-flounder', SPECIES_DATA['summer-flounder'], {
            'permit-type': 'commercial',
            gearType: 'otter-trawl',
            locSfSeaTurtleTed: 'yes'
        });
        assert('summer flounder TED violation', sfTed.some(m => /TED required/i.test(m)), sfTed.join('; '));

        const sfLoa = AV.evaluateAssessmentQuestionViolations('summer-flounder', SPECIES_DATA['summer-flounder'], {
            'permit-type': 'commercial',
            locSfSmallMeshLoa: 'yes',
            dateOfCatch: '2026-07-01'
        });
        assert('summer flounder small mesh LOA', sfLoa.some(m => /valid LOA/i.test(m)), sfLoa.join('; '));

        const sfRecSkip = checkSpeciesViolations('summer-flounder', SPECIES_DATA['summer-flounder'], {
            'permit-type': 'recreational',
            possessionAmount: 50
        });
        assert('summer flounder recreational no federal limit', !sfRecSkip.some(m => /exceeds limit/i.test(m)), sfRecSkip.join('; '));

        assert('SCUP648 policy profile', typeof sb.getScup648PolicyProfile === 'function' && sb.getScup648PolicyProfile('scup')?.headline);

        assert(
            'scup location checklist merged',
            SPECIES_DATA['scup']?.regulations?.assessmentQuestions?.location_locScupWinterOneClosed?.section === 'location-checklist'
        );

        const scupWinter = AV.evaluateAssessmentQuestionViolations('scup', SPECIES_DATA['scup'], {
            'permit-type': 'commercial',
            locScupWinterOneClosed: 'yes',
            dateOfCatch: '2026-02-15'
        });
        assert('scup Winter I closure attestation', scupWinter.some(m => /Winter I/i.test(m)), scupWinter.join('; '));

        const scupGra = AV.evaluateAssessmentQuestionViolations('scup', SPECIES_DATA['scup'], {
            'permit-type': 'commercial',
            locScupNorthernGra: 'yes',
            dateOfCatch: '2026-11-15'
        });
        assert('scup Northern GRA mesh', scupGra.some(m => /Northern Scup GRA/i.test(m)), scupGra.join('; '));

        const scupWinterPoss = checkSpeciesViolations('scup', SPECIES_DATA['scup'], {
            'permit-type': 'commercial',
            possessionAmount: 500,
            dateOfCatch: '2026-03-01'
        });
        assert('scup Winter I possession prohibited', scupWinterPoss.some(m => /prohibited|closed/i.test(m)), scupWinterPoss.join('; '));

        const scupWinterII = checkSpeciesViolations('scup', SPECIES_DATA['scup'], {
            'permit-type': 'commercial',
            possessionAmount: 15000,
            meshSize: 'compliant-mesh',
            dateOfCatch: '2026-11-15'
        });
        assert('scup Winter II over 12000 lb', scupWinterII.some(m => /exceeds.*limit/i.test(m)), scupWinterII.join('; '));

        assert('BSB648 policy profile', typeof sb.getBsb648PolicyProfile === 'function' && sb.getBsb648PolicyProfile('black-sea-bass')?.conservationEquivalency);

        assert(
            'bsb location checklist merged',
            SPECIES_DATA['black-sea-bass']?.regulations?.assessmentQuestions?.location_locBsbTransferAtSea?.section === 'location-checklist'
        );

        const bsbTransfer = AV.evaluateAssessmentQuestionViolations('black-sea-bass', SPECIES_DATA['black-sea-bass'], {
            'permit-type': 'commercial',
            locBsbTransferAtSea: 'yes'
        });
        assert('bsb transfer at sea prohibited', bsbTransfer.some(m => /Transfer at sea prohibited/i.test(m)), bsbTransfer.join('; '));

        const bsbMesh = checkSpeciesViolations('black-sea-bass', SPECIES_DATA['black-sea-bass'], {
            'permit-type': 'commercial',
            'gear-type': 'otter-trawl',
            meshSize: 'non-compliant-mesh',
            possessionAmount: 150,
            dateOfCatch: '2026-07-01'
        });
        assert('bsb trawl mesh over 100 lb threshold', bsbMesh.some(m => /4\.5.*mesh/i.test(m)), bsbMesh.join('; '));

        const bsbTote = AV.evaluateAssessmentQuestionViolations('black-sea-bass', SPECIES_DATA['black-sea-bass'], {
            'permit-type': 'commercial',
            toteStorage: 'no'
        });
        assert('bsb not in standard totes', bsbTote.some(m => /100 lb totes/i.test(m)), bsbTote.join('; '));

        assert('BLUEFISH648 policy profile', typeof sb.getBluefish648PolicyProfile === 'function' && sb.getBluefish648PolicyProfile('bluefish')?.conservationEquivalency);

        assert(
            'bluefish location checklist merged',
            SPECIES_DATA['bluefish']?.regulations?.assessmentQuestions?.location_locBluefishClosedArea?.section === 'location-checklist'
        );

        const bfCharter = AV.evaluateAssessmentQuestionViolations('bluefish', SPECIES_DATA['bluefish'], {
            'permit-type': 'recreational-for-hire',
            locBluefishCharterBag: 'yes'
        });
        assert('bluefish charter bag attestation', bfCharter.some(m => /Charter\/party bluefish/i.test(m)), bfCharter.join('; '));

        assert('HERRING648 policy profile', typeof sb.getHerring648PolicyProfile === 'function' && sb.getHerring648PolicyProfile('atlantic-herring')?.level === 'complex');

        assert(
            'herring location checklist merged',
            SPECIES_DATA['atlantic-herring']?.regulations?.assessmentQuestions?.location_locHerringTransferAtSea?.section === 'location-checklist'
        );

        const herringTransfer = AV.evaluateAssessmentQuestionViolations('atlantic-herring', SPECIES_DATA['atlantic-herring'], {
            'permit-type': 'herring-cat-d',
            locHerringTransferAtSea: 'yes'
        });
        assert('herring transfer at sea prohibited', herringTransfer.some(m => /transfer at sea/i.test(m)), herringTransfer.join('; '));

        const herringCatD = checkSpeciesViolations('atlantic-herring', SPECIES_DATA['atlantic-herring'], {
            'permit-type': 'herring-cat-d',
            possessionAmount: 7000,
            fishingArea: 'area-2',
            dateOfCatch: '2026-05-21'
        });
        assert('herring Cat D over 6600 lb', herringCatD.some(m => /exceeds limit/i.test(m)), herringCatD.join('; '));

        const herring1A = checkSpeciesViolations('atlantic-herring', SPECIES_DATA['atlantic-herring'], {
            'permit-type': 'herring-cat-a',
            possessionAmount: 500,
            fishingArea: 'area-1a',
            dateOfCatch: '2026-05-21'
        });
        assert('herring Area 1A directed prohibited', herring1A.some(m => /prohibited/i.test(m)), herring1A.join('; '));

        assert('DOGFISH648 policy profile', typeof sb.getDogfish648PolicyProfile === 'function' && sb.getDogfish648PolicyProfile('spiny-dogfish')?.level === 'complex');

        assert(
            'dogfish location checklist merged',
            SPECIES_DATA['spiny-dogfish']?.regulations?.assessmentQuestions?.location_locDogfishSecondTripDay?.section === 'location-checklist'
        );

        const dogfishSecondTrip = AV.evaluateAssessmentQuestionViolations('spiny-dogfish', SPECIES_DATA['spiny-dogfish'], {
            'permit-type': 'commercial',
            locDogfishSecondTripDay: 'yes'
        });
        assert('dogfish second trip same day', dogfishSecondTrip.some(m => /one spiny dogfish trip/i.test(m)), dogfishSecondTrip.join('; '));

        const dogfishOver = checkSpeciesViolations('spiny-dogfish', SPECIES_DATA['spiny-dogfish'], {
            'permit-type': 'commercial',
            possessionAmount: 8000,
            dateOfCatch: '2026-07-01'
        });
        assert('dogfish over 7500 lb', dogfishOver.some(m => /exceeds limit/i.test(m)), dogfishOver.join('; '));

        assert('REDFCRAB648 policy profile', typeof sb.getRedCrab648PolicyProfile === 'function' && sb.getRedCrab648PolicyProfile('atlantic-deep-sea-red-crab')?.level === 'complex');

        assert(
            'red crab location checklist merged',
            SPECIES_DATA['atlantic-deep-sea-red-crab']?.regulations?.assessmentQuestions?.location_locRedCrabTransferAtSea?.section === 'location-checklist'
        );

        const redCrabTransfer = AV.evaluateAssessmentQuestionViolations('atlantic-deep-sea-red-crab', SPECIES_DATA['atlantic-deep-sea-red-crab'], {
            'permit-type': 'red-crab-cat-b',
            transferAtSea: 'yes'
        });
        assert('red crab transfer at sea prohibited', redCrabTransfer.some(m => /Transfer at sea prohibited/i.test(m)), redCrabTransfer.join('; '));

        const redCrabIncidental = checkSpeciesViolations('atlantic-deep-sea-red-crab', SPECIES_DATA['atlantic-deep-sea-red-crab'], {
            'permit-type': 'red-crab-open-incidental',
            possessionAmount: 600,
            dateOfCatch: '2026-07-01'
        });
        assert('red crab open access over 500 lb', redCrabIncidental.some(m => /exceeds limit/i.test(m)), redCrabIncidental.join('; '));

        assert('TILEFISH648 policy profile', typeof sb.getTilefish648PolicyProfile === 'function' && sb.getTilefish648PolicyProfile('golden-tilefish')?.level === 'complex');

        assert(
            'tilefish location checklist merged',
            SPECIES_DATA['golden-tilefish']?.regulations?.assessmentQuestions?.location_locTilefishGraCanyon?.section === 'location-checklist'
        );

        const tilefishGra = AV.evaluateAssessmentQuestionViolations('golden-tilefish', SPECIES_DATA['golden-tilefish'], {
            'permit-type': 'commercial',
            locTilefishGraCanyon: 'yes'
        });
        assert('tilefish GRA bottom gear prohibited', tilefishGra.some(m => /Tilefish GRAs/i.test(m)), tilefishGra.join('; '));

        const goldenOver = checkSpeciesViolations('golden-tilefish', SPECIES_DATA['golden-tilefish'], {
            'permit-type': 'commercial',
            possessionAmount: 600,
            dateOfCatch: '2026-07-01'
        });
        assert('golden tilefish over 500 lb', goldenOver.some(m => /exceeds limit/i.test(m)), goldenOver.join('; '));

        assert('SKATE648 policy profile', typeof sb.getSkate648PolicyProfile === 'function' && sb.getSkate648PolicyProfile('smooth-skate')?.level === 'complex');

        assert(
            'skate location checklist merged',
            SPECIES_DATA['smooth-skate']?.regulations?.assessmentQuestions?.location_locSkateThornyOnBoard?.section === 'location-checklist'
        );

        const thornyLoc = AV.evaluateAssessmentQuestionViolations('smooth-skate', SPECIES_DATA['smooth-skate'], {
            'permit-type': 'commercial',
            locSkateThornyOnBoard: 'yes'
        });
        assert('thorny skate attestation', thornyLoc.some(m => /Thorny skate/i.test(m)), thornyLoc.join('; '));

        const thornyPoss = checkSpeciesViolations('thorny-skate', SPECIES_DATA['thorny-skate'], {
            'permit-type': 'commercial',
            possessionAmount: 1,
            dateOfCatch: '2026-05-21'
        });
        assert('thorny skate possession prohibited', thornyPoss.some(m => /prohibited/i.test(m)), thornyPoss.join('; '));

        const smoothSkate = checkSpeciesViolations('smooth-skate', SPECIES_DATA['smooth-skate'], {
            'permit-type': 'commercial',
            possessionAmount: 5000,
            dasTripType: 'nms-a-scallop-monkfish',
            skateProductForm: 'wings',
            dateOfCatch: '2026-06-01'
        });
        assert('smooth skate over 4000 lb wings season 1', smoothSkate.some(m => /exceeds limit/i.test(m)), smoothSkate.join('; '));

        assert('LOBSTER697 policy profile', typeof sb.getLobster697PolicyProfile === 'function' && sb.getLobster697PolicyProfile('american-lobster')?.level === 'complex');

        assert(
            'lobster location checklist merged',
            SPECIES_DATA['american-lobster']?.regulations?.assessmentQuestions?.location_locLobsterEggBearing?.section === 'location-checklist'
        );

        const lobsterEgg = AV.evaluateAssessmentQuestionViolations('american-lobster', SPECIES_DATA['american-lobster'], {
            'permit-type': 'commercial-trap',
            locLobsterEggBearing: 'yes'
        });
        assert('lobster egg-bearing prohibited', lobsterEgg.some(m => /Egg-bearing/i.test(m)), lobsterEgg.join('; '));

        const lobsterNonTrap = checkSpeciesViolations('american-lobster', SPECIES_DATA['american-lobster'], {
            'permit-type': 'commercial-non-trap',
            possessionAmount: 150,
            dateOfCatch: '2026-07-01'
        });
        assert('lobster non-trap over 100', lobsterNonTrap.some(m => /exceeds limit/i.test(m)), lobsterNonTrap.join('; '));

        const jonahNonTrap = checkSpeciesViolations('jonah-crab', SPECIES_DATA['jonah-crab'], {
            'permit-type': 'commercial-non-trap',
            possessionAmount: 1100,
            dateOfCatch: '2026-07-01'
        });
        assert('jonah non-trap over 1000', jonahNonTrap.some(m => /exceeds limit/i.test(m)), jonahNonTrap.join('; '));

        const jonahRec = AV.evaluateAssessmentQuestionViolations('jonah-crab', SPECIES_DATA['jonah-crab'], {
            'permit-type': 'recreational',
            possessionAmount: 55
        });
        assert('jonah recreational over 50', jonahRec.some(m => /exceeds/i.test(m)), jonahRec.join('; '));

        assert('PROHIB697 policy profile striped bass', typeof sb.getProhib697PolicyProfile === 'function' && sb.getProhib697PolicyProfile('striped-bass')?.level === 'prohibited');

        assert(
            'striped bass location checklist merged',
            SPECIES_DATA['striped-bass']?.regulations?.assessmentQuestions?.location_locStripedBassEezPossession?.section === 'location-checklist'
        );

        const stripedEez = AV.evaluateAssessmentQuestionViolations('striped-bass', SPECIES_DATA['striped-bass'], {
            'permit-type': 'recreational',
            fishingArea: 'eez',
            possessionAmount: 2,
            locStripedBassEezPossession: 'yes'
        });
        assert('striped bass EEZ possession attestation', stripedEez.some(m => /prohibited/i.test(m)), stripedEez.join('; '));

        const weakfishOver = checkSpeciesViolations('weakfish', SPECIES_DATA['weakfish'], {
            'permit-type': 'commercial',
            possessionAmount: 200,
            dateOfCatch: '2026-05-21'
        });
        assert('weakfish commercial over 150 lb', weakfishOver.some(m => /exceeds limit/i.test(m)), weakfishOver.join('; '));

        const redDrumRec = checkSpeciesViolations('red-drum', SPECIES_DATA['red-drum'], {
            'permit-type': 'recreational',
            fishingArea: 'north-allowed',
            possessionAmount: 1,
            dateOfCatch: '2026-05-21'
        });
        assert('red drum recreational federal prohibited', redDrumRec.some(m => /prohibited/i.test(m)), redDrumRec.join('; '));

        assert('DOLPHIN622 policy profile', typeof sb.getDolphin622PolicyProfile === 'function' && sb.getDolphin622PolicyProfile('mahi-mahi')?.level === 'complex');

        assert(
            'dolphin location checklist merged',
            SPECIES_DATA['mahi-mahi']?.regulations?.assessmentQuestions?.location_locDolphinTransferAtSea?.section === 'location-checklist'
        );

        const dolphinOver = checkSpeciesViolations('mahi-mahi', SPECIES_DATA['mahi-mahi'], {
            'permit-type': 'commercial',
            possessionAmount: 600,
            dateOfCatch: '2026-05-21'
        });
        assert('dolphin commercial over 500 lb', dolphinOver.some(m => /exceeds limit/i.test(m)), dolphinOver.join('; '));

        assert('CMP622 policy profile', typeof sb.getCmp622PolicyProfile === 'function' && sb.getCmp622PolicyProfile('king-mackerel')?.level === 'complex');

        const kingOver = checkSpeciesViolations('king-mackerel', SPECIES_DATA['king-mackerel'], {
            'permit-type': 'commercial',
            possessionAmount: 4000,
            dateOfCatch: '2026-05-21'
        });
        assert('king mackerel commercial over 3500 lb', kingOver.some(m => /exceeds limit/i.test(m)), kingOver.join('; '));

        assert('FORAGE648 policy profile', typeof sb.getForage648PolicyProfile === 'function' && sb.getForage648PolicyProfile('anchovies')?.level === 'complex');

        const forageOver = checkSpeciesViolations('anchovies', SPECIES_DATA['anchovies'], {
            'permit-type': 'commercial',
            possessionAmount: 1800,
            dateOfCatch: '2026-05-21'
        });
        assert('forage combined over 1700 lb', forageOver.some(m => /exceeds limit/i.test(m)), forageOver.join('; '));

        assert('MPS24 policy profile salmon', typeof sb.getMps24PolicyProfile === 'function' && sb.getMps24PolicyProfile('atlantic-salmon')?.level === 'prohibited');

        const advisor = sb.SpeciesPolicyAdvisor;
        assert('species selection panel hidden', advisor.renderSelectedPanel(['anchovies', 'bluefin-tuna']) === '');
        const missingPermits = [];
        const missingPossession = [];
        const missingSizeGear = [];
        const missingLocation = [];
        Object.keys(SPECIES_DATA).forEach(speciesId => {
            if (speciesId === 'northeast-multispecies') return;
            const species = SPECIES_DATA[speciesId];
            const profile = advisor.getProfile(speciesId, species);
            if (!profile.bullets.length) return;
            if (!advisor.getBulletsForStep(speciesId, 'permits').length) missingPermits.push(speciesId);
            if (!advisor.getBulletsForStep(speciesId, 'possession').length) missingPossession.push(speciesId);
            if (!advisor.getBulletsForStep(speciesId, 'size-gear').length) missingSizeGear.push(speciesId);
        });
        Object.keys(sb.LOCATION_CHECKLIST_BY_SPECIES || {}).forEach(speciesId => {
            if (!advisor.getBulletsForStep(speciesId, 'dynamic-assessment').length) missingLocation.push(speciesId);
        });
        assert('all species permits step policy', missingPermits.length === 0, missingPermits.join(', '));
        assert('all species possession step policy', missingPossession.length === 0, missingPossession.join(', '));
        assert('all species size-gear step policy', missingSizeGear.length === 0, missingSizeGear.join(', '));
        assert('all location checklist species have area policy', missingLocation.length === 0, missingLocation.join(', '));
        assert('NMS cod permits step policy', advisor.getBulletsForStep('atlantic-cod', 'permits').length > 0);
        assert('NMS cod vessel-classification policy', advisor.getBulletsForStep('atlantic-cod', 'vessel-classification').length > 0);

        // Grouped assessment path (speciesViolationChecks)
        const sf = SPECIES_DATA['summer-flounder'];
        const sfV = checkSpeciesViolations('summer-flounder', sf, {
            'has-permit': 'yes',
            'permit-type': 'commercial',
            'mesh-compliant': 'no',
            possessionAmount: 150,
            dateOfCatch: '2026-07-01'
        });
        assert('grouped summer flounder commercial over small-mesh limit', sfV.some(m => /exceeds limit/i.test(m)), sfV.join('; '));

        sb.assessmentData = { vessel: { multispecies: { classification: 'common-pool' } }, species: {} };
        const cod = SPECIES_DATA['atlantic-cod'];
        const codV = checkSpeciesViolations('atlantic-cod', cod, {
            'has-permit': 'yes',
            'permit-type': 'commercial',
            possessionAmount: 999,
            fishingArea: 'gulf-of-maine',
            dasCategory: 'category-a'
        });
        assert('grouped cod GOM trip limit', codV.some(m => /trip limit/i.test(m)), codV.join('; '));

    } catch (e) {
        errors.push(e.message);
        console.error(`  ✗ ${e.message}`);
    }

    console.log('\n--- Results ---');
    if (errors.length) {
        console.error(`Failed (${errors.length})`);
        process.exit(1);
    }
    console.log('OK — smoke scenarios passed.');
    process.exit(0);
}

main();
