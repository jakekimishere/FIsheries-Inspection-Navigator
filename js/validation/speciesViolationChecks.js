/**
 * Species violation checks — grouped assessments + dedicated species rules.
 */

function getAssessmentRef() {
    if (typeof window !== 'undefined' && window.assessmentData) {
        return window.assessmentData;
    }
    if (typeof globalThis !== 'undefined' && globalThis.assessmentData) {
        return globalThis.assessmentData;
    }
    try {
        if (typeof assessmentData !== 'undefined' && assessmentData) {
            return assessmentData;
        }
    } catch (e) {
        /* assessmentData may be undeclared in Node validators */
    }
    return { vessel: {}, species: {} };
}

function checkAllViolations() {
    const allViolations = [];
    
    // First, save any unsaved possession data
    if (typeof saveGroupedStepData === 'function') {
        saveGroupedStepData('possession');
    }
    
    // Check individual species violations
    const speciesIds = getSelectedSpeciesIds();
    speciesIds.forEach(speciesId => {
        const species = SPECIES_DATA[speciesId];
        if (!species) return;
        
        const rawData = getAssessmentRef().species[speciesId] || {};
        const speciesData = normalizeSpeciesAssessmentData(speciesId, species, rawData);
        const violations = checkSpeciesViolations(speciesId, species, speciesData);
        allViolations.push(...violations);
    });
    
    // Check combined possession limits (run once after all species)
    if (typeof shareCombinedLimit === 'function' && typeof window.validators !== 'undefined' && window.validators.checkCombinedPossessionLimits) {
        const combinedViolations = window.validators.checkCombinedPossessionLimits(speciesIds);
        allViolations.push(...combinedViolations);
    }
    
    return [...new Set(allViolations)];
}

/** Fish/lbs count from grouped or dynamic assessment fields. */
function getSpeciesPossessionCount(speciesData) {
    if (typeof AssessmentViolations !== 'undefined' && AssessmentViolations.getCountFromData) {
        return AssessmentViolations.getCountFromData(speciesData);
    }
    if (!speciesData) return null;
    const fields = [
        speciesData.possessionAmount,
        speciesData.numberOfFish,
        speciesData.numberOfSharks,
        speciesData['possession-amount'],
        speciesData['number-of-fish']
    ];
    for (const val of fields) {
        if (val !== undefined && val !== null && val !== '') {
            const n = Number(val);
            return Number.isFinite(n) ? n : 0;
        }
    }
    return null;
}

/** Align dynamic assessment fields (permitType, numberOfFish) with grouped checks. */
function normalizeSpeciesAssessmentData(speciesId, species, speciesData) {
    const data = { ...speciesData };
    const count = getSpeciesPossessionCount(data);
    if (count !== null && data.possessionAmount === undefined) {
        data.possessionAmount = count;
    }
    if (data.permitType && !data['permit-type']) {
        data['permit-type'] = data.permitType;
    }
    if (data.permitType && (data['has-permit'] === undefined || data['has-permit'] === '')) {
        data['has-permit'] = 'yes';
    }
    return data;
}

// Check if species is prohibited (data-driven — all species with zero retention / protected status)
function isProhibitedSpecies(speciesId) {
    if (typeof AssessmentViolations !== 'undefined') {
        return AssessmentViolations.isProhibitedSpecies(speciesId);
    }
    const entry = typeof SPECIES_DATA !== 'undefined' && SPECIES_DATA[speciesId];
    return !!(entry && entry.prohibited);
}

function mapPermitTypeToPossessionKey(permitType) {
    if (typeof AssessmentViolations !== 'undefined') {
        return AssessmentViolations.mapPermitTypeToPossessionKey(permitType);
    }
    if (!permitType) return null;
    if (permitType.startsWith('commercial')) return 'commercial';
    if (permitType.startsWith('recreational')) return 'recreational';
    return permitType;
}

/** Evaluate assessmentQuestions.violation rules (all dynamic species). */
function checkAssessmentQuestionViolations(speciesId, species, speciesData) {
    if (typeof AssessmentViolations !== 'undefined') {
        return AssessmentViolations.evaluateAssessmentQuestionViolations(speciesId, species, speciesData);
    }
    return [];
}

