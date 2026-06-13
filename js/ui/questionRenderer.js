// Question Renderer Module
// Dynamically renders assessment questions from species-data.js assessmentQuestions structure

class QuestionRenderer {
    constructor(state) {
        this.state = state || window.appState;
        this.dateManager = window.dateManager || null;
    }

    /**
     * Render all assessment questions for selected species
     * @param {Array} speciesIds - Array of species IDs to render questions for
     * @param {HTMLElement} container - Container element to render questions into
     * @param {Object} options - Rendering options (stepName, filterByStep, etc.)
     */
    renderQuestions(speciesIds, container, options = {}) {
        if (!container) {
            console.error('QuestionRenderer: Container element required');
            return;
        }

        container.innerHTML = '';

        const questionsBySpecies = {};
        const allQuestions = [];

        // Collect all questions from selected species
        for (const speciesId of speciesIds) {
            const species = SPECIES_DATA[speciesId];
            if (!species || !species.regulations || !species.regulations.assessmentQuestions) {
                continue;
            }

            const questions = species.regulations.assessmentQuestions;
            const filteredQuestions = this.filterQuestions(questions, speciesId, options);

            if (Object.keys(filteredQuestions).length > 0) {
                questionsBySpecies[speciesId] = filteredQuestions;
                
                // Add to all questions array with species context
                for (const [questionKey, questionData] of Object.entries(filteredQuestions)) {
                    allQuestions.push({
                        speciesId,
                        questionKey,
                        questionData,
                        species
                    });
                }
            }
        }

        // Sort questions by dependencies (questions with dependencies come after their dependencies)
        const sortedQuestions = this.sortQuestionsByDependencies(allQuestions);

        const locationHeadersShown = new Set();

        // Render questions
        for (const questionItem of sortedQuestions) {
            const { speciesId, questionData } = questionItem;
            if (questionData.section === 'location-checklist' && questionData.sectionTitle) {
                const headerKey = `${speciesId}:${questionData.sectionTitle}`;
                if (!locationHeadersShown.has(headerKey)) {
                    const sectionDiv = document.createElement('div');
                    sectionDiv.className = 'location-checklist-section';
                    const title = document.createElement('h3');
                    title.className = 'location-checklist-title';
                    title.textContent = questionData.sectionTitle;
                    sectionDiv.appendChild(title);
                    if (questionData.sectionIntro) {
                        const intro = document.createElement('p');
                        intro.className = 'location-checklist-intro';
                        intro.textContent = questionData.sectionIntro;
                        sectionDiv.appendChild(intro);
                    }
                    container.appendChild(sectionDiv);
                    locationHeadersShown.add(headerKey);
                }
            }

            const questionElement = this.renderQuestion(questionItem.speciesId, questionItem.questionKey, questionItem.questionData, questionItem.species);
            if (questionElement) {
                container.appendChild(questionElement);
            }
        }

        // Set up event listeners for dependencies
        this.setupDependencyListeners(container);
    }

    /**
     * Filter questions based on options and dependencies
     */
    filterQuestions(questions, speciesId, options) {
        const filtered = {};

        for (const [key, question] of Object.entries(questions)) {
            // Check if question should be shown based on options
            if (options.stepName && question.stepName && question.stepName !== options.stepName) {
                continue;
            }

            // Check date filter
            if (question.dateFilter && this.dateManager) {
                if (!this.checkDateFilter(question.dateFilter)) {
                    continue;
                }
            }

            // Check applicable permits
            if (question.applicablePermits) {
                const permitType = this.getAnswer(speciesId, 'permitType');
                if (permitType && !question.applicablePermits.includes(permitType)) {
                    continue;
                }
            }

            if (question.applicableVesselCategories) {
                const vesselCategory = this.getAnswer(speciesId, 'vesselCategory')
                    || this.getAnswer(speciesId, 'vessel-category');
                if (vesselCategory && !question.applicableVesselCategories.includes(vesselCategory)) {
                    continue;
                }
            }

            filtered[key] = question;
        }

        return filtered;
    }

    /**
     * Check if date filter conditions are met
     */
    checkDateFilter(dateFilter) {
        if (!this.dateManager) return true;

        const assessmentDate = this.dateManager.getAssessmentDate();
        if (!assessmentDate) return true;

        const date = new Date(assessmentDate);
        const month = date.getMonth() + 1; // 1-12

        if (dateFilter.months && Array.isArray(dateFilter.months)) {
            return dateFilter.months.includes(month);
        }

        if (dateFilter.months && typeof dateFilter.months === 'object') {
            // Range object like {start: 7, end: 11}
            if (dateFilter.months.start && dateFilter.months.end) {
                return month >= dateFilter.months.start && month <= dateFilter.months.end;
            }
        }

        return true;
    }

