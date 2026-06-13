/**
 * Fishery open/closed status and date- or area-based possession limits.
 * Update when NOAA bulletins change — referenced by assessmentViolations.js.
 */
const FISHERY_QUOTA_STATUS = {
    'bluefin-tuna': {
        cfr: '50 CFR 635.23',
        commercial: {
            'commercial-purse-seine': { status: 'CLOSED', effective: '2026-01-01', notes: 'Purse seine category closed — contact NOAA HMS.' },
            'commercial-longline': { status: 'IBQ', notes: 'Individual bluefin quota (IBQ). Call BFT IFQ Hotline (301) 427-8591.' }
        },
        rfdMonths: [7, 8, 9, 10, 11],
        rfdDays: ['Tuesday', 'Friday', 'Saturday']
    },
    'atlantic-herring': {
        cfr: '50 CFR 648.201',
        commercial: {
            areaPossessionAdjustments: [
                {
                    area: 'area-1b',
                    limitLb: 2000,
                    effectiveFrom: '2026-01-09',
                    effectiveTo: '2026-12-31',
                    source: 'https://www.fisheries.noaa.gov/bulletin/2026-atlantic-herring-management-area-1b-possession-limit-adjustment',
                    notes: 'Area 1B: 2,000 lb per trip/day when 92% sub-ACL projected (effective Jan 9, 2026).'
                },
                {
                    area: 'area-1a',
                    limitLb: 2000,
                    effectiveFrom: '2026-01-01',
                    effectiveTo: '2026-07-19',
                    source: 'https://asmfc.org/news/press-releases/atlantic-herring-area-1a-effort-controls-2026/',
                    notes: 'Area 1A: 2,000 lb per trip until ASMFC/NOAA effort controls adjust (verify bulletin).'
                }
            ]
        }
    },
    'atlantic-salmon': {
        cfr: '50 CFR 648.40',
        eeZProhibited: true,
        notes: 'Possession in the EEZ is prohibited except fish being sorted on deck; incidental catch must be released.'
    },
    'king-mackerel': {
        cfr: '50 CFR 622.382',
        recreational: { count: 3, unit: 'fish per person per day', notes: 'Atlantic migratory group — 3 fish/person/day.' }
    },
    'spanish-mackerel': {
        cfr: '50 CFR 622.382',
        recreational: { count: 15, unit: 'fish per person per day', notes: 'Atlantic migratory group — 15 fish/person/day.' }
    },
    'atlantic-mackerel': {
        cfr: '50 CFR 648.24',
        recreational: { count: 25, unit: 'fish per person per day', notes: '25 fish/person; squid/chub/butterfish unlimited.' }
    },
    'tautog': {
        cfr: '50 CFR 648.163',
        recreational: { count: null, notes: 'Federal recreational bag limit waived; state conservation equivalency measures apply.' },
        commercial: { count: null, notes: 'Commercial limits vary by season — verify NOAA Greater Atlantic bulletin.' }
    },
    'silver-hake': {
        cfr: '50 CFR 648.86',
        commercial: {
            meshLimits: {
                'mesh-under-3': { count: 15000, unit: 'lbs combined silver/offshore hake' },
                'mesh-3-plus-gom-gb': { count: 30000, unit: 'lbs' },
                'mesh-3-plus-sne-ma': { count: 40000, unit: 'lbs' }
            },
            incidentalReductionLb: 2000
        }
    },
    'skate-complex': {
        cfr: '50 CFR 648.322',
        commercial: {
            dasWingLimits: {
                season1: { months: [5, 6, 7, 8], limitLb: 4000, unit: 'skate wings per trip' },
                season2: { months: [9, 10, 11, 12, 1, 2, 3, 4], limitLb: 6000, unit: 'skate wings per trip' },
                incidentalLb: 500
            },
            nonDasLb: 625
        }
    }
};

const SKATE_SPECIES_IDS = new Set(['skate', 'thorny-skate', 'smooth-skate', 'barndoor-skate']);

function parseAssessmentDate(speciesData) {
    const raw = speciesData?.dateOfCatch || speciesData?.assessmentDate;
    if (raw) {
        const d = new Date(raw);
        if (!Number.isNaN(d.getTime())) return d;
    }
    if (typeof window !== 'undefined' && window.dateManager?.getAssessmentDate) {
        const d = window.dateManager.getAssessmentDate();
        if (d) return d instanceof Date ? d : new Date(d);
    }
    return new Date();
}

