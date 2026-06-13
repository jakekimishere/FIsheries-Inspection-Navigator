// Navigation Module
// Handles step navigation and progress tracking

class Navigation {
    constructor(state) {
        this.state = state || window.appState;
        this.init();
    }

    init() {
        // Subscribe to step changes
        this.state.subscribe((changeType, data, state) => {
            if (changeType === 'stepChanged') {
                this.updateProgress();
            }
        });
    }

    hideSpeciesSelection() {
        const step0 = document.getElementById('step-0');
        if (step0) {
            step0.classList.remove('active');
            step0.style.display = 'none';
        }
    }

    showSpeciesSelection() {
        const homepage = document.getElementById('step-homepage');
        if (homepage) {
            homepage.classList.remove('active');
            homepage.style.display = 'none';
        }
        const step0 = document.getElementById('step-0');
        if (step0) {
            step0.classList.add('active');
            step0.style.display = 'block';
        }
    }

    scrollToAssessment() {
        requestAnimationFrame(() => {
            const target = document.querySelector('.grouped-assessment[style*="block"]')
                || document.getElementById('assessment-sections');
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    // Show a specific step
    showStep(step) {
        document.querySelectorAll('.step-section').forEach(section => {
            section.classList.remove('active');
        });

        const multispeciesSelected = this.state.selectedSpecies.filter(id => this.isMultispecies(id));
        const hasMultispecies = multispeciesSelected.length > 0;

        if (step === -1) {
            if (typeof hideAssessmentAndResultsUI === 'function') {
                hideAssessmentAndResultsUI();
            } else {
                document.querySelectorAll('.grouped-assessment').forEach(el => {
                    el.classList.remove('active');
                    el.style.display = 'none';
                });
                const resultsSection = document.getElementById('results-section');
                if (resultsSection) {
                    resultsSection.classList.remove('active');
                    resultsSection.style.display = 'none';
                }
                const step0 = document.getElementById('step-0');
                if (step0) {
                    step0.classList.remove('active');
                    step0.style.display = 'none';
                }
            }
            const homepage = document.getElementById('step-homepage');
            if (homepage) homepage.classList.add('active');
        } else if (step === 0) {
            this.showSpeciesSelection();
            document.querySelectorAll('.grouped-assessment').forEach(el => {
                el.classList.remove('active');
                el.style.display = 'none';
            });
            const assessmentSections = document.getElementById('assessment-sections');
            if (assessmentSections) {
                assessmentSections.style.display = 'none';
            }
            const resultsSection = document.getElementById('results-section');
            if (resultsSection) {
                resultsSection.classList.remove('active');
                resultsSection.style.display = 'none';
            }
        } else if (step === 1) {
            this.hideSpeciesSelection();
            // Step 1 (vessel info) removed - skip directly to assessment
            // Generate grouped assessment steps
            if (this.state.selectedSpecies.length > 0) {
                if (typeof window.assessmentSteps !== 'undefined' && window.assessmentSteps.generate) {
                    window.assessmentSteps.generate();
                } else if (typeof generateGroupedAssessmentSteps === 'function') {
                    generateGroupedAssessmentSteps();
                }
                
                // Check if we should use dynamic questions
                const useDynamicQuestions = window.assessmentSteps && 
                    typeof window.assessmentSteps.shouldUseDynamicQuestions === 'function' &&
                    window.assessmentSteps.shouldUseDynamicQuestions();
                
                if (hasMultispecies && (typeof MultispeciesFlow === 'undefined' || MultispeciesFlow.vesselClassificationStepNeeded())) {
                    this.showGroupedStep('vessel-classification');
                } else if (hasMultispecies && typeof MultispeciesFlow !== 'undefined') {
                    MultispeciesFlow.applyDefaultVesselClassification();
                    this.showGroupedStep('permits');
                } else if (useDynamicQuestions) {
                    this.showGroupedStep('dynamic-assessment');
                } else {
                    this.showGroupedStep('permits');
                }
                this.scrollToAssessment();
            }
        } else if (typeof getReportStepNumber === 'function' && step >= 2 && step < getReportStepNumber()) {
            this.hideSpeciesSelection();
            const stepOrder = typeof getAssessmentStepOrder === 'function'
                ? getAssessmentStepOrder()
                : (hasMultispecies
                    ? ['vessel-classification', 'permits', 'possession', 'size-gear', 'vessel-requirements']
                    : ['permits', 'possession', 'size-gear', 'vessel-requirements']);
            const stepName = stepOrder[step - 2];
            if (stepName) {
                this.showGroupedStep(stepName);
            }
        } else if (
            (typeof getReportStepNumber === 'function' && step === getReportStepNumber()) ||
            (hasMultispecies && step === 7) ||
            (!hasMultispecies && step === 6)
        ) {
            this.hideSpeciesSelection();
            // Results - hide all grouped assessment steps first
            document.querySelectorAll('.grouped-assessment').forEach(groupedStep => {
                groupedStep.style.display = 'none';
            });
            
            // Hide assessment sections container
            const assessmentSections = document.getElementById('assessment-sections');
            if (assessmentSections) {
                assessmentSections.style.display = 'none';
            }
            
            if (!window.lastGroupedStepName && typeof rememberGroupedStep === 'function' && typeof getLastAssessmentStepBeforeReport === 'function') {
                rememberGroupedStep(getLastAssessmentStepBeforeReport());
            }
            if (typeof showPreReportSummary === 'function') {
                showPreReportSummary();
            } else if (typeof window.reportGenerator !== 'undefined' && window.reportGenerator.generate) {
                window.reportGenerator.generate();
            } else if (typeof generateReport === 'function') {
                generateReport();
                const resultsSection = document.getElementById('results-section');
                if (resultsSection) {
                    resultsSection.classList.add('active');
                    resultsSection.style.display = 'block';
                }
            }
        }

        this.state.setStep(step);
        this.updateProgress();
    }

    // Show a specific grouped assessment step
    showGroupedStep(stepName) {
        if (stepName === 'vessel-requirements' && typeof vesselRequirementsStepNeeded === 'function' && !vesselRequirementsStepNeeded()) {
            this.showStep(typeof getReportStepNumber === 'function' ? getReportStepNumber() : 6);
            return;
        }
        // Hide results section if it's visible
        const resultsSection = document.getElementById('results-section');
        if (resultsSection) {
            resultsSection.classList.remove('active');
            resultsSection.style.display = 'none';
        }
        
        // Show assessment sections container
        const assessmentSections = document.getElementById('assessment-sections');
        if (assessmentSections) {
            assessmentSections.style.display = 'block';
        }
        
        // Hide all grouped steps
        const allSteps = document.querySelectorAll('.grouped-assessment');
        allSteps.forEach(step => {
            step.style.display = 'none';
        });

        if (typeof rememberGroupedStep === 'function') {
            rememberGroupedStep(stepName);
        }

        const stepElement = document.getElementById(`grouped-${stepName}`);
        if (stepElement) {
            stepElement.style.display = 'block';
        }

        // Update quick reference if available
        if (typeof window.assessmentSteps !== 'undefined' && window.assessmentSteps.updateQuickReference) {
            window.assessmentSteps.updateQuickReference(stepName);
        } else if (typeof updateQuickReference === 'function') {
            updateQuickReference(stepName);
        }
    }

    // Update progress bar
    updateProgress() {
        const multispeciesSelected = this.state.selectedSpecies.filter(id => this.isMultispecies(id));
        const hasMultispecies = multispeciesSelected.length > 0;

        const baseSteps = 2; // Homepage + Species Selection
        const vesselClassificationStep = hasMultispecies ? 1 : 0;
        const groupedSteps = 4; // Permits, Possession, Size/Gear, Vessel Requirements
        const finalStep = 1; // Results
        const calculatedTotalSteps = baseSteps + vesselClassificationStep + groupedSteps + finalStep;

        // Adjust currentStep for display (homepage is -1, species selection is 0)
        let displayStep = this.state.currentStep;
        if (this.state.currentStep < 0) {
            displayStep = 0;
        }

        const progress = (displayStep / calculatedTotalSteps) * 100;
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');
        
        if (progressBar) {
            progressBar.style.setProperty('--progress', `${progress}%`);
        }
        if (progressText) {
            progressText.textContent = `Step ${displayStep + 1} of ${calculatedTotalSteps}`;
        }
    }

    // Check if species is part of multispecies complex
    isMultispecies(speciesId) {
        const multispeciesIds = [
            'atlantic-cod', 'haddock', 'yellowtail-flounder', 'winter-flounder',
            'windowpane-flounder', 'atlantic-wolffish', 'redfish', 'atlantic-halibut',
            'white-hake', 'pollock', 'witch-flounder', 'american-plaice', 'ocean-pout'
        ];
        return multispeciesIds.includes(speciesId);
    }

    // Select regional fishery
    selectRegionalFishery(region) {
        if (region === 'northeast') {
            this.showStep(0);
        }
        // Future: handle other regions here
    }

    // Navigate to next grouped assessment step
    nextGroupedStep(currentStepName) {
        try {
            if (typeof StateBridge !== 'undefined') {
                StateBridge.flushAssessmentInputs();
            }

            const stepOrder = typeof getAssessmentStepOrder === 'function'
                ? getAssessmentStepOrder()
                : ['permits', 'possession', 'size-gear', 'vessel-requirements'];
            const currentIndex = stepOrder.indexOf(currentStepName);
            
            if (currentIndex === -1) {
                console.error('Current step not found in step order:', currentStepName);
                return;
            }
            
            if (typeof saveGroupedStepData === 'function') {
                saveGroupedStepData(currentStepName);
            }
            if (typeof rememberGroupedStep === 'function') {
                rememberGroupedStep(currentStepName);
            }
            
            if (currentIndex < stepOrder.length - 1) {
                const nextStep = stepOrder[currentIndex + 1];
                const stepNumber = typeof groupedStepNameToStepNumber === 'function'
                    ? groupedStepNameToStepNumber(nextStep)
                    : 2 + currentIndex + 1;
                if (stepNumber != null) {
                    this.showStep(stepNumber);
                }
            } else {
                this.showStep(typeof getReportStepNumber === 'function' ? getReportStepNumber() : 6);
            }
        } catch (error) {
            console.error('Error in nextGroupedStep:', error);
            if (typeof Helpers !== 'undefined' && Helpers.showErrorMessage) {
                Helpers.showErrorMessage('Error proceeding to next step. Please try again.');
            } else if (typeof showErrorMessage === 'function') {
                showErrorMessage('Error proceeding to next step. Please try again.');
            }
        }
    }

    // Navigate to previous grouped assessment step
    prevGroupedStep(currentStepName) {
        try {
            if (typeof StateBridge !== 'undefined') {
                StateBridge.flushAssessmentInputs();
            }

            const stepOrder = typeof getAssessmentStepOrder === 'function'
                ? getAssessmentStepOrder()
                : ['permits', 'possession', 'size-gear', 'vessel-requirements'];
            const currentIndex = stepOrder.indexOf(currentStepName);
            
            if (currentIndex === -1) {
                console.error('Current step not found in step order:', currentStepName);
                this.showStep(0);
                return;
            }
            
            if (currentIndex > 0) {
                const prevStepName = stepOrder[currentIndex - 1];
                const stepNumber = typeof groupedStepNameToStepNumber === 'function'
                    ? groupedStepNameToStepNumber(prevStepName)
                    : 2 + currentIndex - 1;
                if (stepNumber != null) {
                    this.showStep(stepNumber);
                }
            } else {
                this.showStep(0);
            }
        } catch (error) {
            console.error('Error in prevGroupedStep:', error);
            if (typeof Helpers !== 'undefined' && Helpers.showErrorMessage) {
                Helpers.showErrorMessage('Error going back. Please try again.');
            } else if (typeof showErrorMessage === 'function') {
                showErrorMessage('Error going back. Please try again.');
            }
        }
    }
}

// Expose methods to window for global access (for onclick handlers in HTML)
// Fallback if orchestrator has not registered prevGroupedStep
if (typeof window !== 'undefined') {
    // Only expose if prevGroupedStep doesn't already exist
    if (!window.prevGroupedStep && typeof Navigation !== 'undefined') {
        // Create a global navigation instance if it doesn't exist
        if (!window.navigationInstance && window.appState) {
            window.navigationInstance = new Navigation(window.appState);
        }
        
        // Expose prevGroupedStep to window for button onclick handlers
        if (window.navigationInstance) {
            window.prevGroupedStep = function(currentStepName) {
                return window.navigationInstance.prevGroupedStep(currentStepName);
            };
        }
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Navigation;
}
