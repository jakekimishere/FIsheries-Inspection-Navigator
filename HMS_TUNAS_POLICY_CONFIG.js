/**
 * HMS Tunas (50 CFR 635) — selection-page policy summaries.
 */
const HMS_TUNAS_POLICY = {
    source: '50 CFR Part 635 — HMS Tunas',
    bftHotline: '(301) 427-8591 Mon–Fri 8am–5pm (BFT IFQ)',
    vesselRequirements: [
        'VMS: required on vessels with pelagic longline gear; bottom longline off SC/NC/VA (33°N–36°30′N) Jan–Jul.',
        'EMS: Atlantic Tunas Longline permit — operable certified EMS (video) required for entire trip.',
        'Operators permit: not required for HMS tunas.'
    ],
    species: {
        'bluefin-tuna': {
            badgeLabel: 'HMS Tunas — complex',
            headline: 'Federal BFT limits depend on permit category, size class, date, and RFDs.',
            bullets: [
                'Commercial General: 3 large medium/giant (≥73″ CFL) per vessel per day/trip — 0 on Restricted Fishing Days (Tue/Fri/Sat, Jul 1–Nov 30).',
                'Commercial Harpoon: 5 large medium + giant combined per vessel per day/trip (no more than 2 large medium).',
                'Commercial Trap: 1 large medium or giant per vessel per year.',
                'Commercial Purse Seine: CLOSED (contact NOAA).',
                'Commercial Longline: IBQ — call BFT IFQ Hotline (301) 427-8591.',
                'Commercial Charter/Headboat (with sale endorsement): follow General Category rules; first fish retained sets category.',
                'Recreational Angler: 2 BFT per vessel per day/trip (only 1 may be large school or small medium, 47″–<73″ CFL).',
                'Recreational Charter: 3 BFT per vessel per day/trip (only 1 large school/small medium).',
                'Recreational Headboat: 6 BFT per vessel per day/trip (only 1 large school/small medium).',
                'Trophy fishery (≥73″ CFL, recreational): South CLOSED; Southern New England & Gulf of Maine OPEN (verify quota).',
                'Fish <27″ CFL: prohibited — must release immediately.'
            ],
            complianceNote: 'Not compliant if over category limit, wrong size class, on RFD (commercial LM/giant), purse seine retention, or trap over annual limit. Enter permit type and fish count in assessment.'
        },
        'yellowfin-tuna': {
            badgeLabel: 'HMS Tunas',
            headline: 'Yellowfin — commercial mostly no federal limit; trap prohibited; recreational bag applies.',
            bullets: [
                'Commercial (General, Harpoon, Longline, Purse Seine, Charter commercial): no federal possession limit.',
                'Commercial Trap: PROHIBITED — any yellowfin on board is not compliant.',
                'Recreational (Angler & Charter/Headboat): 3 yellowfin per person per day; 27″ CFL minimum.',
                'Bigeye, skipjack, albacore on same trip: trap gear cannot retain those species either.'
            ],
            complianceNote: 'Trap permit with any yellowfin on board → violation. Recreational: over 3/person/day or undersized → violation.'
        },
        'bigeye-tuna': {
            badgeLabel: 'HMS Tunas',
            headline: 'Bigeye — no federal recreational bag limit; trap prohibited commercially.',
            bullets: [
                'Commercial (except Trap): no federal possession limit.',
                'Commercial Trap: PROHIBITED.',
                'Recreational: no federal bag limit; 27″ CFL minimum if retained.',
                'Often on board with other tunas — verify permit and gear match each species.'
            ],
            complianceNote: 'Trap + bigeye on board → not compliant. Undersized fish → not compliant.'
        },
        'skipjack-tuna': {
            badgeLabel: 'HMS Tunas',
            headline: 'Skipjack — no federal recreational bag limit; trap prohibited commercially.',
            bullets: [
                'Commercial (except Trap): no federal possession limit.',
                'Commercial Trap: PROHIBITED.',
                'Recreational: no federal bag limit.'
            ],
            complianceNote: 'Trap retention → not compliant under federal rules.'
        },
        'albacore-tuna': {
            badgeLabel: 'HMS Tunas',
            headline: 'Albacore — no federal recreational bag limit; trap prohibited commercially.',
            bullets: [
                'Commercial (except Trap): no federal possession limit.',
                'Commercial Trap: PROHIBITED.',
                'Recreational: no federal bag limit.'
            ],
            complianceNote: 'Trap retention → not compliant under federal rules.'
        }
    }
};

/** Recreational BFT vessel per trip limits. */
function getBFTRecreationalVesselLimit(permitType) {
    const map = {
        recreational: { count: 2, unit: 'fish per vessel per trip', maxLargeSchoolSmallMedium: 1 },
        'recreational-charter': { count: 3, unit: 'fish per vessel per trip', maxLargeSchoolSmallMedium: 1 },
        'recreational-headboat': { count: 6, unit: 'fish per vessel per trip', maxLargeSchoolSmallMedium: 1 },
        'recreational-charter-headboat': { count: 3, unit: 'fish per vessel per trip (charter; headboat 6)', maxLargeSchoolSmallMedium: 1 }
    };
    return map[permitType] || null;
}

function getHmsTunasPolicyProfile(speciesId) {
    const entry = HMS_TUNAS_POLICY.species[speciesId];
    if (!entry) return null;
    const extra = speciesId === 'bluefin-tuna'
        ? [`BFT IFQ Hotline: ${HMS_TUNAS_POLICY.bftHotline}`]
        : [];
    return {
        level: 'complex',
        badgeLabel: entry.badgeLabel,
        badgeClass: 'policy-complex',
        headline: entry.headline,
        bullets: [...entry.bullets, ...HMS_TUNAS_POLICY.vesselRequirements, ...extra],
        complianceNote: entry.complianceNote,
        dataAsOf: typeof REGULATION_META !== 'undefined' ? REGULATION_META.dataLastUpdated : null
    };
}

if (typeof window !== 'undefined') {
    window.HMS_TUNAS_POLICY = HMS_TUNAS_POLICY;
    window.getHmsTunasPolicyProfile = getHmsTunasPolicyProfile;
    window.getBFTRecreationalVesselLimit = getBFTRecreationalVesselLimit;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HMS_TUNAS_POLICY, getHmsTunasPolicyProfile, getBFTRecreationalVesselLimit };
}