function getStoredDynamicViolations(speciesId) {
    const assessmentRef = getAssessmentRef();
    const fromState = window.appState && window.appState.getAssessmentData
        ? window.appState.getAssessmentData(`violations.${speciesId}`)
        : null;
    const list = fromState || assessmentRef?.violations?.[speciesId];
    return Array.isArray(list) ? list : [];
}

// Check violations for a species
function checkSpeciesViolations(speciesId, species, speciesData) {
    const violations = [];
    
    // Safety check: ensure species exists
    if (!species) {
        console.warn(`Species data not found for ${speciesId}`);
        return violations;
    }
    
    try {
        const data = normalizeSpeciesAssessmentData(speciesId, species, speciesData);
        const regs = species.regulations;
        const speciesName = species.name ? species.name.toLowerCase() : speciesId.replace(/-/g, ' ');
        const assessmentRef = getAssessmentRef();
        const permitOk = data['has-permit'] === 'yes' || !!data.permitType;

        violations.push(...checkAssessmentQuestionViolations(speciesId, species, data));
        violations.push(...getStoredDynamicViolations(speciesId));
        
        // Check for prohibited species - ANY possession is a violation
        if (isProhibitedSpecies(speciesId)) {
            const possessionCount = getSpeciesPossessionCount(data) || 0;
            if (possessionCount > 0) {
                violations.push(`PROHIBITED SPECIES: ${species.name || speciesName} — retention/possession prohibited (50 CFR 635.23)`);
            }
        }
        
        // Permit violations
        if (data['has-permit'] === 'no') {
            const cfr = regs?.permits && Object.values(regs.permits).length > 0 ? 
                Object.values(regs.permits)[0]?.cfr : null;
            violations.push(`No valid federal ${speciesName} permit${cfr ? ` (${cfr})` : ''}`);
        } else if (data['has-permit'] === 'expired') {
            violations.push(`Expired federal ${speciesName} permit`);
        }
        
        if (permitOk && regs) {
            if (!isProhibitedSpecies(speciesId)) {
                const possessionViolations = checkPossessionViolations(speciesId, species, data);
                violations.push(...possessionViolations);
            }
            
            if (data['size-compliant'] === 'no') {
                const cfr = regs.size?.cfr || regs.size?.commercialCFR;
                violations.push(`Undersized ${speciesName} present${cfr ? ` (${cfr})` : ''}`);
            }

            if (data.lowerJawForkLength != null && data.lowerJawForkLength !== '' && regs.size?.minimum) {
                const ljfl = Number(data.lowerJawForkLength);
                if (Number.isFinite(ljfl) && ljfl < regs.size.minimum) {
                    violations.push(`Undersized ${speciesName}: ${ljfl}" below ${regs.size.minimum}" minimum (${regs.size.cfr || 'size limit'})`);
                }
            }
            
            const gearViolations = checkGearViolations(speciesId, species, data);
            violations.push(...gearViolations);
            
            if (speciesId === 'atlantic-sea-scallop') {
                const additionalViolations = checkScallopAdditionalViolations(data);
                violations.push(...additionalViolations);
            }
            
            if (regs.reporting && regs.reporting.required) {
                const hmsReported = assessmentRef.vessel?.requirements?.['hms-reported'] || data['hms-reported'];
                if (hmsReported === 'no') {
                    violations.push(`HMS catch reporting required but not completed for ${speciesName} (${regs.reporting.cfr})`);
                }
            }
        }
    } catch (error) {
        console.error(`Error checking violations for ${speciesId}:`, error);
        const speciesName = species?.name || speciesId;
        violations.push(`Error checking compliance for ${speciesName} - manual verification required`);
    }
    
    return [...new Set(violations)];
}

