/**
 * Inspector attestation checklists for special fishing locations (no GPS).
 * Merged into species assessmentQuestions at load time.
 */
const LOCATION_CHECKLIST_TEMPLATES = {
    scallop648: {
        sectionTitle: 'Special location checklist — Atlantic sea scallop',
        intro: 'Answer based on VMS, charts, or vessel statement. “Yes” means the situation applies.',
        cfr: '50 CFR Part 648 Subpart D',
        items: [
            {
                field: 'locScallopClosedArea',
                question: 'Is the vessel fishing in a closed scallop area or rotational area without a valid declared access trip?',
                notes: 'Includes closed areas and transit through rotational areas without continuous transit when on a scallop declaration.',
                violation: {
                    ifTrue: 'VIOLATION: Scallop fishing or prohibited transit in closed/rotational area (50 CFR 648.60)'
                }
            },
            {
                field: 'locScallopWgomTransit',
                question: 'Did the vessel enter or transit the Western Gulf of Maine closure without continuous transit (gear stowed, direct heading)?',
                notes: 'Western GOM closure — no transit unless gear stowed and expeditious passage.',
                violation: {
                    ifTrue: 'VIOLATION: Prohibited transit in Western Gulf of Maine closure (50 CFR 648.60)'
                }
            },
            {
                field: 'locScallopLagcClosedAccess',
                question: 'Is this a LAGC vessel fishing in an access area closed to LAGC (e.g., NY Bight, Area II when closed, Nantucket Lightship)?',
                applicablePermits: ['lagc-ifq', 'lagc-ngom', 'lagc-incidental'],
                notes: 'Verify VMS code and current access program status.',
                violation: {
                    ifTrue: 'VIOLATION: LAGC fishing in area closed to general category (50 CFR 648.59)'
                }
            },
            {
                field: 'locScallopNgomLagc',
                question: 'LAGC IFQ or incidental — is the vessel fishing in the Northern Gulf of Maine?',
                applicablePermits: ['lagc-ifq', 'lagc-incidental'],
                violation: {
                    ifTrue: 'VIOLATION: NGOM closed to LAGC IFQ and incidental permits (50 CFR 648.62)'
                }
            },
            {
                field: 'locScallopStellwagenShipwreck',
                question: 'Is fishing gear within 400 ft of a Stellwagen Bank shipwreck site?',
                notes: 'NOAA requests gear stay ≥400 ft from listed sanctuary shipwreck coordinates.',
                violation: {
                    ifTrue: 'VIOLATION: Gear too close to Stellwagen Bank shipwreck site (sanctuary avoidance request)'
                }
            }
        ]
    },
    surfclam648: {
        sectionTitle: 'Special location checklist — surf clam / ocean quahog',
        intro: 'Answer based on charts, VMS, or vessel statement. Closed areas apply to commercial and recreational.',
        cfr: '50 CFR Part 648 Subpart E',
        items: [
            {
                field: 'locBostonFoulGround',
                question: 'Is the vessel fishing for surfclam or ocean quahog in the Boston Foul Ground (1 nm around 42°25′36″ N, 70°35′00″ W)?',
                violation: {
                    ifTrue: 'VIOLATION: Boston Foul Ground closed to surfclam and ocean quahog fishing (50 CFR 648.76)'
                }
            },
            {
                field: 'locNyBightSurfclam',
                question: 'Is the vessel harvesting surfclam or ocean quahog in the New York Bight closure area?',
                violation: {
                    ifTrue: 'VIOLATION: New York Bight closed to surfclam and ocean quahog harvest (50 CFR 648.76)'
                }
            },
            {
                field: 'loc106Dumpsite',
                question: 'Is the vessel fishing for surfclam or ocean quahog in the 106 Dumpsite closed area?',
                violation: {
                    ifTrue: 'VIOLATION: 106 Dumpsite closed to surfclam and ocean quahog fishing (50 CFR 648.76)'
                }
            },
            {
                field: 'locGeorgesBankPspHarvest',
                question: 'Is the vessel harvesting surfclam or ocean quahog in the Georges Bank PSP closed area without a valid LOA aboard?',
                notes: 'Trips into the PSP area require LOA on board even when not harvesting.',
                violation: {
                    ifTrue: 'VIOLATION: Harvest in Georges Bank PSP area or missing required LOA (50 CFR 648.76)'
                }
            },
            {
                field: 'locGscHmaMobileGear',
                question: 'Is mobile bottom-tending gear being used in the Great South Channel HMA outside a surfclam/blue mussel exemption area?',
                violation: {
                    ifTrue: 'VIOLATION: Mobile bottom gear prohibited in GSC HMA outside exemption areas (50 CFR 648.76)'
                }
            },
            {
                field: 'locGscOldSouthSeason',
                question: 'Is mobile bottom-tending gear being used in the Old South exemption area during Nov 1–Apr 30?',
                dateFilter: { months: [11, 12, 1, 2, 3, 4] },
                notes: 'Old South closed to all mobile bottom gear Nov 1 through Apr 30 each year.',
                violation: {
                    ifTrue: 'VIOLATION: Old South area closed to mobile bottom gear Nov 1–Apr 30 (50 CFR 648.76)'
                }
            }
        ]
    },
    smb648: {
        sectionTitle: 'Special location checklist — squid / mackerel / butterfish',
        intro: 'Confirm canyon and closure areas from charts or vessel statement.',
        cfr: '50 CFR Part 648 Subpart B',
        items: [
            {
                field: 'locCanyonBottomTrawl',
                question: 'Is bottom trawl gear being used to fish (not continuous transit) in Oceanographer or Lydonia Canyon?',
                notes: 'Transit only with gear stowed — no bottom trawl fishing in these canyons.',
                violation: {
                    ifTrue: 'VIOLATION: Bottom trawl fishing prohibited in Oceanographer or Lydonia Canyon (50 CFR 648.14)'
                }
            }
        ]
    },
    herring648: {
        sectionTitle: 'Special location checklist — Atlantic herring',
        intro: 'Confirm area status from charts, VMS, or vessel statement.',
        cfr: '50 CFR Part 648 Subpart J',
        items: [
            {
                field: 'locHerringClosedArea',
                question: 'Is the vessel fishing for herring in a federally closed herring management area?',
                notes: 'Includes seasonal or in-season area closures beyond trip limits.',
                violation: {
                    ifTrue: 'VIOLATION: Herring fishing in closed management area (50 CFR 648.201)'
                }
            }
        ]
    },
    groundfish648: {
        sectionTitle: 'Special location checklist — Northeast multispecies',
        intro: 'Answer based on charts, VMS, or vessel statement. “Yes” means the situation applies.',
        cfr: '50 CFR Part 648 Subpart F',
        items: [
            {
                field: 'nmsRegulatedMeshArea',
                type: 'choice',
                question: 'Which regulated mesh / stock area best describes where the vessel fished?',
                options: [
                    { value: 'gom', label: 'GOM RMA / GOM stock area' },
                    { value: 'in-gb', label: 'Inshore Georges Bank' },
                    { value: 'off-gb', label: 'Offshore Georges Bank' },
                    { value: 'sne-ma', label: 'SNE or Mid-Atlantic RMA' },
                    { value: 'multiple', label: 'Multiple stock areas this trip' }
                ],
                notes: 'Common pool trip limits and recreational cod/haddock rules depend on stock area.'
            },
            {
                field: 'locGroundfishClosedArea',
                question: 'Is the vessel fishing with gear in a closed groundfish area (rolling closure, EFH, or year-round closure)?',
                notes: 'Sector vessels may have LOA exemptions — still verify.',
                violation: {
                    ifTrue: 'VIOLATION: Fishing prohibited in closed groundfish area (50 CFR 648.81)'
                }
            },
            {
                field: 'locNmsGomCodProtection',
                question: 'Is the vessel fishing in a GOM Cod Protection closure without a valid exemption (recreational, exempt gear, whiting/scallop exempted fishery, etc.)?',
                overwrite: true,
                notes: 'Closures I–V vary by month and permit type. Charter/party with LOA and Handgear A in Closures IV–V may be exempt.',
                violation: {
                    ifTrue: 'VIOLATION: Fishing in GOM Cod Protection closure without exemption (50 CFR 648.81)'
                }
            },
            {
                field: 'locNmsInshoreRollerGear',
                question: 'Is trawl gear fishing in the GOM/GB Inshore Restricted Roller Gear Area with any footrope part (disc, roller, rockhopper) greater than 12 inches?',
                violation: {
                    ifTrue: 'VIOLATION: Trawl footrope exceeds 12″ in Inshore Restricted Roller Gear Area (50 CFR 648.80)'
                }
            },
            {
                field: 'locNmsEasternUsCanadaGear',
                question: 'Is the vessel trawling in the Eastern U.S./Canada Area without required gear (haddock separator, Ruhle, or flounder trawl — sector otter trawl only with valid LOA)?',
                violation: {
                    ifTrue: 'VIOLATION: Non-compliant trawl gear in Eastern U.S./Canada Area (50 CFR 648.85)'
                }
            },
            {
                field: 'locNmsRestrictedGearRga',
                question: 'Is mobile bottom-tending gear fishing (not transiting with gear stowed) in a Mobile Gear or Lobster Trap/Pot RGA during that RGA’s closed season?',
                overwrite: true,
                notes: 'RGA I Oct 1–Jun 15; II Nov 27–Jun 15; III Jun 16–Nov 26; IV Jun 16–Sep 30. Transit allowed if gear stowed.',
                violation: {
                    ifTrue: 'VIOLATION: Mobile gear fishing in Restricted Gear Area during closure (50 CFR 648.80)'
                }
            },
            {
                field: 'locNmsSectorNoLoa',
                question: 'Is this a sector vessel without the sector operations plan and NMFS LOA aboard?',
                applicableVesselCategories: ['sector'],
                violation: {
                    ifTrue: 'VIOLATION: Sector vessel missing required LOA or operations plan (50 CFR 648.87)'
                }
            },
            {
                field: 'locNmsRecCodOutsideGom',
                question: 'Recreational or charter — is Atlantic cod on board while outside the GOM Regulated Mesh Area?',
                applicablePermits: ['recreational'],
                speciesOnly: ['atlantic-cod'],
                violation: {
                    ifTrue: 'VIOLATION: Recreational Atlantic cod retention prohibited outside GOM RMA (50 CFR 648.83)'
                }
            },
            {
                field: 'locNmsClosedArea2Sap',
                question: 'Is the vessel fishing in Closed Area 2 Yellowtail/Haddock SAP outside open season or without valid SAP requirements?',
                notes: 'Haddock SAP Aug 1–Jan 31; yellowtail targeting closed Jul 1–Dec 31.',
                violation: {
                    ifTrue: 'VIOLATION: Non-compliant fishing in Closed Area 2 SAP (50 CFR 648.85)'
                }
            },
            {
                field: 'locNmsExemptedFisheryHeader',
                type: 'choice',
                sectionBreak: true,
                sectionTitle: 'Exempted fishery attestation',
                sectionIntro: 'If participating in an exempted fishery, confirm season, LOA, gear, and declaration. “Yes” on a violation item means non-compliant.',
                question: 'Is the vessel participating in a Northeast multispecies exempted fishery this trip?',
                options: [
                    { value: 'no', label: 'No — not in an exempted fishery' },
                    { value: 'yes', label: 'Yes — exempted fishery trip' },
                    { value: 'unknown', label: 'Unknown / verify with captain' }
                ],
                notes: 'Exempted trips must meet area, season, gear, and LOA rules; declare out of fishery on VMS when required.'
            },
            {
                field: 'locNmsSmallMeshArea',
                question: 'Small Mesh Area 1 or 2 — fishing outside open season or without required mesh/possession limits?',
                notes: 'Area 1 open Jul 15–Nov 15; Area 2 open Jan 1–Jun 30. Silver/offshore hake limits vary by mesh size.',
                violation: {
                    ifTrue: 'VIOLATION: Non-compliant fishing in Small Mesh Exemption Area (50 CFR 648.80)'
                }
            },
            {
                field: 'locNmsRaisedFootropeWhiting',
                question: 'Raised Footrope Trawl whiting exemption (West or East area) — fishing outside season or without LOA?',
                notes: 'West Sep 1–Nov 20; East Sep 1–Dec 31. LOA required.',
                violation: {
                    ifTrue: 'VIOLATION: Non-compliant Raised Footrope whiting exempted fishery (50 CFR 648.80)'
                }
            },
            {
                field: 'locNmsGomGrateWhiting',
                question: 'GOM Grate Raised Footrope whiting exemption — fishing outside Jul 1–Nov 30 or without LOA?',
                violation: {
                    ifTrue: 'VIOLATION: Non-compliant GOM Grate whiting exempted fishery (50 CFR 648.80)'
                }
            },
            {
                field: 'locNmsCultivatorShoalWhiting',
                question: 'Cultivator Shoal whiting exemption — fishing outside Jun 15–Oct 31 or without LOA aboard?',
                violation: {
                    ifTrue: 'VIOLATION: Non-compliant Cultivator Shoal whiting exempted fishery (50 CFR 648.80)'
                }
            },
            {
                field: 'locNmsSneExemption',
                question: 'SNE Exemption Area — trawl fishing without meeting exempted fishery rules (small mesh, not on NMS DAS, retaining regulated NMS)?',
                notes: 'Silver/offshore and red hake limits vary by mesh; many incidental species allowed.',
                violation: {
                    ifTrue: 'VIOLATION: Non-compliant SNE Exemption Area fishing (50 CFR 648.80)'
                }
            },
            {
                field: 'locNmsLittleTunnyGillnet',
                question: 'SNE Little Tunny gillnet exemption — fishing outside Sep 1–Oct 31, without 5.5″ diamond mesh, or without LOA?',
                violation: {
                    ifTrue: 'VIOLATION: Non-compliant SNE Little Tunny gillnet exempted fishery (50 CFR 648.80)'
                }
            },
            {
                field: 'locNmsRedfishExemption',
                question: 'Universal Redfish Exemption — sector vessel fishing without LOA, or with mesh under 5.5″?',
                speciesOnly: ['redfish'],
                notes: 'Sector vessels only; cod sub-closure Feb 1–Mar 31 and Seasonal Closure II Sep 1–Dec 31 apply.',
                violation: {
                    ifTrue: 'VIOLATION: Non-compliant Universal Redfish Exemption fishery (50 CFR 648.80)'
                }
            }
        ]
    },
    monkfish648: {
        sectionTitle: 'Special location checklist — monkfish',
        intro: 'Answer based on charts, VMS, or vessel statement. “Yes” means the situation applies.',
        cfr: '50 CFR Part 648 — Monkfish',
        items: [
            {
                field: 'locMonkfishOffshoreDas',
                question: 'On a monkfish DAS — fishing outside Oct 1–Apr 30 offshore season or outside the Offshore Fishery Program Area without gear stowed during transit?',
                applicablePermits: ['monkfish-cat-f'],
                notes: 'Offshore program requires VMS; Cat F may use incidental limits when not on monkfish DAS.',
                violation: {
                    ifTrue: 'VIOLATION: Non-compliant offshore monkfish DAS fishing (50 CFR 648.92)'
                }
            },
            {
                field: 'locMonkfishCanyonClosure',
                question: 'On a monkfish DAS — is the vessel fishing (not transiting with gear stowed) in Oceanographer or Lydonia Canyon?',
                violation: {
                    ifTrue: 'VIOLATION: Monkfish DAS fishing prohibited in Oceanographer or Lydonia Canyon (50 CFR 648.92)'
                }
            },
            {
                field: 'locMonkfishGomGbGillnetExemption',
                question: 'GOM/GB Monkfish Gillnet Exemption Area — fishing outside Jul 1–Sep 14, without ≥10″ diamond gillnet, or possessing species other than monkfish and lobster?',
                notes: 'Lobster limit: 10% by weight or 200 lobsters, whichever is less.',
                violation: {
                    ifTrue: 'VIOLATION: Non-compliant GOM/GB Monkfish Gillnet Exemption Area fishing (50 CFR 648.92)'
                }
            },
            {
                field: 'locMonkfishSneTrawlExemption',
                question: 'SNE Monkfish/Skate Trawl Exemption Area — fishing without required mesh (10″ square/12″ diamond, 45 meshes), LOA, or allowed possession?',
                notes: 'Year-round; skate bait LOA or ≤10% skate by weight; verify incidental species list.',
                violation: {
                    ifTrue: 'VIOLATION: Non-compliant SNE Monkfish/Skate Trawl Exemption Area fishing (50 CFR 648.92)'
                }
            },
            {
                field: 'locMonkfishSneGillnetExemption',
                question: 'SNE Monkfish/Skate Gillnet Exemption Area — fishing without ≥10″ diamond gillnet or allowed possession/LOA?',
                notes: 'Year-round; monkfish, dogfish, incidental SNE species, and skate rules apply.',
                violation: {
                    ifTrue: 'VIOLATION: Non-compliant SNE Monkfish/Skate Gillnet Exemption Area fishing (50 CFR 648.92)'
                }
            },
            {
                field: 'locMonkfishMaExemption',
                question: 'Mid-Atlantic Exemption Area — retaining regulated Northeast multispecies, or gillnet fishing without monkfish DAS declaration?',
                notes: 'Trawl may use small mesh if not on NMS DAS and not retaining regulated multispecies. Gillnet: 5″ min, 50 stand-up nets, monkfish DAS required.',
                violation: {
                    ifTrue: 'VIOLATION: Non-compliant Mid-Atlantic Exemption Area fishing (50 CFR 648.92)'
                }
            },
            {
                field: 'locMonkfishNjSturgeonGillnet',
                question: 'New Jersey Atlantic Sturgeon Bycatch Reduction Area — using gillnet ≥10″ mesh without low-profile gillnets?',
                notes: 'Low-profile gillnets required year-round when mesh is 10″ or larger.',
                violation: {
                    ifTrue: 'VIOLATION: Non-compliant gillnet in NJ Atlantic Sturgeon Bycatch Reduction Area (50 CFR 648.92)'
                }
            },
            {
                field: 'locMonkfishNfmaNoLetter',
                question: 'Fishing in NFMA without NFMA exemption letter aboard and without VMS tracking for NFMA limits?',
                notes: 'Without letter or VMS, SFMA (more restrictive) quotas apply.',
                violation: {
                    ifTrue: 'VIOLATION: NFMA fishing without required exemption letter or VMS tracking (50 CFR 648.92)'
                }
            }
        ]
    }
};

