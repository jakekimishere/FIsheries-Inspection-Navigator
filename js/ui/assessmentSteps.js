// Assessment Steps Module
// Handles generation and display of assessment steps for all selected species

class AssessmentSteps {
    constructor(state) {
        this.state = state || window.appState;
        this.container = null;
        this.questionRenderer = null;
        
        // Initialize question renderer if available
        if (typeof QuestionRenderer !== 'undefined') {
            this.questionRenderer = new QuestionRenderer(state);
        }
    }

    // Generate all assessment steps
    generate() {
        try {
            this.container = document.getElementById('assessment-sections');
            if (!this.container) {
                console.error('Assessment sections container not found');
                return;
            }

            this.container.innerHTML = '';

            // Check if we have multispecies groundfish selected
            const multispeciesSelected = this.state.selectedSpecies.filter(id => this.isMultispecies(id));
            const otherSpeciesSelected = this.state.selectedSpecies.filter(id => !this.isMultispecies(id));

            // Initialize assessment data for all species
            for (const speciesId of this.state.selectedSpecies) {
                if (!this.state.getAssessmentData(`species.${speciesId}`)) {
                    this.state.setAssessmentData(`species.${speciesId}`, {});
                }
            }

            // Sync to window for backward compatibility
            if (typeof window !== 'undefined') {
                window.selectedSpecies = [...this.state.selectedSpecies];
                window.assessmentData = this.state.assessmentData;
            }

            // If we have multispecies, add vessel classification step
            if (multispeciesSelected.length > 0
                && (typeof MultispeciesFlow === 'undefined' || MultispeciesFlow.vesselClassificationStepNeeded())) {
                this.createVesselClassificationSection();
            } else if (multispeciesSelected.length > 0 && typeof MultispeciesFlow !== 'undefined') {
                MultispeciesFlow.applyDefaultVesselClassification();
            }

            // Create grouped assessment sections
            // Try to use dynamic questions first, fall back to hardcoded if needed
            if (this.questionRenderer && this.shouldUseDynamicQuestions()) {
                this.createDynamicAssessmentSections();
            } else {
                this.createPermitsSection();
                this.createPossessionSection();
                this.createSizeGearSection();
                if (typeof vesselRequirementsStepNeeded === 'function' ? vesselRequirementsStepNeeded() : true) {
                    this.createVesselRequirementsSection();
                }
            }

        } catch (error) {
            console.error('Error generating grouped assessment steps:', error);
            if (typeof Helpers !== 'undefined' && Helpers.showErrorMessage) {
                Helpers.showErrorMessage('Error setting up assessments. Please refresh and try again.');
            } else if (typeof showErrorMessage === 'function') {
                showErrorMessage('Error setting up assessments. Please refresh and try again.');
            }
        }
    }

    // Check if species is part of multispecies complex
    isMultispecies(speciesId) {
        if (typeof Helpers !== 'undefined' && Helpers.isMultispecies) {
            return Helpers.isMultispecies(speciesId);
        }
        const multispeciesIds = [
            'atlantic-cod', 'haddock', 'yellowtail-flounder', 'winter-flounder',
            'windowpane-flounder', 'atlantic-wolffish', 'redfish', 'atlantic-halibut',
            'white-hake', 'pollock', 'witch-flounder', 'american-plaice', 'ocean-pout'
        ];
        return multispeciesIds.includes(speciesId);
    }

    // Generate quick reference HTML (delegates to helper if available)
    generateQuickReference(stepName) {
        if (typeof generateQuickReference === 'function') {
            return generateQuickReference(stepName);
        }
        return ''; // Return empty if helper not available
    }

    // Create vessel classification section (for multispecies)
    createVesselClassificationSection() {
        try {
            const section = document.createElement('section');
            section.className = 'step-section grouped-assessment';
            section.id = 'grouped-vessel-classification';
            
            const multispData = NORTHEAST_MULTISPECIES_DATA;
            
            let html = `
                <div class="grouped-header">
                    <h2>Vessel Classification</h2>
                    <p class="grouped-subtitle">Determine vessel enrollment status for Northeast Multispecies fishery</p>
                </div>
                
                ${this.generateQuickReference('vessel-classification')}
                
                <div class="vessel-classification-group">
                    <h3>Vessel Enrollment Status</h3>
                    <p class="question">Is this vessel enrolled in a fishing sector or fishing under common pool regulations?</p>
                    
                    <div class="choice-group">
                        <button class="choice-btn vessel-class-btn" data-field="vessel-classification" data-value="sector" onclick="selectVesselClassification(this)">
                            <div class="choice-header">
                                <span class="choice-icon">🏢</span>
                                <span class="choice-title">Sector Vessel</span>
                            </div>
                            <div class="choice-description">
                                Enrolled in a fishing sector with allocated catch shares (ACE)
                            </div>
                            <div class="choice-details">
                                <small>• Annual Catch Entitlement (ACE) allocations</small>
                                <small>• Sector-specific regulations</small>
                                <small>• Observer coverage requirements</small>
                            </div>
                        </button>
                        
                        <button class="choice-btn vessel-class-btn" data-field="vessel-classification" data-value="common-pool" onclick="selectVesselClassification(this)">
                            <div class="choice-header">
                                <span class="choice-icon">⚓</span>
                                <span class="choice-title">Common Pool Vessel</span>
                            </div>
                            <div class="choice-description">
                                Fishing under traditional Days-at-Sea (DAS) regulations
                            </div>
                            <div class="choice-details">
                                <small>• Days-at-Sea allocations</small>
                                <small>• Trip limit enforcement</small>
                                <small>• Traditional gear requirements</small>
                            </div>
                        </button>
                    </div>
                    
                    <div class="info-note">
                        <strong>CFR Reference:</strong> Sector vessels (50 CFR 648.87), Common pool vessels (50 CFR 648.82)
                    </div>
                </div>
                
                <div class="nav-buttons">
                    <button class="btn-secondary" onclick="prevGroupedStep('vessel-classification')">← Back</button>
                    <button class="btn-primary" onclick="nextGroupedStep('vessel-classification')" id="continue-vessel-classification" disabled>Continue to Permits →</button>
                </div>
            `;
            
            section.innerHTML = html;
            this.container.appendChild(section);
        } catch (error) {
            console.error('Error creating vessel classification section:', error);
        }
    }

