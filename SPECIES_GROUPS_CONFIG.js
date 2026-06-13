// Species Groups Configuration
// Defines which species share combined possession limits

const SPECIES_GROUPS = {
    // Large Coastal Sharks (LCS) - Recreational: 1 shark total from this group
    'lcs-recreational': {
        name: 'Large Coastal Sharks (LCS)',
        description: 'Recreational limit: 1 shark per vessel per trip from this group',
        species: [
            'blacktip-shark',
            'bull-shark',
            'lemon-shark',
            'nurse-shark',
            'spinner-shark',
            'tiger-shark'
        ],
        limits: {
            'recreational': {
                limit: { count: 1, unit: 'fish per vessel per trip' },
                cfr: '50 CFR 635.22',
                notes: '1 shark per vessel per trip from allowable species list (LCS). 54" FL minimum for most LCS; cannot retain with tunas/billfish/swordfish on board.'
            }
        }
    },
    
    // Hammerhead Sharks - only one hammerhead species may be retained per trip (78" FL); shares vessel trip limit with other allowable sharks
    'hammerhead-recreational': {
        name: 'Hammerhead Sharks',
        description: 'Recreational: 1 shark per vessel per trip total (any allowable species, including hammerheads at 78" FL)',
        species: [
            'great-hammerhead-shark',
            'scalloped-hammerhead-shark',
            'smooth-hammerhead-shark'
        ],
        limits: {
            'recreational': {
                limit: { count: 1, unit: 'fish per vessel per trip' },
                cfr: '50 CFR 635.22',
                notes: '1 shark per vessel per trip from allowable species list. Hammerheads: 78" FL min; prohibited in U.S. Caribbean.'
            }
        }
    },
    
    // Small Coastal Sharks (SCS) — sharpnose & bonnethead per person; finetooth in vessel limit group
    'scs-recreational': {
        name: 'Small Coastal Sharks (SCS)',
        description: 'Recreational: sharpnose & bonnethead 1 each per person per trip; finetooth in 1 shark/vessel limit',
        species: [
            'atlantic-sharpnose-shark',
            'bonnethead-shark',
            'finetooth-shark'
        ],
        limits: {
            'recreational': {
                limit: { count: 1, unit: 'fish per person per trip (sharpnose & bonnethead)' },
                cfr: '50 CFR 635.22',
                notes: 'Atlantic sharpnose and bonnethead: 1 each per person per trip, no minimum size. Finetooth: 54" FL; counts toward 1 shark/vessel/trip.'
            },
            'recreational-charter-headboat': {
                limit: { count: 1, unit: 'fish per vessel per trip (finetooth; sharpnose/bonnethead per person)' },
                cfr: '50 CFR 635.22',
                notes: 'Same as angler — verify passenger counts for sharpnose/bonnethead.'
            }
        }
    },
    
    // Small Coastal Sharks (Non-Blacknose) - legacy alias
    'scs-non-blacknose': {
        name: 'Small Coastal Sharks (Non-Blacknose)',
        description: 'See scs-recreational group for current limits',
        species: [
            'atlantic-sharpnose-shark',
            'bonnethead-shark',
            'finetooth-shark'
        ],
        limits: {
            'recreational': {
                limit: { count: 1, unit: 'fish per person per trip (sharpnose & bonnethead)' },
                cfr: '50 CFR 635.22',
                notes: 'Atlantic sharpnose and bonnethead: 1 each per person per trip.'
            }
        }
    },
    
    // Add more groups as needed
    // Example format:
    // 'group-id': {
    //     name: 'Group Name',
    //     description: 'Description of combined limit',
    //     species: ['species-id-1', 'species-id-2'],
    //     limits: {
    //         'permit-type': {
    //             limit: { count: X, unit: 'fish' },
    //             cfr: '50 CFR XXX.XX',
    //             notes: 'Combined limit description'
    //         }
    //     }
    // }
};

// Helper function to get all groups a species belongs to
function getSpeciesGroups(speciesId) {
    const groups = [];
    for (const groupId in SPECIES_GROUPS) {
        if (SPECIES_GROUPS[groupId].species.includes(speciesId)) {
            groups.push({
                id: groupId,
                ...SPECIES_GROUPS[groupId]
            });
        }
    }
    return groups;
}

// Helper function to get combined limit for a group
function getCombinedLimit(groupId, permitType) {
    const group = SPECIES_GROUPS[groupId];
    if (!group || !group.limits) return null;
    return group.limits[permitType] || null;
}

// Helper function to check if species share a combined limit
function shareCombinedLimit(speciesIds, permitType) {
    // Find all groups that contain any of the selected species
    const relevantGroups = {};
    
    speciesIds.forEach(speciesId => {
        const groups = getSpeciesGroups(speciesId);
        groups.forEach(group => {
            if (!relevantGroups[group.id]) {
                relevantGroups[group.id] = {
                    group: group,
                    species: []
                };
            }
            if (!relevantGroups[group.id].species.includes(speciesId)) {
                relevantGroups[group.id].species.push(speciesId);
            }
        });
    });
    
    // Check if any group has multiple selected species (meaning combined limit applies)
    const combinedLimitGroups = [];
    for (const groupId in relevantGroups) {
        const groupData = relevantGroups[groupId];
        // Only include if multiple species from this group are selected
        if (groupData.species.length > 1) {
            const limit = getCombinedLimit(groupId, permitType);
            if (limit) {
                combinedLimitGroups.push({
                    groupId: groupId,
                    group: groupData.group,
                    species: groupData.species,
                    limit: limit
                });
            }
        }
    }
    
    return combinedLimitGroups;
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SPECIES_GROUPS, getSpeciesGroups, getCombinedLimit, shareCombinedLimit };
}
