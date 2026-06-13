/**

 * HMS policy summaries (sharks, swordfish, billfish, gear areas).
 * Complements HMS_TUNAS_POLICY_CONFIG.js.

 */

const HMS_SHARED_POLICY = {

    source: '50 CFR Part 635 — HMS compliance chart',

    vesselRequirements: [

        'VMS: required on vessels with pelagic longline gear; bottom longline off SC/NC/VA (33°N–36°30′N) Jan–Jul.',

        'Transfer at sea: prohibited for HMS.',

        'Pelagic longline NE U.S. closed area: closed in June each year.',

        'Pelagic longline closures: DeSoto Canyon & East Florida — year-round; Charleston Bump — Feb 1–Apr 30.',

        'NED gear restricted area: circle hooks 18/0+ (≤10° offset); whole mackerel/squid bait only.'

    ],

    finningRule: 'All sharks: fins naturally attached through offloading (uncut skin). Smooth dogfish exception if ≥25% of retained catch is smooth dogfish.'

};



/** Tuna measurement/carcass supplement — appended to tuna policy profiles. */

const HMS_TUNAS_SECTION_62 = {

    measurement: 'Measurements are curved (CFL from lower jaw; PFCFL from pectoral/dorsal intersection when head removed — BFT only).',

    baysMinSize: 'Yellowfin & bigeye: 27″ CFL minimum. Albacore & skipjack: no federal minimum.',

    carcass: 'Tuna may be round or eviscerated; one pectoral fin and tail must remain for ID.',

    ceaseFishing: 'Cease fishing and return to port once daily LARGE MEDIUM or GIANT BFT limit is reached.',

    pelagicLonglinePermits: 'Pelagic longline for swordfish/tuna requires Directed or Incidental Swordfish + Directed or Incidental Shark + Atlantic Tunas Longline permits.'

};



const HMS_PROHIBITED_SHARKS = new Set([

    'atlantic-angel-shark', 'basking-shark', 'bigeye-sand-tiger-shark', 'bigeye-sixgill-shark',

    'bigeye-thresher-shark', 'bignose-shark', 'caribbean-reef-shark', 'caribbean-sharpnose-shark',

    'dusky-shark', 'galapagos-shark', 'longfin-mako-shark', 'narrowtooth-shark', 'night-shark',

    'oceanic-whitetip-shark', 'sandbar-shark', 'sand-tiger-shark', 'sevengill-shark', 'sixgill-shark',

    'smalltail-shark', 'whale-shark', 'white-shark', 'shortfin-mako-shark'

]);



const HMS_SHARK_SPECIES = new Set([

    'atlantic-sharks', 'blue-shark', 'common-thresher-shark', 'porbeagle-shark',

    'blacktip-shark', 'bull-shark', 'lemon-shark', 'nurse-shark', 'spinner-shark', 'tiger-shark',

    'great-hammerhead-shark', 'scalloped-hammerhead-shark', 'smooth-hammerhead-shark',

    'atlantic-sharpnose-shark', 'blacknose-shark', 'bonnethead-shark', 'finetooth-shark',

    'silky-shark', ...HMS_PROHIBITED_SHARKS

]);



const HMS_SHARKS_POLICY = {

    generic: {

        badgeLabel: 'HMS Sharks',

        headline: 'Shark limits depend on permit (directed/incidental/charter/angler), species group, and size.',

        bullets: [

            'Commercial Directed: 55 LCS per vessel/trip (sandbar excluded); Blacknose SCS max 8/trip; other pelagic/SCS no federal limit.',

            'Commercial Incidental: 3 LCS/trip; 16 combined pelagic/SCS/trip (max 8 blacknose).',

            'Recreational (Charter/Headboat & Angler): 1 shark per vessel per trip from allowable list.',

            '54″ FL minimum: blue, porbeagle, thresher, tiger, nurse, lemon, blacktip, spinner, bull, finetooth, blacknose (blacknose prohibited north of 34°N).',

            '78″ FL minimum: great, smooth, scalloped hammerhead.',

            'Atlantic sharpnose & bonnethead: 1 each per person per trip (no minimum size).',

            'Shortfin mako: retention limit ZERO — release at haulback.',

            'Prohibited species: angel, basking, dusky, sandbar, whitetip, whale, white, makos, and others — any on board is not compliant.',

            HMS_SHARED_POLICY.finningRule

        ],

        complianceNote: 'Not compliant if prohibited species on board, over trip limit, undersized, fins not naturally attached, or wrong commercial permit category.'

    },

    prohibited: {

        badgeLabel: 'Prohibited shark',

        headline: 'Federal retention prohibited — not compliant if any on board.',

        bullets: [

            'Must be released immediately; remain in water when possible.',

            'Fins must stay naturally attached if accidentally brought aboard for release documentation.'

        ],

        complianceNote: 'Compliant only when zero on board.'

    },

    'shortfin-mako-shark': {

        badgeLabel: 'Prohibited — mako',

        headline: 'Shortfin mako retention limit is ZERO (all permits).',

        bullets: [

            'Release at haulback; remain in water with minimal injury.',

            'Chart lists 71″ FL (male) / 83″ FL (female) reference sizes — retention still prohibited.'

        ],

        complianceNote: 'Any shortfin mako on board → not compliant.'

    },

    'silky-shark': {

        badgeLabel: 'HMS Sharks — special',

        headline: 'Silky — commercial LCS only; recreational retention prohibited.',

        bullets: [

            'Commercial directed/incidental: may retain as LCS subject to trip limits.',

            'Recreational: prohibited — must release.'

        ],

        complianceNote: 'Recreational permit with silky on board → not compliant.'

    },

    'blacknose-shark': {

        badgeLabel: 'HMS Sharks',

        headline: 'Blacknose — 54″ FL; prohibited north of 34°00′ N.',

        bullets: [

            'Commercial: counts toward SCS limits (directed max 8/trip).',

            'Recreational: 1 shark/vessel/trip from allowable list; verify latitude if north of 34°N.'

        ],

        complianceNote: 'North of 34°N → blacknose retention not compliant.'

    }

};



