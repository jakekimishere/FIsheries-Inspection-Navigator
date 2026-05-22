// Regulation Dates Configuration
// Centralized date management for all fisheries closures and seasonal regulations
// Update this file when regulations change - no need to edit code elsewhere

const REGULATION_DATES = {
    // Bluefin Tuna Commercial Closures
    'bluefin-tuna': {
        commercial: {
            closures: [
                {
                    // 2026 closure
                    startDate: '2026-01-14T23:30:00',
                    endDate: '2026-03-31T23:59:59',
                    recurring: false, // Specific to 2026
                    notes: 'General Category Commercial Fishery closed. Cannot retain, possess, or land large medium or giant bluefin tuna (≥73" CFL).'
                }
            ],
            reopenings: [
                {
                    date: '2026-06-01T00:00:00',
                    limit: { count: 3, unit: 'fish', size: '≥73" CFL', period: 'per vessel per day/trip' },
                    period: 'June 2026',
                    notes: 'General Category reopens June 1–30, 2026: 3 large medium or giant BFT per vessel per day/trip (unless adjusted by NOAA).'
                },
                {
                    date: '2026-07-01T00:00:00',
                    limit: { count: 1, unit: 'fish', size: '≥73" CFL', period: 'per vessel per day/trip on open days' },
                    period: 'July-August 2026',
                    notes: 'July 1–Aug 31, 2026: 1 large medium or giant BFT per vessel per day/trip on open days; RFDs (Tue/Fri/Sat) = 0.'
                }
            ]
        }
    },
    
    // Summer Flounder Seasonal Limits
    'summer-flounder': {
        commercial: {
            seasonalLimits: {
                'may-oct': {
                    startMonth: 5,
                    startDay: 1,
                    endMonth: 10,
                    endDay: 31,
                    limit: 100,
                    unit: 'lbs',
                    notes: '100 lbs May 1 - Oct 31'
                },
                'nov-apr': {
                    startMonth: 11,
                    startDay: 1,
                    endMonth: 4,
                    endDay: 30,
                    limit: 200,
                    unit: 'lbs',
                    notes: '200 lbs Nov 1 - Apr 30'
                }
            }
        }
    },
    
    // Add more species closures/seasonal regulations here
    // Format:
    // 'species-id': {
    //     commercial: {
    //         closures: [{ startDate, endDate, recurring, notes }],
    //         seasonalLimits: { seasonKey: { startMonth, endMonth, limit, unit } }
    //     },
    //     recreational: { ... }
    // }
};

// Helper function to get closure info for a species
function getClosureInfo(speciesId, permitType = 'commercial') {
    const speciesDates = REGULATION_DATES[speciesId];
    if (!speciesDates) return null;
    
    return speciesDates[permitType] || null;
}

// Helper function to check if closure is active
function isClosureActive(speciesId, permitType = 'commercial') {
    const closureInfo = getClosureInfo(speciesId, permitType);
    if (!closureInfo || !closureInfo.closures) return false;
    
    const currentDate = new Date();
    
    return closureInfo.closures.some(closure => {
        const start = new Date(closure.startDate);
        const end = new Date(closure.endDate);
        return currentDate >= start && currentDate <= end;
    });
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { REGULATION_DATES, getClosureInfo, isClosureActive };
}
