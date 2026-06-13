// 648 Northeast species
// Auto-split from species-data.js — edit here for routine updates.

// Additional Northeast Fisheries Species
// Atlantic Salmon
SPECIES_DATA['atlantic-salmon'] = {
    name: 'Atlantic Salmon',
    commonName: 'Salmon',
    image: null,
    imagePath: 'images/fish/Atlantic_Salmon.webp',
    color: '#ff6b6b',
    prohibited: true,
    regulations: {
        dataSources: [
            {
                title: 'Atlantic Salmon — 50 CFR 648 Subpart C',
                url: 'https://www.ecfr.gov/current/title-50/chapter-VI/part-648/subpart-C',
                effective: '2026-05-21'
            }
        ],
        permits: {
            'commercial': {
                name: 'Atlantic Salmon Commercial Permit',
                required: true,
                cfr: '50 CFR 648.4',
                notes: 'Check for specific permit requirements'
            },
            'recreational': {
                name: 'Recreational (No Federal Permit Required)',
                required: false,
                cfr: null
            }
        },
        possession: {
            'commercial': {
                name: 'Commercial / EEZ',
                limit: { count: 0 },
                unit: 'fish',
                prohibited: true,
                cfr: '50 CFR 648.40',
                notes: 'Incidental catch must be released for maximum probability of survival.'
            },
            'recreational': {
                name: 'Recreational / EEZ',
                limit: { count: 0 },
                unit: 'fish',
                prohibited: true,
                cfr: '50 CFR 648.40',
                notes: 'Possession in federal waters prohibited except fish being sorted on deck. Verify state-waters harvest if applicable.'
            }
        },
        size: {
            minimum: null,
            unit: 'n/a',
            cfr: '50 CFR 648.40',
            notes: 'No retention in EEZ — size not applicable for possessed salmon.'
        },
        seasons: {
            federal: {
                open: 'EEZ possession prohibited',
                cfr: '50 CFR 648.40',
                notes: 'Directed or retained Atlantic salmon in the EEZ is prohibited.'
            }
        },
        assessmentQuestions: {
            permitType: {
                question: 'What type of permit does this vessel have?',
                field: 'permitType',
                required: true,
                options: [
                    { value: 'commercial', label: 'Atlantic Salmon Commercial Permit', description: 'Commercial fishing permit' },
                    { value: 'recreational', label: 'Recreational (No Federal Permit Required)', description: 'Recreational fishing' }
                ],
                cfr: '50 CFR 648.4'
            },
            possessionAmount: {
                question: 'How many Atlantic salmon are on board?',
                field: 'numberOfFish',
                required: true,
                type: 'number',
                unit: 'fish',
                dependsOn: ['permitType'],
                notes: 'Any salmon on board in the EEZ is a presumptive violation unless rebutted (state waters, aquaculture, etc.).',
                cfr: '50 CFR 648.40',
                violation: {
                    ifProhibited: 'VIOLATION: Atlantic salmon possession prohibited in EEZ (50 CFR 648.40)'
                }
            },
            possessionLimitCheck: {
                question: 'Retention check (auto)',
                field: 'exceedsLimit',
                type: 'auto',
                dependsOn: ['permitType', 'numberOfFish'],
                autoCheck: true,
                limits: {
                    commercial: { count: 0, prohibited: true },
                    recreational: { count: 0, prohibited: true }
                },
                violation: {
                    ifProhibited: 'VIOLATION: Atlantic salmon possession prohibited in EEZ (50 CFR 648.40)'
                },
                cfr: '50 CFR 648.40'
            },
            stateRegulations: {
                question: 'Have state regulations been checked?',
                field: 'stateRegulationsChecked',
                required: true,
                type: 'boolean',
                notes: 'EEZ possession prohibited (50 CFR 648.40). If fish are from state waters or aquaculture, document source to rebut presumption.',
                cfr: '50 CFR 648.4'
            },
            reportingStatus: {
                question: 'Has the catch been reported?',
                field: 'reported',
                required: true,
                type: 'boolean',
                dependsOn: ['permitType'],
                applicablePermits: ['commercial'],
                notes: 'Commercial catch must be reported as required',
                violation: {
                    ifFalse: 'VIOLATION: Commercial catch reporting required (50 CFR 648.7)'
                },
                cfr: '50 CFR 648.7'
            }
        }
    }
};

// Surf Clam
SPECIES_DATA['surf-clam'] = {
    name: 'Surf Clam',
    commonName: 'Surf Clam',
    image: null,
    imagePath: 'images/fish/Surf_Clam.webp',
    color: '#ffd93d',
    regulations: {
        permits: {
            'commercial': {
                name: 'Surf Clam/Ocean Quahog Commercial Permit',
                required: true,
                cfr: '50 CFR 648.4',
                notes: 'Includes surf clam, ocean quahog, and Maine mahogany quahog (north of 43°50′ N). VMS and operator permit required.'
            },
            'commercial-maine-mahogany': {
                name: 'Maine Mahogany Quahog Commercial',
                required: true,
                cfr: '50 CFR 648.4',
                notes: 'Harvest north of 43°50′ N only.'
            },
            'recreational': {
                name: 'Recreational Surf Clam/Ocean Quahog',
                required: false,
                cfr: '50 CFR 648 Subpart E'
            }
        },
        possession: {
            'commercial': {
                name: 'Commercial',
                limit: null,
                unit: 'bushels per trip',
                cfr: '50 CFR 648.70',
                notes: 'Unlimited per trip when fishery open (subject to quota closure).'
            },
            'commercial-maine-mahogany': {
                name: 'Maine Mahogany Quahog Commercial',
                limit: null,
                unit: 'bushels per trip',
                cfr: '50 CFR 648.70',
                notes: 'Unlimited per trip when fishery open; north of 43°50′ N.'
            },
            'recreational': {
                name: 'Recreational',
                limit: { count: 2, unit: 'bushels' },
                cfr: '50 CFR 648 Subpart E',
                notes: '2 bushels federally; closed areas still apply.'
            }
        },
        size: {
            minimum: null,
            unit: null,
            cfr: '50 CFR 648.70',
            notes: 'No federal minimum size for surf clam.'
        },
        gear: {
            'dredge': {
                name: 'Hydraulic Dredge',
                cfr: '50 CFR 648.70',
                notes: 'Hydraulic dredge gear authorized'
            }
        },
        seasons: {
            federal: {
                open: 'Year-round',
                cfr: '50 CFR 648.70',
                notes: 'Subject to quota closures'
            }
        },
        assessmentQuestions: {
            permitType: {
                question: 'What type of permit does this vessel have?',
                field: 'permitType',
                required: true,
                options: [
                    { value: 'commercial', label: 'Surf Clam/Ocean Quahog Commercial Permit', description: 'VMS and operator permit required' },
                    { value: 'commercial-maine-mahogany', label: 'Maine Mahogany Quahog', description: 'North of 43°50′ N' },
                    { value: 'recreational', label: 'Recreational', description: '2 bushels; no VMS or operator permit' }
                ],
                cfr: '50 CFR 648.4'
            },
            possessionAmount: {
                question: 'What is the possession amount on board?',
                field: 'possessionAmount',
                required: true,
                type: 'number',
                unit: 'bushels',
                dependsOn: ['permitType'],
                notes: 'Record total amount in bushels',
                cfr: '50 CFR 648.70'
            },
            possessionLimitCheck: {
                question: 'Does the possession amount exceed the permit limit or quota?',
                field: 'exceedsLimit',
                required: false,
                type: 'auto',
                dependsOn: ['permitType', 'possessionAmount'],
                autoCheck: true,
                limits: {
                    'commercial': null,
                    'commercial-maine-mahogany': null,
                    'recreational': { count: 2, unit: 'bushels' }
                },
                notes: 'Commercial: unlimited per trip when fishery open. Recreational: 2 bushels (closed areas still apply).',
                violation: {
                    ifExceeds: 'VIOLATION: Possession amount exceeds permit limit or quota (50 CFR 648.70)'
                },
                cfr: '50 CFR 648.70'
            },
            sizeCompliance: {
                question: 'Is there a size compliance issue?',
                field: 'shellLength',
                required: false,
                type: 'boolean',
                notes: 'No federal minimum size for surf clam.',
                cfr: '50 CFR 648.70'
            },
            gearType: {
                question: 'What gear is being used?',
                field: 'gearType',
                required: true,
                type: 'choice',
                dependsOn: ['permitType'],
                options: [
                    { value: 'dredge', label: 'Hydraulic Dredge', notes: 'Hydraulic dredge gear authorized' }
                ],
                cfr: '50 CFR 648.70'
            },
            quotaStatus: {
                question: 'Is the fishery open or closed due to quota?',
                field: 'quotaStatus',
                required: false,
                type: 'auto',
                dependsOn: ['permitType'],
                applicablePermits: ['commercial', 'commercial-maine-mahogany'],
                autoCheck: true,
                notes: 'Check current quota status - fishery may close when quota is reached',
                cfr: '50 CFR 648.70'
            },
            reportingStatus: {
                question: 'Has the catch been reported?',
                field: 'reported',
                required: true,
                type: 'boolean',
                dependsOn: ['permitType'],
                applicablePermits: ['commercial'],
                notes: 'Commercial catch must be reported as required',
                violation: {
                    ifFalse: 'VIOLATION: Commercial catch reporting required (50 CFR 648.7)'
                },
                cfr: '50 CFR 648.7'
            }
        }
    }
};

// Ocean Quahog
SPECIES_DATA['ocean-quahog'] = {
    name: 'Ocean Quahog',
    commonName: 'Quahog',
    image: null,
    imagePath: 'images/fish/Ocean_Quahog.webp',
    color: '#ffd93d',
    regulations: {
        permits: {
            'commercial': {
                name: 'Surf Clam/Ocean Quahog Commercial Permit',
                required: true,
                cfr: '50 CFR 648.4',
                notes: 'Includes surf clam, ocean quahog, and Maine mahogany quahog (north of 43°50′ N). VMS and operator permit required.'
            },
            'commercial-maine-mahogany': {
                name: 'Maine Mahogany Quahog Commercial',
                required: true,
                cfr: '50 CFR 648.4',
                notes: 'Harvest north of 43°50′ N only.'
            },
            'recreational': {
                name: 'Recreational Surf Clam/Ocean Quahog',
                required: false,
                cfr: '50 CFR 648 Subpart E'
            }
        },
        possession: {
            'commercial': {
                name: 'Commercial',
                limit: null,
                unit: 'bushels per trip',
                cfr: '50 CFR 648.70',
                notes: 'Unlimited per trip when fishery open (subject to quota closure).'
            },
            'commercial-maine-mahogany': {
                name: 'Maine Mahogany Quahog Commercial',
                limit: null,
                unit: 'bushels per trip',
                cfr: '50 CFR 648.70',
                notes: 'Unlimited per trip when fishery open; north of 43°50′ N.'
            },
            'recreational': {
                name: 'Recreational',
                limit: { count: 2, unit: 'bushels' },
                cfr: '50 CFR 648 Subpart E',
                notes: '2 bushels federally; closed areas still apply.'
            }
        },
        size: {
            minimum: null,
            unit: null,
            cfr: '50 CFR 648.70',
            notes: 'No federal minimum size for ocean quahog.'
        },
        gear: {
            'dredge': {
                name: 'Hydraulic Dredge',
                cfr: '50 CFR 648.70',
                notes: 'Hydraulic dredge gear authorized'
            }
        },
        seasons: {
            federal: {
                open: 'Year-round',
                cfr: '50 CFR 648.70',
                notes: 'Subject to quota closures'
            }
        },
        assessmentQuestions: {
            permitType: {
                question: 'What type of permit does this vessel have?',
                field: 'permitType',
                required: true,
                options: [
                    { value: 'commercial', label: 'Surf Clam/Ocean Quahog Commercial Permit', description: 'VMS and operator permit required' },
                    { value: 'commercial-maine-mahogany', label: 'Maine Mahogany Quahog', description: 'North of 43°50′ N' },
                    { value: 'recreational', label: 'Recreational', description: '2 bushels; no VMS or operator permit' }
                ],
                cfr: '50 CFR 648.4'
            },
            possessionAmount: {
                question: 'What is the possession amount on board?',
                field: 'possessionAmount',
                required: true,
                type: 'number',
                unit: 'bushels',
                dependsOn: ['permitType'],
                notes: 'Record total amount in bushels',
                cfr: '50 CFR 648.70'
            },
            possessionLimitCheck: {
                question: 'Does the possession amount exceed the permit limit or quota?',
                field: 'exceedsLimit',
                required: false,
                type: 'auto',
                dependsOn: ['permitType', 'possessionAmount'],
                autoCheck: true,
                limits: {
                    'commercial': null,
                    'commercial-maine-mahogany': null,
                    'recreational': { count: 2, unit: 'bushels' }
                },
                notes: 'Commercial: unlimited per trip when fishery open. Recreational: 2 bushels (closed areas still apply).',
                violation: {
                    ifExceeds: 'VIOLATION: Possession amount exceeds permit limit or quota (50 CFR 648.70)'
                },
                cfr: '50 CFR 648.70'
            },
            sizeCompliance: {
                question: 'Is there a size compliance issue?',
                field: 'shellWidth',
                required: false,
                type: 'boolean',
                notes: 'No federal minimum size for ocean quahog.',
                cfr: '50 CFR 648.70'
            },
            gearType: {
                question: 'What gear is being used?',
                field: 'gearType',
                required: true,
                type: 'choice',
                dependsOn: ['permitType'],
                options: [
                    { value: 'dredge', label: 'Hydraulic Dredge', notes: 'Hydraulic dredge gear authorized' }
                ],
                cfr: '50 CFR 648.70'
            },
            quotaStatus: {
                question: 'Is the fishery open or closed due to quota?',
                field: 'quotaStatus',
                required: false,
                type: 'auto',
                dependsOn: ['permitType'],
                applicablePermits: ['commercial', 'commercial-maine-mahogany'],
                autoCheck: true,
                notes: 'Check current quota status - fishery may close when quota is reached',
                cfr: '50 CFR 648.70'
            },
            reportingStatus: {
                question: 'Has the catch been reported?',
                field: 'reported',
                required: true,
                type: 'boolean',
                dependsOn: ['permitType'],
                applicablePermits: ['commercial'],
                notes: 'Commercial catch must be reported as required',
                violation: {
                    ifFalse: 'VIOLATION: Commercial catch reporting required (50 CFR 648.7)'
                },
                cfr: '50 CFR 648.7'
            }
        }
    }
};

