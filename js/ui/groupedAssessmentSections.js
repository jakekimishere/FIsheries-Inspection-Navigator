/**
 * Grouped assessment UI sections.
 */
function speciesPolicyContextHtml(speciesId, stepName) {
    if (typeof SpeciesPolicyAdvisor === 'undefined' || !SpeciesPolicyAdvisor.renderPolicyContextBlock) {
        return '';
    }
    return SpeciesPolicyAdvisor.renderPolicyContextBlock(speciesId, stepName);
}

function createGroupedPermitsSection(container) {
    const section = document.createElement('section');
    section.className = 'step-section grouped-assessment';
    section.id = 'grouped-permits';
    
    let html = `
        <div class="grouped-header">
            <h2>Federal Permits Assessment</h2>
            <p class="grouped-subtitle">Check permits for all species found on board</p>
        </div>
        
        ${generateQuickReference('permits')}
    `;
    
    // Group species by permit type
    const multispeciesSelected = selectedSpecies.filter(id => isMultispecies(id));
    const otherSpeciesSelected = selectedSpecies.filter(id => !isMultispecies(id));
    
    // Handle multispecies permit (if any multispecies are selected)
        if (multispeciesSelected.length > 0) {
            html += `
            <div class="species-permit-group multispecies-group" data-species="multispecies">
                <h3>Northeast Multispecies Permit</h3>
                <p class="species-list">Covers: ${multispeciesSelected.map(id => SPECIES_DATA[id].name).join(', ')}</p>
                ${multispeciesSelected.map(id => speciesPolicyContextHtml(id, 'permits')).join('')}
                <p class="question">Does the vessel possess a valid Northeast Multispecies permit?</p>
                <div class="choice-group small">
                    <button class="choice-btn" data-species="multispecies" data-field="has-permit" data-value="yes" onclick="selectGroupedChoice('multispecies', this)">
                        <span class="choice-icon">✓</span>
                        Valid Permit
                    </button>
                    <button class="choice-btn" data-species="multispecies" data-field="has-permit" data-value="no" onclick="selectGroupedChoice('multispecies', this)">
                        <span class="choice-icon">✗</span>
                        No Permit
                    </button>
                    <button class="choice-btn" data-species="multispecies" data-field="has-permit" data-value="expired" onclick="selectGroupedChoice('multispecies', this)">
                        <span class="choice-icon">!</span>
                        Expired
                    </button>
                </div>
            </div>
        `;
    }
    
    // Handle individual species permits
    otherSpeciesSelected.forEach(speciesId => {
        const species = SPECIES_DATA[speciesId];
        if (!species) {
            console.error(`Species data not found for ${speciesId}`);
            return; // Skip this species
        }
        
        const speciesName = species.name || speciesId.replace(/-/g, ' ');
        
        html += `
            <div class="species-permit-group" data-species="${speciesId}">
                <h3>${speciesName} Permits</h3>
                ${speciesPolicyContextHtml(speciesId, 'permits')}
                <p class="question">Does the vessel possess a valid federal ${speciesName.toLowerCase()} permit?</p>
                <div class="choice-group small">
                    <button class="choice-btn" data-species="${speciesId}" data-field="has-permit" data-value="yes" onclick="selectGroupedChoice('${speciesId}', this)">
                        <span class="choice-icon">✓</span>
                        Valid Permit
                    </button>
                    <button class="choice-btn" data-species="${speciesId}" data-field="has-permit" data-value="no" onclick="selectGroupedChoice('${speciesId}', this)">
                        <span class="choice-icon">✗</span>
                        No Permit
                    </button>
                    <button class="choice-btn" data-species="${speciesId}" data-field="has-permit" data-value="expired" onclick="selectGroupedChoice('${speciesId}', this)">
                        <span class="choice-icon">!</span>
                        Expired
                    </button>
                </div>
                
                <div class="permit-type-section" id="${speciesId}-permit-types" style="display: none;">
                    <h4>Permit Type</h4>
                    <div class="choice-group small" id="${speciesId}-permit-options">
                        <!-- Will be populated based on species -->
                    </div>
                </div>
            </div>
        `;
    });
    
    html += `
        <div class="nav-buttons">
            <button class="btn-secondary" onclick="prevGroupedStep('permits')">← Back</button>
            <button class="btn-primary" onclick="nextGroupedStep('permits')">Continue to Possession →</button>
        </div>
    `;
    
    section.innerHTML = html;
    container.appendChild(section);
    
    // Populate permit options for non-multispecies
    otherSpeciesSelected.forEach(speciesId => {
        populatePermitOptions(speciesId);
    });
    
    // Ensure the button can call nextGroupedStep - add direct event listener as backup
    setTimeout(() => {
        const continueBtn = section.querySelector('button.btn-primary');
        if (continueBtn && continueBtn.textContent.includes('Continue to Possession')) {
            continueBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                // Ensure data is synced before calling
                if (window.assessmentData) {
                    assessmentData = window.assessmentData;
                }
                if (window.selectedSpecies) {
                    selectedSpecies = window.selectedSpecies;
                }
                
                // Try to call the function
                let funcToCall = null;
                if (typeof nextGroupedStep === 'function') {
                    funcToCall = nextGroupedStep;
                } else if (typeof window.nextGroupedStep === 'function') {
                    funcToCall = window.nextGroupedStep;
                } else {
                    console.error('nextGroupedStep function not found!');
                    alert('Error: nextGroupedStep function not available. Please refresh the page.');
                    return;
                }
                
                try {
                    funcToCall('permits');
                } catch (err) {
                    console.error('Error calling nextGroupedStep:', err);
                    alert('Error: ' + err.message);
                }
            });
        }
    }, 100);
}