    // Create permits section
    createPermitsSection() {
        try {
            // Delegate to existing function for now (it's very large and complex)
            // Report HTML: ReportBuilder.buildFullReport (assessmentEngine.generateReport)
            if (typeof createGroupedPermitsSection === 'function') {
                createGroupedPermitsSection(this.container);
            } else {
                console.error('createGroupedPermitsSection function not found');
            }
        } catch (error) {
            console.error('Error creating permits section:', error);
        }
    }

    // Create possession section
    createPossessionSection() {
        try {
            // Delegate to existing function for now
            if (typeof createGroupedPossessionSection === 'function') {
                createGroupedPossessionSection(this.container);
            } else {
                console.error('createGroupedPossessionSection function not found');
            }
        } catch (error) {
            console.error('Error creating possession section:', error);
        }
    }

    // Create size/gear section
    createSizeGearSection() {
        try {
            // Delegate to existing function for now
            if (typeof createGroupedSizeGearSection === 'function') {
                createGroupedSizeGearSection(this.container);
            } else {
                console.error('createGroupedSizeGearSection function not found');
            }
        } catch (error) {
            console.error('Error creating size/gear section:', error);
        }
    }

    // Create vessel requirements section
    createVesselRequirementsSection() {
        try {
            // Delegate to existing function for now
            if (typeof createGroupedVesselRequirementsSection === 'function') {
                createGroupedVesselRequirementsSection(this.container);
            } else {
                console.error('createGroupedVesselRequirementsSection function not found');
            }
        } catch (error) {
            console.error('Error creating vessel requirements section:', error);
        }
    }

    // Check if we should use dynamic questions
    shouldUseDynamicQuestions() {
        // Use dynamic questions if at least one selected species has assessmentQuestions
        for (const speciesId of this.state.selectedSpecies) {
            const species = SPECIES_DATA[speciesId];
            if (species && species.regulations && species.regulations.assessmentQuestions) {
                return true;
            }
        }
        return false;
    }

    // Create dynamic assessment sections using question renderer
    createDynamicAssessmentSections() {
        try {
            // Create a single comprehensive assessment section with all questions
            const section = document.createElement('section');
            section.className = 'step-section grouped-assessment';
            section.id = 'grouped-dynamic-assessment';
            
            const html = `
                <div class="grouped-header">
                    <h2>Species Assessment</h2>
                    <p class="grouped-subtitle">Answer the following questions for each selected species</p>
                </div>
                
                <div class="dynamic-questions-container" id="dynamic-questions-container">
                    <!-- Questions will be rendered here -->
                </div>
                
                <div class="nav-buttons">
                    <button class="btn-secondary" onclick="prevGroupedStep('dynamic-assessment')">← Back</button>
                    <button class="btn-primary" onclick="nextGroupedStep('dynamic-assessment')" id="continue-dynamic-assessment">Continue to Report →</button>
                </div>
            `;
            
            section.innerHTML = html;
            this.container.appendChild(section);
            
            // Render questions
            const questionsContainer = section.querySelector('#dynamic-questions-container');
            if (questionsContainer && this.questionRenderer) {
                this.questionRenderer.renderQuestions(
                    this.state.selectedSpecies,
                    questionsContainer,
                    { stepName: 'assessment' }
                );
            }
        } catch (error) {
            console.error('Error creating dynamic assessment sections:', error);
            // Fall back to hardcoded sections
            this.createPermitsSection();
            this.createPossessionSection();
            this.createSizeGearSection();
            this.createVesselRequirementsSection();
        }
    }

    // Update quick reference for a step
    updateQuickReference(stepName) {
        try {
            if (typeof updateQuickReference === 'function') {
                updateQuickReference(stepName);
            } else if (typeof generateQuickReference === 'function') {
                const quickRef = generateQuickReference(stepName);
                // Update quick reference display if element exists
                const quickRefElement = document.getElementById('quick-reference');
                if (quickRefElement) {
                    quickRefElement.innerHTML = quickRef;
                }
            }
        } catch (error) {
            console.error('Error updating quick reference:', error);
        }
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AssessmentSteps;
}