/** speciesId → template key */
const LOCATION_CHECKLIST_BY_SPECIES = {
    'atlantic-sea-scallop': 'scallop648',
    'surf-clam': 'surfclam648',
    'ocean-quahog': 'surfclam648',
    'atlantic-mackerel': 'smb648',
    'longfin-squid': 'smb648',
    'shortfin-squid': 'smb648',
    'butterfish': 'smb648',
    'atlantic-chub-mackerel': 'smb648',
    'atlantic-herring': 'herring648',
    'atlantic-cod': 'groundfish648',
    'haddock': 'groundfish648',
    'yellowtail-flounder': 'groundfish648',
    'winter-flounder': 'groundfish648',
    'windowpane-flounder': 'groundfish648',
    'atlantic-wolffish': 'groundfish648',
    'ocean-pout': 'groundfish648',
    'pollock': 'groundfish648',
    'redfish': 'groundfish648',
    'white-hake': 'groundfish648',
    'american-plaice': 'groundfish648',
    'witch-flounder': 'groundfish648',
    'atlantic-halibut': 'groundfish648',
    'monkfish': 'monkfish648'
};

function locationChecklistApplies(questionData, permitType, assessmentDate, vesselCategory) {
    if (questionData.applicablePermits && permitType) {
        if (!questionData.applicablePermits.includes(permitType)) return false;
    }
    if (questionData.applicableVesselCategories && vesselCategory) {
        if (!questionData.applicableVesselCategories.includes(vesselCategory)) return false;
    }
    if (questionData.dateFilter?.months && Array.isArray(questionData.dateFilter.months)) {
        const d = assessmentDate instanceof Date ? assessmentDate : new Date(assessmentDate || Date.now());
        const month = d.getMonth() + 1;
        if (!questionData.dateFilter.months.includes(month)) return false;
    }
    return true;
}

