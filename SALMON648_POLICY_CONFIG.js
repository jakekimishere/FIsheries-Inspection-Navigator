/**
 * Atlantic Salmon (50 CFR 648 Subpart C) — selection-page policy summary.
 */
const SALMON648_POLICY = {
    source: '50 CFR Part 648 Subpart C — Atlantic Salmon',
    species: {
        'atlantic-salmon': {
            badgeLabel: 'Prohibited in EEZ',
            headline: 'Atlantic salmon — prohibited species in the EEZ; not compliant if retained on board.',
            bullets: [
                'Possession in the EEZ is prohibited (50 CFR 648.40) — prima facie evidence of violation.',
                'Incidental catch in a directed fishery for other species must be released for maximum probability of survival.',
                'Identify: slightly forked caudal fin; dark green back, silvery sides; X-shaped black spots above lateral line.',
                'Mouth extends only to or slightly beyond rear of eye; males develop hook-shaped jaws (kypes).',
                'Document state-waters or aquaculture source if vessel claims fish are not from EEZ retention.'
            ],
            complianceNote: 'Compliant only when zero Atlantic salmon on board in the EEZ, or documented lawful source outside federal retention rules.'
        }
    }
};

function getSalmon648PolicyProfile(speciesId) {
    const entry = SALMON648_POLICY.species[speciesId];
    if (!entry) return null;
    const asOf = typeof REGULATION_META !== 'undefined' ? REGULATION_META.dataLastUpdated : null;
    return {
        level: 'prohibited',
        badgeLabel: entry.badgeLabel,
        badgeClass: 'policy-prohibited',
        headline: entry.headline,
        bullets: entry.bullets,
        complianceNote: entry.complianceNote,
        dataAsOf: asOf
    };
}

if (typeof window !== 'undefined') {
    window.SALMON648_POLICY = SALMON648_POLICY;
    window.getSalmon648PolicyProfile = getSalmon648PolicyProfile;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SALMON648_POLICY, getSalmon648PolicyProfile };
}