    /**
     * Sort questions by dependencies (topological sort)
     */
    sortQuestionsByDependencies(questions) {
        const sorted = [];
        const visited = new Set();
        const visiting = new Set();

        const visit = (question) => {
            if (visiting.has(question.questionKey)) {
                // Circular dependency - skip
                return;
            }
            if (visited.has(question.questionKey)) {
                return;
            }

            visiting.add(question.questionKey);

            // Visit dependencies first
            if (question.questionData.dependsOn && Array.isArray(question.questionData.dependsOn)) {
                for (const depKey of question.questionData.dependsOn) {
                    const depQuestion = questions.find(q => q.questionKey === depKey);
                    if (depQuestion) {
                        visit(depQuestion);
                    }
                }
            }

            visiting.delete(question.questionKey);
            visited.add(question.questionKey);
            sorted.push(question);
        };

        for (const question of questions) {
            if (!visited.has(question.questionKey)) {
                visit(question);
            }
        }

        return sorted;
    }

    /**
     * Render a single question
     */
    renderQuestion(speciesId, questionKey, questionData, species) {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'assessment-question';
        questionDiv.dataset.speciesId = speciesId;
        questionDiv.dataset.questionKey = questionKey;
        questionDiv.dataset.field = questionData.field;

        // Check dependencies - hide if dependencies not met
        if (questionData.dependsOn && Array.isArray(questionData.dependsOn)) {
            const allDepsMet = questionData.dependsOn.every(depKey => {
                const depAnswer = this.getAnswer(speciesId, depKey);
                return depAnswer !== null && depAnswer !== undefined && depAnswer !== '';
            });
            if (!allDepsMet) {
                questionDiv.style.display = 'none';
            }
        }

        // Question header
        const header = document.createElement('div');
        header.className = 'question-header';
        
        const questionText = document.createElement('h4');
        questionText.className = 'question-text';
        questionText.textContent = questionData.question;
        if (questionData.required) {
            questionText.innerHTML += ' <span class="required-indicator">*</span>';
        }
        header.appendChild(questionText);

        // Species label
        const speciesLabel = document.createElement('span');
        speciesLabel.className = 'question-species-label';
        speciesLabel.textContent = species.name;
        header.appendChild(speciesLabel);

        questionDiv.appendChild(header);

        // Question body based on type
        const body = this.renderQuestionBody(speciesId, questionKey, questionData, species);
        if (body) {
            questionDiv.appendChild(body);
        }

        // CFR citation
        if (questionData.cfr) {
            const cfrCite = document.createElement('div');
            cfrCite.className = 'question-cfr';
            cfrCite.textContent = `CFR: ${questionData.cfr}`;
            questionDiv.appendChild(cfrCite);
        }

        // Notes
        if (questionData.notes) {
            const notes = document.createElement('div');
            notes.className = 'question-notes';
            notes.textContent = questionData.notes;
            questionDiv.appendChild(notes);
        }

        // Auto-check if needed
        if (questionData.autoCheck) {
            this.performAutoCheck(speciesId, questionKey, questionData);
        }

        // Auto-fill if needed
        if (questionData.autoFill) {
            this.performAutoFill(speciesId, questionKey, questionData);
        }

        return questionDiv;
    }

    /**
     * Render question body based on question type
     */
    renderQuestionBody(speciesId, questionKey, questionData, species) {
        const body = document.createElement('div');
        body.className = 'question-body';

        const type = questionData.type || 'choice';
        const field = questionData.field;

        switch (type) {
            case 'choice':
                return this.renderChoiceQuestion(speciesId, questionKey, questionData, species);
            case 'boolean':
                return this.renderBooleanQuestion(speciesId, questionKey, questionData, species);
            case 'number':
                return this.renderNumberQuestion(speciesId, questionKey, questionData, species);
            case 'text':
                return this.renderTextQuestion(speciesId, questionKey, questionData, species);
            case 'date':
                return this.renderDateQuestion(speciesId, questionKey, questionData, species);
            case 'auto':
                return this.renderAutoQuestion(speciesId, questionKey, questionData, species);
            default:
                return this.renderChoiceQuestion(speciesId, questionKey, questionData, species);
        }
    }

