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

        // Grouped assessment path (speciesViolationChecks)
        const sf = SPECIES_DATA['summer-flounder'];
        const sfV = checkSpeciesViolations('summer-flounder', sf, {
            'has-permit': 'yes',
            'permit-type': 'recreational',
            possessionAmount: 10
        });
        assert('grouped summer flounder over recreational bag', sfV.some(m => /exceeds limit/i.test(m)), sfV.join('; '));

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