const HMS_SWORDFISH_POLICY = {

    species: ['swordfish'],

    badgeLabel: 'HMS Swordfish — complex',

    headline: 'Swordfish limits vary by permit category and directed-fishery status.',

    bullets: [

        'Commercial Directed: no trip limit when fishery open; when closed — 15/trip (longline), 2/trip (handgear), 0 (harpoon).',

        'Commercial Incidental: 30/trip (15 if squid trawl). General access: 18/vessel/trip.',

        'Recreational Angler: 1 per person, up to 4 per vessel per trip.',

        'Recreational Charter: 1 per paying passenger, up to 6 per vessel per trip.',

        'Recreational Headboat: 1 per paying passenger, up to 15 per vessel per trip.',

        'Non-for-hire rod/reel or handline: 6 per vessel per trip.',

        'Minimum size: 47″ LJFL (head attached) or 25″ cleithrum-to-caudal keel (head removed). Whole or dressed only — no fillets at sea.',

        'Trap gear: swordfish retention prohibited.'

    ],

    complianceNote: 'Not compliant if over permit limit, undersized, filleted at sea, wrong gear, or missing valid HMS permit.'

};



const HMS_BILLFISH_POLICY = {

    species: ['billfish'],

    badgeLabel: 'HMS Billfish',

    headline: 'Recreational billfish — no federal trip limit; rod and reel only; no commercial sale.',

    bullets: [

        'Species: white marlin, blue marlin, roundscale spearfish, sailfish — no trip limit (Charter/Headboat & Angler).',

        'Minimum LJFL: blue marlin 99″; white marlin 66″; sailfish 63″; roundscale spearfish 66″.',

        'Longbill spearfish: prohibited.',

        'Gear: rod and reel only. Land whole with head, fins, and bill intact (may be gutted).',

        'Commercial sale of Atlantic billfish prohibited.'

    ],

    complianceNote: 'Not compliant if longbill on board, undersized, wrong gear, filleted, or offered for commercial sale.'

};



/** Blacknose retention boundary (50 CFR 635.22). */
const BLACKNOSE_NORTH_PROHIBITED_LAT = 34;

function isBlacknoseRetentionProhibited(speciesData) {
    if (!speciesData) return false;
    const zone = speciesData.catchLatitudeZone || speciesData['catch-latitude-zone'];
    if (zone === 'north') return true;
    const lat = speciesData.catchLatitudeDecimal ?? speciesData['catch-latitude-decimal'];
    if (typeof lat === 'number' && Number.isFinite(lat) && lat >= BLACKNOSE_NORTH_PROHIBITED_LAT) {
        return true;
    }
    return false;
}

function getSwordfishRecreationalVesselLimit(permitType) {

    const map = {

        recreational: { count: 4, unit: 'fish per vessel per trip', perPerson: 1 },

        'recreational-charter': { count: 6, unit: 'fish per vessel per trip (charter)' },

        'recreational-headboat': { count: 15, unit: 'fish per vessel per trip (headboat)' },

        'recreational-charter-headboat': { count: 6, unit: 'fish per vessel per trip (charter; headboat 15)' }

    };

    return map[permitType] || null;

}