function questionAppliesToAssessment(questionData, ctx) {
    const permitType = ctx.permitType || ctx.speciesData?.permitType || ctx.speciesData?.['permit-type'];
    const vesselCategory = ctx.vesselCategory
        || ctx.speciesData?.vesselCategory
        || ctx.speciesData?.['vessel-category']
        || ctx.speciesData?.vesselClassification;
    const assessmentDate = ctx.speciesData?.dateOfCatch || ctx.speciesData?.dateOfLanding
        || (typeof parseAssessmentDate === 'function' ? parseAssessmentDate(ctx.speciesData) : null);
    return locationChecklistApplies(questionData, permitType, assessmentDate, vesselCategory);
}

function mergeLocationChecklistsIntoSpeciesData() {
    if (typeof SPECIES_DATA === 'undefined') return;

    Object.entries(LOCATION_CHECKLIST_BY_SPECIES).forEach(([speciesId, templateKey]) => {
        const template = LOCATION_CHECKLIST_TEMPLATES[templateKey];
        const species = SPECIES_DATA[speciesId];
        if (!template || !species?.regulations) return;

        if (!species.regulations.assessmentQuestions) {
            species.regulations.assessmentQuestions = {};
        }
        const questions = species.regulations.assessmentQuestions;

        template.items.forEach((item, index) => {
            if (item.speciesOnly && !item.speciesOnly.includes(speciesId)) return;

            const key = item.key || `location_${item.field}`;
            if (questions[key] && !item.overwrite) return;

            questions[key] = {
                question: item.question,
                field: item.field,
                type: item.type || 'boolean',
                required: item.required === true,
                section: item.section || 'location-checklist',
                sectionTitle: index === 0
                    ? template.sectionTitle
                    : (item.sectionBreak ? item.sectionTitle : undefined),
                sectionIntro: index === 0
                    ? template.intro
                    : (item.sectionBreak ? item.sectionIntro : undefined),
                sectionBreak: !!item.sectionBreak,
                options: item.options,
                applicablePermits: item.applicablePermits,
                applicableVesselCategories: item.applicableVesselCategories,
                dateFilter: item.dateFilter,
                notes: item.notes,
                violation: item.violation,
                cfr: item.cfr || template.cfr
            };
        });
    });
}

