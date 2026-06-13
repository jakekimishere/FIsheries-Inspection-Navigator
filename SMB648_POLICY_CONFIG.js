/**
 * Squid, Mackerel, Butterfish (50 CFR 648 Subpart B) — selection-page policy summaries.
 */
const SMB648_POLICY = {
    source: '50 CFR Part 648 Subpart B — Squid, Mackerel, Butterfish',
    sharedBullets: [
        'No minimum size for squid, mackerel, or butterfish.',
        'Longfin mesh by trimester: T I (Jan–Apr) 2 1/8″; T II (May–Aug) 1 7/8″; T III (Sep–Dec) 2 1/8″.',
        'Scup GRA: 5″ diamond codend when possessing longfin squid, black sea bass, or silver hake (Northern Nov–Dec; Southern Jan–Mar 15).',
        'Oceanographer & Lydonia Canyons: no bottom trawl fishing — transit only with gear stowed.',
        'Moratorium permits may transfer longfin, illex, and/or butterfish at sea; incidental transfers need LOA.'
    ],
    species: {
        'atlantic-mackerel': {
            badgeLabel: 'SMB — complex',
            headline: 'Atlantic mackerel limits depend on permit tier, party/charter status, and area exemptions.',
            bullets: [
                'Tier 1 Limited Access: 200,000 lbs/trip. Tier 2: 135,000 lbs. Tier 3: 100,000 lbs.',
                'SMB 4 Open Access: 20,000 lbs/trip.',
                'SMB 2 Party/Charter: unlimited squid/chub/butterfish; mackerel 50 fish/person/day with paying customers, 25 without.',
                'Recreational: 25 fish per person (squid/chub/butterfish unlimited federally).',
                'SNE Exemption Area: may use smaller mesh when compliant with gear stowage and possession rules.',
                'Midwater trawl & purse seine exempted fisheries: LOA, species, and notification rules apply.'
            ],
            complianceNote: 'Not compliant if over tier/open-access trip limit, wrong mesh in regulated area, or fishing bottom trawl in canyon closures.'
        },
        'longfin-squid': {
            badgeLabel: 'SMB — complex',
            headline: 'Longfin (Loligo) limits depend on moratorium tier or incidental permit.',
            bullets: [
                'SMB 1A Tier 1: unlimited (VMS + operator permit required).',
                'SMB 1B Tier 2: 5,000 lbs/trip. SMB 1C Tier 3: 2,500 lbs/trip.',
                'SMB 3 Incidental: 250 lbs longfin/trip (600 lbs butterfish; 10,000 lbs illex on same permit).',
                'SMB 2 Party/Charter: unlimited squid/chub/butterfish; mackerel bag rules if mackerel on board.',
                'Illex Trawl Exemption Area: special longfin possession during illex directed trips when trimester II/III rules met.',
                'Identify vs illex: long tentacles, fin base ~½ mantle; no black stripe.'
            ],
            complianceNote: 'Verify permit tier, trimester mesh, GRA dates if also possessing BSB/silver hake, and exemption-area rules.'
        },
        'shortfin-squid': {
            badgeLabel: 'SMB — complex',
            headline: 'Illex (shortfin) — moratorium unlimited; incidental 10,000 lbs/trip.',
            bullets: [
                'SMB 5 Illex Moratorium: unlimited when directed fishery open; when closed, incidental landing once per calendar day.',
                'SMB 3 Incidental: 10,000 lbs illex/trip.',
                'Illex Trawl Exemption Area: gear mesh and longfin-bycatch rules apply.',
                'Identify vs longfin: short tentacles, fin base ~⅓ mantle, black stripe.'
            ],
            complianceNote: 'Not compliant if over incidental limit or fishing illex exemption area without required mesh/declaration.'
        },
        'butterfish': {
            badgeLabel: 'SMB',
            headline: 'Butterfish moratorium — unlimited with large mesh; 5,000 lbs with small mesh.',
            bullets: [
                'SMB 6 Butterfish Moratorium: unlimited if using ≥3″ diamond or ≥2 5/8″ square mesh.',
                'Same permit: 5,000 lbs/trip if using <3″ diamond or <2 5/8″ square mesh.',
                'SMB 3 Incidental: 600 lbs butterfish/trip.',
                'Recreational: no federal possession limit.'
            ],
            complianceNote: 'Measure mesh and compare to possession — small mesh + over 5,000 lbs on moratorium permit is not compliant.'
        },
        'atlantic-chub-mackerel': {
            badgeLabel: 'SMB',
            headline: 'Atlantic chub mackerel — no federal recreational limit; party/charter unlimited.',
            bullets: [
                'SMB 2 Party/Charter: unlimited chub mackerel (with operator permit).',
                'Recreational: no federal possession limit.',
                'Often grouped with squid/butterfish on SMB permits — verify primary permit category.'
            ],
            complianceNote: 'Confirm permit matches species retained; Atlantic mackerel has separate tier limits.'
        }
    }
};