// Atlantic Herring
SPECIES_DATA['atlantic-herring'] = {
    name: 'Atlantic Herring',
    commonName: 'Herring',
    image: null,
    imagePath: 'images/fish/Atlantic_Herring.webp',
    color: '#95e1d3',
    regulations: {
        permits: {
            'commercial': {
                name: 'Atlantic Herring Commercial Permit',
                required: true,
                cfr: '50 CFR 648.4'
            },
            'recreational': {
                name: 'Recreational (No Federal Permit Required)',
                required: false,
                cfr: null
            }
        },
        possession: {
            'commercial': {
                name: 'Commercial',
                limit: null,
                unit: 'lbs',
                cfr: '50 CFR 648.200',
                notes: 'Area 1A/1B: 2,000 lb per trip/day when 92% sub-ACL projected (verify NOAA bulletin). Areas 2–3: phase limits per 50 CFR 648.201.'
            },
            'recreational': {
                name: 'Recreational',
                limit: null,
                unit: 'lbs',
                cfr: null,
                notes: 'No federal recreational herring limit — verify state measures.'
            }
        },
        size: {
            minimum: null,
            unit: 'n/a',
            cfr: '50 CFR 648.200',
            notes: 'No federal minimum size for Atlantic herring.'
        },
        gear: {
            'purse-seine': {
                name: 'Purse Seine',
                cfr: '50 CFR 648.200',
                notes: 'Purse seine gear authorized'
            },
            'otter-trawl': {
                name: 'Otter Trawl',
                cfr: '50 CFR 648.200',
                notes: 'Otter trawl gear authorized'
            }
        },
        seasons: {
            federal: {
                open: 'Year-round',
                cfr: '50 CFR 648.200',
                notes: 'Subject to quota closures'
            }
        },
        assessmentQuestions: {
            permitType: {
                question: 'What type of permit does this vessel have?',
                field: 'permitType',
                required: true,
                options: [
                    { value: 'commercial', label: 'Atlantic Herring Commercial Permit', description: 'Commercial fishing permit' },
                    { value: 'recreational', label: 'Recreational (No Federal Permit Required)', description: 'Recreational fishing' }
                ],
                cfr: '50 CFR 648.4'
            },
            possessionAmount: {
                question: 'What is the possession amount on board?',
                field: 'possessionAmount',
                required: true,
                type: 'number',
                unit: 'lbs',
                dependsOn: ['permitType'],
                notes: 'Record total weight in pounds',
                cfr: '50 CFR 648.200'
            },
            possessionLimitCheck: {
                question: 'Does the possession amount exceed the permit limit or quota?',
                field: 'exceedsLimit',
                required: false,
                type: 'auto',
                dependsOn: ['permitType', 'possessionAmount'],
                autoCheck: true,
                limits: {
                    'commercial': null,
                    'recreational': null
                },
                notes: 'Commercial: 2,000 lb/trip/day in Areas 1A/1B when in-season adjustment active. Recreational: state measures.',
                violation: {
                    ifExceeds: 'VIOLATION: Possession amount exceeds permit limit or quota (50 CFR 648.200)'
                },
                cfr: '50 CFR 648.200'
            },
            fishingArea: {
                question: 'What area was the vessel fishing in?',
                field: 'fishingArea',
                required: true,
                type: 'choice',
                dependsOn: ['permitType'],
                applicablePermits: ['commercial'],
                options: [
                    { value: 'area-1a', label: 'Area 1A', notes: '2,000 lb/trip/day when 92% sub-ACL adjustment active (2026)' },
                    { value: 'area-1b', label: 'Area 1B', notes: '2,000 lb/trip/day effective Jan 9, 2026 per NOAA bulletin' },
                    { value: 'area-2', label: 'Area 2', notes: 'Area 2 specific limits apply' },
                    { value: 'area-3', label: 'Area 3', notes: 'Area 3 specific limits apply' },
                    { value: 'closed-area', label: 'Closed Area', violation: true, notes: 'VIOLATION: Fishing prohibited in closed areas' }
                ],
                violation: {
                    ifValue: 'closed-area',
                    message: 'VIOLATION: Fishing prohibited in closed areas (50 CFR 648.200)'
                },
                cfr: '50 CFR 648.200'
            },
            gearType: {
                question: 'What gear is being used?',
                field: 'gearType',
                required: true,
                type: 'choice',
                dependsOn: ['permitType'],
                options: [
                    { value: 'purse-seine', label: 'Purse Seine', notes: 'Purse seine gear authorized' },
                    { value: 'otter-trawl', label: 'Otter Trawl', notes: 'Otter trawl gear authorized' },
                    { value: 'rod-reel', label: 'Rod and Reel', notes: 'Recreational gear' }
                ],
                cfr: '50 CFR 648.200'
            },
            quotaStatus: {
                question: 'Is the fishery open or closed due to quota?',
                field: 'quotaStatus',
                required: false,
                type: 'auto',
                dependsOn: ['permitType'],
                applicablePermits: ['commercial'],
                autoCheck: true,
                notes: 'Auto: verify NOAA/ASMFC bulletin — fishery closes at quota.',
                quotaClosedViolation: 'VIOLATION: Atlantic herring commercial fishery closed due to quota (50 CFR 648.200)',
                cfr: '50 CFR 648.200'
            },
            reportingStatus: {
                question: 'Has the catch been reported?',
                field: 'reported',
                required: true,
                type: 'boolean',
                dependsOn: ['permitType'],
                applicablePermits: ['commercial'],
                notes: 'Commercial catch must be reported as required',
                violation: {
                    ifFalse: 'VIOLATION: Commercial catch reporting required (50 CFR 648.7)'
                },
                cfr: '50 CFR 648.7'
            }
        }
    }
};

// Skate (General - Complex Skate)
SPECIES_DATA['skate'] = {
    name: 'Skate',
    commonName: 'Skate',
    image: null,
    imagePath: 'images/fish/Skate.webp',
    color: '#a8dadc',
    regulations: {
        permits: {
            'commercial': {
                name: 'Skate Commercial Permit',
                required: true,
                cfr: '50 CFR 648.4'
            },
            'recreational': {
                name: 'Recreational (No Federal Permit Required)',
                required: false,
                cfr: null
            }
        },
        possession: {
            'commercial': {
                name: 'Commercial',
                limit: null,
                unit: 'lbs',
                cfr: '50 CFR 648.320',
                notes: 'Skate wing DAS limits: 4,000 lb (May 1–Aug 31) or 6,000 lb (Sep 1–Apr 30); incidental 500 lb when reduced (50 CFR 648.322).'
            },
            'recreational': {
                name: 'Recreational',
                limit: null,
                unit: 'fish',
                cfr: null,
                notes: 'No federal recreational skate limit — verify state measures.'
            }
        },
        size: {
            minimum: null,
            unit: 'n/a',
            cfr: '50 CFR 648.320',
            notes: 'No federal minimum size under skate wing fishery; species-specific rules may apply.'
        },
        seasons: {
            federal: {
                open: 'Year-round',
                cfr: '50 CFR 648.320',
                notes: 'Subject to quota closures'
            }
        },
        assessmentQuestions: {
            permitType: {
                question: 'What type of permit does this vessel have?',
                field: 'permitType',
                required: true,
                options: [
                    { value: 'commercial', label: 'Skate Commercial Permit', description: 'Commercial fishing permit' },
                    { value: 'recreational', label: 'Recreational (No Federal Permit Required)', description: 'Recreational fishing' }
                ],
                cfr: '50 CFR 648.4'
            },
            skateSpecies: {
                question: 'What species of skate is on board?',
                field: 'skateSpecies',
                required: true,
                type: 'choice',
                notes: 'Skate retention limits vary by species. Check species-specific regulations.',
                cfr: '50 CFR 648.320'
            },
            possessionAmount: {
                question: 'What is the possession amount on board?',
                field: 'possessionAmount',
                required: true,
                type: 'number',
                unit: 'lbs',
                dependsOn: ['permitType'],
                notes: 'Record total weight in pounds',
                cfr: '50 CFR 648.320'
            },
            possessionLimitCheck: {
                question: 'Does the possession amount exceed the permit limit or quota?',
                field: 'exceedsLimit',
                required: false,
                type: 'auto',
                dependsOn: ['permitType', 'possessionAmount', 'skateSpecies'],
                autoCheck: true,
                limits: {
                    'commercial': null, // Subject to quota and trip limits - varies by skate species
                    'recreational': null // Check state regulations
                },
                notes: 'Commercial limits subject to quota and trip limits - check current regulations and species-specific limits. Recreational: Check state regulations.',
                violation: {
                    ifExceeds: 'VIOLATION: Possession amount exceeds permit limit or quota (50 CFR 648.320)'
                },
                cfr: '50 CFR 648.320'
            },
            sizeCompliance: {
                question: 'What is the size of the skate?',
                field: 'skateSize',
                required: false,
                type: 'number',
                unit: 'inches',
                dependsOn: ['skateSpecies'],
                notes: 'Size requirements vary by skate species. Check species-specific size requirements.',
                cfr: '50 CFR 648.320'
            },
            quotaStatus: {
                question: 'Is the fishery open or closed due to quota?',
                field: 'quotaStatus',
                required: false,
                type: 'auto',
                dependsOn: ['permitType'],
                applicablePermits: ['commercial'],
                autoCheck: true,
                notes: 'Check current quota status - fishery may close when quota is reached',
                cfr: '50 CFR 648.320'
            },
            reportingStatus: {
                question: 'Has the catch been reported?',
                field: 'reported',
                required: true,
                type: 'boolean',
                dependsOn: ['permitType'],
                applicablePermits: ['commercial'],
                notes: 'Commercial catch must be reported as required',
                violation: {
                    ifFalse: 'VIOLATION: Commercial catch reporting required (50 CFR 648.7)'
                },
                cfr: '50 CFR 648.7'
            }
        }
    }
};

