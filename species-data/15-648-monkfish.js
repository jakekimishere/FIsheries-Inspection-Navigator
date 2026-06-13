/**
 * Monkfish (50 CFR Part 648) — species data and assessment questions.
 */
SPECIES_DATA['monkfish'] = {
    name: 'Monkfish',
    commonName: 'Monkfish',
    image: null,
    imagePath: 'images/fish/Monkfish.jpg',
    color: '#696969',
    regulations: {
        permits: {
            'monkfish-cat-a': {
                name: 'Monkfish Limited Access — Category A',
                required: true,
                cfr: '50 CFR 648.4'
            },
            'monkfish-cat-b': {
                name: 'Monkfish Limited Access — Category B',
                required: true,
                cfr: '50 CFR 648.4'
            },
            'monkfish-cat-c': {
                name: 'Monkfish Limited Access — Category C',
                required: true,
                cfr: '50 CFR 648.4'
            },
            'monkfish-cat-d': {
                name: 'Monkfish Limited Access — Category D',
                required: true,
                cfr: '50 CFR 648.4'
            },
            'monkfish-cat-e': {
                name: 'Monkfish Open Access — Category E',
                required: true,
                cfr: '50 CFR 648.4'
            },
            'monkfish-cat-f': {
                name: 'Monkfish Limited Access — Category F (Offshore)',
                required: true,
                cfr: '50 CFR 648.4'
            },
            'monkfish-cat-h': {
                name: 'Monkfish Limited Access — Category H',
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
            'monkfish-cat-a': {
                name: 'Category A — on monkfish DAS',
                limit: null,
                unit: 'lbs tail weight per DAS',
                cfr: '50 CFR 648.92',
                notes: 'NFMA 1,250 lb tail; SFMA 700 lb tail per DAS — verify management area.'
            },
            'monkfish-cat-b': {
                name: 'Category B — on monkfish DAS',
                limit: null,
                unit: 'lbs tail weight per DAS',
                cfr: '50 CFR 648.92',
                notes: 'NFMA 600 lb tail; SFMA 575 lb tail per DAS.'
            },
            'monkfish-cat-c': {
                name: 'Category C — on monkfish DAS',
                limit: null,
                unit: 'lbs tail weight per DAS',
                cfr: '50 CFR 648.92',
                notes: 'NFMA 1,250 lb tail; SFMA 700 lb tail per DAS.'
            },
            'monkfish-cat-d': {
                name: 'Category D — on monkfish DAS',
                limit: null,
                unit: 'lbs tail weight per DAS',
                cfr: '50 CFR 648.92',
                notes: 'NFMA 600 lb tail; SFMA 575 lb tail per DAS.'
            },
            'monkfish-cat-e': {
                name: 'Category E — open access',
                limit: null,
                unit: 'lbs tail weight',
                cfr: '50 CFR 648.92',
                notes: 'Incidental limits when on NMS DAS or no-DAS trips — verify area and mesh.'
            },
            'monkfish-cat-f': {
                name: 'Category F — offshore',
                limit: null,
                unit: 'lbs tail weight per DAS',
                cfr: '50 CFR 648.92',
                notes: 'SFMA 1,600 lb tail on monkfish DAS in offshore program area (Oct 1–Apr 30).'
            },
            'monkfish-cat-h': {
                name: 'Category H',
                limit: null,
                unit: 'lbs tail weight per DAS',
                cfr: '50 CFR 648.92',
                notes: 'SFMA 575 lb tail on monkfish DAS; may fish throughout SFMA.'
            },
            'recreational': {
                name: 'Recreational',
                limit: null,
                unit: 'fish',
                cfr: '50 CFR 648.92',
                notes: 'No federal possession limit; minimum size applies.'
            }
        },
        size: {
            whole: { minimum: 17, unit: 'inches' },
            tail: { minimum: 11, unit: 'inches' },
            cfr: '50 CFR 648.93',
            notes: 'Skin on required except cheeks and livers. Tail measured from fourth cephalic dorsal spine to caudal fin.'
        },
        dataSources: [
            {
                title: 'Monkfish Fishery — NOAA Compliance Guide',
                url: 'https://www.fisheries.noaa.gov/new-england-mid-atlantic/commercial-fishing/monkfish',
                effective: '2026-06-13'
            }
        ],
        assessmentQuestions: {
            permitType: {
                question: 'What monkfish permit category does this vessel hold?',
                field: 'permitType',
                required: true,
                options: [
                    { value: 'monkfish-cat-a', label: 'Limited Access — Category A' },
                    { value: 'monkfish-cat-b', label: 'Limited Access — Category B' },
                    { value: 'monkfish-cat-c', label: 'Limited Access — Category C' },
                    { value: 'monkfish-cat-d', label: 'Limited Access — Category D' },
                    { value: 'monkfish-cat-e', label: 'Open Access — Category E' },
                    { value: 'monkfish-cat-f', label: 'Limited Access — Category F (Offshore)' },
                    { value: 'monkfish-cat-h', label: 'Limited Access — Category H' },
                    { value: 'recreational', label: 'Recreational (no federal permit)' }
                ],
                cfr: '50 CFR 648.4'
            },
            monkfishManagementArea: {
                question: 'Which monkfish management area applies to this trip?',
                field: 'monkfishManagementArea',
                required: false,
                type: 'choice',
                applicablePermits: [
                    'monkfish-cat-a', 'monkfish-cat-b', 'monkfish-cat-c', 'monkfish-cat-d',
                    'monkfish-cat-e', 'monkfish-cat-f', 'monkfish-cat-h'
                ],
                options: [
                    { value: 'nfma', label: 'Northern Fishery Management Area (NFMA)' },
                    { value: 'sfma', label: 'Southern Fishery Management Area (SFMA)' },
                    { value: 'both', label: 'Both areas this trip' },
                    { value: 'unknown', label: 'Unknown — verify charts/VMS' }
                ],
                notes: 'NFMA exemption letter or VMS required for NFMA catch limits; without letter SFMA quotas apply.',
                cfr: '50 CFR 648.92'
            },
            onMonkfishDas: {
                question: 'Is the vessel fishing on a monkfish DAS this trip?',
                field: 'onMonkfishDas',
                required: false,
                type: 'choice',
                applicablePermits: [
                    'monkfish-cat-a', 'monkfish-cat-b', 'monkfish-cat-c', 'monkfish-cat-d',
                    'monkfish-cat-f', 'monkfish-cat-h'
                ],
                options: [
                    { value: 'yes', label: 'Yes — monkfish DAS' },
                    { value: 'no', label: 'No — incidental or other DAS program' }
                ],
                cfr: '50 CFR 648.92'
            },
            onNmsDas: {
                question: 'Is the vessel also fishing on a Northeast multispecies DAS this trip?',
                field: 'onNmsDas',
                required: false,
                type: 'choice',
                applicablePermits: [
                    'monkfish-cat-c', 'monkfish-cat-d', 'monkfish-cat-e', 'monkfish-cat-h'
                ],
                options: [
                    { value: 'yes', label: 'Yes — NMS DAS' },
                    { value: 'no', label: 'No' }
                ],
                cfr: '50 CFR 648.92'
            },
            possessionAmount: {
                question: 'Monkfish possession on board (tail weight, lbs)?',
                field: 'possessionAmount',
                required: true,
                type: 'number',
                unit: 'lbs tail weight',
                notes: 'Convert whole weight ÷ 2.91. Limits vary by DAS program, area, and permit — verify chart.',
                cfr: '50 CFR 648.92'
            },
            sizeCompliance: {
                question: 'Do monkfish meet minimum size (17″ whole or 11″ tail) with skin on?',
                field: 'size-compliant',
                required: true,
                type: 'choice',
                violation: {
                    ifEquals: 'no',
                    message: 'VIOLATION: Undersized monkfish or skin-off product (50 CFR 648.93)'
                },
                cfr: '50 CFR 648.93'
            },
            operatorPermit: {
                question: 'Does the operator hold a valid federal operator permit?',
                field: 'operatorPermit',
                required: false,
                type: 'choice',
                applicablePermits: [
                    'monkfish-cat-a', 'monkfish-cat-b', 'monkfish-cat-c', 'monkfish-cat-d',
                    'monkfish-cat-e', 'monkfish-cat-f', 'monkfish-cat-h'
                ],
                violation: {
                    ifEquals: 'no',
                    message: 'VIOLATION: Commercial monkfish fishing requires valid operator permit (50 CFR 648.4)'
                },
                cfr: '50 CFR 648.4'
            }
        }
    }
};
