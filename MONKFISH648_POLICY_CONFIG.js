/**
 * Monkfish (50 CFR Part 648) — selection-page policy summaries.
 */
const MONKFISH648_SPECIES = new Set(['monkfish']);

const MONKFISH648_TAIL_RATIO = 2.91;

const MONKFISH648_SHARED_BULLETS = [
    'Commercial permit categories: Limited Access Cat A, B, C, D, F, H; Open Access Cat E. Operator permit required for all commercial categories; not required recreational.',
    'VMS: Cat F required (may turn off outside offshore season). Cat C or D in a sector, or fishing on a Northeast multispecies DAS during the year — must declare monkfish trip on VMS. Vessels without VMS (or fishing both sides of the demarcation line on one trip) must declare through IVR.',
    'Minimum sizes: 17″ whole; 11″ tail (skin on except cheeks and livers). Whole weight ÷ 2.91 = tail weight. Livers ≤25% of tail weight or 10% of whole weight; heads only ≤1.91× tail weight on board.',
    'On a monkfish DAS — NFMA: Cat A/C 1,250 lb tail (3,638 lb whole); Cat B/D 600 lb tail (1,746 lb whole). SFMA: Cat A/C 700 lb tail; Cat B/D/H 575 lb tail; Cat F 1,600 lb tail per DAS.',
    'Incidental on NE multispecies DAS (not monkfish DAS): NFMA Cat C 900 lb tail, Cat D 750 lb tail, Cat E/F/H up to 25% not to exceed 300 lb. SFMA varies by gear — verify chart.',
    'On monkfish DAS and multispecies Cat A DAS: NFMA Cat C/D unlimited; SFMA Cat C 700 lb tail, Cat D 575 lb tail per DAS.',
    'Scallop DAS or Sea Scallop Access Area: incidental 300 lb tail (873 lb whole) per DAS.',
    'No DAS: limits vary by RMA, mesh size, and permit (5% rules, 50 lb tail/day caps, MA vs SNE east of 72°30′ W boundary). Smallest mesh fished during trip sets incidental limit west of MA exemption boundary.',
    'Recreational: no federal possession limit; minimum size limits apply.',
    'Gear on monkfish DAS: no dredge on board; trawl ≥10″ square or 12″ diamond for 45 continuous meshes forward of terminus. Cat A/B monkfish gillnet: 12″ diamond, <160 nets, <300 ft.',
    'Cat C/D/F/H with NMS permit: follow NMS regulated mesh area minimums. NFMA monkfish option on VMS may authorize <10″ diamond if more restrictive NMS mesh is followed. SFMA: standup gillnets to 6.5″ on monkfish + NMS DAS; trawl roller max 6″ diameter in SFMA.',
    'Management areas: NFMA exemption letter or VMS tracking for NFMA catch limits — without letter, SFMA quotas apply. Transit with gear stowed allowed with letter or VMS.',
    'Offshore fishery: monkfish DAS only Oct 1–Apr 30, only in Offshore Fishery Program Area, VMS required; gear stowed when transiting. Cat F may fish incidental limits when not on monkfish DAS.',
    'Oceanographer and Lydonia Canyon: closed to fishing on a monkfish DAS (not closed to recreational or vessels not on monkfish DAS).',
    'Exemption areas (verify season, LOA, gear): GOM/GB Monkfish Gillnet (Jul 1–Sep 14, ≥10″ diamond, monkfish and lobster only); SNE Monkfish/Skate Trawl and Gillnet (year-round, mesh and skate/LOA rules); Mid-Atlantic Exemption (no regulated NMS retention; gillnet on monkfish DAS, 5″ min, 50 stand-up nets).',
    'NJ Atlantic Sturgeon Bycatch Reduction Area: gillnet ≥10″ mesh must use low-profile gillnets year-round.'
];

function getMonkfish648PolicyProfile(speciesId) {
    if (!MONKFISH648_SPECIES.has(speciesId)) return null;

    const asOf = typeof REGULATION_META !== 'undefined' ? REGULATION_META.dataLastUpdated : null;

    return {
        level: 'complex',
        badgeLabel: 'Monkfish — complex',
        badgeClass: 'policy-complex',
        headline: 'Monkfish limits depend on permit category, NFMA vs SFMA, DAS program (monkfish, NMS, scallop, or none), gear, and exemption area.',
        bullets: [...MONKFISH648_SHARED_BULLETS],
        complianceNote: 'Not compliant if over DAS/trip limit for permit and area, wrong gear or mesh, undersized or skin-off product, fishing closed canyon on monkfish DAS, or non-compliant exempted fishery.',
        dataAsOf: asOf
    };
}

function isMonkfish648Species(speciesId) {
    return MONKFISH648_SPECIES.has(speciesId);
}

/** Basic possession guidance; null count = verify DAS/area/permit table. */
function getMonkfish648PossessionLimit(permitType, speciesData) {
    if (!permitType) {
        return { count: null, prohibited: false, unit: 'lbs tail weight' };
    }

    if (permitType === 'recreational') {
        return {
            count: null,
            prohibited: false,
            unit: 'fish',
            notes: 'No federal bag limit; 17″ whole or 11″ tail minimum.'
        };
    }

    const onMonkfishDas = speciesData?.onMonkfishDas === 'yes'
        || speciesData?.['on-monkfish-das'] === 'yes';
    const managementArea = speciesData?.monkfishManagementArea
        || speciesData?.['monkfish-management-area'];

    if (onMonkfishDas && managementArea === 'nfma') {
        if (permitType === 'monkfish-cat-a' || permitType === 'monkfish-cat-c') {
            return { count: 1250, prohibited: false, unit: 'lbs tail weight per DAS' };
        }
        if (permitType === 'monkfish-cat-b' || permitType === 'monkfish-cat-d') {
            return { count: 600, prohibited: false, unit: 'lbs tail weight per DAS' };
        }
    }

    if (onMonkfishDas && managementArea === 'sfma') {
        if (permitType === 'monkfish-cat-f') {
            return { count: 1600, prohibited: false, unit: 'lbs tail weight per DAS' };
        }
        if (permitType === 'monkfish-cat-a' || permitType === 'monkfish-cat-c') {
            return { count: 700, prohibited: false, unit: 'lbs tail weight per DAS' };
        }
        if (permitType === 'monkfish-cat-b' || permitType === 'monkfish-cat-d' || permitType === 'monkfish-cat-h') {
            return { count: 575, prohibited: false, unit: 'lbs tail weight per DAS' };
        }
    }

    return {
        count: null,
        prohibited: false,
        unit: 'lbs tail weight',
        notes: 'Verify DAS program, management area, and incidental limits for this permit.'
    };
}

if (typeof window !== 'undefined') {
    window.MONKFISH648_SPECIES = MONKFISH648_SPECIES;
    window.MONKFISH648_SHARED_BULLETS = MONKFISH648_SHARED_BULLETS;
    window.MONKFISH648_TAIL_RATIO = MONKFISH648_TAIL_RATIO;
    window.getMonkfish648PolicyProfile = getMonkfish648PolicyProfile;
    window.getMonkfish648PossessionLimit = getMonkfish648PossessionLimit;
    window.isMonkfish648Species = isMonkfish648Species;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MONKFISH648_SPECIES,
        MONKFISH648_SHARED_BULLETS,
        MONKFISH648_TAIL_RATIO,
        getMonkfish648PolicyProfile,
        getMonkfish648PossessionLimit,
        isMonkfish648Species
    };
}