// Create possession section (species-specific but grouped)
function createGroupedPossessionSection(container) {
    const section = document.createElement('section');
    section.className = 'step-section grouped-assessment';
    section.id = 'grouped-possession';
    
    let html = `
        <div class="grouped-header">
            <h2>Possession & Catch Assessment</h2>
            <p class="grouped-subtitle">Record quantities for all species on board</p>
        </div>
        
        ${generateQuickReference('possession')}
    `;
    
    selectedSpecies.forEach(speciesId => {
        const species = SPECIES_DATA[speciesId];
        if (!species) {
            console.error(`Species data not found for ${speciesId}`);
            return; // Skip this species
        }
        
        const speciesName = species.name || speciesId.replace(/-/g, ' ');
        
        html += `
            <div class="species-possession-group" data-species="${speciesId}">
                <h3>${speciesName} Possession</h3>
                ${speciesPolicyContextHtml(speciesId, 'possession')}
                <div id="${speciesId}-possession-inputs-grouped">
                    <!-- Will be populated based on species -->
                </div>
                <div class="limit-info" id="${speciesId}-limit-info-grouped"></div>
                
                ${isMultispecies(speciesId) ? `
                    <div class="multispecies-info">
                        <div class="info-note">
                            <strong>Multispecies Note:</strong> 
                            ${assessmentData.vessel.multispecies?.classification === 'sector' ? 
                                'Sector vessels must have sufficient ACE allocation for this species' : 
                                'Common pool vessels must comply with trip limits based on DAS category'}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    });
    
    html += `
        <div class="nav-buttons">
            <button class="btn-secondary" onclick="prevGroupedStep('possession')">← Back</button>
            <button class="btn-primary" onclick="nextGroupedStep('possession')">Continue to Size & Gear →</button>
        </div>
    `;
    
    section.innerHTML = html;
    container.appendChild(section);
    
    // Populate possession inputs for each species
    selectedSpecies.forEach(speciesId => {
        populateGroupedPossessionInputs(speciesId);
    });
    
    // Add combined limit warnings if applicable
    displayCombinedLimitWarnings();
    
    // Add event listeners for possession amount changes to update combined limits
    selectedSpecies.forEach(speciesId => {
        const amountInput = document.getElementById(`${speciesId}-possession-amount-grouped`);
        if (amountInput) {
            amountInput.addEventListener('input', () => {
                updateCombinedLimitDisplay();
            });
        }
    });
}

