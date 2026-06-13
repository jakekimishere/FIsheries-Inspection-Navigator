/**
 * Northeast Multispecies (50 CFR 648 Subpart F) — selection-page policy summaries.
 */
const NMS648_SPECIES = new Set([
    'atlantic-cod', 'haddock', 'yellowtail-flounder', 'winter-flounder',
    'windowpane-flounder', 'atlantic-wolffish', 'redfish', 'atlantic-halibut',
    'white-hake', 'pollock', 'witch-flounder', 'american-plaice', 'ocean-pout'
]);

const NMS648_SHARED_BULLETS = [
    'Commercial permit categories: Cat A DAS, Cat C small vessel, Cat D hand, Cat E combination, Cat F large-mesh individual DAS, Handgear A/B, Cat J scallop-NMS 300 lb, Cat K open access, charter/party, sector.',
    'VMS required for most limited-access categories; Cat C and Handgear A require VMS if fishing multiple stock areas. Handgear B, charter/party, Cat J/K, recreational — no VMS.',
    'Operator permit required for all commercial categories; not required recreational.',
    'Sector vessels: LOA and operations plan aboard; daily common-pool trip limits do not apply — verify ACE on LOA.',
    'Common pool possession limits vary by stock area (GOM, inshore GB, offshore GB, SNE/MA) and permit category — cod prohibited in GB/SNE; windowpane, ocean pout, wolffish prohibited all areas.',
    'Cat C small vessel: combined 300 lb/trip cod + haddock + yellowtail (max 100 lb GOM cod, 200 lb GOM haddock within combined limit); 1 halibut/trip.',
    'Cat J scallop-NMS: up to 300 lb NMS species (no yellowtail) on scallop DAS; haddock prohibited Jan 1–Jun 30.',
    'Recreational/charter: cod inside GOM RMA — 1 fish/person, 23″, Sept 1–Oct 31 only; outside GOM RMA — no cod retention. Haddock inside GOM — 15 fish/person, 18″; outside GOM — no federal bag limit, 18″ minimum.',
    'Regulated mesh areas: GOM, GB, SNE, Mid-Atlantic RMAs — mesh and gillnet tag rules vary (6.5″ minimum trawl/gillnet; large-mesh DAS 8.5″).',
    'Restricted gear: GOM/GB Inshore Restricted Roller Gear Area — trawl footrope parts max 12″ diameter. Mobile Gear and Lobster Trap/Pot RGAs apply.',
    'Eastern U.S./Canada Area: trawl gear must be haddock separator, Ruhle, or flounder trawl (sector otter trawl with LOA); other trawl stowed per regulations.',
    'Closed areas: year-round groundfish and EFH closures; GOM Cod Spawning Protection Area; GOM Cod Protection closures (Closures I–V by month — verify exemptions).',
    'GOM Cod Protection exemptions include: state-waters-only without federal permit, recreational, charter/party with LOA, Handgear A in Closures IV–V, exempt gear types, mid-water trawl/scallop dredge/whiting exempted fisheries.',
    'Mobile Gear / Lobster Trap-Pot RGAs I–IV: seasonal mobile-gear closures — transit allowed with gear stowed.',
    'Exempted fisheries (verify season, LOA, gear, declaration): Small Mesh Areas 1 & 2 (Area 1 Jul 15–Nov 15; Area 2 Jan 1–Jun 30); GOM Raised Footrope whiting (West Sep 1–Nov 20; East Sep 1–Dec 31); GOM Grate whiting (Jul 1–Nov 30); Cultivator Shoal whiting (Jun 15–Oct 31); SNE Exemption Area (trawl, small mesh, no NMS DAS); SNE Little Tunny gillnet (Sep 1–Oct 31, 5.5″ diamond, LOA); Universal Redfish Exemption (sector, ≥5.5″ mesh, LOA).',
    'Special access programs: Closed Area 2 yellowtail/haddock SAP — verify season and gear.',
    'White hake trimester TAC and windowpane AM areas: verify current bulletin when measures published.'
];

function getNms648PolicyProfile(speciesId) {
    if (!NMS648_SPECIES.has(speciesId)) return null;

    const names = {
        'atlantic-cod': 'Atlantic cod',
        'haddock': 'Haddock',
        'yellowtail-flounder': 'Yellowtail flounder',
        'winter-flounder': 'Winter flounder',
        'windowpane-flounder': 'Windowpane flounder',
        'atlantic-wolffish': 'Atlantic wolffish',
        'ocean-pout': 'Ocean pout',
        'atlantic-halibut': 'Atlantic halibut',
        'pollock': 'Pollock',
        'redfish': 'Acadian redfish',
        'white-hake': 'White hake',
        'witch-flounder': 'Witch flounder',
        'american-plaice': 'American plaice'
    };

    const asOf = typeof REGULATION_META !== 'undefined' ? REGULATION_META.dataLastUpdated : null;
    const label = names[speciesId] || speciesId.replace(/-/g, ' ');

    return {
        level: 'complex',
        badgeLabel: 'NMS — complex',
        badgeClass: 'policy-complex',
        headline: `${label} — Northeast multispecies rules depend on sector vs common pool, permit category, stock area, and closed areas.`,
        bullets: [...NMS648_SHARED_BULLETS],
        complianceNote: 'Not compliant if over trip limit/ACE, in closed area, prohibited species on board, wrong gear for area, or recreational cod outside GOM RMA season.'
    };
}

function isNms648Species(speciesId) {
    return NMS648_SPECIES.has(speciesId);
}

if (typeof window !== 'undefined') {
    window.NMS648_SPECIES = NMS648_SPECIES;
    window.NMS648_SHARED_BULLETS = NMS648_SHARED_BULLETS;
    window.getNms648PolicyProfile = getNms648PolicyProfile;
    window.isNms648Species = isNms648Species;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        NMS648_SPECIES,
        NMS648_SHARED_BULLETS,
        getNms648PolicyProfile,
        isNms648Species
    };
}
