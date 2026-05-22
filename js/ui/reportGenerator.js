// Report Generator Module
// Handles generation of compliance reports

class ReportGenerator {
    constructor(state) {
        this.state = state || window.appState;
    }

    // Pre-report summary then full report (legacy engine + ReportBuilder)
    generate() {
        try {
            if (typeof StateBridge !== 'undefined') {
                StateBridge.flushAssessmentInputs();
            } else if (typeof window !== 'undefined') {
                window.selectedSpecies = this.state.selectedSpecies;
                window.assessmentData = this.state.assessmentData;
            }

            const reportContent = document.getElementById('report-content');
            if (!reportContent) {
                this._reportError('Report container not found. Please refresh and try again.');
                return;
            }

            if (typeof showPreReportSummary === 'function') {
                showPreReportSummary();
                return;
            }
            if (typeof generateReport === 'function') {
                generateReport();
                if (typeof StateBridge !== 'undefined') {
                    StateBridge.syncFromWindow(this.state);
                }
                return;
            }

            this._renderMinimalFallback(reportContent);

        } catch (error) {
            console.error('Error generating report:', error);
            if (typeof Helpers !== 'undefined' && Helpers.showErrorMessage) {
                Helpers.showErrorMessage('Error generating report. Please try again.');
            } else if (typeof showErrorMessage === 'function') {
                showErrorMessage('Error generating report. Please try again.');
            }
        }
    }

    // Generate report section for a single species (delegates to ReportBuilder)
    generateSpeciesReport(speciesId, species, speciesData, violations, dataSource) {
        if (typeof ReportBuilder !== 'undefined' && ReportBuilder.buildSpeciesSection) {
            return ReportBuilder.buildSpeciesSection({
                speciesId,
                species,
                speciesData,
                violations,
                dataSource: dataSource || this.state?.assessmentData || {},
                getPossessionCount: (d) => {
                    if (typeof getSpeciesPossessionCount === 'function') return getSpeciesPossessionCount(d);
                    if (typeof AssessmentViolations !== 'undefined') return AssessmentViolations.getCountFromData(d);
                    return d?.possessionAmount ?? d?.numberOfFish ?? null;
                },
                isProhibitedSpecies: (id) => {
                    if (typeof isProhibitedSpecies === 'function') return isProhibitedSpecies(id);
                    if (typeof AssessmentViolations !== 'undefined') {
                        return AssessmentViolations.isProhibitedSpecies(id);
                    }
                    return false;
                }
            });
        }
        return `<div class="report-section"><p>${species?.name || speciesId}</p></div>`;
    }

    // Generate violations summary
    generateViolationsSummary(allViolations) {
        if (allViolations.length === 0) {
            return `
                <div class="report-section">
                    <h3>COMPLIANCE STATUS</h3>
                    <div class="report-row">
                        <span class="report-label">Overall Status:</span>
                        <span class="report-value compliant">✓ COMPLIANT</span>
                    </div>
                </div>
            `;
        }

        return `
            <div class="report-section">
                <h3>COMPLIANCE STATUS</h3>
                <div class="report-row">
                    <span class="report-label">Overall Status:</span>
                    <span class="report-value violation">✗ NON-COMPLIANT</span>
                </div>
                <div class="report-row">
                    <span class="report-label">Total Violations:</span>
                    <span class="report-value violation">${allViolations.length}</span>
                </div>
            </div>
        `;
    }

    // Check violations for a species
    checkViolations(speciesId, species, speciesData) {
        const violations = [];
        
        // Get violations from question renderer if available
        if (window.questionRenderer) {
            const questionViolations = window.questionRenderer.getViolations(speciesId);
            violations.push(...questionViolations);
        }
        
        // Get violations from legacy function if available
        if (typeof ViolationChecker !== 'undefined') {
            violations.push(...ViolationChecker.checkSpecies(speciesId, species, speciesData));
        } else if (typeof checkSpeciesViolations === 'function') {
            violations.push(...checkSpeciesViolations(speciesId, species, speciesData));
        }
        
        // Remove duplicates
        return [...new Set(violations)];
    }

    formatPermitStatus(status) {
        if (typeof ReportBuilder !== 'undefined') return ReportBuilder.formatPermitStatus(status);
        if (!status) return 'Not Checked';
        if (status === 'yes') return '✓ Valid';
        if (status === 'no') return '✗ No Permit';
        return status;
    }

    getPossessionUnit(speciesId, speciesData) {
        if (typeof ReportBuilder !== 'undefined') return ReportBuilder.getPossessionUnit(speciesId, speciesData);
        if (typeof getPossessionUnit === 'function') return getPossessionUnit(speciesId, speciesData);
        return 'units';
    }

    _reportError(message) {
        console.error(message);
        if (typeof Helpers !== 'undefined' && Helpers.showErrorMessage) {
            Helpers.showErrorMessage(message);
        } else if (typeof showErrorMessage === 'function') {
            showErrorMessage(message);
        } else {
            alert(message);
        }
    }

    _renderMinimalFallback(reportContent) {
        const now = new Date();
        const header = typeof ReportBuilder !== 'undefined'
            ? ReportBuilder.buildReportHeader(now)
            : `<p>Generated: ${now.toLocaleString()}</p>`;
        reportContent.innerHTML = `${header}<div class="report-body"><p>Complete assessment steps, then generate the report again.</p></div>`;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReportGenerator;
}