// Create size and gear section (combined for efficiency)
function createGroupedSizeGearSection(container) {
    const section = document.createElement('section');
    section.className = 'step-section grouped-assessment';
    section.id = 'grouped-size-gear';
    
    let html = `
        <div class="grouped-header">
            <h2>Size Compliance & Gear Assessment</h2>
            <p class="grouped-subtitle">Check size compliance and gear specifications</p>
        </div>
        
        ${generateQuickReference('size-gear')}
    `;
    
    selectedSpecies.forEach(speciesId => {
        const species = SPECIES_DATA[speciesId];
        if (!species) {
            console.error(`Species data not found for ${speciesId}`);
            return; // Skip this species
        }
        
        const speciesName = species.name || speciesId.replace(/-/g, ' ');
        
        html += `
            <div class="species-size-gear-group" data-species="${speciesId}">
                <h3>${speciesName}</h3>
                ${speciesPolicyContextHtml(speciesId, 'size-gear')}
                
                <!-- Size Compliance -->
                <div class="size-section">
                    <h4>Size Compliance</h4>
                    <div id="${speciesId}-size-info-grouped"></div>
                    <p class="question">Do the ${speciesName.toLowerCase()} meet minimum size requirements?</p>
                    <div class="choice-group small">
                        <button class="choice-btn" data-species="${speciesId}" data-field="size-compliant" data-value="yes" onclick="selectGroupedChoice('${speciesId}', this)">
                            <span class="choice-icon">✓</span>
                            Compliant
                        </button>
                        <button class="choice-btn" data-species="${speciesId}" data-field="size-compliant" data-value="no" onclick="selectGroupedChoice('${speciesId}', this)">
                            <span class="choice-icon">✗</span>
                            Undersized
                        </button>
                        <button class="choice-btn" data-species="${speciesId}" data-field="size-compliant" data-value="not-applicable" onclick="selectGroupedChoice('${speciesId}', this)">
                            <span class="choice-icon">—</span>
                            N/A
                        </button>
                    </div>
                </div>
                
                <!-- Gear Section -->
                <div class="gear-section">
                    <h4>Gear Compliance</h4>
                    <div id="${speciesId}-gear-content-grouped">
                        <!-- Will be populated based on species -->
                    </div>
                </div>
            </div>
        `;
    });
    
    const needsVesselRequirements = vesselRequirementsStepNeeded();
    html += `
        <div class="nav-buttons">
            <button class="btn-secondary" onclick="prevGroupedStep('size-gear')">← Back</button>
            <button class="btn-primary" onclick="nextGroupedStep('size-gear')">${needsVesselRequirements ? 'Continue to Vessel Requirements →' : 'Generate Report →'}</button>
        </div>
    `;
    
    section.innerHTML = html;
    container.appendChild(section);
    
    // Populate size info and gear content for each species
    selectedSpecies.forEach(speciesId => {
        populateGroupedSizeInfo(speciesId);
        populateGroupedGearContent(speciesId);
    });
}