// Silver Hake
SPECIES_DATA['silver-hake'] = {
    name: 'Silver Hake',
    commonName: 'Whiting',
    image: null,
    imagePath: 'images/fish/Silver_Hake.webp',
    color: '#c7d2fe',
    regulations: {
        permits: {
            'commercial': {
                name: 'Northeast Multispecies Commercial Permit',
                required: true,
                cfr: '50 CFR 648.4'
            },
            'recreational': {
                name: 'Recreational (No Federal Permit Required)',
                required: false,
                cfr: null
            }
        },
        possession: {
            'commercial': {
                name: 'Commercial',
                limit: null,
                unit: 'lbs',
                cfr: '50 CFR 648.86',
                notes: 'Combined silver/offshore hake: 15,000 lb (<3" mesh) or 30,000/40,000 lb (≥3" mesh by exemption area) per 50 CFR 648.86(d).'
            },
            'recreational': {
                name: 'Recreational',
                limit: null,
                unit: 'fish',
                cfr: null,
                notes: 'No federal recreational limit — verify state measures.'
            }
        },
        size: {
            minimum: null,
            unit: 'n/a',
            cfr: '50 CFR 648.86',
            notes: 'No federal minimum size for silver hake (whiting).'
        },
        assessmentQuestions: {
            permitType: {
                question: 'What type of permit does this vessel have?',
                field: 'permitType',
                required: true,
                options: [
                    { value: 'commercial', label: 'Northeast Multispecies Commercial Permit', description: 'Commercial fishing permit' },
                    { value: 'recreational', label: 'Recreational (No Federal Permit Required)', description: 'Recreational fishing' }
                ],
                cfr: '50 CFR 648.4'
            },
            meshSize: {
                question: 'What is the mesh size of nets on board?',
                field: 'meshSize',
                required: false,
                type: 'choice',
                dependsOn: ['permitType'],
                applicablePermits: ['commercial'],
                options: [
                    { value: 'mesh-under-3', label: 'Less than 3 inches', notes: '15,000 lb combined silver/offshore hake limit' },
                    { value: 'mesh-3-plus-gom-gb', label: '3 inches or greater (GOM/GB exemption area)', notes: '30,000 lb limit' },
                    { value: 'mesh-3-plus-sne-ma', label: '3 inches or greater (SNE/MA exemption area)', notes: '40,000 lb limit' }
                ],
                cfr: '50 CFR 648.86'
            },
            exemptionArea: {
                question: 'Which exemption area applies (if mesh ≥3")?',
                field: 'exemptionArea',
                required: false,
                type: 'choice',
                dependsOn: ['meshSize'],
                options: [
                    { value: 'gom-gb', label: 'GOM or GB Exemption Area' },
                    { value: 'sne-ma', label: 'SNE or MA Exemption Area' }
                ],
                cfr: '50 CFR 648.80'
            },
            possessionAmount: {
                question: 'What is the possession amount on board (lbs)?',
                field: 'possessionAmount',
                required: true,
                type: 'number',
                unit: 'lbs',
                dependsOn: ['permitType'],
                notes: 'Combined silver hake and offshore hake weight in pounds',
                cfr: '50 CFR 648.86'
            },
            possessionLimitCheck: {
                question: 'Does the possession amount exceed the permit limit or quota?',
                field: 'exceedsLimit',
                required: false,
                type: 'auto',
                dependsOn: ['permitType', 'possessionAmount', 'meshSize', 'exemptionArea'],
                autoCheck: true,
                limits: {
                    'commercial': null,
                    'recreational': null
                },
                notes: 'Commercial trip limits per mesh size and exemption area (50 CFR 648.86(d)).',
                violation: {
                    ifExceeds: 'VIOLATION: Possession amount exceeds permit limit or quota (50 CFR 648.86)'
                },
                cfr: '50 CFR 648.86'
            },
            quotaStatus: {
                question: 'Is the fishery open or closed due to quota?',
                field: 'quotaStatus',
                required: false,
                type: 'auto',
                dependsOn: ['permitType'],
                applicablePermits: ['commercial'],
                autoCheck: true,
                notes: 'In-season reduction may lower limits to 2,000 lb combined — verify NOAA bulletin.',
                cfr: '50 CFR 648.86'
            },
            reportingStatus: {
                question: 'Has the catch been reported?',
                field: 'reported',
                required: true,
                type: 'boolean',
                dependsOn: ['permitType'],
                applicablePermits: ['commercial'],
                notes: 'Commercial catch must be reported as required',
                violation: {
                    ifFalse: 'VIOLATION: Commercial catch reporting required (50 CFR 648.7)'
                },
                cfr: '50 CFR 648.7'
            }
        }
    }
};

// Longhorn Sculpin
SPECIES_DATA['longhorn-sculpin'] = {
    name: 'Longhorn Sculpin',
    commonName: 'Sculpin',
    image: null,
    imagePath: 'images/fish/Longhorn_Sculpin.webp',
    color: '#b8b8ff',
    regulations: {
        permits: {
            'commercial': {
                name: 'Northeast Multispecies Commercial Permit',
                required: true,
                cfr: '50 CFR 648.4'
            },
            'recreational': {
                name: 'Recreational (No Federal Permit Required)',
                required: false,
                cfr: null
            }
        },
        possession: {
            'commercial': {
                name: 'Commercial',
                limit: null,
                unit: 'lbs',
                cfr: '50 CFR 648.86',
                notes: 'No federal common-pool trip limit listed for longhorn sculpin — verify sector/state rules.'
            },
            'recreational': {
                name: 'Recreational',
                limit: null,
                unit: 'fish',
                cfr: null,
                notes: 'No federal recreational limit — verify state measures.'
            }
        },
        size: {
            minimum: null,
            unit: 'n/a',
            cfr: null,
            notes: 'No federal minimum size for longhorn sculpin.'
        },
        assessmentQuestions: {
            permitType: {
                question: 'What type of permit does this vessel have?',
                field: 'permitType',
                required: true,
                options: [
                    { value: 'commercial', label: 'Northeast Multispecies Commercial Permit', description: 'Commercial fishing permit' },
                    { value: 'recreational', label: 'Recreational (No Federal Permit Required)', description: 'Recreational fishing' }
                ],
                cfr: '50 CFR 648.4'
            },
            possessionAmount: {
                question: 'What is the possession amount on board?',
                field: 'possessionAmount',
                required: true,
                type: 'number',
                unit: 'lbs',
                dependsOn: ['permitType'],
                notes: 'Record total weight in pounds',
                cfr: '50 CFR 648.86'
            },
            stateRegulations: {
                question: 'Have state regulations been checked?',
                field: 'stateRegulationsChecked',
                required: true,
                type: 'boolean',
                notes: 'No federal trip or size limit — verify state and sector rules.',
                cfr: null
            },
            reportingStatus: {
                question: 'Has the catch been reported?',
                field: 'reported',
                required: true,
                type: 'boolean',
                dependsOn: ['permitType'],
                applicablePermits: ['commercial'],
                notes: 'Commercial catch must be reported as required',
                violation: {
                    ifFalse: 'VIOLATION: Commercial catch reporting required (50 CFR 648.7)'
                },
                cfr: '50 CFR 648.7'
            }
        }
    }
};

// Atlantic Deep Sea Red Crab
SPECIES_DATA['atlantic-deep-sea-red-crab'] = {
    name: 'Atlantic Deep Sea Red Crab',
    commonName: 'Red Crab',
    image: null,
    imagePath: 'images/fish/Atlantic_Deep_Sea_Red_Crab.webp',
    color: '#ff6b6b',
    regulations: {
        permits: {
            'commercial': {
                name: 'Deep Sea Red Crab Commercial Permit',
                required: true,
                cfr: '50 CFR 648.4'
            },
            'recreational': {
                name: 'Recreational (No Federal Permit Required)',
                required: false,
                cfr: null
            }
        },
        possession: {
            'commercial': {
                name: 'Commercial',
                limit: null,
                unit: 'lbs',
                cfr: '50 CFR 648.260',
                notes: 'Subject to quota and trip limits. Check current regulations.'
            },
            'recreational': {
                name: 'Recreational',
                limit: null,
                unit: 'lbs',
                cfr: null,
                notes: 'Check state regulations'
            }
        },
        size: {
            minimum: 4.75,
            unit: 'inches (carapace width)',
            cfr: '50 CFR 648.260',
            notes: '4.75" minimum carapace width'
        },
        gear: {
            'trap': {
                name: 'Trap',
                cfr: '50 CFR 648.260',
                notes: 'Trap gear authorized'
            }
        },
        seasons: {
            federal: {
                open: 'Year-round',
                cfr: '50 CFR 648.260',
                notes: 'Subject to quota closures'
            }
        },
        assessmentQuestions: {
            permitType: {
                question: 'What type of permit does this vessel have?',
                field: 'permitType',
                required: true,
                options: [
                    { value: 'commercial', label: 'Deep Sea Red Crab Commercial Permit', description: 'Commercial fishing permit' },
                    { value: 'recreational', label: 'Recreational (No Federal Permit Required)', description: 'Recreational fishing' }
                ],
                cfr: '50 CFR 648.4'
            },
            possessionAmount: {
                question: 'What is the possession amount on board?',
                field: 'possessionAmount',
                required: true,
                type: 'number',
                unit: 'lbs',
                dependsOn: ['permitType'],
                notes: 'Record total weight in pounds',
                cfr: '50 CFR 648.260'
            },
            possessionLimitCheck: {
                question: 'Does the possession amount exceed the permit limit or quota?',
                field: 'exceedsLimit',
                required: false,
                type: 'auto',
                dependsOn: ['permitType', 'possessionAmount'],
                autoCheck: true,
                limits: {
                    'commercial': null, // Subject to quota and trip limits
                    'recreational': null // Check state regulations
                },
                notes: 'Commercial limits subject to quota and trip limits - check current regulations. Recreational: Check state regulations.',
                violation: {
                    ifExceeds: 'VIOLATION: Possession amount exceeds permit limit or quota (50 CFR 648.260)'
                },
                cfr: '50 CFR 648.260'
            },
            sizeCompliance: {
                question: 'What is the carapace width of the crabs?',
                field: 'carapaceWidth',
                required: true,
                type: 'number',
                unit: 'inches',
                minimum: 4.75,
                notes: 'Minimum size: 4.75" carapace width. Measure across the widest part of the carapace.',
                violation: {
                    ifBelow: 'VIOLATION: Atlantic deep sea red crab below minimum size must be released (50 CFR 648.260)'
                },
                cfr: '50 CFR 648.260'
            },
            gearType: {
                question: 'What gear is being used?',
                field: 'gearType',
                required: true,
                type: 'choice',
                dependsOn: ['permitType'],
                options: [
                    { value: 'trap', label: 'Trap', notes: 'Trap gear authorized' }
                ],
                cfr: '50 CFR 648.260'
            },
            quotaStatus: {
                question: 'Is the fishery open or closed due to quota?',
                field: 'quotaStatus',
                required: false,
                type: 'auto',
                dependsOn: ['permitType'],
                applicablePermits: ['commercial'],
                autoCheck: true,
                notes: 'Check current quota status - fishery may close when quota is reached',
                cfr: '50 CFR 648.260'
            },
            reportingStatus: {
                question: 'Has the catch been reported?',
                field: 'reported',
                required: true,
                type: 'boolean',
                dependsOn: ['permitType'],
                applicablePermits: ['commercial'],
                notes: 'Commercial catch must be reported as required',
                violation: {
                    ifFalse: 'VIOLATION: Commercial catch reporting required (50 CFR 648.7)'
                },
                cfr: '50 CFR 648.7'
            }
        }
    }
};

// Golden Tilefish
SPECIES_DATA['golden-tilefish'] = {
    name: 'Golden Tilefish',
    commonName: 'Tilefish',
    image: null,
    imagePath: 'images/fish/Golden_Tilefish.webp',
    color: '#ffd93d',
    regulations: {
        permits: {
            'commercial': {
                name: 'Golden Tilefish Commercial Permit',
                required: true,
                cfr: '50 CFR 648.4'
            },
            'recreational': {
                name: 'Recreational (No Federal Permit Required)',
                required: false,
                cfr: null
            }
        },
        possession: {
            'commercial': {
                name: 'Commercial',
                limit: null,
                unit: 'lbs',
                cfr: '50 CFR 648.290',
                notes: 'Subject to quota and trip limits. Check current regulations.'
            },
            'recreational': {
                name: 'Recreational',
                limit: null,
                unit: 'fish',
                cfr: null,
                notes: 'Check state regulations'
            }
        },
        size: {
            minimum: 19,
            unit: 'inches (total length)',
            cfr: '50 CFR 648.290',
            notes: '19" minimum total length'
        },
        seasons: {
            federal: {
                open: 'Year-round',
                cfr: '50 CFR 648.290',
                notes: 'Subject to quota closures'
            }
        },
        assessmentQuestions: {
            permitType: {
                question: 'What type of permit does this vessel have?',
                field: 'permitType',
                required: true,
                options: [
                    { value: 'commercial', label: 'Golden Tilefish Commercial Permit', description: 'Commercial fishing permit' },
                    { value: 'recreational', label: 'Recreational (No Federal Permit Required)', description: 'Recreational fishing' }
                ],
                cfr: '50 CFR 648.4'
            },
            possessionAmount: {
                question: 'What is the possession amount on board?',
                field: 'possessionAmount',
                required: true,
                type: 'number',
                unit: 'lbs',
                dependsOn: ['permitType'],
                notes: 'Record total weight in pounds',
                cfr: '50 CFR 648.290'
            },
            possessionLimitCheck: {
                question: 'Does the possession amount exceed the permit limit or quota?',
                field: 'exceedsLimit',
                required: false,
                type: 'auto',
                dependsOn: ['permitType', 'possessionAmount'],
                autoCheck: true,
                limits: {
                    'commercial': null, // Subject to quota and trip limits
                    'recreational': null // Check state regulations
                },
                notes: 'Commercial limits subject to quota and trip limits - check current regulations. Recreational: Check state regulations.',
                violation: {
                    ifExceeds: 'VIOLATION: Possession amount exceeds permit limit or quota (50 CFR 648.290)'
                },
                cfr: '50 CFR 648.290'
            },
            sizeCompliance: {
                question: 'What is the total length of the fish?',
                field: 'totalLength',
                required: true,
                type: 'number',
                unit: 'inches',
                minimum: 19,
                notes: 'Minimum size: 19" total length. Measure from tip of snout to tip of tail.',
                violation: {
                    ifBelow: 'VIOLATION: Golden tilefish below minimum size must be released (50 CFR 648.290)'
                },
                cfr: '50 CFR 648.290'
            },
            gearType: {
                question: 'What gear is being used?',
                field: 'gearType',
                required: true,
                type: 'choice',
                dependsOn: ['permitType'],
                options: [
                    { value: 'hook-line', label: 'Hook and Line', notes: 'Hook and line gear authorized' },
                    { value: 'longline', label: 'Longline', notes: 'Longline gear authorized' }
                ],
                cfr: '50 CFR 648.290'
            },
            quotaStatus: {
                question: 'Is the fishery open or closed due to quota?',
                field: 'quotaStatus',
                required: false,
                type: 'auto',
                dependsOn: ['permitType'],
                applicablePermits: ['commercial'],
                autoCheck: true,
                notes: 'Check current quota status - fishery may close when quota is reached',
                cfr: '50 CFR 648.290'
            },
            reportingStatus: {
                question: 'Has the catch been reported?',
                field: 'reported',
                required: true,
                type: 'boolean',
                dependsOn: ['permitType'],
                applicablePermits: ['commercial'],
                notes: 'Commercial catch must be reported as required',
                violation: {
                    ifFalse: 'VIOLATION: Commercial catch reporting required (50 CFR 648.7)'
                },
                cfr: '50 CFR 648.7'
            }
        }
    }
};