// Check possession limits from regulations.possession[permitType] (dynamic HMS assessments)
function checkRegulationPossessionLimits(speciesId, species, speciesData) {
    const violations = [];
    const permitType = speciesData.permitType || speciesData['permit-type'];
    const possessionRules = species.regulations?.possession;
    if (!possessionRules || !permitType) return violations;

    const possessionKey = possessionRules[permitType]
        ? permitType
        : mapPermitTypeToPossessionKey(permitType);
    const rule = possessionKey ? possessionRules[possessionKey] : null;
    if (!rule) return violations;

    const count = getSpeciesPossessionCount(speciesData);
    if (count === null) return violations;

    if (rule.prohibited && count > 0) {
        violations.push(`PROHIBITED: ${species.name} retention not allowed under ${rule.name || permitType} (${rule.cfr || ''})`);
        return violations;
    }

    const lim = rule.limit;
    if (lim && typeof lim === 'object' && lim.count != null && count > lim.count) {
        violations.push(`${species.name} possession exceeds limit: ${count} vs ${lim.count} ${lim.unit || rule.unit || 'fish'} (${rule.cfr || ''})`);
    }
    return violations;
}

// Check limits from assessmentQuestions.possessionLimitCheck (swordfish, etc.)
function checkAssessmentQuestionLimits(speciesId, species, speciesData) {
    const violations = [];
    const limitCheck = species.regulations?.assessmentQuestions?.possessionLimitCheck;
    if (!limitCheck?.limits) return violations;

    const permitType = speciesData.permitType || speciesData['permit-type'];
    const count = getSpeciesPossessionCount(speciesData);
    if (count === null || !permitType) return violations;

    const limitRule = limitCheck.limits[permitType];
    if (limitRule === undefined || limitRule === null) return violations;

    const cfr = limitCheck.cfr || limitCheck.violation?.ifExceeds || '';

    if (limitRule.prohibited || (limitRule.count === 0 && count > 0)) {
        violations.push(`Possession prohibited for selected permit category${cfr ? ` (${cfr})` : ''}`);
    } else if (limitRule.count != null && count > limitRule.count) {
        violations.push(`Possession exceeds limit: ${count} vs ${limitRule.count} ${limitRule.unit || 'fish'}${cfr ? ` (${cfr})` : ''}`);
    }
    return violations;
}

// Check possession violations
function checkPossessionViolations(speciesId, species, speciesData) {
    const violations = [];
    
    if (!species) return violations;
    if (getSpeciesPossessionCount(speciesData) === null) return violations;
    
    try {
        if (speciesId === 'summer-flounder') {
            violations.push(...checkSummerFlounderPossession(species, speciesData));
        } else if (speciesId === 'atlantic-sea-scallop') {
            violations.push(...checkScallopPossession(species, speciesData));
        } else if (speciesId === 'bluefin-tuna') {
            violations.push(...checkBluefinTunaPossession(species, speciesData));
        } else if (speciesId === 'atlantic-cod' || speciesId === 'haddock') {
            violations.push(...checkGroundfishPossession(speciesId, species, speciesData));
        } else if (isMultispecies(speciesId)) {
            violations.push(...checkMultispeciesGroupedPossession(speciesId, species, speciesData));
        }

        const hasDedicatedPossessionCheck = [
            'summer-flounder', 'atlantic-sea-scallop', 'bluefin-tuna', 'atlantic-cod', 'haddock'
        ].includes(speciesId);
        if (species.regulations?.possession && !hasDedicatedPossessionCheck) {
            violations.push(...checkRegulationPossessionLimits(speciesId, species, speciesData));
        }
        violations.push(...checkAssessmentQuestionLimits(speciesId, species, speciesData));
    } catch (error) {
        console.error(`Error checking possession violations for ${speciesId}:`, error);
        violations.push(`Error checking possession limits - manual verification required`);
    }
    
    return violations;
}