// Create vessel requirements section (vessel-level checks)
function createGroupedVesselRequirementsSection(container) {
    const section = document.createElement('section');
    section.className = 'step-section grouped-assessment';
    section.id = 'grouped-vessel-requirements';
    
    // Check if any selected species require vessel-level checks
    const requiresVMS = selectedSpecies.includes('atlantic-sea-scallop');
    const requiresObserver = selectedSpecies.includes('atlantic-sea-scallop');
    const requiresTDD = selectedSpecies.includes('atlantic-sea-scallop');
    
    // Check for HMS reporting requirements
    const hmsReportingSpecies = ['bluefin-tuna', 'swordfish', 'billfish'];
    const requiresHMSReporting = selectedSpecies.some(id => hmsReportingSpecies.includes(id));
    
    let html = `
        <div class="grouped-header">
            <h2>Vessel Requirements Assessment</h2>
            <p class="grouped-subtitle">Check vessel-level compliance requirements</p>
        </div>
        
        ${generateQuickReference('vessel-requirements')}
    `;
    
    if (requiresVMS || requiresObserver || requiresTDD || requiresHMSReporting) {
        html += `<div class="vessel-requirements-group">`;
        
        if (requiresVMS) {
            html += `
                <div class="vessel-requirement-item">
                    <h3>Vessel Monitoring System (VMS)</h3>
                    <p class="question">Is the vessel's VMS operational and transmitting?</p>
                    <div class="info-note">Required for scallop vessels (CFR: 50 CFR 648.10)</div>
                    <div class="choice-group small">
                        <button class="choice-btn" data-field="vms-operational" data-value="yes" onclick="selectVesselChoice(this)">
                            <span class="choice-icon">✓</span>
                            Operational
                        </button>
                        <button class="choice-btn" data-field="vms-operational" data-value="no" onclick="selectVesselChoice(this)">
                            <span class="choice-icon">✗</span>
                            Not Operational
                        </button>
                        <button class="choice-btn" data-field="vms-operational" data-value="unknown" onclick="selectVesselChoice(this)">
                            <span class="choice-icon">?</span>
                            Unable to Verify
                        </button>
                    </div>
                </div>
            `;
        }
        
        if (requiresObserver) {
            html += `
                <div class="vessel-requirement-item">
                    <h3>At-Sea Observer</h3>
                    <p class="question">Does the vessel have a required observer on board?</p>
                    <div class="info-note">Some trips require NMFS-certified observers (CFR: 50 CFR 648.11)</div>
                    <div class="choice-group small">
                        <button class="choice-btn" data-field="observer-present" data-value="yes" onclick="selectVesselChoice(this)">
                            <span class="choice-icon">✓</span>
                            Observer Present
                        </button>
                        <button class="choice-btn" data-field="observer-present" data-value="no" onclick="selectVesselChoice(this)">
                            <span class="choice-icon">✗</span>
                            No Observer
                        </button>
                        <button class="choice-btn" data-field="observer-present" data-value="not-required" onclick="selectVesselChoice(this)">
                            <span class="choice-icon">—</span>
                            Not Required
                        </button>
                    </div>
                </div>
            `;
        }
        
        if (requiresTDD) {
            html += `
                <div class="vessel-requirement-item">
                    <h3>Turtle Deflector Dredge (TDD)</h3>
                    <p class="question">Are Turtle Deflector Dredges installed when required?</p>
                    <div class="info-note">Required in Sea Turtle Protection Areas during certain seasons (CFR: 50 CFR 223.206)</div>
                    <div class="choice-group small">
                        <button class="choice-btn" data-field="tdd-installed" data-value="yes" onclick="selectVesselChoice(this)">
                            <span class="choice-icon">✓</span>
                            TDD Installed
                        </button>
                        <button class="choice-btn" data-field="tdd-installed" data-value="no" onclick="selectVesselChoice(this)">
                            <span class="choice-icon">✗</span>
                            No TDD
                        </button>
                        <button class="choice-btn" data-field="tdd-installed" data-value="not-required" onclick="selectVesselChoice(this)">
                            <span class="choice-icon">—</span>
                            Not Required
                        </button>
                    </div>
                </div>
            `;
        }
        
        if (requiresHMSReporting) {
            const reportingSpecies = selectedSpecies.filter(id => hmsReportingSpecies.includes(id));
            const speciesNames = reportingSpecies.map(id => {
                const species = SPECIES_DATA[id];
                return species ? species.name : id;
            }).join(', ');
            
            html += `
                <div class="vessel-requirement-item">
                    <h3>HMS Catch Reporting</h3>
                    <p class="question">Has the catch been reported via HMS Catch Reporting System?</p>
                    <div class="info-note">Required for ${speciesNames}. Must be reported within 24 hours of landing (CFR: 50 CFR 635.5)</div>
                    <div class="choice-group small">
                        <button class="choice-btn" data-field="hms-reported" data-value="yes" onclick="selectVesselChoice(this)">
                            <span class="choice-icon">✓</span>
                            Reported
                        </button>
                        <button class="choice-btn" data-field="hms-reported" data-value="no" onclick="selectVesselChoice(this)">
                            <span class="choice-icon">✗</span>
                            Not Reported
                        </button>
                        <button class="choice-btn" data-field="hms-reported" data-value="pending" onclick="selectVesselChoice(this)">
                            <span class="choice-icon">⏳</span>
                            Pending (Within 24hrs)
                        </button>
                    </div>
                </div>
            `;
        }
        
        html += `</div>`;
    } else {
        html += `
            <div class="no-requirements">
                <p class="info-note">No additional vessel requirements for the selected species.</p>
            </div>
        `;
    }
    
    html += `
        <div class="nav-buttons">
            <button class="btn-secondary" onclick="prevGroupedStep('vessel-requirements')">← Back</button>
            <button class="btn-primary" onclick="nextGroupedStep('vessel-requirements')">Generate Report →</button>
        </div>
    `;
    
    section.innerHTML = html;
    container.appendChild(section);
}
