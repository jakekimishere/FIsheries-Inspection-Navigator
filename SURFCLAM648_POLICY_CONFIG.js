/**
 * Atlantic Surf Clam / Ocean Quahog (50 CFR 648 Subpart E) — selection-page policy summaries.
 */
const SURFCLAM648_SPECIES = new Set(['surf-clam', 'ocean-quahog']);

const SURFCLAM648_POLICY = {
    source: '50 CFR Part 648 Subpart E — Atlantic Surf Clam and Ocean Quahog',
    sharedBullets: [
        'Commercial permits (surf clam, ocean quahog, Maine mahogany quahog north of 43°50′ N): VMS and operator permit required; unlimited possession per trip when fishery open.',
        'Recreational: no VMS or operator permit; 2 bushels per person/trip federally (closed areas still apply).',
        'No federal minimum size for surf clam or ocean quahog.',
        'Gear: all cages containing ocean quahog or surfclam must have tags attached before offloading — fixed on or as near as possible to the upper crossbar.',
        'Transfer at sea: prohibited.',
        'Shucking at sea: prohibited without Regional Administrator approval; written authorization must be aboard if approved.',
        'Reporting: surfclam/ocean quahog permit vessels must maintain accurate trip reports aboard; additional VTR if other species retained.',
        'Year-round closed areas: Boston Foul Ground (1 nm circle, 42°25′36″ N, 70°35′00″ W); 106 Dumpsite; New York Bight (all surfclam/ocean quahog harvest); Georges Bank PSP area (harvest closed — LOA required for trips into area).',
        'Great South Channel HMA: mobile bottom-tending gear closed except surfclam/blue mussel exemption areas (McBlair, Old South, Fishing Rip AB). Old South: all mobile bottom gear closed Nov 1–Apr 30.'
    ],
    species: {
        'surf-clam': {
            badgeLabel: 'Subpart E',
            headline: 'Surf clam — commercial unlimited per trip when open; recreational 2 bushels; closed areas and gear rules apply.',
            complianceNote: 'Not compliant if over recreational limit, fishing closed area, missing cage tags, transfer at sea, unapproved shucking at sea, or fishing during quota/PSP closure.'
        },
        'ocean-quahog': {
            badgeLabel: 'Subpart E',
            headline: 'Ocean quahog — commercial unlimited per trip when open; recreational 2 bushels; closed areas and gear rules apply.',
            complianceNote: 'Not compliant if over recreational limit, fishing closed area, missing cage tags, transfer at sea, unapproved shucking at sea, or fishing during quota/PSP closure.'
        }
    }
};

/** Possession limits by permit. null count = unlimited per trip. */
function getSurfClam648PossessionLimit(speciesId, permitType, speciesData) {
    if (!SURFCLAM648_SPECIES.has(speciesId)) {
        return { count: null, prohibited: false, unit: 'bushels' };
    }

    if (!permitType || permitType === 'commercial' || permitType.startsWith('commercial-')) {
        return {
            count: null,
            prohibited: false,
            unit: 'bushels per trip',
            notes: 'Unlimited per trip when fishery open (subject to quota closure).'
        };
    }

    if (permitType === 'recreational') {
        return { count: 2, prohibited: false, unit: 'bushels' };
    }

    return { count: null, prohibited: false, unit: 'bushels' };
}

function getSurfClam648PolicyProfile(speciesId) {
    if (!SURFCLAM648_SPECIES.has(speciesId)) return null;
    const entry = SURFCLAM648_POLICY.species[speciesId];
    const asOf = typeof REGULATION_META !== 'undefined' ? REGULATION_META.dataLastUpdated : null;
    return {
        level: 'verified',
        badgeLabel: entry.badgeLabel,
        badgeClass: 'policy-verified',
        headline: entry.headline,
        bullets: [...SURFCLAM648_POLICY.sharedBullets],
        complianceNote: entry.complianceNote,
        dataAsOf: asOf
    };
}

if (typeof window !== 'undefined') {
    window.SURFCLAM648_POLICY = SURFCLAM648_POLICY;
    window.getSurfClam648PolicyProfile = getSurfClam648PolicyProfile;
    window.getSurfClam648PossessionLimit = getSurfClam648PossessionLimit;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SURFCLAM648_POLICY,
        SURFCLAM648_SPECIES,
        getSurfClam648PolicyProfile,
        getSurfClam648PossessionLimit
    };
}