function isDateInRange(date, fromIso, toIso) {
    const t = date.getTime();
    if (fromIso && t < new Date(fromIso).getTime()) return false;
    if (toIso && t > new Date(toIso + 'T23:59:59').getTime()) return false;
    return true;
}

function getHerringAreaLimitLb(area, assessmentDate) {
    const cfg = FISHERY_QUOTA_STATUS['atlantic-herring']?.commercial?.areaPossessionAdjustments;
    if (!cfg || !area) return null;
    const d = assessmentDate || new Date();
    const match = cfg.find(a => a.area === area && isDateInRange(d, a.effectiveFrom, a.effectiveTo));
    return match ? match.limitLb : null;
}

function getSkateWingTripLimitLb(assessmentDate) {
    const cfg = FISHERY_QUOTA_STATUS['skate-complex']?.commercial?.dasWingLimits;
    if (!cfg) return null;
    const month = (assessmentDate || new Date()).getMonth() + 1;
    if (cfg.season1.months.includes(month)) return cfg.season1.limitLb;
    if (cfg.season2.months.includes(month)) return cfg.season2.limitLb;
    return cfg.season2.limitLb;
}

function getSilverHakeLimitLb(speciesData) {
    const cfg = FISHERY_QUOTA_STATUS['silver-hake']?.commercial?.meshLimits;
    if (!cfg) return null;
    const mesh = speciesData.meshSize || speciesData.meshSizeCompliance;
    const area = speciesData.exemptionArea || speciesData.fishingArea;
    if (mesh === 'mesh-under-3' || mesh === 'under-3') return cfg['mesh-under-3'].count;
    if (mesh === 'mesh-3-plus-sne-ma' || area === 'sne-ma') return cfg['mesh-3-plus-sne-ma'].count;
    if (mesh === 'mesh-3-plus-gom-gb' || mesh === 'mesh-3-plus' || area === 'gom-gb') {
        return cfg['mesh-3-plus-gom-gb'].count;
    }
    return cfg['mesh-under-3'].count;
}

function isRestrictedFishingDay(date) {
    const cfg = FISHERY_QUOTA_STATUS['bluefin-tuna'];
    if (!cfg) return false;
    const month = date.getMonth() + 1;
    if (!cfg.rfdMonths.includes(month)) return false;
    const day = date.toLocaleDateString('en-US', { weekday: 'long' });
    return cfg.rfdDays.includes(day);
}

/**
 * Commercial BFT daily retention (large medium / giant) by permit and assessment date.
 */
function getBFTCommercialDailyLimit(permitType, assessmentDate, speciesData) {
    if (!permitType || !permitType.startsWith('commercial')) return { count: null, prohibited: false };

    const status = FISHERY_QUOTA_STATUS['bluefin-tuna']?.commercial?.[permitType];
    if (status?.status === 'CLOSED') {
        return { count: 0, prohibited: true, message: status.notes || 'Commercial category closed.' };
    }
    if (status?.status === 'IBQ') {
        return { count: null, prohibited: false, message: status.notes };
    }

    const d = assessmentDate || new Date();
    const month = d.getMonth() + 1;

    if (typeof isClosureActive === 'function' && isClosureActive('bluefin-tuna', 'commercial')) {
        if (permitType === 'commercial-general') {
            return {
                count: 0,
                prohibited: true,
                message: 'General Category commercial fishery CLOSED (Jan 14–Mar 31, 2026) for large medium/giant BFT.'
            };
        }
    }

    if (speciesData?.restrictedFishingDay === true || isRestrictedFishingDay(d)) {
        if (['commercial-general', 'commercial-harpoon'].includes(permitType) && month >= 7 && month <= 11) {
            return { count: 0, prohibited: true, message: 'Restricted Fishing Day — 0 large medium/giant BFT.' };
        }
    }

    if (permitType === 'commercial-general') {
        if (month === 6) return { count: 3, prohibited: false };
        if (month === 7 || month === 8) return { count: 1, prohibited: false };
        if (month >= 4 && month <= 11) return { count: 1, prohibited: false };
    }
    if (permitType === 'commercial-harpoon') {
        return { count: 5, prohibited: false, subLimit: { maxLargeMedium: 2 } };
    }
    if (permitType === 'commercial-trap') {
        return { count: 1, prohibited: false, annual: true };
    }
    if (permitType === 'commercial-charter-headboat') {
        return { count: null, prohibited: false, message: 'With commercial sale endorsement — follow General Category limits.' };
    }

    return { count: null, prohibited: false };
}