// Blueline Tilefish
SPECIES_DATA['blueline-tilefish'] = {
    name: 'Blueline Tilefish',
    commonName: 'Blueline Tilefish',
    image: null,
    imagePath: 'images/fish/Blueline_Tilefish.webp',
    color: '#4ecdc4',
    regulations: {
        permits: {
            'commercial': {
                name: 'Blueline Tilefish Commercial Permit',
                required: true,
                cfr: '50 CFR 648.4'
            },
            'recreational': {
                name: 'Recreational (No Federal Permit Required)',
                required: false,
                cfr: null
            }
        },
        possession: {
            'commercial': {
                name: 'Commercial',
                limit: null,
                unit: 'lbs',
                cfr: '50 CFR 648.290',
                notes: 'Subject to quota and trip limits. Check current regulations.'
            },
            'recreational': {
                name: 'Recreational',
                limit: null,
                unit: 'fish',
                cfr: null,
                notes: 'Check state regulations'
            }
        },
        size: {
            minimum: 19,
            unit: 'inches (total length)',
            cfr: '50 CFR 648.290',
            notes: '19" minimum total length'
        },
        seasons: {
            federal: {
                open: 'Year-round',
                cfr: '50 CFR 648.290',
                notes: 'Subject to quota closures'
            }
        },
        assessmentQuestions: {
            permitType: {
                question: 'What type of permit does this vessel have?',
                field: 'permitType',
                required: true,
                options: [
                    { value: 'commercial', label: 'Blueline Tilefish Commercial Permit', description: 'Commercial fishing permit' },
                    { value: 'recreational', label: 'Recreational (No Federal Permit Required)', description: 'Recreational fishing' }
                ],
                cfr: '50 CFR 648.4'
            },
            possessionAmount: {
                question: 'What is the possession amount on board?',
                field: 'possessionAmount',
                required: true,
                type: 'number',
                unit: 'lbs',
                dependsOn: ['permitType'],
                notes: 'Record total weight in pounds',
                cfr: '50 CFR 648.290'
            },
            possessionLimitCheck: {
                question: 'Does the possession amount exceed the permit limit or quota?',
                field: 'exceedsLimit',
                required: false,
                type: 'auto',
                dependsOn: ['permitType', 'possessionAmount'],
                autoCheck: true,
                limits: {
                    'commercial': null, // Subject to quota and trip limits
                    'recreational': null // Check state regulations
                },
                notes: 'Commercial limits subject to quota and trip limits - check current regulations. Recreational: Check state regulations.',
                violation: {
                    ifExceeds: 'VIOLATION: Possession amount exceeds permit limit or quota (50 CFR 648.290)'
                },
                cfr: '50 CFR 648.290'
            },
            sizeCompliance: {
                question: 'What is the total length of the fish?',
                field: 'totalLength',
                required: true,
                type: 'number',
                unit: 'inches',
                minimum: 14,
                notes: 'Minimum size: 14" total length. Measure from tip of snout to tip of tail.',
                violation: {
                    ifBelow: 'VIOLATION: Blueline tilefish below minimum size must be released (50 CFR 648.290)'
                },
                cfr: '50 CFR 648.290'
            },
            gearType: {
                question: 'What gear is being used?',
                field: 'gearType',
                required: true,
                type: 'choice',
                dependsOn: ['permitType'],
                options: [
                    { value: 'hook-line', label: 'Hook and Line', notes: 'Hook and line gear authorized' },
                    { value: 'longline', label: 'Longline', notes: 'Longline gear authorized' }
                ],
                cfr: '50 CFR 648.290'
            },
            quotaStatus: {
                question: 'Is the fishery open or closed due to quota?',
                field: 'quotaStatus',
                required: false,
                type: 'auto',
                dependsOn: ['permitType'],
                applicablePermits: ['commercial'],
                autoCheck: true,
                notes: 'Check current quota status - fishery may close when quota is reached',
                cfr: '50 CFR 648.290'
            },
            reportingStatus: {
                question: 'Has the catch been reported?',
                field: 'reported',
                required: true,
                type: 'boolean',
                dependsOn: ['permitType'],
                applicablePermits: ['commercial'],
                notes: 'Commercial catch must be reported as required',
                violation: {
                    ifFalse: 'VIOLATION: Commercial catch reporting required (50 CFR 648.7)'
                },
                cfr: '50 CFR 648.7'
            }
        }
    }
};

// Thorny Skate
SPECIES_DATA['thorny-skate'] = {
    name: 'Thorny Skate',
    commonName: 'Thorny Skate',
    image: null,
    imagePath: 'images/fish/Thorny_Skate.webp',
    color: '#a8dadc',
    regulations: {
        permits: {
            'commercial': {
                name: 'Skate Commercial Permit',
                required: true,
                cfr: '50 CFR 648.4'
            },
            'recreational': {
                name: 'Recreational (No Federal Permit Required)',
                required: false,
                cfr: null
            }
        },
        possession: {
            'commercial': {
                name: 'Commercial',
                limit: null,
                unit: 'lbs',
                cfr: '50 CFR 648.320',
                notes: 'Skate wing DAS limits: 4,000 lb (May 1–Aug 31) or 6,000 lb (Sep 1–Apr 30); incidental 500 lb when reduced (50 CFR 648.322).'
            },
            'recreational': {
                name: 'Recreational',
                limit: null,
                unit: 'fish',
                cfr: null,
                notes: 'No federal recreational skate limit — verify state measures.'
            }
        },
        size: {
            minimum: null,
            unit: 'n/a',
            cfr: '50 CFR 648.320',
            notes: 'No federal minimum size under skate wing fishery.'
        },
        seasons: {
            federal: {
                open: 'Year-round',
                cfr: '50 CFR 648.320',
                notes: 'Subject to quota closures'
            }
        },
        assessmentQuestions: {
            permitType: {
                question: 'What type of permit does this vessel have?',
                field: 'permitType',
                required: true,
                options: [
                    { value: 'commercial', label: 'Skate Commercial Permit', description: 'Commercial fishing permit' },
                    { value: 'recreational', label: 'Recreational (No Federal Permit Required)', description: 'Recreational fishing' }
                ],
                cfr: '50 CFR 648.4'
            },
            possessionAmount: {
                question: 'What is the possession amount on board?',
                field: 'possessionAmount',
                required: true,
                type: 'number',
                unit: 'lbs',
                dependsOn: ['permitType'],
                notes: 'Record total weight in pounds',
                cfr: '50 CFR 648.320'
            },
            possessionLimitCheck: {
                question: 'Does the possession amount exceed the permit limit or quota?',
                field: 'exceedsLimit',
                required: false,
                type: 'auto',
                dependsOn: ['permitType', 'possessionAmount'],
                autoCheck: true,
                limits: {
                    'commercial': null, // Subject to quota and trip limits
                    'recreational': null // Check state regulations
                },
                notes: 'Commercial wing trip limits enforced by season (see 50 CFR 648.322). Recreational: state measures.',
                violation: {
                    ifExceeds: 'VIOLATION: Possession amount exceeds permit limit or quota (50 CFR 648.320)'
                },
                cfr: '50 CFR 648.320'
            },
            quotaStatus: {
                question: 'Is the fishery open or closed due to quota?',
                field: 'quotaStatus',
                required: false,
                type: 'auto',
                dependsOn: ['permitType'],
                applicablePermits: ['commercial'],
                autoCheck: true,
                notes: 'Quota trigger may reduce wing limit to 500 lb — verify NOAA bulletin.',
                cfr: '50 CFR 648.320'
            },
            reportingStatus: {
                question: 'Has the catch been reported?',
                field: 'reported',
                required: true,
                type: 'boolean',
                dependsOn: ['permitType'],
                applicablePermits: ['commercial'],
                notes: 'Commercial catch must be reported as required',
                violation: {
                    ifFalse: 'VIOLATION: Commercial catch reporting required (50 CFR 648.7)'
                },
                cfr: '50 CFR 648.7'
            }
        }
    }
};

// Smooth Skate
SPECIES_DATA['smooth-skate'] = {
    name: 'Smooth Skate',
    commonName: 'Smooth Skate',
    image: null,
    imagePath: 'images/fish/Smooth_Skate.webp',
    color: '#a8dadc',
    regulations: {
        permits: {
            'commercial': {
                name: 'Skate Commercial Permit',
                required: true,
                cfr: '50 CFR 648.4'
            },
            'recreational': {
                name: 'Recreational (No Federal Permit Required)',
                required: false,
                cfr: null
            }
        },
        possession: {
            'commercial': {
                name: 'Commercial',
                limit: null,
                unit: 'lbs',
                cfr: '50 CFR 648.320',
                notes: 'Skate wing DAS limits: 4,000 lb (May 1–Aug 31) or 6,000 lb (Sep 1–Apr 30); incidental 500 lb when reduced (50 CFR 648.322).'
            },
            'recreational': {
                name: 'Recreational',
                limit: null,
                unit: 'fish',
                cfr: null,
                notes: 'No federal recreational skate limit — verify state measures.'
            }
        },
        size: {
            minimum: null,
            unit: 'n/a',
            cfr: '50 CFR 648.320',
            notes: 'No federal minimum size under skate wing fishery.'
        },
        seasons: {
            federal: {
                open: 'Year-round',
                cfr: '50 CFR 648.320',
                notes: 'Subject to quota closures'
            }
        },
        assessmentQuestions: {
            permitType: {
                question: 'What type of permit does this vessel have?',
                field: 'permitType',
                required: true,
                options: [
                    { value: 'commercial', label: 'Skate Commercial Permit', description: 'Commercial fishing permit' },
                    { value: 'recreational', label: 'Recreational (No Federal Permit Required)', description: 'Recreational fishing' }
                ],
                cfr: '50 CFR 648.4'
            },
            possessionAmount: {
                question: 'What is the possession amount on board?',
                field: 'possessionAmount',
                required: true,
                type: 'number',
                unit: 'lbs',
                dependsOn: ['permitType'],
                notes: 'Record total weight in pounds',
                cfr: '50 CFR 648.320'
            },
            possessionLimitCheck: {
                question: 'Does the possession amount exceed the permit limit or quota?',
                field: 'exceedsLimit',
                required: false,
                type: 'auto',
                dependsOn: ['permitType', 'possessionAmount'],
                autoCheck: true,
                limits: {
                    'commercial': null, // Subject to quota and trip limits
                    'recreational': null // Check state regulations
                },
                notes: 'Commercial wing trip limits enforced by season (see 50 CFR 648.322). Recreational: state measures.',
                violation: {
                    ifExceeds: 'VIOLATION: Possession amount exceeds permit limit or quota (50 CFR 648.320)'
                },
                cfr: '50 CFR 648.320'
            },
            quotaStatus: {
                question: 'Is the fishery open or closed due to quota?',
                field: 'quotaStatus',
                required: false,
                type: 'auto',
                dependsOn: ['permitType'],
                applicablePermits: ['commercial'],
                autoCheck: true,
                notes: 'Quota trigger may reduce wing limit to 500 lb — verify NOAA bulletin.',
                cfr: '50 CFR 648.320'
            },
            reportingStatus: {
                question: 'Has the catch been reported?',
                field: 'reported',
                required: true,
                type: 'boolean',
                dependsOn: ['permitType'],
                applicablePermits: ['commercial'],
                notes: 'Commercial catch must be reported as required',
                violation: {
                    ifFalse: 'VIOLATION: Commercial catch reporting required (50 CFR 648.7)'
                },
                cfr: '50 CFR 648.7'
            }
        }
    }
};