    /**
     * Render choice question (radio buttons or select)
     */
    renderChoiceQuestion(speciesId, questionKey, questionData, species) {
        const container = document.createElement('div');
        container.className = 'choice-question-container';

        if (questionData.options && Array.isArray(questionData.options)) {
            const choiceGroup = document.createElement('div');
            choiceGroup.className = 'choice-group';

            for (const option of questionData.options) {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'choice-btn question-choice-btn';
                button.dataset.speciesId = speciesId;
                button.dataset.questionKey = questionKey;
                button.dataset.field = questionData.field;
                button.dataset.value = option.value;

                const currentValue = this.getAnswer(speciesId, questionData.field);
                if (currentValue === option.value) {
                    button.classList.add('selected');
                }

                button.innerHTML = `
                    <div class="choice-header">
                        <span class="choice-title">${option.label}</span>
                    </div>
                    ${option.description ? `<div class="choice-description">${option.description}</div>` : ''}
                    ${option.notes ? `<div class="choice-notes"><small>${option.notes}</small></div>` : ''}
                `;

                button.onclick = () => {
                    this.selectChoice(button, speciesId, questionData.field, option.value);
                };

                choiceGroup.appendChild(button);
            }

            container.appendChild(choiceGroup);
        }

        return container;
    }

    /**
     * Render boolean question (yes/no)
     */
    renderBooleanQuestion(speciesId, questionKey, questionData, species) {
        const container = document.createElement('div');
        container.className = 'boolean-question-container';

        const choiceGroup = document.createElement('div');
        choiceGroup.className = 'choice-group';

        const currentValue = this.getAnswer(speciesId, questionData.field);

        ['Yes', 'No'].forEach((label, index) => {
            const value = index === 0;
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'choice-btn question-choice-btn';
            button.dataset.speciesId = speciesId;
            button.dataset.questionKey = questionKey;
            button.dataset.field = questionData.field;
            button.dataset.value = value;

            if (currentValue === value || (currentValue === null && index === 0)) {
                button.classList.add('selected');
            }

            button.innerHTML = `
                <div class="choice-header">
                    <span class="choice-title">${label}</span>
                </div>
            `;

            button.onclick = () => {
                this.selectChoice(button, speciesId, questionData.field, value);
            };

            choiceGroup.appendChild(button);
        });

        container.appendChild(choiceGroup);
        return container;
    }

    /**
     * Render number question
     */
    renderNumberQuestion(speciesId, questionKey, questionData, species) {
        const container = document.createElement('div');
        container.className = 'number-question-container';

        const inputGroup = document.createElement('div');
        inputGroup.className = 'input-group';

        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'question-input';
        input.dataset.speciesId = speciesId;
        input.dataset.questionKey = questionKey;
        input.dataset.field = questionData.field;
        input.min = questionData.min !== undefined ? questionData.min : 0;
        input.step = questionData.step || 1;

        const currentValue = this.getAnswer(speciesId, questionData.field);
        if (currentValue !== null && currentValue !== undefined) {
            input.value = currentValue;
        }

        if (questionData.unit) {
            input.placeholder = `Enter ${questionData.unit}`;
        }

        input.onchange = () => {
            const value = parseFloat(input.value) || 0;
            this.setAnswer(speciesId, questionData.field, value);
            this.checkDependentQuestions(speciesId, questionKey);
            this.checkViolations(speciesId, questionKey, questionData, value);
        };

        inputGroup.appendChild(input);
        if (questionData.unit) {
            const unitLabel = document.createElement('span');
            unitLabel.className = 'input-unit';
            unitLabel.textContent = questionData.unit;
            inputGroup.appendChild(unitLabel);
        }

        container.appendChild(inputGroup);
        return container;
    }

    /**
     * Render text question
     */
    renderTextQuestion(speciesId, questionKey, questionData, species) {
        const container = document.createElement('div');
        container.className = 'text-question-container';

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'question-input';
        input.dataset.speciesId = speciesId;
        input.dataset.questionKey = questionKey;
        input.dataset.field = questionData.field;

        const currentValue = this.getAnswer(speciesId, questionData.field);
        if (currentValue) {
            input.value = currentValue;
        }

        if (questionData.placeholder) {
            input.placeholder = questionData.placeholder;
        }

        input.onchange = () => {
            this.setAnswer(speciesId, questionData.field, input.value);
            this.checkDependentQuestions(speciesId, questionKey);
        };

        container.appendChild(input);
        return container;
    }