const SMB648_SPECIES = new Set(Object.keys(SMB648_POLICY.species));

/** Trip limits (lbs) by permit. Returns null = unlimited / verify bulletin. */
function getSmb648PossessionLimit(speciesId, permitType, speciesData) {
    if (!permitType || permitType === 'commercial') {
        return { count: null, prohibited: false, unit: 'lbs' };
    }

    if (permitType === 'recreational') {
        if (speciesId === 'atlantic-mackerel') {
            return { count: 25, prohibited: false, unit: 'fish per person' };
        }
        return { count: null, prohibited: false, unit: 'lbs' };
    }

    if (permitType === 'smb3-incidental') {
        const limits = {
            'butterfish': 600,
            'longfin-squid': 250,
            'shortfin-squid': 10000
        };
        if (limits[speciesId] != null) {
            return { count: limits[speciesId], prohibited: false, unit: 'lbs per trip' };
        }
    }

    if (permitType === 'smb2-party-charter' && speciesId === 'atlantic-mackerel') {
        const forHire = speciesData?.carryingCustomersForHire ?? speciesData?.['carrying-customers-for-hire'];
        const perPerson = (forHire === 'no' || forHire === false) ? 25 : 50;
        return { count: perPerson, prohibited: false, unit: 'fish per person per day' };
    }

    if (speciesId === 'butterfish' && permitType === 'smb6-butterfish-moratorium') {
        const mesh = speciesData?.meshSize || speciesData?.meshSizeCompliance || speciesData?.['mesh-size'];
        const largeMesh = mesh === 'large-mesh' || mesh === 'large' || mesh === 'yes' || mesh === '3-inch-plus';
        if (!largeMesh && mesh) {
            return { count: 5000, prohibited: false, unit: 'lbs per trip' };
        }
        return { count: null, prohibited: false, unit: 'lbs' };
    }

    if (speciesId === 'longfin-squid') {
        if (permitType === 'smb1a-longfin-tier1') return { count: null, prohibited: false, unit: 'lbs' };
        if (permitType === 'smb1b-longfin-tier2') return { count: 5000, prohibited: false, unit: 'lbs per trip' };
        if (permitType === 'smb1c-longfin-tier3') return { count: 2500, prohibited: false, unit: 'lbs per trip' };
    }

    if (speciesId === 'shortfin-squid' && permitType === 'smb5-illex-moratorium') {
        return { count: null, prohibited: false, unit: 'lbs', notes: 'Unlimited when directed fishery open; verify closure status.' };
    }

    if (speciesId === 'atlantic-mackerel') {
        const tierLimits = {
            'mackerel-tier1-limited': 200000,
            'mackerel-tier2-limited': 135000,
            'mackerel-tier3-limited': 100000,
            'smb4-mackerel-open-access': 20000
        };
        if (tierLimits[permitType] != null) {
            return { count: tierLimits[permitType], prohibited: false, unit: 'lbs per trip' };
        }
    }

    return { count: null, prohibited: false, unit: 'lbs' };
}

/** Longfin minimum diamond mesh (inches) by assessment date. */
function getLongfinSquidMeshMinimumInches(assessmentDate) {
    const d = assessmentDate instanceof Date ? assessmentDate : new Date(assessmentDate || Date.now());
    const month = d.getMonth() + 1;
    if (month >= 5 && month <= 8) return 1.875;
    return 2.125;
}

function getSmb648PolicyProfile(speciesId) {
    if (!SMB648_SPECIES.has(speciesId)) return null;
    const entry = SMB648_POLICY.species[speciesId];
    const asOf = typeof REGULATION_META !== 'undefined' ? REGULATION_META.dataLastUpdated : null;
    return {
        level: speciesId === 'atlantic-chub-mackerel' ? 'verified' : 'complex',
        badgeLabel: entry.badgeLabel,
        badgeClass: speciesId === 'atlantic-chub-mackerel' ? 'policy-verified' : 'policy-complex',
        headline: entry.headline,
        bullets: [...entry.bullets, ...SMB648_POLICY.sharedBullets],
        complianceNote: entry.complianceNote,
        dataAsOf: asOf
    };
}

if (typeof window !== 'undefined') {
    window.SMB648_POLICY = SMB648_POLICY;
    window.getSmb648PolicyProfile = getSmb648PolicyProfile;
    window.getSmb648PossessionLimit = getSmb648PossessionLimit;
    window.getLongfinSquidMeshMinimumInches = getLongfinSquidMeshMinimumInches;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SMB648_POLICY,
        getSmb648PolicyProfile,
        getSmb648PossessionLimit,
        getLongfinSquidMeshMinimumInches
    };
}