// Barndoor Skate
SPECIES_DATA['barndoor-skate'] = {
    name: 'Barndoor Skate',
    commonName: 'Barndoor Skate',
    image: null,
    imagePath: 'images/fish/Barndoor_Skate.webp',
    color: '#a8dadc',
    regulations: {
        permits: {
            'commercial': {
                name: 'Skate Commercial Permit',
                required: true,
                cfr: '50 CFR 648.4'
            },
            'recreational': {
                name: 'Recreational (No Federal Permit Required)',
                required: false,
                cfr: null
            }
        },
        possession: {
            'commercial': {
                name: 'Commercial',
                limit: null,
                unit: 'lbs',
                cfr: '50 CFR 648.320',
                notes: 'Skate wing DAS limits: 4,000 lb (May 1–Aug 31) or 6,000 lb (Sep 1–Apr 30); incidental 500 lb when reduced (50 CFR 648.322).'
            },
            'recreational': {
                name: 'Recreational',
                limit: null,
                unit: 'fish',
                cfr: null,
                notes: 'No federal recreational skate limit — verify state measures.'
            }
        },
        size: {
            minimum: null,
            unit: 'n/a',
            cfr: '50 CFR 648.320',
            notes: 'No federal minimum size under skate wing fishery.'
        },
        seasons: {
            federal: {
                open: 'Year-round',
                cfr: '50 CFR 648.320',
                notes: 'Subject to quota closures'
            }
        },
        assessmentQuestions: {
            permitType: {
                question: 'What type of permit does this vessel have?',
                field: 'permitType',
                required: true,
                options: [
                    { value: 'commercial', label: 'Skate Commercial Permit', description: 'Commercial fishing permit' },
                    { value: 'recreational', label: 'Recreational (No Federal Permit Required)', description: 'Recreational fishing' }
                ],
                cfr: '50 CFR 648.4'
            },
            possessionAmount: {
                question: 'What is the possession amount on board?',
                field: 'possessionAmount',
                required: true,
                type: 'number',
                unit: 'lbs',
                dependsOn: ['permitType'],
                notes: 'Record total weight in pounds',
                cfr: '50 CFR 648.320'
            },
            possessionLimitCheck: {
                question: 'Does the possession amount exceed the permit limit or quota?',
                field: 'exceedsLimit',
                required: false,
                type: 'auto',
                dependsOn: ['permitType', 'possessionAmount'],
                autoCheck: true,
                limits: {
                    'commercial': null, // Subject to quota and trip limits
                    'recreational': null // Check state regulations
                },
                notes: 'Commercial wing trip limits enforced by season (see 50 CFR 648.322). Recreational: state measures.',
                violation: {
                    ifExceeds: 'VIOLATION: Possession amount exceeds permit limit or quota (50 CFR 648.320)'
                },
                cfr: '50 CFR 648.320'
            },
            quotaStatus: {
                question: 'Is the fishery open or closed due to quota?',
                field: 'quotaStatus',
                required: false,
                type: 'auto',
                dependsOn: ['permitType'],
                applicablePermits: ['commercial'],
                autoCheck: true,
                notes: 'Quota trigger may reduce wing limit to 500 lb — verify NOAA bulletin.',
                cfr: '50 CFR 648.320'
            },
            reportingStatus: {
                question: 'Has the catch been reported?',
                field: 'reported',
                required: true,
                type: 'boolean',
                dependsOn: ['permitType'],
                applicablePermits: ['commercial'],
                notes: 'Commercial catch must be reported as required',
                violation: {
                    ifFalse: 'VIOLATION: Commercial catch reporting required (50 CFR 648.7)'
                },
                cfr: '50 CFR 648.7'
            }
        }
    }
};

// American Lobster
SPECIES_DATA['american-lobster'] = {
    name: 'American Lobster',
    commonName: 'Lobster',
    image: null,
    imagePath: 'images/fish/American_Lobster.webp',
    color: '#ff6b6b',
    regulations: {
        permits: {
            'commercial': {
                name: 'American Lobster Commercial Permit',
                required: true,
                cfr: '50 CFR 697.4'
            },
            'recreational': {
                name: 'Recreational (No Federal Permit Required)',
                required: false,
                cfr: null
            }
        },
        possession: {
            'commercial': {
                name: 'Commercial',
                limit: null,
                unit: 'lbs',
                cfr: '50 CFR 697.17',
                notes: 'Subject to trap limits and area restrictions. Check current regulations.'
            },
            'recreational': {
                name: 'Recreational',
                limit: null,
                unit: 'lobsters',
                cfr: null,
                notes: 'Check state regulations'
            }
        },
        size: {
            minimum: 3.25,
            unit: 'inches (carapace length)',
            cfr: '50 CFR 697.17',
            notes: '3.25" minimum carapace length. Maximum size varies by area.'
        },
        gear: {
            'trap': {
                name: 'Lobster Trap',
                cfr: '50 CFR 697.20',
                notes: 'Trap gear authorized. Check for area-specific restrictions.'
            }
        },
        seasons: {
            federal: {
                open: 'Year-round',
                cfr: '50 CFR 697.17',
                notes: 'Subject to area closures'
            }
        },
        assessmentQuestions: {
            permitType: {
                question: 'What type of permit does this vessel have?',
                field: 'permitType',
                required: true,
                options: [
                    { value: 'commercial', label: 'American Lobster Commercial Permit', description: 'Commercial fishing permit' },
                    { value: 'recreational', label: 'Recreational (No Federal Permit Required)', description: 'Recreational fishing' }
                ],
                cfr: '50 CFR 697.4'
            },
            possessionAmount: {
                question: 'What is the possession amount on board?',
                field: 'possessionAmount',
                required: true,
                type: 'number',
                unit: 'lbs',
                dependsOn: ['permitType'],
                notes: 'Record total weight in pounds (commercial) or number of lobsters (recreational)',
                cfr: '50 CFR 697.17'
            },
            possessionLimitCheck: {
                question: 'Does the possession amount exceed the permit limit?',
                field: 'exceedsLimit',
                required: false,
                type: 'auto',
                dependsOn: ['permitType', 'possessionAmount'],
                autoCheck: true,
                limits: {
                    'commercial': null, // Subject to trap limits and area restrictions
                    'recreational': null // Check state regulations
                },
                notes: 'Commercial limits subject to trap limits and area restrictions - check current regulations. Recreational: Check state regulations.',
                violation: {
                    ifExceeds: 'VIOLATION: Possession amount exceeds permit limit or trap allocation (50 CFR 697.17)'
                },
                cfr: '50 CFR 697.17'
            },
            sizeCompliance: {
                question: 'What is the carapace length of the lobsters?',
                field: 'carapaceLength',
                required: true,
                type: 'number',
                unit: 'inches',
                minimum: 3.25,
                notes: 'Minimum size: 3.25" carapace length. Maximum size varies by area. Measure from rear of eye socket to rear of carapace.',
                violation: {
                    ifBelow: 'VIOLATION: Lobsters below minimum size must be released (50 CFR 697.17)'
                },
                cfr: '50 CFR 697.17'
            },
            maximumSizeCheck: {
                question: 'What is the maximum size limit for this area?',
                field: 'maximumSize',
                required: false,
                type: 'number',
                unit: 'inches',
                dependsOn: ['fishingArea'],
                notes: 'Maximum size varies by area. Check area-specific regulations.',
                violation: {
                    ifExceeds: 'VIOLATION: Lobsters above maximum size must be released (50 CFR 697.17)'
                },
                cfr: '50 CFR 697.17'
            },
            fishingArea: {
                question: 'What area was the vessel fishing in?',
                field: 'fishingArea',
                required: true,
                type: 'choice',
                options: [
                    { value: 'area-1', label: 'Area 1', notes: 'Area 1 specific regulations apply' },
                    { value: 'area-2', label: 'Area 2', notes: 'Area 2 specific regulations apply' },
                    { value: 'area-3', label: 'Area 3', notes: 'Area 3 specific regulations apply' },
                    { value: 'area-4', label: 'Area 4', notes: 'Area 4 specific regulations apply' },
                    { value: 'area-5', label: 'Area 5', notes: 'Area 5 specific regulations apply' },
                    { value: 'area-6', label: 'Area 6', notes: 'Area 6 specific regulations apply' },
                    { value: 'closed-area', label: 'Closed Area', violation: true, notes: 'VIOLATION: Fishing prohibited in closed areas' }
                ],
                violation: {
                    ifValue: 'closed-area',
                    message: 'VIOLATION: Fishing prohibited in closed areas (50 CFR 697.17)'
                },
                cfr: '50 CFR 697.17'
            },
            trapCompliance: {
                question: 'How many traps are being used?',
                field: 'numberOfTraps',
                required: false,
                type: 'number',
                dependsOn: ['permitType'],
                applicablePermits: ['commercial'],
                notes: 'Trap limits vary by area and permit. Check current trap allocation.',
                cfr: '50 CFR 697.20'
            },
            gearCompliance: {
                question: 'What gear is being used?',
                field: 'gearType',
                required: true,
                type: 'choice',
                dependsOn: ['permitType'],
                options: [
                    { value: 'trap', label: 'Lobster Trap', notes: 'Trap gear authorized - check area-specific restrictions' },
                    { value: 'diving', label: 'Diving', notes: 'Recreational diving gear' }
                ],
                cfr: '50 CFR 697.20'
            },
            reportingStatus: {
                question: 'Has the catch been reported?',
                field: 'reported',
                required: true,
                type: 'boolean',
                dependsOn: ['permitType'],
                applicablePermits: ['commercial'],
                notes: 'Commercial catch must be reported as required',
                violation: {
                    ifFalse: 'VIOLATION: Commercial catch reporting required (50 CFR 697.7)'
                },
                cfr: '50 CFR 697.7'
            }
        }
    }
};

// Jonah Crab
SPECIES_DATA['jonah-crab'] = {
    name: 'Jonah Crab',
    commonName: 'Jonah Crab',
    image: null,
    imagePath: 'images/fish/Jonah_Crab.webp',
    color: '#ff8787',
    regulations: {
        permits: {
            'commercial': {
                name: 'Jonah Crab Commercial Permit',
                required: true,
                cfr: '50 CFR 697.4'
            },
            'recreational': {
                name: 'Recreational (No Federal Permit Required)',
                required: false,
                cfr: null
            }
        },
        possession: {
            'commercial': {
                name: 'Commercial',
                limit: null,
                unit: 'lbs',
                cfr: '50 CFR 697.7',
                notes: 'Subject to trap limits and area restrictions. Check current regulations.'
            },
            'recreational': {
                name: 'Recreational',
                limit: null,
                unit: 'crabs',
                cfr: null,
                notes: 'Check state regulations'
            }
        },
        size: {
            minimum: 4.75,
            unit: 'inches (carapace width)',
            cfr: '50 CFR 697.7',
            notes: '4.75" minimum carapace width'
        },
        gear: {
            'trap': {
                name: 'Crab Trap',
                cfr: '50 CFR 697.7',
                notes: 'Trap gear authorized'
            }
        },
        seasons: {
            federal: {
                open: 'Year-round',
                cfr: '50 CFR 697.7',
                notes: 'Subject to area closures'
            }
        },
        assessmentQuestions: {
            permitType: {
                question: 'What type of permit does this vessel have?',
                field: 'permitType',
                required: true,
                options: [
                    { value: 'commercial', label: 'Jonah Crab Commercial Permit', description: 'Commercial fishing permit' },
                    { value: 'recreational', label: 'Recreational (No Federal Permit Required)', description: 'Recreational fishing' }
                ],
                cfr: '50 CFR 697.4'
            },
            possessionAmount: {
                question: 'What is the possession amount on board?',
                field: 'possessionAmount',
                required: true,
                type: 'number',
                unit: 'lbs',
                dependsOn: ['permitType'],
                notes: 'Record total weight in pounds',
                cfr: '50 CFR 697.7'
            },
            possessionLimitCheck: {
                question: 'Does the possession amount exceed the permit limit?',
                field: 'exceedsLimit',
                required: false,
                type: 'auto',
                dependsOn: ['permitType', 'possessionAmount'],
                autoCheck: true,
                limits: {
                    'commercial': null,
                    'recreational': null
                },
                notes: 'Commercial limits subject to trap limits and area restrictions - check current regulations. Recreational: Check state regulations.',
                violation: {
                    ifExceeds: 'VIOLATION: Possession amount exceeds permit limit or quota (50 CFR 697.7)'
                },
                cfr: '50 CFR 697.7'
            },
            sizeCompliance: {
                question: 'What is the carapace width of the crabs?',
                field: 'carapaceWidth',
                required: true,
                type: 'number',
                unit: 'inches',
                minimum: 4.75,
                notes: 'Minimum size: 4.75" carapace width. Measure across the widest part of the carapace.',
                violation: {
                    ifBelow: 'VIOLATION: Jonah crab below minimum size must be released (50 CFR 697.7)'
                },
                cfr: '50 CFR 697.7'
            },
            gearType: {
                question: 'What gear is being used?',
                field: 'gearType',
                required: true,
                type: 'choice',
                dependsOn: ['permitType'],
                options: [
                    { value: 'trap', label: 'Crab Trap', notes: 'Trap gear authorized' }
                ],
                cfr: '50 CFR 697.7'
            },
            reportingStatus: {
                question: 'Has the catch been reported?',
                field: 'reported',
                required: true,
                type: 'boolean',
                dependsOn: ['permitType'],
                applicablePermits: ['commercial'],
                notes: 'Commercial catch must be reported as required',
                violation: {
                    ifFalse: 'VIOLATION: Commercial catch reporting required (50 CFR 697.7)'
                },
                cfr: '50 CFR 697.7'
            }
        }
    }
};