    /**
     * Render date question
     */
    renderDateQuestion(speciesId, questionKey, questionData, species) {
        const container = document.createElement('div');
        container.className = 'date-question-container';

        const input = document.createElement('input');
        input.type = 'date';
        input.className = 'question-input';
        input.dataset.speciesId = speciesId;
        input.dataset.questionKey = questionKey;
        input.dataset.field = questionData.field;

        // Auto-fill from assessment date if useAssessmentDate is true
        if (questionData.useAssessmentDate && this.dateManager) {
            const assessmentDate = this.dateManager.getAssessmentDate();
            if (assessmentDate) {
                const date = new Date(assessmentDate);
                input.value = date.toISOString().split('T')[0];
                this.setAnswer(speciesId, questionData.field, input.value);
            }
        }

        const currentValue = this.getAnswer(speciesId, questionData.field);
        if (currentValue) {
            input.value = currentValue;
        }

        input.onchange = () => {
            this.setAnswer(speciesId, questionData.field, input.value);
            this.checkDependentQuestions(speciesId, questionKey);
        };

        container.appendChild(input);
        return container;
    }

    /**
     * Render auto question (read-only, calculated)
     */
    renderAutoQuestion(speciesId, questionKey, questionData, species) {
        const container = document.createElement('div');
        container.className = 'auto-question-container';

        const display = document.createElement('div');
        display.className = 'auto-question-display';

        // Perform auto-check to get the value
        const result = this.performAutoCheck(speciesId, questionKey, questionData);
        if (result !== null && result !== undefined) {
            display.textContent = result;
        } else {
            display.textContent = 'Calculating...';
        }

        container.appendChild(display);
        return container;
    }

    /**
     * Handle choice selection
     */
    selectChoice(button, speciesId, field, value) {
        // Update button state
        const group = button.closest('.choice-group');
        if (group) {
            group.querySelectorAll('.question-choice-btn').forEach(btn => {
                btn.classList.remove('selected');
            });
        }
        button.classList.add('selected');

        // Store answer
        this.setAnswer(speciesId, field, value);

        // Get question data to check dependencies
        const questionDiv = button.closest('.assessment-question');
        if (questionDiv) {
            const questionKey = questionDiv.dataset.questionKey;
            this.checkDependentQuestions(speciesId, questionKey);
            this.checkViolations(speciesId, questionKey, this.getQuestionData(speciesId, questionKey), value);
        }
    }

    /**
     * Check and show/hide dependent questions
     */
    checkDependentQuestions(speciesId, questionKey) {
        const container = document.querySelector('#assessment-sections');
        if (!container) return;

        // Find all questions that depend on this one
        const dependentQuestions = container.querySelectorAll(`[data-species-id="${speciesId}"][data-question-key]`);
        
        dependentQuestions.forEach(questionDiv => {
            const depQuestionKey = questionDiv.dataset.questionKey;
            const questionData = this.getQuestionData(speciesId, depQuestionKey);
            
            if (questionData && questionData.dependsOn && questionData.dependsOn.includes(questionKey)) {
                const allDepsMet = questionData.dependsOn.every(depKey => {
                    const depAnswer = this.getAnswer(speciesId, depKey);
                    return depAnswer !== null && depAnswer !== undefined && depAnswer !== '';
                });
                
                questionDiv.style.display = allDepsMet ? 'block' : 'none';
            }
        });
    }

    /**
     * Perform auto-check for a question
     */
    performAutoCheck(speciesId, questionKey, questionData) {
        if (!questionData.autoCheck) return null;

        // Check possession limits
        if (questionData.limits) {
            const permitType = this.getAnswer(speciesId, 'permitType');
            const numberOfFish = this.getAnswer(speciesId, 'numberOfFish');
            
            if (permitType && numberOfFish !== null && numberOfFish !== undefined) {
                const limit = questionData.limits[permitType];
                
                if (limit !== null && limit !== undefined) {
                    const maxCount = (limit && typeof limit === 'object' && limit.count != null)
                        ? limit.count
                        : (typeof limit === 'number' ? limit : null);
                    if (maxCount != null) {
                        if (numberOfFish > maxCount) {
                            return `EXCEEDS LIMIT: ${numberOfFish} > ${maxCount}`;
                        }
                        return `WITHIN LIMIT: ${numberOfFish} ≤ ${maxCount}`;
                    }
                    if (limit.prohibited && numberOfFish > 0) {
                        return 'PROHIBITED: retention not allowed for this permit category';
                    }
                }
            }
        }

        return null;
    }