// Display combined limit warnings in possession section
function displayCombinedLimitWarnings() {
    if (typeof shareCombinedLimit !== 'function') return;
    
    // Use global references to avoid circular reference issues
    const assessmentDataRef = window.assessmentData;
    const selectedSpeciesIds = window.selectedSpecies || [];
    
    if (!assessmentDataRef) {
        console.warn('assessmentData not available for combined limit warnings');
        return;
    }
    
    // Check each permit type
    const permitTypes = ['commercial', 'recreational', 'charter-headboat'];
    
    permitTypes.forEach(permitType => {
        // Get species with this permit type
        const speciesWithPermit = selectedSpeciesIds.filter(speciesId => {
            const speciesData = assessmentDataRef.species[speciesId];
            return speciesData && speciesData['permit-type'] === permitType;
        });
        
        if (speciesWithPermit.length === 0) return;
        
        // Check for combined limits
        const combinedLimitGroups = shareCombinedLimit(speciesWithPermit, permitType);
        
        combinedLimitGroups.forEach(groupData => {
            const { group, species, limit } = groupData;
            
            if (!limit || !limit.limit) return;
            
            // Create warning display for this group
            const warningId = `combined-limit-warning-${group.id}-${permitType}`;
            let warningDiv = document.getElementById(warningId);
            
            if (!warningDiv) {
                // Find the first species in the group to attach the warning
                const firstSpeciesId = species[0];
                const firstSpeciesGroup = document.querySelector(`[data-species="${firstSpeciesId}"]`);
                
                if (firstSpeciesGroup) {
                    warningDiv = document.createElement('div');
                    warningDiv.id = warningId;
                    warningDiv.className = 'combined-limit-warning';
                    warningDiv.style.cssText = 'background: #fff3cd; border: 2px solid #ffc107; border-radius: 6px; padding: 12px; margin: 10px 0;';
                    firstSpeciesGroup.insertBefore(warningDiv, firstSpeciesGroup.firstChild);
                }
            }
            
            if (warningDiv) {
                const speciesNames = species.map(id => {
                    const s = SPECIES_DATA[id];
                    return s ? s.name : id;
                }).join(', ');
                
                warningDiv.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                        <strong style="color: #856404;">⚠️ COMBINED LIMIT APPLIES</strong>
                    </div>
                    <p style="margin: 0; color: #856404; font-size: 14px;">
                        <strong>${group.name}:</strong> ${limit.limit.count} ${limit.limit.unit} total limit for: ${speciesNames}
                    </p>
                    <p style="margin: 4px 0 0 0; color: #856404; font-size: 12px; font-style: italic;">
                        ${limit.notes || ''} ${limit.cfr ? `(${limit.cfr})` : ''}
                    </p>
                    <div id="${warningId}-current-total" style="margin-top: 8px; font-weight: bold; color: #856404;">
                        Current Total: 0 ${limit.limit.unit}
                    </div>
                `;
            }
        });
    });
    
    // Update current totals
    updateCombinedLimitDisplay();
}

// Update combined limit display with current totals
function updateCombinedLimitDisplay() {
    if (typeof shareCombinedLimit !== 'function') return;
    
    // Use global references to avoid circular reference issues
    const assessmentDataRef = window.assessmentData;
    const selectedSpeciesIds = window.selectedSpecies || [];
    
    if (!assessmentDataRef) {
        return;
    }
    
    // Check each permit type
    const permitTypes = ['commercial', 'recreational', 'charter-headboat'];
    
    permitTypes.forEach(permitType => {
        // Get species with this permit type
        const speciesWithPermit = selectedSpeciesIds.filter(speciesId => {
            const speciesData = assessmentDataRef.species[speciesId];
            return speciesData && speciesData['permit-type'] === permitType;
        });
        
        if (speciesWithPermit.length === 0) return;
        
        // Check for combined limits
        const combinedLimitGroups = shareCombinedLimit(speciesWithPermit, permitType);
        
        combinedLimitGroups.forEach(groupData => {
            const { group, species, limit } = groupData;
            
            if (!limit || !limit.limit) return;
            
            const warningId = `combined-limit-warning-${group.id}-${permitType}`;
            const totalDisplay = document.getElementById(`${warningId}-current-total`);
            
            if (totalDisplay) {
                // Calculate current total
                let totalPossession = 0;
                
                species.forEach(speciesId => {
                    const amountInput = document.getElementById(`${speciesId}-possession-amount-grouped`);
                    if (amountInput && amountInput.value) {
                        totalPossession += parseFloat(amountInput.value) || 0;
                    }
                });
                
                // Update display with color coding
                const isOverLimit = limit.limit.count && totalPossession > limit.limit.count;
                totalDisplay.style.color = isOverLimit ? '#dc2626' : '#856404';
                totalDisplay.innerHTML = `Current Total: <span style="font-weight: bold;">${totalPossession}</span> ${limit.limit.unit} ${isOverLimit ? '<span style="color: #dc2626;">⚠️ EXCEEDS LIMIT</span>' : ''}`;
            }
        });
    });
}

// Make function globally accessible
if (typeof window !== 'undefined') {
    window.updateCombinedLimitDisplay = updateCombinedLimitDisplay;
}

// Check Summer Flounder possession
function checkSummerFlounderPossession(species, speciesData) {
    const violations = [];
    const regs = species.regulations;
    const permitType = speciesData['permit-type'];
    const meshStatus = speciesData['mesh-compliant'];
    
    if (permitType === 'commercial') {
        let limit = null;
        let cfr = '50 CFR 648.106(b)';
        
        if (meshStatus === 'yes') {
            // Large mesh - no limit
            limit = null;
        } else {
            // Small mesh - seasonal limits
            // Use date manager if available
            const date = (window.dateManager && window.dateManager.getAssessmentDate) 
                ? window.dateManager.getAssessmentDate() 
                : new Date();
            const month = date.getMonth() + 1;
            const seasonal = regs.possession['commercial-small-mesh'].seasonal;
            
            // Use date manager's seasonal limit function if available
            if (window.dateManager && window.dateManager.getSeasonalLimit) {
                limit = window.dateManager.getSeasonalLimit(seasonal);
            } else {
                // Fallback to month-based logic
                if (month >= 5 && month <= 10) {
                    limit = seasonal['may-oct'].limit;
                } else {
                    limit = seasonal['nov-apr'].limit;
                }
            }
        }
        
        if (limit !== null && speciesData.possessionAmount > limit) {
            violations.push(`Summer flounder possession exceeds limit: ${speciesData.possessionAmount} lbs vs ${limit} lbs limit (${cfr})`);
        }
    } else if (permitType === 'recreational') {
        const recLimit = regs.possession['recreational'].limit.count;
        if (speciesData.possessionAmount > recLimit) {
            const cfr = regs.possession['recreational'].cfr;
            violations.push(`Recreational possession exceeds limit: ${speciesData.possessionAmount} fish vs ${recLimit} fish limit${cfr ? ` (${cfr})` : ''}`);
        }
    }
    
    return violations;
}

// Check Bluefin Tuna possession
function checkBluefinTunaPossession(species, speciesData) {
    const violations = [];
    const regs = species.regulations;
    const permitType = speciesData['permit-type'];
    
    // Use date manager if available, otherwise fall back to current date
    const currentDate = (window.dateManager && window.dateManager.getAssessmentDate) 
        ? window.dateManager.getAssessmentDate() 
        : new Date();
    
    if (permitType === 'commercial') {
        // Check closures using date manager or fallback to hardcoded dates
        let isClosed = false;
        let closureInfo = null;
        
        if (typeof isClosureActive === 'function') {
            isClosed = isClosureActive('bluefin-tuna', 'commercial');
            closureInfo = getClosureInfo('bluefin-tuna', 'commercial');
        } else {
            // Fallback to hardcoded dates
            const closureStart = new Date('2026-01-14T23:30:00');
            const closureEnd = new Date('2026-03-31T23:59:59');
            isClosed = currentDate >= closureStart && currentDate <= closureEnd;
        }
        
        if (isClosed && speciesData.possessionAmount > 0) {
            const closurePeriod = closureInfo?.closures?.[0] 
                ? `${window.dateManager ? window.dateManager.formatDate(closureInfo.closures[0].startDate, 'short') : 'January 14'} - ${window.dateManager ? window.dateManager.formatDate(closureInfo.closures[0].endDate, 'short') : 'March 31'}`
                : 'January 14 - March 31, 2026';
            violations.push(`COMMERCIAL FISHERY CLOSED: Cannot retain, possess, or land large medium or giant bluefin tuna (≥73" CFL) during closure period (${closurePeriod}) (50 CFR 635.23)`);
        } else if (!isClosed) {
            // Check June-August limit if applicable
            const currentMonth = currentDate.getMonth() + 1;
            if (currentMonth >= 6 && currentMonth <= 8) {
                const possessionAmount = speciesData.possessionAmount || 0;
                if (possessionAmount > 1) {
                    violations.push(`Bluefin tuna possession exceeds limit: ${possessionAmount} fish vs 1 fish >73" CFL per vessel per day limit (June-August period) (50 CFR 635.23)`);
                }
            }
        }
    } else if (permitType === 'recreational' || permitType === 'charter-headboat') {
        const possessionAmount = speciesData.possessionAmount || 0;
        const limit = regs.possession[permitType]?.limit?.count || 1;
        if (possessionAmount > limit) {
            violations.push(`Bluefin tuna possession exceeds limit: ${possessionAmount} fish vs ${limit} fish per vessel per trip limit (50 CFR 635.23)`);
        }
    }
    
    return violations;
}

// Grouped multispecies: size compliance + cod/haddock-style trip limits when configured
function checkMultispeciesGroupedPossession(speciesId, species, speciesData) {
    const violations = [];
    if (speciesData['size-compliant'] === 'no') {
        const cfr = species.regulations?.size?.cfr || '50 CFR 648.83';
        violations.push(`Undersized ${species.name || speciesId} present (${cfr})`);
    }
    if (MULTISPECIES_TRIP_LIMIT_SPECIES && MULTISPECIES_TRIP_LIMIT_SPECIES.includes(speciesId)) {
        violations.push(...checkGroundfishPossession(speciesId, species, speciesData));
    } else if (typeof getGroundfishTripLimit === 'function') {
        violations.push(...checkGroundfishPossession(speciesId, species, speciesData));
    }
    const rec = species.regulations?.possession?.recreational;
    const count = getSpeciesPossessionCount(speciesData);
    if (count !== null && rec?.limit?.count != null && count > rec.limit.count) {
        violations.push(`${species.name} recreational possession exceeds ${rec.limit.count} ${rec.limit.unit || 'fish'} (${rec.cfr || '50 CFR 648.83'})`);
    }
    return violations;
}

const MULTISPECIES_TRIP_LIMIT_SPECIES = ['atlantic-cod', 'haddock'];

// Check Northeast multispecies common pool trip limits (cod, haddock)
function checkGroundfishPossession(speciesId, species, speciesData) {
    const violations = [];
    const amount = Number(speciesData.possessionAmount || speciesData['possession-amount'] || 0);
    if (!amount || amount <= 0) return violations;

    const assessmentRef = getAssessmentRef();
    const vesselCategory = speciesData.vesselCategory || speciesData['vessel-category']
        || speciesData.vesselClassification
        || assessmentRef.vessel?.multispecies?.classification
        || assessmentRef.vesselClassification;
    if (vesselCategory !== 'common-pool') return violations;

    const stockArea = speciesData.fishingArea || speciesData['fishing-area'];
    const dasCategory = speciesData.dasCategory || speciesData['das-category'];
    if (!stockArea) return violations;

    if (typeof getGroundfishTripLimit !== 'function') return violations;

    const limitInfo = getGroundfishTripLimit(speciesId, stockArea, dasCategory);
    if (!limitInfo) return violations;

    if (limitInfo.prohibited) {
        violations.push(`${species.name}: possession prohibited in ${limitInfo.label || stockArea} (50 CFR 648.86)`);
        return violations;
    }

    const tripMax = limitInfo.perTrip;
    if (tripMax != null && amount > tripMax) {
        violations.push(`${species.name} possession exceeds trip limit: ${amount} lbs vs ${tripMax} lbs (${stockArea}, ${dasCategory || 'DAS category'}) (50 CFR 648.86)`);
    }

    return violations;
}

// Check Scallop possession
function checkScallopPossession(species, speciesData) {
    const violations = [];
    const regs = species.regulations;
    const permitType = speciesData['permit-type'] || speciesData.permitType;

    const fishingArea = speciesData.fishingArea || speciesData['fishing-area'];
    if (fishingArea === 'closed-area') {
        violations.push('Scallop fishing prohibited in closed areas (50 CFR 648.60)');
        return violations;
    }

    if (permitType === 'recreational') {
        const amount = speciesData.possessionAmountStandard || speciesData.possessionAmount || 0;
        if (amount > 0) {
            violations.push('Recreational scallop retention prohibited (50 CFR 648 Subpart D)');
        }
        return violations;
    }

    if (typeof resolveScallop648Limits === 'function') {
        const resolved = resolveScallop648Limits(permitType, speciesData);
        if (resolved?.prohibited) {
            violations.push('Recreational scallop retention prohibited (50 CFR 648 Subpart D)');
            return violations;
        }
        if (resolved?.unlimited) {
            return violations;
        }
        if (resolved?.limits) {
            return violations.concat(checkScallopLimitExceeded(resolved.limits, speciesData, resolved.context, resolved.cfr));
        }
    }

    if (permitType && regs.possession[permitType]) {
        const possEntry = regs.possession[permitType];
        const onDas = speciesData.onScallopDas === 'yes' || speciesData['on-scallop-das'] === 'yes';
        if (possEntry.unlimitedOnDas && onDas) {
            return violations;
        }

        let limits = possEntry.limit;
        if (fishingArea === 'access-area' && possEntry.accessAreaTrip) {
            limits = possEntry.accessAreaTrip;
        }
        const cfr = possEntry.cfr;
        violations.push(...checkScallopLimitExceeded(limits, speciesData, fishingArea === 'access-area' ? 'access area trip' : null, cfr));
    }

    return violations;
}

function checkScallopLimitExceeded(limits, speciesData, contextNote, cfr) {
    const violations = [];
    if (!limits) return violations;

    const possessionAmount = speciesData.possessionAmountStandard || speciesData.possessionAmount || 0;
    const possessionType = speciesData.possessionType || speciesData['possession-type'] || 'shucked';

    let exceeded = false;
    let limitText = '';

    if (possessionType === 'shucked' && limits.shucked != null) {
        if (possessionAmount > limits.shucked) {
            exceeded = true;
            limitText = `${possessionAmount} lbs shucked vs ${limits.shucked} lbs limit`;
        }
    } else if (possessionType === 'inshell' && limits.inshell != null) {
        const actualInshell = speciesData.possessionAmount || possessionAmount;
        if (actualInshell > limits.inshell) {
            exceeded = true;
            limitText = `${actualInshell} lbs in-shell vs ${limits.inshell} lbs limit`;
        }
    } else if (limits.shucked != null && possessionAmount > limits.shucked) {
        exceeded = true;
        limitText = `${possessionAmount} lbs vs ${limits.shucked} lbs shucked limit`;
    }

    if (exceeded) {
        const areaNote = contextNote ? ` (${contextNote})` : '';
        violations.push(`Scallop possession exceeds limit: ${limitText}${areaNote}${cfr ? ` (${cfr})` : ''}`);
    }

    return violations;
}

// Check gear violations
function checkGearViolations(speciesId, species, speciesData) {
    const violations = [];
    
    try {
        if (speciesId === 'summer-flounder') {
            if (speciesData['mesh-compliant'] === 'no') {
                violations.push(`Non-compliant mesh size (50 CFR 648.106)`);
            }
        } else if (speciesId === 'atlantic-sea-scallop') {
            if (speciesData['dredge-compliant'] === 'no') {
                violations.push(`Non-compliant dredge specifications (50 CFR 648.51)`);
            }
            if (speciesData['trawl-compliant'] === 'no') {
                violations.push(`Non-compliant trawl gear specifications`);
            }
        }
    } catch (error) {
        console.error(`Error checking gear violations for ${speciesId}:`, error);
        violations.push(`Error checking gear compliance - manual verification required`);
    }
    
    return violations;
}

// Check scallop additional violations
function checkScallopAdditionalViolations(speciesData) {
    const violations = [];
    
    try {
        if (speciesData['vms-operational'] === 'no') {
            violations.push(`VMS not operational (50 CFR 648.10)`);
        }
        
        if (speciesData['observer-present'] === 'no') {
            violations.push(`Required observer not present (50 CFR 648.11)`);
        }
        
        if (speciesData['tdd-installed'] === 'no') {
            violations.push(`Turtle Deflector Dredge not installed when required (50 CFR 223.206)`);
        }
    } catch (error) {
        console.error('Error checking scallop additional violations:', error);
        violations.push('Error checking additional requirements - manual verification required');
    }
    
    return violations;
}