// Atlantic Sturgeon
SPECIES_DATA['atlantic-sturgeon'] = {
    name: 'Atlantic Sturgeon',
    commonName: 'Sturgeon',
    image: null,
    imagePath: 'images/fish/Atlantic_Sturgeon.webp',
    color: '#4a90e2',
    regulations: {
        permits: {
            'commercial': {
                name: 'Atlantic Sturgeon Commercial Permit',
                required: false,
                cfr: null,
                notes: 'PROHIBITED - Atlantic sturgeon is listed as threatened/endangered under ESA'
            },
            'recreational': {
                name: 'Recreational',
                required: false,
                cfr: null,
                notes: 'PROHIBITED - Atlantic sturgeon is listed as threatened/endangered under ESA'
            }
        },
        possession: {
            'commercial': {
                name: 'Commercial',
                limit: { count: 0 },
                unit: 'fish',
                cfr: '50 CFR 223.102',
                notes: 'PROHIBITED - No retention allowed. Listed under Endangered Species Act.'
            },
            'recreational': {
                name: 'Recreational',
                limit: { count: 0 },
                unit: 'fish',
                cfr: '50 CFR 223.102',
                notes: 'PROHIBITED - No retention allowed. Must be released immediately.'
            }
        },
        size: {
            minimum: null,
            unit: 'N/A - Prohibited',
            cfr: '50 CFR 223.102',
            notes: 'PROHIBITED - All sizes must be released'
        },
        seasons: {
            federal: {
                open: 'CLOSED',
                cfr: '50 CFR 223.102',
                notes: 'PROHIBITED - Listed as threatened/endangered under ESA'
            }
        },
        assessmentQuestions: {
            prohibitedSpeciesCheck: {
                question: 'Is Atlantic sturgeon on board?',
                field: 'hasSturgeon',
                required: true,
                type: 'boolean',
                notes: 'Atlantic sturgeon is PROHIBITED from retention. Listed as threatened/endangered under Endangered Species Act.',
                violation: {
                    ifTrue: 'VIOLATION: Atlantic sturgeon is PROHIBITED from retention. Must be released immediately. Listed under Endangered Species Act (50 CFR 223.102)'
                },
                cfr: '50 CFR 223.102'
            },
            numberOfFish: {
                question: 'How many Atlantic sturgeon are on board?',
                field: 'numberOfFish',
                required: false,
                type: 'number',
                notes: 'Any Atlantic sturgeon on board is a violation - species is PROHIBITED',
                violation: {
                    ifGreaterThan: 0,
                    message: 'VIOLATION: Atlantic sturgeon is PROHIBITED from retention. All fish must be released immediately (50 CFR 223.102)'
                },
                cfr: '50 CFR 223.102'
            },
            releaseStatus: {
                question: 'Have all Atlantic sturgeon been released immediately?',
                field: 'released',
                required: true,
                type: 'boolean',
                notes: 'All Atlantic sturgeon must be released immediately upon capture. No retention allowed.',
                violation: {
                    ifFalse: 'VIOLATION: Atlantic sturgeon must be released immediately. No retention allowed (50 CFR 223.102)'
                },
                cfr: '50 CFR 223.102'
            },
            permitType: {
                question: 'What type of permit does this vessel have?',
                field: 'permitType',
                required: false,
                options: [
                    { value: 'commercial', label: 'Commercial Permit', description: 'Commercial fishing - PROHIBITED for Atlantic sturgeon' },
                    { value: 'recreational', label: 'Recreational', description: 'Recreational fishing - PROHIBITED for Atlantic sturgeon' }
                ],
                notes: 'Atlantic sturgeon retention is PROHIBITED for both commercial and recreational fishing',
                cfr: '50 CFR 223.102'
            },
            esaCompliance: {
                question: 'Is the vessel in compliance with Endangered Species Act requirements?',
                field: 'esaCompliance',
                required: true,
                type: 'boolean',
                notes: 'Atlantic sturgeon is listed as threatened/endangered under ESA. All fish must be released immediately.',
                violation: {
                    ifFalse: 'VIOLATION: Atlantic sturgeon is protected under Endangered Species Act. All fish must be released immediately (50 CFR 223.102)'
                },
                cfr: '50 CFR 223.102'
            }
        }
    }
};

// Shortnose Sturgeon
SPECIES_DATA['shortnose-sturgeon'] = {
    name: 'Shortnose Sturgeon',
    commonName: 'Shortnose Sturgeon',
    image: null,
    imagePath: 'images/fish/Shortnose_Sturgeon.webp',
    color: '#4a90e2',
    regulations: {
        permits: {
            'commercial': {
                name: 'Shortnose Sturgeon Commercial Permit',
                required: false,
                cfr: null,
                notes: 'PROHIBITED - Shortnose sturgeon is listed as endangered under ESA'
            },
            'recreational': {
                name: 'Recreational',
                required: false,
                cfr: null,
                notes: 'PROHIBITED - Shortnose sturgeon is listed as endangered under ESA'
            }
        },
        possession: {
            'commercial': {
                name: 'Commercial',
                limit: { count: 0 },
                unit: 'fish',
                cfr: '50 CFR 223.102',
                notes: 'PROHIBITED - No retention allowed. Listed under Endangered Species Act.'
            },
            'recreational': {
                name: 'Recreational',
                limit: { count: 0 },
                unit: 'fish',
                cfr: '50 CFR 223.102',
                notes: 'PROHIBITED - No retention allowed. Must be released immediately.'
            }
        },
        size: {
            minimum: null,
            unit: 'N/A - Prohibited',
            cfr: '50 CFR 223.102',
            notes: 'PROHIBITED - All sizes must be released'
        },
        seasons: {
            federal: {
                open: 'CLOSED',
                cfr: '50 CFR 223.102',
                notes: 'PROHIBITED - Listed as endangered under ESA'
            }
        },
        assessmentQuestions: {
            prohibitedSpeciesCheck: {
                question: 'Is shortnose sturgeon on board?',
                field: 'hasSturgeon',
                required: true,
                type: 'boolean',
                notes: 'Shortnose sturgeon is PROHIBITED from retention. Listed as endangered under Endangered Species Act.',
                violation: {
                    ifTrue: 'VIOLATION: Shortnose sturgeon is PROHIBITED from retention. Must be released immediately. Listed under Endangered Species Act (50 CFR 223.102)'
                },
                cfr: '50 CFR 223.102'
            },
            numberOfFish: {
                question: 'How many shortnose sturgeon are on board?',
                field: 'numberOfFish',
                required: false,
                type: 'number',
                notes: 'Any shortnose sturgeon on board is a violation - species is PROHIBITED',
                violation: {
                    ifGreaterThan: 0,
                    message: 'VIOLATION: Shortnose sturgeon is PROHIBITED from retention. All fish must be released immediately (50 CFR 223.102)'
                },
                cfr: '50 CFR 223.102'
            },
            releaseStatus: {
                question: 'Have all shortnose sturgeon been released immediately?',
                field: 'released',
                required: true,
                type: 'boolean',
                notes: 'All shortnose sturgeon must be released immediately upon capture. No retention allowed.',
                violation: {
                    ifFalse: 'VIOLATION: Shortnose sturgeon must be released immediately. No retention allowed (50 CFR 223.102)'
                },
                cfr: '50 CFR 223.102'
            },
            permitType: {
                question: 'What type of permit does this vessel have?',
                field: 'permitType',
                required: false,
                options: [
                    { value: 'commercial', label: 'Commercial Permit', description: 'Commercial fishing - PROHIBITED for shortnose sturgeon' },
                    { value: 'recreational', label: 'Recreational', description: 'Recreational fishing - PROHIBITED for shortnose sturgeon' }
                ],
                notes: 'Shortnose sturgeon retention is PROHIBITED for both commercial and recreational fishing',
                cfr: '50 CFR 223.102'
            },
            esaCompliance: {
                question: 'Is the vessel in compliance with Endangered Species Act requirements?',
                field: 'esaCompliance',
                required: true,
                type: 'boolean',
                notes: 'Shortnose sturgeon is listed as endangered under ESA. All fish must be released immediately.',
                violation: {
                    ifFalse: 'VIOLATION: Shortnose sturgeon is protected under Endangered Species Act. All fish must be released immediately (50 CFR 223.102)'
                },
                cfr: '50 CFR 223.102'
            }
        }
    }
};

// Atlantic Coast Horseshoe Crab
SPECIES_DATA['atlantic-coast-horseshoe-crab'] = {
    name: 'Atlantic Coast Horseshoe Crab',
    commonName: 'Horseshoe Crab',
    image: null,
    imagePath: 'images/fish/Atlantic_Coast_Horseshoe_Crab.jpg',
    color: '#8b4513',
    regulations: {
        permits: {
            'commercial': {
                name: 'Horseshoe Crab Commercial Permit',
                required: true,
                cfr: '50 CFR 697.4'
            },
            'recreational': {
                name: 'Recreational (No Federal Permit Required)',
                required: false,
                cfr: null
            }
        },
        possession: {
            'commercial': {
                name: 'Commercial',
                limit: null,
                unit: 'crabs',
                cfr: '50 CFR 697.7',
                notes: 'Subject to quota and area restrictions. Check current regulations.'
            },
            'recreational': {
                name: 'Recreational',
                limit: null,
                unit: 'crabs',
                cfr: null,
                notes: 'Check state regulations'
            }
        },
        size: {
            minimum: null,
            unit: 'varies',
            cfr: '50 CFR 697.7',
            notes: 'Check current size requirements'
        },
        seasons: {
            federal: {
                open: 'Year-round',
                cfr: '50 CFR 697.7',
                notes: 'Subject to area closures'
            }
        },
        assessmentQuestions: {
            permitType: {
                question: 'What type of permit does this vessel have?',
                field: 'permitType',
                required: true,
                options: [
                    { value: 'commercial', label: 'Commercial - Horseshoe Crab Commercial Permit', description: 'Commercial fishing - Horseshoe Crab Commercial Permit required' },
                    { value: 'recreational', label: 'Recreational (No Federal Permit Required)', description: 'Recreational fishing - No federal permit required' }
                ],
                cfr: '50 CFR 697.4'
            },
            possessionAmount: {
                question: 'How many horseshoe crabs are on board?',
                field: 'numberOfCrabs',
                required: true,
                type: 'number',
                unit: 'crabs',
                dependsOn: ['permitType'],
                notes: 'Record total number of horseshoe crabs on board',
                cfr: '50 CFR 697.7'
            },
            possessionLimitCheck: {
                question: 'Does the possession amount comply with permit limits?',
                field: 'exceedsLimit',
                required: false,
                type: 'auto',
                dependsOn: ['permitType', 'numberOfCrabs'],
                autoCheck: true,
                limits: {
                    'commercial': null, // Subject to quota
                    'recreational': null // Check state regulations
                },
                notes: 'Commercial limits subject to quota and area restrictions - check current regulations. Recreational: Check state regulations.',
                cfr: '50 CFR 697.7'
            },
            areaRestrictions: {
                question: 'Was fishing conducted in a closed or restricted area?',
                field: 'closedArea',
                required: false,
                type: 'boolean',
                dependsOn: ['permitType'],
                applicablePermits: ['commercial'],
                notes: 'Horseshoe crab fishing subject to area closures and restrictions',
                violation: {
                    ifTrue: 'VIOLATION: Fishing in closed or restricted area (50 CFR 697.7)'
                },
                cfr: '50 CFR 697.7'
            },
            reportingStatus: {
                question: 'Has the catch been reported?',
                field: 'reported',
                required: true,
                type: 'boolean',
                dependsOn: ['permitType'],
                applicablePermits: ['commercial'],
                notes: 'Commercial catch must be reported as required',
                violation: {
                    ifFalse: 'VIOLATION: Commercial catch reporting required (50 CFR 697.7)'
                },
                cfr: '50 CFR 697.7'
            }
        }
    }
};

