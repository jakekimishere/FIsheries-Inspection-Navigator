/**
 * FIN — Application entry point (orchestrator)
 * Loads after js/legacy/assessmentEngine.js; binds AppState as single source of truth.
 */
document.addEventListener('DOMContentLoaded', () => {
    if (typeof appState === 'undefined') {
        console.error('AppState not loaded. Check script order in index.html.');
        return;
    }

    if (typeof StateBridge !== 'undefined') {
        StateBridge.bindToAppState(appState);
    } else {
        window.appState = appState;
        window.selectedSpecies = appState.selectedSpecies;
        window.assessmentData = appState.assessmentData;
    }

    let navigation, speciesGrid, assessmentSteps, reportGenerator, validators;

    if (typeof Navigation !== 'undefined') {
        navigation = new Navigation(appState);
        window.navigation = navigation;
    }

    if (typeof SpeciesGrid !== 'undefined') {
        speciesGrid = new SpeciesGrid(appState);
        window.speciesGrid = speciesGrid;
        speciesGrid.populate();

        const searchInput = document.getElementById('species-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => speciesGrid.filter(e.target.value));
        }
    }

    if (typeof AssessmentSteps !== 'undefined') {
        assessmentSteps = new AssessmentSteps(appState);
        window.assessmentSteps = assessmentSteps;
    }

    if (typeof QuestionRenderer !== 'undefined' && !window.questionRenderer) {
        window.questionRenderer = new QuestionRenderer(appState);
    }

    if (typeof ReportGenerator !== 'undefined') {
        reportGenerator = new ReportGenerator(appState);
        window.reportGenerator = reportGenerator;
    }

    if (typeof Validators !== 'undefined') {
        validators = new Validators(appState);
        window.validators = validators;
        window.Validators = Validators;
    }

    window.toggleSpecies = function(speciesId) {
        if (window.speciesGrid) {
            window.speciesGrid.toggleSpecies(speciesId);
        }
    };

    appState.subscribe((changeType, data) => {
        if (changeType === 'speciesAdded' || changeType === 'speciesRemoved' || changeType === 'speciesCleared') {
            if (typeof StateBridge !== 'undefined') {
                StateBridge.syncToWindow(appState);
            }
            if (window.speciesGrid) {
                window.speciesGrid.updateSelectedDisplay();
                if (data && data.speciesId) {
                    window.speciesGrid.updateCardSelection(data.speciesId);
                }
            }
        }
        if (changeType === 'stateReset' && typeof StateBridge !== 'undefined') {
            StateBridge.bindToAppState(appState);
        }
    });

    if (typeof dateManager !== 'undefined') {
        window.dateManager = dateManager;
        const today = new Date();
        const todayString = today.toISOString().split('T')[0];
        const dateInput = document.getElementById('assessment-date');
        const dateDisplay = document.getElementById('date-display');
        if (dateInput) {
            dateInput.value = todayString;
            dateManager.setAssessmentDate(today);
            if (dateDisplay) {
                dateDisplay.textContent = dateManager.formatDate(today, 'long');
            }
        }
    }

    if (typeof updateHomepageUpdateDate === 'function') {
        updateHomepageUpdateDate();
    }
    if (typeof updateFooterDate === 'function') {
        updateFooterDate();
    }

    appState.setStep(-1);

    if (navigation && navigation.showStep) {
        navigation.showStep(-1);
    } else if (typeof showStep === 'function') {
        showStep(-1);
    }

    if (navigation) {
        window.showStep = function(step) {
            navigation.showStep(step);
        };
    }

    if (validators && navigation) {
        window.nextGroupedStep = function(currentStepName) {
            if (typeof StateBridge !== 'undefined') {
                StateBridge.flushAssessmentInputs();
            }

            if (currentStepName === 'permits') {
                const validationError = validators.validatePermitsStep();
                if (validationError) {
                    alert(validationError);
                    return;
                }
            }

            navigation.nextGroupedStep(currentStepName);
        };

        window.prevGroupedStep = function(currentStepName) {
            navigation.prevGroupedStep(currentStepName);
        };
    }

    if (navigation) {
        window.selectRegionalFishery = function(region) {
            navigation.selectRegionalFishery(region);
        };
    }

    window.proceedToAssessment = function() {
        if (appState.selectedSpecies.length === 0) {
            alert('Please select at least one species to continue.');
            return;
        }
        if (navigation) {
            navigation.showStep(1);
        } else if (typeof showStep === 'function') {
            showStep(1);
        }
    };

    window.nextStep = function(fromStep) {
        if (fromStep === 0) {
            window.proceedToAssessment();
        }
    };
});

function filterSpeciesGrid(searchTerm) {
    if (window.speciesGrid) {
        window.speciesGrid.filter(searchTerm);
    }
}

function updateAssessmentDate(dateString) {
    if (window.dateManager && dateString) {
        window.dateManager.setAssessmentDate(dateString);
        const assessmentDate = window.dateManager.getAssessmentDate();
        const dateDisplay = document.getElementById('date-display');
        if (dateDisplay && window.dateManager.formatDate) {
            dateDisplay.textContent = window.dateManager.formatDate(assessmentDate, 'long');
        }
        const activeStep = document.querySelector('.grouped-assessment[style*="block"]');
        if (activeStep) {
            const stepId = activeStep.id.replace('grouped-', '');
            if (typeof updateQuickReference === 'function') {
                updateQuickReference(stepId);
            }
            if (window.assessmentSteps && window.assessmentSteps.updateQuickReference) {
                window.assessmentSteps.updateQuickReference(stepId);
            }
        }
    }
}
