/**
 * Atlantic Sea Scallop (50 CFR 648 Subpart D) — selection-page policy summaries.
 */
const SCALLOP648_INSHELL_RATIO = 8.33;

const SCALLOP648_POSSESSION = {
    recreational: { shucked: 0, inshell: 0, retentionProhibited: true },
    'lagc-incidental': { shucked: 40, inshell: 333 },
    'lagc-ngom': { shucked: 200, inshell: 1666 },
    'lagc-ifq': {
        shucked: 600,
        inshell: 4998,
        accessAreaTrip: { shucked: 800, inshell: 6664 }
    },
    'la-full': {
        unlimitedOnDas: true,
        shoreward: { shucked: 400, inshell: 3332 },
        accessAreaTrip: { shucked: 12000, inshell: 99960 }
    },
    'la-part': {
        unlimitedOnDas: true,
        shoreward: { shucked: 400, inshell: 3332 },
        accessAreaTrip: { shucked: 9600, inshell: 79968 }
    },
    'la-occ': {
        unlimitedOnDas: true,
        shoreward: { shucked: 400, inshell: 3332 }
    },
    'la-small-ft': { unlimitedOnDas: true, shoreward: { shucked: 400, inshell: 3332 } },
    'la-small-pt': { unlimitedOnDas: true, shoreward: { shucked: 400, inshell: 3332 } },
    'la-trawl-ft': { unlimitedOnDas: true, shoreward: { shucked: 400, inshell: 3332 } },
    'la-trawl-pt': { unlimitedOnDas: true, shoreward: { shucked: 400, inshell: 3332 } }
};

const SCALLOP648_LA_PERMITS = new Set([
    'la-full', 'la-part', 'la-occ', 'la-small-ft', 'la-small-pt', 'la-trawl-ft', 'la-trawl-pt'
]);

const SCALLOP648_POLICY = {
    source: '50 CFR Part 648 Subpart D — Atlantic Sea Scallops',
    species: {
        'atlantic-sea-scallop': {
            badgeLabel: 'Scallop — complex',
            headline: 'Atlantic sea scallop limits depend on permit category, DAS/access trip, and location relative to the VMS line.',
            bullets: [
                'Limited Access (LA): unlimited on a scallop DAS; shoreward of the VMS demarcation line — max 3,332 lb in-shell (unless under state-waters exemption). NGOM prohibited while on a DAS program. Groundfish bycatch max 300 lb combined; yellowtail flounder prohibited.',
                'LAGC IFQ: 600 lb shucked or 4,998 lb in-shell shoreward of VMS; all harvest counts against IFQ. May not possess NMS species if declared into a trip; one landing per calendar day.',
                'LAGC NGOM: 200 lb shucked or 1,666 lb in-shell shoreward of VMS. NGOM closed to LAGC IFQ and incidental permits.',
                'LAGC Incidental: 40 lb shucked or 333 lb in-shell per trip.',
                'Recreational: no retention.',
                'VMS and operator permit required for LA and LAGC commercial permits; not required recreational.',
                'Open-area crew: LA full/part max 7; LA small dredge max 5; LAGC — no federal crew cap.',
                'Transit: gear stowed — no entry/transit of rotational areas (except declared access trip) or Western GOM closure (no transit).',
                'Access programs (verify VMS code): Area II closed (LA may use 2025 allocation until July 13, 2026); NY Bight open LA / closed LAGC; Nantucket Lightship closed.',
                'Gear: LA combined dredge width ≤31 ft; LAGC ≤10 ft 6 in (31 ft west of 72°30′ W in Mid-Atlantic Exemption Area); small dredge — one dredge ≤10 ft 6 in. Rings 4″, twine top 10″.',
                'May 1–Nov 30 west of 71°: Turtle Deflector Dredge and chain mat required (14″ chain legs, ≤45° bale/strut angle, and related specs).',
                'Georges Bank Accountability Measure (Apr 1–Mar 31): max 5 apron rows; hanging ratio ≤1.5:1 on twine top.',
                'Reporting: LA/LAGC scallop catch VTR daily by 0900; LAGC pre-landing notification 6 hours before landing and before crossing VMS line.',
                'Stellwagen Bank: keep gear ≥400 ft from listed shipwreck sites in the sanctuary.',
                'Observer aboard: NGOM +125 lb/trip; LA SAA +200 lb/day; LAGC +200 lb/day (max 2 days, prorated).',
                'Pre-trip notification (PTNS): declare intent 10 days to 48 hours before trip.'
            ],
            complianceNote: 'Not compliant if over permit limit, fishing closed/access area without allocation, missing VMS/gear/TDD when required, recreational retention, or transit violation in closed/rotational areas.'
        }
    }
};