// Red Drum
SPECIES_DATA['red-drum'] = {
    name: 'Red Drum',
    commonName: 'Redfish',
    image: null,
    imagePath: 'images/fish/Red_Drum.webp',
    color: '#ff6b6b',
    regulations: {
        permits: {
            'commercial': {
                name: 'Red Drum Commercial Permit',
                required: true,
                cfr: '50 CFR 622.4',
                notes: 'Check for specific permit requirements'
            },
            'recreational': {
                name: 'Recreational (No Federal Permit Required)',
                required: false,
                cfr: null
            }
        },
        possession: {
            'commercial': {
                name: 'Commercial',
                limit: null,
                unit: 'fish',
                cfr: '50 CFR 622.42',
                notes: 'Check current regulations and quotas'
            },
            'recreational': {
                name: 'Recreational',
                limit: null,
                unit: 'fish',
                cfr: null,
                notes: 'Check state regulations'
            }
        },
        size: {
            minimum: 18,
            unit: 'inches (total length)',
            cfr: '50 CFR 622.42',
            notes: '18" minimum total length. Check for slot limits.'
        },
        seasons: {
            federal: {
                open: 'Check current regulations',
                notes: 'Regulations vary by area and season'
            }
        },
        assessmentQuestions: {
            permitType: {
                question: 'What type of permit does this vessel have?',
                field: 'permitType',
                required: true,
                options: [
                    { value: 'commercial', label: 'Red Drum Commercial Permit', description: 'Commercial fishing permit' },
                    { value: 'recreational', label: 'Recreational (No Federal Permit Required)', description: 'Recreational fishing' }
                ],
                cfr: '50 CFR 622.4'
            },
            possessionAmount: {
                question: 'What is the possession amount on board?',
                field: 'possessionAmount',
                required: true,
                type: 'number',
                unit: 'fish',
                dependsOn: ['permitType'],
                notes: 'Record number of fish',
                cfr: '50 CFR 622.42'
            },
            possessionLimitCheck: {
                question: 'Does the possession amount exceed the permit limit?',
                field: 'exceedsLimit',
                required: false,
                type: 'auto',
                dependsOn: ['permitType', 'possessionAmount'],
                autoCheck: true,
                limits: {
                    'commercial': null, // Check current regulations and quotas
                    'recreational': null // Check state regulations
                },
                notes: 'Commercial limits subject to quotas - check current regulations. Recreational: Check state regulations.',
                violation: {
                    ifExceeds: 'VIOLATION: Possession amount exceeds permit limit or quota (50 CFR 622.42)'
                },
                cfr: '50 CFR 622.42'
            },
            sizeCompliance: {
                question: 'What is the total length of the fish?',
                field: 'totalLength',
                required: true,
                type: 'number',
                unit: 'inches',
                minimum: 18,
                notes: 'Minimum size: 18" total length. Check for slot limits. Measure from tip of snout to tip of tail.',
                violation: {
                    ifBelow: 'VIOLATION: Red drum below minimum size must be released (50 CFR 622.42)'
                },
                cfr: '50 CFR 622.42'
            },
            slotLimitCheck: {
                question: 'Does the fish fall within the slot limit (if applicable)?',
                field: 'slotLimitCompliance',
                required: false,
                type: 'auto',
                dependsOn: ['totalLength'],
                notes: 'Check for area-specific slot limits (minimum and maximum size restrictions)',
                cfr: '50 CFR 622.42'
            },
            reportingStatus: {
                question: 'Has the catch been reported?',
                field: 'reported',
                required: true,
                type: 'boolean',
                dependsOn: ['permitType'],
                applicablePermits: ['commercial'],
                notes: 'Commercial catch must be reported as required',
                violation: {
                    ifFalse: 'VIOLATION: Commercial catch reporting required (50 CFR 622.7)'
                },
                cfr: '50 CFR 622.7'
            }
        }
    }
};

// Weakfish
SPECIES_DATA['weakfish'] = {
    name: 'Weakfish',
    commonName: 'Sea Trout',
    image: null,
    imagePath: 'images/fish/Weakfish.webp',
    color: '#95e1d3',
    regulations: {
        permits: {
            'commercial': {
                name: 'Weakfish Commercial Permit',
                required: true,
                cfr: '50 CFR 648.4',
                notes: 'Check for specific permit requirements'
            },
            'recreational': {
                name: 'Recreational (No Federal Permit Required)',
                required: false,
                cfr: null
            }
        },
        possession: {
            'commercial': {
                name: 'Commercial',
                limit: null,
                unit: 'lbs',
                cfr: '50 CFR 648.4',
                notes: 'Check current regulations and quotas'
            },
            'recreational': {
                name: 'Recreational',
                limit: null,
                unit: 'fish',
                cfr: null,
                notes: 'Check state regulations'
            }
        },
        size: {
            minimum: 13,
            unit: 'inches (total length)',
            cfr: null,
            notes: '13" minimum total length. Check state regulations.'
        },
        seasons: {
            federal: {
                open: 'Check current regulations',
                notes: 'Regulations vary by area and season'
            }
        },
        assessmentQuestions: {
            permitType: {
                question: 'What type of permit does this vessel have?',
                field: 'permitType',
                required: true,
                options: [
                    { value: 'commercial', label: 'Weakfish Commercial Permit', description: 'Commercial fishing permit' },
                    { value: 'recreational', label: 'Recreational (No Federal Permit Required)', description: 'Recreational fishing' }
                ],
                cfr: '50 CFR 648.4'
            },
            possessionAmount: {
                question: 'What is the possession amount on board?',
                field: 'possessionAmount',
                required: true,
                type: 'number',
                unit: 'lbs',
                dependsOn: ['permitType'],
                notes: 'Record total weight in pounds (commercial) or number of fish (recreational)',
                cfr: '50 CFR 648.4'
            },
            possessionLimitCheck: {
                question: 'Does the possession amount exceed the permit limit?',
                field: 'exceedsLimit',
                required: false,
                type: 'auto',
                dependsOn: ['permitType', 'possessionAmount'],
                autoCheck: true,
                limits: {
                    'commercial': null, // Check current regulations and quotas
                    'recreational': null // Check state regulations
                },
                notes: 'Commercial limits subject to quotas - check current regulations. Recreational: Check state regulations.',
                violation: {
                    ifExceeds: 'VIOLATION: Possession amount exceeds permit limit or quota (50 CFR 648.4)'
                },
                cfr: '50 CFR 648.4'
            },
            sizeCompliance: {
                question: 'What is the total length of the fish?',
                field: 'totalLength',
                required: true,
                type: 'number',
                unit: 'inches',
                minimum: 13,
                notes: 'Minimum size: 13" total length. Check state regulations. Measure from tip of snout to tip of tail.',
                violation: {
                    ifBelow: 'VIOLATION: Weakfish below minimum size must be released'
                },
                cfr: null
            },
            stateRegulations: {
                question: 'Have state regulations been checked?',
                field: 'stateRegulationsChecked',
                required: true,
                type: 'boolean',
                notes: 'Weakfish regulations vary by state. Check state-specific limits and seasons.',
                cfr: null
            },
            reportingStatus: {
                question: 'Has the catch been reported?',
                field: 'reported',
                required: true,
                type: 'boolean',
                dependsOn: ['permitType'],
                applicablePermits: ['commercial'],
                notes: 'Commercial catch must be reported as required',
                violation: {
                    ifFalse: 'VIOLATION: Commercial catch reporting required (50 CFR 648.7)'
                },
                cfr: '50 CFR 648.7'
            }
        }
    }
};

// Mahi-Mahi (Dorado)
SPECIES_DATA['mahi-mahi'] = {
    name: 'Mahi-Mahi',
    commonName: 'Dorado',
    image: null,
    imagePath: 'images/fish/Mahi-Mahi.webp',
    color: '#ffd93d',
    regulations: {
        permits: {
            'commercial': {
                name: 'Atlantic HMS Commercial Permit',
                required: true,
                cfr: '50 CFR 635.4'
            },
            'recreational': {
                name: 'Recreational (No Federal Permit Required)',
                required: false,
                cfr: null
            }
        },
        possession: {
            'commercial': {
                name: 'Commercial',
                limit: null,
                unit: 'lbs',
                cfr: '50 CFR 635.21',
                notes: 'No federal possession limit. Check state regulations.'
            },
            'recreational': {
                name: 'Recreational',
                limit: null,
                unit: 'fish',
                cfr: null,
                notes: 'No federal possession limit. Check state regulations.'
            }
        },
        size: {
            minimum: null,
            unit: 'varies',
            cfr: null,
            notes: 'No federal size limit. Check state regulations.'
        },
        seasons: {
            federal: {
                open: 'Year-round',
                cfr: '50 CFR 635.21',
                notes: 'No federal season restrictions'
            }
        },
        assessmentQuestions: {
            permitType: {
                question: 'What type of permit does this vessel have?',
                field: 'permitType',
                required: true,
                options: [
                    { value: 'commercial', label: 'Atlantic HMS Commercial Permit', description: 'Commercial fishing permit' },
                    { value: 'recreational', label: 'Recreational (No Federal Permit Required)', description: 'Recreational fishing' }
                ],
                cfr: '50 CFR 635.4'
            },
            possessionAmount: {
                question: 'What is the possession amount on board?',
                field: 'possessionAmount',
                required: true,
                type: 'number',
                unit: 'lbs',
                dependsOn: ['permitType'],
                notes: 'Record total weight in pounds (commercial) or number of fish (recreational)',
                cfr: '50 CFR 635.21'
            },
            stateRegulations: {
                question: 'Have state regulations been checked?',
                field: 'stateRegulationsChecked',
                required: true,
                type: 'boolean',
                notes: 'No federal possession limit or size limit for mahi-mahi. Check state regulations for limits.',
                cfr: '50 CFR 635.21'
            },
            reportingStatus: {
                question: 'Has the catch been reported?',
                field: 'reported',
                required: true,
                type: 'boolean',
                dependsOn: ['permitType'],
                applicablePermits: ['commercial'],
                notes: 'Commercial catch must be reported as required',
                violation: {
                    ifFalse: 'VIOLATION: Commercial catch reporting required (50 CFR 648.7)'
                },
                cfr: '50 CFR 648.7'
            }
        }
    }
};

// Ocean Barracuda
SPECIES_DATA['ocean-barracuda'] = {
    name: 'Ocean Barracuda',
    commonName: 'Barracuda',
    image: null,
    imagePath: 'images/fish/Ocean_Barracuda.webp',
    color: '#4ecdc4',
    regulations: {
        permits: {
            'commercial': {
                name: 'Commercial Permit',
                required: false,
                cfr: null,
                notes: 'Check for specific permit requirements'
            },
            'recreational': {
                name: 'Recreational (No Federal Permit Required)',
                required: false,
                cfr: null
            }
        },
        possession: {
            'commercial': {
                name: 'Commercial',
                limit: null,
                unit: 'lbs',
                cfr: null,
                notes: 'No federal possession limit. Check state regulations.'
            },
            'recreational': {
                name: 'Recreational',
                limit: null,
                unit: 'fish',
                cfr: null,
                notes: 'No federal possession limit. Check state regulations.'
            }
        },
        size: {
            minimum: null,
            unit: 'varies',
            cfr: null,
            notes: 'No federal size limit. Check state regulations.'
        },
        seasons: {
            federal: {
                open: 'Year-round',
                notes: 'No federal season restrictions'
            }
        },
        assessmentQuestions: {
            permitType: {
                question: 'What type of permit does this vessel have?',
                field: 'permitType',
                required: false,
                options: [
                    { value: 'commercial', label: 'Commercial Permit', description: 'Commercial fishing - no federal permit required' },
                    { value: 'recreational', label: 'Recreational (No Federal Permit Required)', description: 'Recreational fishing' }
                ],
                notes: 'No federal permit required. Check state regulations.',
                cfr: null
            },
            possessionAmount: {
                question: 'What is the possession amount on board?',
                field: 'possessionAmount',
                required: true,
                type: 'number',
                unit: 'lbs',
                dependsOn: ['permitType'],
                notes: 'Record total weight in pounds',
                cfr: null
            },
            stateRegulations: {
                question: 'Have state regulations been checked?',
                field: 'stateRegulationsChecked',
                required: true,
                type: 'boolean',
                notes: 'No federal possession limit or size limit for ocean barracuda. Check state regulations for limits.',
                cfr: null
            },
            reportingStatus: {
                question: 'Has the catch been reported?',
                field: 'reported',
                required: true,
                type: 'boolean',
                dependsOn: ['permitType'],
                applicablePermits: ['commercial'],
                notes: 'Commercial catch must be reported as required by state regulations',
                cfr: null
            }
        }
    }
};

// Tigerfish (Note: This may refer to a different species - adding as requested)
SPECIES_DATA['tigerfish'] = {
    name: 'Tigerfish',
    commonName: 'Tigerfish',
    image: null,
    imagePath: 'images/fish/Tigerfish.webp',
    color: '#ff8787',
    regulations: {
        permits: {
            'commercial': {
                name: 'Commercial Permit',
                required: false,
                cfr: null,
                notes: 'Check for specific permit requirements'
            },
            'recreational': {
                name: 'Recreational (No Federal Permit Required)',
                required: false,
                cfr: null
            }
        },
        possession: {
            'commercial': {
                name: 'Commercial',
                limit: null,
                unit: 'lbs',
                cfr: null,
                notes: 'No federal NE multispecies limit — verify state and local rules.'
            },
            'recreational': {
                name: 'Recreational',
                limit: null,
                unit: 'fish',
                cfr: null,
                notes: 'No federal limit — verify state measures.'
            }
        },
        size: {
            minimum: null,
            unit: 'n/a',
            cfr: null,
            notes: 'No federal minimum size.'
        },
        seasons: {
            federal: {
                open: 'State-managed',
                notes: 'No federal FMP entry for tigerfish in Northeast — verify state regulations.'
            }
        },
        assessmentQuestions: {
            permitType: {
                question: 'What type of permit does this vessel have?',
                field: 'permitType',
                required: true,
                options: [
                    { value: 'commercial', label: 'Commercial Permit', description: 'Commercial fishing - verify state permit requirements' },
                    { value: 'recreational', label: 'Recreational (No Federal Permit Required)', description: 'Recreational fishing - No federal permit required' }
                ],
                cfr: null
            },
            possessionAmount: {
                question: 'How many tigerfish are on board?',
                field: 'numberOfFish',
                required: true,
                type: 'number',
                unit: 'fish',
                dependsOn: ['permitType'],
                notes: 'Record total number of tigerfish on board',
                cfr: null
            },
            stateRegulationsCheck: {
                question: 'Have state regulations been checked?',
                field: 'stateRegsChecked',
                required: true,
                type: 'boolean',
                dependsOn: ['permitType'],
                notes: 'Tigerfish is state-managed in the Northeast — verify applicable state regulations.',
                violation: {
                    ifFalse: 'WARNING: Verify compliance with state and federal regulations'
                },
                cfr: null
            },
            reportingStatus: {
                question: 'Has the catch been reported if required?',
                field: 'reported',
                required: false,
                type: 'boolean',
                dependsOn: ['permitType'],
                applicablePermits: ['commercial'],
                notes: 'Check if commercial catch reporting is required',
                cfr: null
            }
        }
    }
};