    /**
     * Perform auto-fill for a question
     */
    performAutoFill(speciesId, questionKey, questionData) {
        if (!questionData.autoFill) return;

        if (questionData.useAssessmentDate && this.dateManager) {
            const assessmentDate = this.dateManager.getAssessmentDate();
            if (assessmentDate) {
                const date = new Date(assessmentDate);
                const dateString = date.toISOString().split('T')[0];
                this.setAnswer(speciesId, questionData.field, dateString);
            }
        }
    }

    /**
     * Check for violations based on question answer
     */
    checkViolations(speciesId, questionKey, questionData, answer) {
        if (!questionData.violation) return;

        let violationMessages = [];
        const species = typeof SPECIES_DATA !== 'undefined' && SPECIES_DATA[speciesId];
        const speciesData = { ...(this.getAnswer ? {} : {}) };
        if (this.state && this.state.assessmentData?.species?.[speciesId]) {
            Object.assign(speciesData, this.state.assessmentData.species[speciesId]);
        } else if (window.assessmentData?.species?.[speciesId]) {
            Object.assign(speciesData, window.assessmentData.species[speciesId]);
        }
        if (questionData.field) {
            speciesData[questionData.field] = answer;
        }

        if (typeof AssessmentViolations !== 'undefined' && species) {
            const ctx = {
                speciesId,
                species,
                speciesData,
                questions: species.regulations?.assessmentQuestions || {},
                speciesName: species.name || speciesId,
                permitType: speciesData.permitType || speciesData['permit-type']
            };
            violationMessages = AssessmentViolations.evaluateViolationRule(
                questionData.violation,
                typeof AssessmentViolations.coerceAnswerValue === 'function'
                    ? AssessmentViolations.coerceAnswerValue(answer)
                    : answer,
                questionData,
                ctx
            );
            if (AssessmentViolations.COUNT_FIELDS?.has(questionData.field)) {
                violationMessages.push(
                    ...AssessmentViolations.checkCountFieldViolations(
                        speciesData,
                        ctx.questions,
                        ctx
                    )
                );
            }
            violationMessages = [...new Set(violationMessages)];
        } else {
            let violationMessage = null;
            if (questionData.violation.ifExceeds && typeof answer === 'number') {
                const limit = this.getLimitForPermit(speciesId, questionData);
                if (limit !== null && answer > limit) {
                    violationMessage = questionData.violation.ifExceeds;
                }
            }
            if (questionData.violation.ifFalse && answer === false) {
                violationMessage = questionData.violation.ifFalse;
            }
            if (questionData.violation.ifTrue && answer === true) {
                violationMessage = questionData.violation.ifTrue;
            }
            if (questionData.violation.ifGreaterThan !== undefined && typeof answer === 'number' && answer > questionData.violation.ifGreaterThan) {
                violationMessage = questionData.violation.message || questionData.violation.ifExceeds || 'VIOLATION DETECTED';
            }
            if (violationMessage) violationMessages = [violationMessage];
        }

        if (violationMessages.length > 0) {
            this.addViolation(speciesId, questionKey, violationMessages[0]);
        } else {
            this.removeViolation(speciesId, questionKey);
        }
    }

    /**
     * Get limit for current permit type
     */
    getLimitForPermit(speciesId, questionData) {
        if (!questionData.limits) return null;

        const permitType = this.getAnswer(speciesId, 'permitType');
        if (!permitType) return null;

        return questionData.limits[permitType] !== undefined ? questionData.limits[permitType] : null;
    }

    /**
     * Add violation to state
     */
    addViolation(speciesId, questionKey, message) {
        if (!this.state) return;

        const violationKey = `violations.${speciesId}.${questionKey}`;
        const existingViolations = this.state.getAssessmentData(`violations.${speciesId}`) || [];
        
        if (!existingViolations.includes(message)) {
            existingViolations.push(message);
            this.state.setAssessmentData(`violations.${speciesId}`, existingViolations);
        }

        // Update UI to show violation
        const questionDiv = document.querySelector(`[data-species-id="${speciesId}"][data-question-key="${questionKey}"]`);
        if (questionDiv) {
            questionDiv.classList.add('has-violation');
            
            // Add violation message display
            let violationDisplay = questionDiv.querySelector('.violation-message');
            if (!violationDisplay) {
                violationDisplay = document.createElement('div');
                violationDisplay.className = 'violation-message';
                questionDiv.appendChild(violationDisplay);
            }
            violationDisplay.textContent = message;
        }
    }