function resolveScallop648Limits(permitType, speciesData) {
    const cfg = SCALLOP648_POSSESSION[permitType];
    if (!cfg) return null;
    if (cfg.retentionProhibited) return { prohibited: true };

    const fishingArea = speciesData?.fishingArea || speciesData?.['fishing-area'];
    const onDas = speciesData?.onScallopDas === 'yes' || speciesData?.['on-scallop-das'] === 'yes';

    if (cfg.unlimitedOnDas && onDas && fishingArea !== 'closed-area') {
        return { unlimited: true, cfr: '50 CFR 648.59' };
    }

    if (fishingArea === 'access-area' && cfg.accessAreaTrip) {
        return { limits: cfg.accessAreaTrip, context: 'access area trip', cfr: '50 CFR 648.59' };
    }

    if (cfg.shoreward) {
        return { limits: cfg.shoreward, context: 'shoreward of VMS line', cfr: '50 CFR 648.53' };
    }

    if (cfg.shucked != null) {
        return { limits: { shucked: cfg.shucked, inshell: cfg.inshell }, context: 'per trip', cfr: '50 CFR 648.53' };
    }

    return null;
}

/** Trip/shoreward limits for assessment. Returns null count = unlimited / verify context. */
function getScallop648PossessionLimit(permitType, speciesData) {
    if (!permitType) {
        return { count: null, prohibited: false, unit: 'lbs' };
    }

    if (permitType === 'recreational') {
        return {
            count: 0,
            prohibited: true,
            unit: 'lbs',
            message: 'Recreational scallop retention prohibited (50 CFR 648 Subpart D).'
        };
    }

    const resolved = resolveScallop648Limits(permitType, speciesData);
    if (!resolved) {
        return { count: null, prohibited: false, unit: 'lbs' };
    }
    if (resolved.prohibited) {
        return { count: 0, prohibited: true, unit: 'lbs' };
    }
    if (resolved.unlimited) {
        return {
            count: null,
            prohibited: false,
            unit: 'lbs',
            notes: 'Unlimited on scallop DAS; shoreward of VMS max 3,332 lb in-shell.'
        };
    }

    const possessionType = speciesData?.possessionType || speciesData?.['possession-type'] || 'shucked';
    const limits = resolved.limits;
    const count = possessionType === 'inshell' ? limits.inshell : limits.shucked;
    const unit = possessionType === 'inshell' ? 'lbs in-shell' : 'lbs shucked';

    return {
        count,
        prohibited: false,
        unit,
        notes: resolved.context,
        message: resolved.context ? `${resolved.context} limit` : null
    };
}

function getScallop648PolicyProfile(speciesId) {
    const entry = SCALLOP648_POLICY.species[speciesId];
    if (!entry) return null;
    const asOf = typeof REGULATION_META !== 'undefined' ? REGULATION_META.dataLastUpdated : null;
    return {
        level: 'complex',
        badgeLabel: entry.badgeLabel,
        badgeClass: 'policy-complex',
        headline: entry.headline,
        bullets: entry.bullets,
        complianceNote: entry.complianceNote,
        dataAsOf: asOf
    };
}

function isScallop648LaPermit(permitType) {
    return SCALLOP648_LA_PERMITS.has(permitType);
}

if (typeof window !== 'undefined') {
    window.SCALLOP648_POLICY = SCALLOP648_POLICY;
    window.SCALLOP648_POSSESSION = SCALLOP648_POSSESSION;
    window.getScallop648PolicyProfile = getScallop648PolicyProfile;
    window.getScallop648PossessionLimit = getScallop648PossessionLimit;
    window.resolveScallop648Limits = resolveScallop648Limits;
    window.isScallop648LaPermit = isScallop648LaPermit;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SCALLOP648_POLICY,
        SCALLOP648_POSSESSION,
        SCALLOP648_INSHELL_RATIO,
        getScallop648PolicyProfile,
        getScallop648PossessionLimit,
        resolveScallop648Limits,
        isScallop648LaPermit
    };
}