// King Mackerel
SPECIES_DATA['king-mackerel'] = {
    name: 'King Mackerel',
    commonName: 'Kingfish',
    image: null,
    imagePath: 'images/fish/King_Mackerel.webp',
    color: '#4a90e2',
    regulations: {
        permits: {
            'commercial': {
                name: 'King Mackerel Commercial Permit',
                required: true,
                cfr: '50 CFR 622.4'
            },
            'recreational': {
                name: 'Recreational (No Federal Permit Required)',
                required: false,
                cfr: null
            }
        },
        possession: {
            'commercial': {
                name: 'Commercial',
                limit: null,
                unit: 'lbs',
                cfr: '50 CFR 622.38',
                notes: 'Commercial trip limits and quota — verify NOAA Southeast bulletin.'
            },
            'recreational': {
                name: 'Recreational',
                limit: { count: 3, unit: 'fish per person per day' },
                cfr: '50 CFR 622.382',
                notes: 'Atlantic migratory group: 3 king mackerel per person per day (50 CFR 622.382).'
            }
        },
        size: {
            minimum: 23,
            unit: 'inches (fork length)',
            cfr: '50 CFR 622.38',
            notes: '23" minimum fork length'
        },
        seasons: {
            federal: {
                open: 'Year-round',
                cfr: '50 CFR 622.38',
                notes: 'Subject to quota closures'
            }
        },
        assessmentQuestions: {
            permitType: {
                question: 'What type of permit does this vessel have?',
                field: 'permitType',
                required: true,
                options: [
                    { value: 'commercial', label: 'King Mackerel Commercial Permit', description: 'Commercial fishing permit' },
                    { value: 'recreational', label: 'Recreational (No Federal Permit Required)', description: 'Recreational fishing' }
                ],
                cfr: '50 CFR 622.4'
            },
            possessionAmount: {
                question: 'What is the possession amount on board?',
                field: 'possessionAmount',
                required: true,
                type: 'number',
                unit: 'lbs',
                dependsOn: ['permitType'],
                notes: 'Record total weight in pounds (commercial) or number of fish (recreational)',
                cfr: '50 CFR 622.38'
            },
            possessionLimitCheck: {
                question: 'Does the possession amount exceed the permit limit or quota?',
                field: 'exceedsLimit',
                required: false,
                type: 'auto',
                dependsOn: ['permitType', 'possessionAmount'],
                autoCheck: true,
                limits: {
                    'commercial': null,
                    'recreational': { count: 3, unit: 'fish per person per day' }
                },
                notes: 'Recreational: 3 fish/person/day (50 CFR 622.382). Commercial: quota/trip limits per bulletin.',
                violation: {
                    ifExceeds: 'VIOLATION: Possession amount exceeds permit limit or quota (50 CFR 622.38)'
                },
                cfr: '50 CFR 622.38'
            },
            numberOfFish: {
                question: 'How many king mackerel are on board (recreational)?',
                field: 'numberOfFish',
                required: false,
                type: 'number',
                dependsOn: ['permitType'],
                applicablePermits: ['recreational'],
                notes: '3 fish per person per day (50 CFR 622.382)',
                violation: {
                    ifGreaterThan: 3,
                    message: 'VIOLATION: Recreational bag limit is 3 king mackerel per person per day (50 CFR 622.382)'
                },
                cfr: '50 CFR 622.382'
            },
            sizeCompliance: {
                question: 'What is the fork length of the fish?',
                field: 'forkLength',
                required: true,
                type: 'number',
                unit: 'inches',
                minimum: 23,
                notes: 'Minimum size: 23" fork length. Measure from tip of snout to fork of tail.',
                violation: {
                    ifBelow: 'VIOLATION: King mackerel below minimum size must be released (50 CFR 622.38)'
                },
                cfr: '50 CFR 622.38'
            },
            quotaStatus: {
                question: 'Is the fishery open or closed due to quota?',
                field: 'quotaStatus',
                required: false,
                type: 'auto',
                dependsOn: ['permitType'],
                applicablePermits: ['commercial'],
                autoCheck: true,
                notes: 'Commercial fishery may close when ACL reached — verify NOAA bulletin.',
                cfr: '50 CFR 622.38'
            },
            reportingStatus: {
                question: 'Has the catch been reported?',
                field: 'reported',
                required: true,
                type: 'boolean',
                dependsOn: ['permitType'],
                applicablePermits: ['commercial'],
                notes: 'Commercial catch must be reported as required',
                violation: {
                    ifFalse: 'VIOLATION: Commercial catch reporting required (50 CFR 622.7)'
                },
                cfr: '50 CFR 622.7'
            }
        }
    }
};

// Spanish Mackerel
SPECIES_DATA['spanish-mackerel'] = {
    name: 'Spanish Mackerel',
    commonName: 'Spanish Mackerel',
    image: null,
    imagePath: 'images/fish/Spanish_Mackerel.webp',
    color: '#4a90e2',
    regulations: {
        permits: {
            'commercial': {
                name: 'Spanish Mackerel Commercial Permit',
                required: true,
                cfr: '50 CFR 622.4'
            },
            'recreational': {
                name: 'Recreational (No Federal Permit Required)',
                required: false,
                cfr: null
            }
        },
        possession: {
            'commercial': {
                name: 'Commercial',
                limit: null,
                unit: 'lbs',
                cfr: '50 CFR 622.38',
                notes: 'Commercial trip limits and quota — verify NOAA Southeast bulletin.'
            },
            'recreational': {
                name: 'Recreational',
                limit: { count: 15, unit: 'fish per person per day' },
                cfr: '50 CFR 622.382',
                notes: 'Atlantic migratory group: 15 Spanish mackerel per person per day (50 CFR 622.382).'
            }
        },
        size: {
            minimum: 14,
            unit: 'inches (fork length)',
            cfr: '50 CFR 622.38',
            notes: '14" minimum fork length'
        },
        seasons: {
            federal: {
                open: 'Year-round',
                cfr: '50 CFR 622.38',
                notes: 'Subject to quota closures'
            }
        },
        assessmentQuestions: {
            permitType: {
                question: 'What type of permit does this vessel have?',
                field: 'permitType',
                required: true,
                options: [
                    { value: 'commercial', label: 'Spanish Mackerel Commercial Permit', description: 'Commercial fishing permit' },
                    { value: 'recreational', label: 'Recreational (No Federal Permit Required)', description: 'Recreational fishing' }
                ],
                cfr: '50 CFR 622.4'
            },
            possessionAmount: {
                question: 'What is the possession amount on board?',
                field: 'possessionAmount',
                required: true,
                type: 'number',
                unit: 'lbs',
                dependsOn: ['permitType'],
                notes: 'Record total weight in pounds (commercial) or number of fish (recreational)',
                cfr: '50 CFR 622.38'
            },
            possessionLimitCheck: {
                question: 'Does the possession amount exceed the permit limit or quota?',
                field: 'exceedsLimit',
                required: false,
                type: 'auto',
                dependsOn: ['permitType', 'possessionAmount'],
                autoCheck: true,
                limits: {
                    'commercial': null,
                    'recreational': { count: 15, unit: 'fish per person per day' }
                },
                notes: 'Recreational: 15 fish/person/day (50 CFR 622.382). Commercial: quota/trip limits per bulletin.',
                violation: {
                    ifExceeds: 'VIOLATION: Possession amount exceeds permit limit or quota (50 CFR 622.38)'
                },
                cfr: '50 CFR 622.38'
            },
            numberOfFish: {
                question: 'How many Spanish mackerel are on board (recreational)?',
                field: 'numberOfFish',
                required: false,
                type: 'number',
                dependsOn: ['permitType'],
                applicablePermits: ['recreational'],
                notes: '15 fish per person per day (50 CFR 622.382)',
                violation: {
                    ifGreaterThan: 15,
                    message: 'VIOLATION: Recreational bag limit is 15 Spanish mackerel per person per day (50 CFR 622.382)'
                },
                cfr: '50 CFR 622.382'
            },
            sizeCompliance: {
                question: 'What is the fork length of the fish?',
                field: 'forkLength',
                required: true,
                type: 'number',
                unit: 'inches',
                minimum: 14,
                notes: 'Minimum size: 14" fork length. Measure from tip of snout to fork of tail.',
                violation: {
                    ifBelow: 'VIOLATION: Spanish mackerel below minimum size must be released (50 CFR 622.38)'
                },
                cfr: '50 CFR 622.38'
            },
            quotaStatus: {
                question: 'Is the fishery open or closed due to quota?',
                field: 'quotaStatus',
                required: false,
                type: 'auto',
                dependsOn: ['permitType'],
                applicablePermits: ['commercial'],
                autoCheck: true,
                notes: 'Commercial fishery may close when ACL reached — verify NOAA bulletin.',
                cfr: '50 CFR 622.38'
            },
            reportingStatus: {
                question: 'Has the catch been reported?',
                field: 'reported',
                required: true,
                type: 'boolean',
                dependsOn: ['permitType'],
                applicablePermits: ['commercial'],
                notes: 'Commercial catch must be reported as required',
                violation: {
                    ifFalse: 'VIOLATION: Commercial catch reporting required (50 CFR 622.7)'
                },
                cfr: '50 CFR 622.7'
            }
        }
    }
};

// Atlantic Chub Mackerel
SPECIES_DATA['atlantic-chub-mackerel'] = {
    name: 'Atlantic Chub Mackerel',
    commonName: 'Chub Mackerel',
    image: null,
    imagePath: 'images/fish/Atlantic_Chub_Marckerel.webp',
    color: '#4a90e2',
    regulations: {
        permits: {
            'commercial': {
                name: 'Commercial Permit',
                required: false,
                cfr: null,
                notes: 'Check for specific permit requirements'
            },
            'recreational': {
                name: 'Recreational (No Federal Permit Required)',
                required: false,
                cfr: null
            }
        },
        possession: {
            'commercial': {
                name: 'Commercial',
                limit: null,
                unit: 'lbs',
                cfr: null,
                notes: 'No federal possession limit. Check state regulations.'
            },
            'recreational': {
                name: 'Recreational',
                limit: null,
                unit: 'fish',
                cfr: null,
                notes: 'No federal possession limit. Check state regulations.'
            }
        },
        size: {
            minimum: null,
            unit: 'varies',
            cfr: null,
            notes: 'No federal size limit. Check state regulations.'
        },
        seasons: {
            federal: {
                open: 'Year-round',
                notes: 'No federal season restrictions'
            }
        },
        assessmentQuestions: {
            permitType: {
                question: 'What type of permit does this vessel have?',
                field: 'permitType',
                required: true,
                options: [
                    { value: 'commercial', label: 'Commercial Permit', description: 'Commercial fishing - Check for specific permit requirements' },
                    { value: 'recreational', label: 'Recreational (No Federal Permit Required)', description: 'Recreational fishing - No federal permit required' }
                ],
                cfr: null
            },
            possessionAmount: {
                question: 'How many Atlantic chub mackerel are on board?',
                field: 'numberOfFish',
                required: true,
                type: 'number',
                unit: 'fish',
                dependsOn: ['permitType'],
                notes: 'Record total number of Atlantic chub mackerel on board',
                cfr: null
            },
            possessionLimitCheck: {
                question: 'Does the possession amount comply with permit limits?',
                field: 'exceedsLimit',
                required: false,
                type: 'auto',
                dependsOn: ['permitType', 'numberOfFish'],
                autoCheck: true,
                limits: {
                    'commercial': null, // No federal limit
                    'recreational': null // No federal limit
                },
                notes: 'No federal possession limit. Check state regulations.',
                cfr: null
            },
            stateRegulationsCheck: {
                question: 'Have state regulations been checked?',
                field: 'stateRegsChecked',
                required: true,
                type: 'boolean',
                dependsOn: ['permitType'],
                notes: 'No federal size or possession limits. Check state regulations for restrictions.',
                violation: {
                    ifFalse: 'WARNING: Verify compliance with state regulations'
                },
                cfr: null
            },
            reportingStatus: {
                question: 'Has the catch been reported if required?',
                field: 'reported',
                required: false,
                type: 'boolean',
                dependsOn: ['permitType'],
                applicablePermits: ['commercial'],
                notes: 'Check if commercial catch reporting is required',
                cfr: null
            }
        }
    }
};