function getCommercialPossessionLimit(speciesId, permitType, speciesData) {
    const d = parseAssessmentDate(speciesData);

    if (speciesId === 'bluefin-tuna' && permitType?.startsWith('commercial')) {
        const bft = getBFTCommercialDailyLimit(permitType, d, speciesData);
        return { count: bft.count, prohibited: bft.prohibited, message: bft.message };
    }

    if (speciesId === 'atlantic-salmon') {
        return { count: 0, prohibited: true, message: 'Atlantic salmon possession prohibited in EEZ (50 CFR 648.40).' };
    }

    if (speciesId === 'atlantic-herring' && permitType === 'commercial') {
        const area = speciesData.fishingArea;
        const lb = getHerringAreaLimitLb(area, d);
        if (lb != null) return { count: lb, prohibited: false, unit: 'lbs' };
    }

    if (SKATE_SPECIES_IDS.has(speciesId) && permitType === 'commercial') {
        const lb = getSkateWingTripLimitLb(d);
        if (lb != null) return { count: lb, prohibited: false, unit: 'lbs skate wings' };
    }

    if (speciesId === 'silver-hake' && permitType === 'commercial') {
        const lb = getSilverHakeLimitLb(speciesData);
        if (lb != null) return { count: lb, prohibited: false, unit: 'lbs' };
    }

    if (speciesId === 'king-mackerel' && permitType === 'recreational') {
        return { count: 3, prohibited: false };
    }
    if (speciesId === 'spanish-mackerel' && permitType === 'recreational') {
        return { count: 15, prohibited: false };
    }

    if (speciesId === 'atlantic-sea-scallop' && typeof getScallop648PossessionLimit === 'function') {
        const sc = getScallop648PossessionLimit(permitType, speciesData);
        if (sc?.count != null || sc?.prohibited) {
            return {
                count: sc.count,
                prohibited: !!sc.prohibited,
                unit: sc.unit,
                message: sc.message || sc.notes || null
            };
        }
    }

    if (typeof getSurfClam648PossessionLimit === 'function' && (speciesId === 'surf-clam' || speciesId === 'ocean-quahog')) {
        const clam = getSurfClam648PossessionLimit(speciesId, permitType, speciesData);
        if (clam?.count != null || clam?.prohibited) {
            return {
                count: clam.count,
                prohibited: !!clam.prohibited,
                unit: clam.unit,
                message: clam.notes || null
            };
        }
    }

    if (typeof getSmb648PossessionLimit === 'function') {
        const smb = getSmb648PossessionLimit(speciesId, permitType, speciesData);
        if (smb?.count != null || smb?.prohibited) {
            return {
                count: smb.count,
                prohibited: !!smb.prohibited,
                unit: smb.unit,
                message: smb.notes || smb.message || null
            };
        }
    }

    const recCfg = FISHERY_QUOTA_STATUS[speciesId]?.recreational;
    if (permitType === 'recreational' && recCfg?.count != null) {
        return { count: recCfg.count, prohibited: recCfg.count === 0 };
    }

    return { count: null, prohibited: false };
}

function isCommercialFisheryClosed(speciesId, permitType, speciesData) {
    const lim = getCommercialPossessionLimit(speciesId, permitType, speciesData);
    return lim.prohibited === true && lim.count === 0;
}

if (typeof window !== 'undefined') {
    window.FISHERY_QUOTA_STATUS = FISHERY_QUOTA_STATUS;
    window.getBFTCommercialDailyLimit = getBFTCommercialDailyLimit;
    window.getCommercialPossessionLimit = getCommercialPossessionLimit;
    window.getHerringAreaLimitLb = getHerringAreaLimitLb;
    window.getSkateWingTripLimitLb = getSkateWingTripLimitLb;
    window.getSilverHakeLimitLb = getSilverHakeLimitLb;
    window.isCommercialFisheryClosed = isCommercialFisheryClosed;
    window.parseAssessmentDate = parseAssessmentDate;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        FISHERY_QUOTA_STATUS,
        SKATE_SPECIES_IDS,
        parseAssessmentDate,
        getHerringAreaLimitLb,
        getSkateWingTripLimitLb,
        getSilverHakeLimitLb,
        getBFTCommercialDailyLimit,
        getCommercialPossessionLimit,
        isCommercialFisheryClosed
    };
}