    /**
     * Remove violation from state
     */
    removeViolation(speciesId, questionKey) {
        if (!this.state) return;

        const questionDiv = document.querySelector(`[data-species-id="${speciesId}"][data-question-key="${questionKey}"]`);
        if (questionDiv) {
            questionDiv.classList.remove('has-violation');
            const violationDisplay = questionDiv.querySelector('.violation-message');
            if (violationDisplay) {
                violationDisplay.remove();
            }
        }
    }

    /**
     * Setup dependency listeners
     */
    setupDependencyListeners(container) {
        // Listeners are set up in individual question renderers
        // This method can be used for global dependency updates
    }

    /**
     * Get answer for a question
     */
    getAnswer(speciesId, field) {
        if (!this.state) {
            // Fallback to window.assessmentData
            if (window.assessmentData && window.assessmentData.species && window.assessmentData.species[speciesId]) {
                return window.assessmentData.species[speciesId][field];
            }
            return null;
        }

        return this.state.getAssessmentData(`species.${speciesId}.${field}`);
    }

    /**
     * Set answer for a question
     */
    setAnswer(speciesId, field, value) {
        if (!this.state) {
            // Fallback to window.assessmentData
            if (!window.assessmentData.species) {
                window.assessmentData.species = {};
            }
            if (!window.assessmentData.species[speciesId]) {
                window.assessmentData.species[speciesId] = {};
            }
            window.assessmentData.species[speciesId][field] = value;
            return;
        }

        this.state.setAssessmentData(`species.${speciesId}.${field}`, value);
    }

    /**
     * Get question data
     */
    getQuestionData(speciesId, questionKey) {
        const species = SPECIES_DATA[speciesId];
        if (!species || !species.regulations || !species.regulations.assessmentQuestions) {
            return null;
        }

        return species.regulations.assessmentQuestions[questionKey] || null;
    }

    /**
     * Get all violations for a species
     */
    getViolations(speciesId) {
        if (!this.state) {
            // Fallback
            return [];
        }

        return this.state.getAssessmentData(`violations.${speciesId}`) || [];
    }

    /**
     * Get all violations for all selected species
     */
    getAllViolations() {
        const violations = {};
        
        if (this.state && this.state.selectedSpecies) {
            for (const speciesId of this.state.selectedSpecies) {
                const speciesViolations = this.getViolations(speciesId);
                if (speciesViolations.length > 0) {
                    violations[speciesId] = speciesViolations;
                }
            }
        }

        return violations;
    }

    /**
     * Persist all answers from the dynamic assessment UI into AppState
     */
    flushToState() {
        const container = document.getElementById('dynamic-questions-container');
        if (!container) return;

        container.querySelectorAll('[data-species][data-field]').forEach(el => {
            const speciesId = el.dataset.species;
            const field = el.dataset.field;
            if (!speciesId || !field) return;

            let value = null;
            if (el.type === 'checkbox') {
                value = el.checked;
            } else if (el.type === 'radio') {
                if (!el.checked) return;
                value = el.value;
            } else if (el.tagName === 'SELECT' || el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                value = el.value;
            } else if (el.classList.contains('choice-btn') && el.classList.contains('selected')) {
                value = el.dataset.value;
            }

            if (value !== null && value !== '') {
                this.setAnswer(speciesId, field, value);
            }
        });

        container.querySelectorAll('.choice-btn.selected').forEach(btn => {
            const speciesId = btn.dataset.species;
            const field = btn.dataset.field;
            const value = btn.dataset.value;
            if (speciesId && field && value) {
                this.setAnswer(speciesId, field, value);
            }
        });

        if (typeof StateBridge !== 'undefined') {
            StateBridge.syncToWindow();
        }

        this.recheckAllQuestionViolations();
    }

    /**
     * Re-run violation rules for all rendered dynamic questions (e.g. before report).
     */
    recheckAllQuestionViolations() {
        const container = document.getElementById('dynamic-questions-container');
        if (!container) return;

        const speciesIds = (this.state && this.state.selectedSpecies) || window.selectedSpecies || [];
        speciesIds.forEach(speciesId => {
            const species = typeof SPECIES_DATA !== 'undefined' && SPECIES_DATA[speciesId];
            const questions = species?.regulations?.assessmentQuestions;
            if (!questions) return;
            Object.entries(questions).forEach(([questionKey, questionData]) => {
                const answer = this.getAnswer(speciesId, questionData.field);
                if (answer !== null && answer !== undefined && answer !== '') {
                    this.checkViolations(speciesId, questionKey, questionData, answer);
                }
            });
        });
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuestionRenderer;
}
