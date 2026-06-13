// 648 butterfish
// Auto-split from species-data.js — edit here for routine updates.

// Butterfish (Northeast Fisheries - 50 CFR Part 648)
SPECIES_DATA['butterfish'] = {
    name: 'Butterfish',
    commonName: 'Butterfish',
    image: null,
    imagePath: 'images/fish/Butterfish.webp',
    color: '#fbbf24',
    regulations: {
        permits: {
            'commercial': {
                name: 'Butterfish Commercial Permit',
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
                limit: null, // Subject to quota
                unit: 'lbs',
                cfr: '50 CFR 648.24',
                notes: 'Retention limits subject to annual quota. Check current trip limits and quota status.'
            },
            'recreational': {
                name: 'Recreational',
                limit: null, // No federal limit
                unit: 'lbs',
                cfr: '50 CFR 648.24',
                notes: 'No federal possession limit for recreational butterfish'
            }
        },
        size: {
            minimum: null,
            unit: 'No minimum size',
            cfr: '50 CFR 648.24',
            notes: 'No federal minimum size requirement for butterfish'
        },
        gear: {
            'otter-trawl': {
                name: 'Otter Trawl',
                cfr: '50 CFR 648.24',
                notes: 'Check for mesh size requirements and area restrictions'
            },
            'purse-seine': {
                name: 'Purse Seine',
                cfr: '50 CFR 648.24',
                notes: 'Purse seine gear authorized for butterfish'
            },
            'rod-reel': {
                name: 'Rod and Reel',
                cfr: '50 CFR 648.24',
                notes: 'Rod and reel gear authorized'
            }
        },
        seasons: {
            federal: {
                open: 'Year-round',
                cfr: '50 CFR 648.24',
                notes: 'Open year-round, subject to quota closures'
            }
        },
        assessmentQuestions: {
            permitType: {
                question: 'What type of permit does this vessel have?',
                field: 'permitType',
                required: true,
                options: [
                    { value: 'smb6-butterfish-moratorium', label: 'SMB 6 Butterfish Moratorium', description: 'Unlimited (large mesh) or 5,000 lbs (small mesh)' },
                    { value: 'smb3-incidental', label: 'SMB 3 Squid/Butterfish Incidental', description: '600 lbs butterfish/trip' },
                    { value: 'smb2-party-charter', label: 'SMB 2 Party/Charter', description: 'Unlimited butterfish (operator permit required)' },
                    { value: 'recreational', label: 'Recreational (No Federal Permit Required)', description: 'No federal possession limit' }
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
                cfr: '50 CFR 648.24'
            },
            meshSize: {
                question: 'What mesh size is in use? (SMB 6 butterfish moratorium)',
                field: 'meshSize',
                required: false,
                type: 'choice',
                dependsOn: ['permitType'],
                applicablePermits: ['smb6-butterfish-moratorium'],
                options: [
                    { value: 'large-mesh', label: 'Large mesh (≥3″ diamond or ≥2 5/8″ square)', notes: 'Unlimited possession' },
                    { value: 'small-mesh', label: 'Small mesh (<3″ diamond or <2 5/8″ square)', notes: '5,000 lbs/trip limit' }
                ],
                notes: 'Mesh determines butterfish moratorium trip limit.',
                cfr: '50 CFR 648.24'
            },
            possessionLimitCheck: {
                question: 'Does the possession amount exceed the permit limit or quota?',
                field: 'exceedsLimit',
                required: false,
                type: 'auto',
                dependsOn: ['permitType', 'possessionAmount'],
                autoCheck: true,
                limits: {
                    'smb6-butterfish-moratorium': null,
                    'smb3-incidental': null,
                    'smb2-party-charter': null,
                    'recreational': null
                },
                notes: 'SMB 6: 5,000 lbs if mesh <3″ diamond or <2 5/8″ square; unlimited with large mesh.',
                violation: {
                    ifExceeds: 'VIOLATION: Possession amount exceeds permit limit or quota (50 CFR 648.24)'
                },
                cfr: '50 CFR 648.24'
            },
            gearType: {
                question: 'What gear is being used?',
                field: 'gearType',
                required: true,
                type: 'choice',
                dependsOn: ['permitType'],
                options: [
                    { value: 'otter-trawl', label: 'Otter Trawl', notes: 'Check mesh size requirements and area restrictions' },
                    { value: 'purse-seine', label: 'Purse Seine', notes: 'Purse seine gear authorized' },
                    { value: 'rod-reel', label: 'Rod and Reel', notes: 'Recreational gear' }
                ],
                cfr: '50 CFR 648.24'
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
                cfr: '50 CFR 648.24'
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