function checkLocationChecklistViolations(speciesId, speciesData, speciesName) {
    const messages = [];
    const templateKey = LOCATION_CHECKLIST_BY_SPECIES[speciesId];
    if (!templateKey || !speciesData) return messages;

    const template = LOCATION_CHECKLIST_TEMPLATES[templateKey];
    const permitType = speciesData.permitType || speciesData['permit-type'];
    const vesselCategory = speciesData.vesselCategory || speciesData['vessel-category']
        || speciesData.vesselClassification;
    const assessmentDate = speciesData.dateOfCatch || speciesData.dateOfLanding
        || (typeof parseAssessmentDate === 'function' ? parseAssessmentDate(speciesData) : null);

    template.items.forEach((item) => {
        if (item.speciesOnly && !item.speciesOnly.includes(speciesId)) return;

        const raw = speciesData[item.field];
        if (raw === undefined || raw === null || raw === '') return;

        const questionData = {
            applicablePermits: item.applicablePermits,
            applicableVesselCategories: item.applicableVesselCategories,
            dateFilter: item.dateFilter,
            violation: item.violation
        };
        if (!locationChecklistApplies(questionData, permitType, assessmentDate, vesselCategory)) return;

        const answer = raw === true || raw === 'true' || raw === 'yes' || raw === 'Yes';
        if (answer && item.violation?.ifTrue) {
            messages.push(item.violation.ifTrue);
        }
    });

    return messages;
}

if (typeof SPECIES_DATA !== 'undefined') {
    mergeLocationChecklistsIntoSpeciesData();
}

if (typeof window !== 'undefined') {
    window.LOCATION_CHECKLIST_TEMPLATES = LOCATION_CHECKLIST_TEMPLATES;
    window.LOCATION_CHECKLIST_BY_SPECIES = LOCATION_CHECKLIST_BY_SPECIES;
    window.mergeLocationChecklistsIntoSpeciesData = mergeLocationChecklistsIntoSpeciesData;
    window.checkLocationChecklistViolations = checkLocationChecklistViolations;
    window.locationChecklistApplies = locationChecklistApplies;
    window.questionAppliesToAssessment = questionAppliesToAssessment;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        LOCATION_CHECKLIST_TEMPLATES,
        LOCATION_CHECKLIST_BY_SPECIES,
        mergeLocationChecklistsIntoSpeciesData,
        checkLocationChecklistViolations,
        locationChecklistApplies
    };
}