function appendTunasSection62(profile, speciesId) {

    if (!profile) return null;

    const extra = [

        HMS_TUNAS_SECTION_62.measurement,

        HMS_TUNAS_SECTION_62.carcass,

        HMS_TUNAS_SECTION_62.pelagicLonglinePermits

    ];

    if (speciesId === 'bluefin-tuna') {

        extra.push(HMS_TUNAS_SECTION_62.ceaseFishing);

    }

    if (['yellowfin-tuna', 'bigeye-tuna', 'skipjack-tuna', 'albacore-tuna'].includes(speciesId)) {

        extra.push(HMS_TUNAS_SECTION_62.baysMinSize);

    }

    return {

        ...profile,

        bullets: [...profile.bullets, ...extra]

    };

}



function getHmsSharksPolicyProfile(speciesId) {

    if (!HMS_SHARK_SPECIES.has(speciesId)) return null;

    const asOf = typeof REGULATION_META !== 'undefined' ? REGULATION_META.dataLastUpdated : null;



    if (HMS_PROHIBITED_SHARKS.has(speciesId)) {

        const custom = HMS_SHARKS_POLICY[speciesId] || HMS_SHARKS_POLICY.prohibited;

        return {

            level: 'prohibited',

            badgeLabel: custom.badgeLabel,

            badgeClass: 'policy-prohibited',

            headline: custom.headline,

            bullets: [...custom.bullets, ...HMS_SHARED_POLICY.vesselRequirements],

            complianceNote: custom.complianceNote,

            dataAsOf: asOf

        };

    }



    const custom = HMS_SHARKS_POLICY[speciesId];

    const base = custom || HMS_SHARKS_POLICY.generic;

    return {

        level: custom ? 'complex' : 'verified',

        badgeLabel: base.badgeLabel,

        badgeClass: custom ? 'policy-complex' : 'policy-verified',

        headline: base.headline,

        bullets: [...(custom ? custom.bullets : HMS_SHARKS_POLICY.generic.bullets), ...HMS_SHARED_POLICY.vesselRequirements],

        complianceNote: base.complianceNote || HMS_SHARKS_POLICY.generic.complianceNote,

        dataAsOf: asOf

    };

}



function getHmsSwordfishPolicyProfile(speciesId) {

    if (speciesId !== 'swordfish') return null;

    const asOf = typeof REGULATION_META !== 'undefined' ? REGULATION_META.dataLastUpdated : null;

    return {

        level: 'complex',

        badgeLabel: HMS_SWORDFISH_POLICY.badgeLabel,

        badgeClass: 'policy-complex',

        headline: HMS_SWORDFISH_POLICY.headline,

        bullets: [...HMS_SWORDFISH_POLICY.bullets, ...HMS_SHARED_POLICY.vesselRequirements],

        complianceNote: HMS_SWORDFISH_POLICY.complianceNote,

        dataAsOf: asOf

    };

}



function getHmsBillfishPolicyProfile(speciesId) {

    if (!HMS_BILLFISH_POLICY.species.includes(speciesId)) return null;

    const asOf = typeof REGULATION_META !== 'undefined' ? REGULATION_META.dataLastUpdated : null;

    return {

        level: 'verified',

        badgeLabel: HMS_BILLFISH_POLICY.badgeLabel,

        badgeClass: 'policy-verified',

        headline: HMS_BILLFISH_POLICY.headline,

        bullets: [...HMS_BILLFISH_POLICY.bullets, ...HMS_SHARED_POLICY.vesselRequirements],

        complianceNote: HMS_BILLFISH_POLICY.complianceNote,

        dataAsOf: asOf

    };

}



/** Unified HMS selection-page policy. */

function getHmsPolicyProfile(speciesId) {

    if (typeof getHmsTunasPolicyProfile === 'function') {

        const tunas = getHmsTunasPolicyProfile(speciesId);

        if (tunas) return appendTunasSection62(tunas, speciesId);

    }

    return getHmsSharksPolicyProfile(speciesId)

        || getHmsSwordfishPolicyProfile(speciesId)

        || getHmsBillfishPolicyProfile(speciesId);

}



if (typeof window !== 'undefined') {

    window.HMS_SHARED_POLICY = HMS_SHARED_POLICY;

    window.HMS_PROHIBITED_SHARKS = HMS_PROHIBITED_SHARKS;

    window.BLACKNOSE_NORTH_PROHIBITED_LAT = BLACKNOSE_NORTH_PROHIBITED_LAT;

    window.isBlacknoseRetentionProhibited = isBlacknoseRetentionProhibited;

    window.getHmsPolicyProfile = getHmsPolicyProfile;

    window.getSwordfishRecreationalVesselLimit = getSwordfishRecreationalVesselLimit;

}



if (typeof module !== 'undefined' && module.exports) {

    module.exports = {

        HMS_SHARED_POLICY,

        HMS_PROHIBITED_SHARKS,

        BLACKNOSE_NORTH_PROHIBITED_LAT,

        isBlacknoseRetentionProhibited,

        getHmsPolicyProfile,

        getSwordfishRecreationalVesselLimit

    };

}


