/**
 * Shared HTML builders for pre-report overlay and compliance report.
 * Used by assessmentEngine.js and ReportGenerator.
 */
(function (root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    } else {
        root.ReportBuilder = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    function escapeHtml(text) {
        if (text == null) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function formatPermitStatus(status) {
        const statusMap = {
            yes: 'Valid permit verified',
            no: 'NO VALID PERMIT',
            expired: 'EXPIRED PERMIT'
        };
        return statusMap[status] || 'Not assessed';
    }

    function formatSizeCompliance(status) {
        const statusMap = {
            yes: 'Compliant - All meet minimum size',
            no: 'NON-COMPLIANT - Undersized fish present',
            'not-applicable': 'N/A'
        };
        return statusMap[status] || 'Not assessed';
    }

    function formatGearType(type) {
        const typeMap = {
            'otter-trawl': 'Otter Trawl',
            gillnet: 'Gillnet',
            dredge: 'New Bedford Scallop Dredge',
            trawl: 'Otter Trawl',
            other: 'Other'
        };
        return typeMap[type] || type;
    }

    function formatMeshCompliance(status) {
        const statusMap = {
            yes: 'Compliant',
            no: 'NON-COMPLIANT',
            exemption: 'Small Mesh Exemption (LOA)'
        };
        return statusMap[status] || 'Not assessed';
    }

    function getPossessionUnit(speciesId, speciesData) {
        if (speciesId === 'summer-flounder') {
            return speciesData['permit-type'] === 'recreational' ? 'fish' : 'lbs';
        }
        if (speciesId === 'atlantic-sea-scallop') {
            const possessionType = speciesData['possession-type'] || speciesData.possessionType;
            return possessionType === 'inshell' ? 'bushels' : 'lbs';
        }
        return 'lbs';
    }

    function buildReportHeader(generatedAt) {
        const when = generatedAt instanceof Date ? generatedAt : new Date();
        return `
        <div class="report-header">
            <h2>FIN - FISHERIES INSPECTION NAVIGATOR</h2>
            <h3>NORTHEAST FISHERIES COMPLIANCE REPORT</h3>
            <p class="report-date">Generated: ${escapeHtml(when.toLocaleString())}</p>
        </div>`;
    }

    function buildSummaryBanner(violationCount) {
        const n = violationCount || 0;
        return `
        <div class="report-summary-banner ${n > 0 ? 'violation' : 'compliant'}" role="status" aria-live="polite">
            <p><strong>${n > 0
                ? `⚠️ ${n} potential violation(s) identified`
                : '✓ No potential violations identified from entered data'}</strong></p>
            ${n > 0 ? '<p>Review species sections and the final verdict below.</p>' : ''}
        </div>`;
    }

    function buildVerdictBox(allViolations) {
        const list = allViolations || [];
        if (list.length === 0) {
            return `
            <div class="verdict-box compliant" role="status">
                <h3>✓ NO VIOLATIONS IDENTIFIED</h3>
                <p>Based on the information provided, the vessel appears to be in compliance with Northeast fisheries regulations.</p>
            </div>`;
        }
        return `
            <div class="verdict-box violation" role="alert">
                <h3>⚠️ POTENTIAL VIOLATION(S) IDENTIFIED</h3>
                <p>Possible violation(s) of <strong>50 USC 648</strong> - Magnuson-Stevens Fishery Conservation and Management Act</p>
                <ul class="violation-list">
                    ${list.map(v => `<li>${escapeHtml(v)}</li>`).join('')}
                </ul>
            </div>`;
    }

    function buildReportRow(label, value, valueClass) {
        const cls = valueClass ? ` ${valueClass}` : '';
        return `
            <div class="report-row">
                <span class="report-label">${escapeHtml(label)}:</span>
                <span class="report-value${cls}">${value}</span>
            </div>`;
    }

    function buildSpeciesSectionOpen(species, speciesId, hasViolations) {
        const name = species?.name || speciesId;
        return `
            <div class="report-section">
                <h3>${escapeHtml(name.toUpperCase())} ASSESSMENT</h3>
                ${buildReportRow(
                    'Compliance Status',
                    hasViolations ? '⚠️ POTENTIAL VIOLATION(S)' : '✓ NO ISSUES IDENTIFIED',
                    `report-species-status ${hasViolations ? 'violation' : 'compliant'}`
                )}`;
    }

    function buildMissingSpeciesSection(speciesId) {
        return `
            <div class="report-section">
                <h3>SPECIES ASSESSMENT - ${escapeHtml(speciesId.toUpperCase())}</h3>
                ${buildReportRow('Status', 'Species data not available', '')}
            </div>`;
    }

    function buildPotentialIssuesBlock(violations) {
        const list = violations || [];
        const hasViolations = list.length > 0;
        const inner = hasViolations
            ? `<ul class="violation-list-small">${list.map(v => `<li>${escapeHtml(v)}</li>`).join('')}</ul>`
            : 'None identified for this species based on entered data.';
        return buildReportRow('Potential Issues', inner, hasViolations ? 'violation' : 'compliant');
    }

    function closeReportSection() {
        return '</div>';
    }

    /**
     * Full species assessment block (permit, possession, gear, dynamic rows, violations).
     * @param {object} opts
     * @param {string} opts.speciesId
     * @param {object} opts.species
     * @param {object} opts.speciesData - normalized assessment answers
     * @param {string[]} opts.violations
     * @param {object} [opts.dataSource] - full assessmentData for HMS reporting
     * @param {function} [opts.getPossessionCount]
     * @param {function} [opts.isProhibitedSpecies]
     */
    function buildSpeciesSection(opts) {
        const {
            speciesId,
            species,
            speciesData = {},
            violations = [],
            dataSource = {},
            getPossessionCount = () => null,
            isProhibitedSpecies = () => false
        } = opts;

        if (!species) {
            return buildMissingSpeciesSection(speciesId);
        }

        const hasViolations = violations.length > 0;
        let html = buildSpeciesSectionOpen(species, speciesId, hasViolations);

        const permitTypeKey = speciesData['permit-type'] || speciesData.permitType;
        const usesDynamicQuestions = !!(species.regulations?.assessmentQuestions);
        const hasGroupedPermit = speciesData['has-permit'] !== undefined && speciesData['has-permit'] !== '';

        if (!usesDynamicQuestions || hasGroupedPermit) {
            const permitCFR = species.regulations?.permits && Object.values(species.regulations.permits).length > 0
                ? Object.values(species.regulations.permits)[0]?.cfr
                : null;
            const cfrHtml = permitCFR ? ` <span class="cfr-cite">(${escapeHtml(permitCFR)})</span>` : '';
            html += buildReportRow(
                'Federal Permit',
                `${escapeHtml(formatPermitStatus(speciesData['has-permit']))}${cfrHtml}`,
                speciesData['has-permit'] !== 'yes' ? 'violation' : 'compliant'
            );
        }

        if ((speciesData['has-permit'] === 'yes' || permitTypeKey) && permitTypeKey && species.regulations?.permits) {
            const permit = species.regulations.permits[permitTypeKey];
            if (permit) {
                const permitCfr = permit.cfr ? ` <span class="cfr-cite">(${escapeHtml(permit.cfr)})</span>` : '';
                html += buildReportRow(
                    'Permit Type',
                    `${escapeHtml(permit.name || permitTypeKey)}${permitCfr}`,
                    ''
                );
            }
        }

        const onBoardYes = speciesData.hasShark === true || speciesData.hasShark === 'yes'
            || speciesData.isProhibited === true || speciesData.isProhibited === 'yes';
        if (onBoardYes) {
            html += buildReportRow(
                'On Board / Prohibited',
                'Yes — prohibited or restricted species reported on vessel',
                'violation'
            );
        }

        if (speciesData.released === false || speciesData.released === 'no') {
            html += buildReportRow(
                'Release Status',
                'Not all fish released immediately',
                'violation'
            );
        }

        const possessionCount = getPossessionCount(speciesData);
        if (possessionCount !== null) {
            const possessionViolation = violations.some(v =>
                /possession|prohibited|exceeds limit|retention/i.test(v)
            );
            const isProhibited = isProhibitedSpecies(speciesId) && possessionCount > 0;
            const fishLabel = (speciesData.numberOfFish !== undefined && speciesData.numberOfFish !== '')
                || (speciesData.numberOfSharks !== undefined && speciesData.numberOfSharks !== '')
                ? 'Fish on Board'
                : 'Possession Amount';
            const suffix = isProhibited
                ? ' (PROHIBITED SPECIES)'
                : possessionViolation
                    ? ' (OVER LIMIT / PROHIBITED)'
                    : '';
            html += buildReportRow(
                fishLabel,
                `${possessionCount} ${escapeHtml(getPossessionUnit(speciesId, speciesData))}${suffix}`,
                possessionViolation || isProhibited ? 'violation' : ''
            );
        }

        if (speciesData['size-compliant']) {
            const sizeCFR = species.regulations?.size?.cfr || species.regulations?.size?.commercialCFR;
            const cfrHtml = sizeCFR ? ` <span class="cfr-cite">(${escapeHtml(sizeCFR)})</span>` : '';
            html += buildReportRow(
                'Size Compliance',
                `${escapeHtml(formatSizeCompliance(speciesData['size-compliant']))}${cfrHtml}`,
                speciesData['size-compliant'] === 'no' ? 'violation' : 'compliant'
            );
        }

        if (speciesData['gear-type']) {
            html += buildReportRow('Gear Type', escapeHtml(formatGearType(speciesData['gear-type'])), '');
        }

        const gearCompliance = speciesData['mesh-compliant'] || speciesData['dredge-compliant'] || speciesData['trawl-compliant'];
        if (gearCompliance) {
            const meshCFR = speciesId === 'summer-flounder' ? '50 CFR 648.106' : '50 CFR 648.51';
            html += buildReportRow(
                'Gear Compliance',
                `${escapeHtml(formatMeshCompliance(gearCompliance))} <span class="cfr-cite">(${meshCFR})</span>`,
                gearCompliance === 'no' ? 'violation' : 'compliant'
            );
        }

        if (species.regulations?.reporting?.required) {
            const hmsReported = dataSource.vessel?.requirements?.['hms-reported']
                || dataSource.species?.[speciesId]?.['hms-reported'];
            const reportedText = hmsReported === 'yes'
                ? 'Reported'
                : hmsReported === 'pending'
                    ? 'Pending (Within 24hrs)'
                    : hmsReported === 'no'
                        ? 'NOT REPORTED (REQUIRED)'
                        : 'Not Verified';
            html += buildReportRow(
                'HMS Catch Reporting',
                `${escapeHtml(reportedText)} <span class="cfr-cite">(${escapeHtml(species.regulations.reporting.cfr)})</span>`,
                hmsReported === 'no' ? 'violation' : 'compliant'
            );
        }

        if (speciesId === 'atlantic-sea-scallop') {
            if (speciesData['vms-operational']) {
                const vmsText = speciesData['vms-operational'] === 'yes'
                    ? 'Operational'
                    : speciesData['vms-operational'] === 'no'
                        ? 'NOT OPERATIONAL'
                        : 'Unable to Verify';
                html += buildReportRow(
                    'VMS Status',
                    `${escapeHtml(vmsText)} <span class="cfr-cite">(50 CFR 648.10)</span>`,
                    speciesData['vms-operational'] === 'no' ? 'violation' : 'compliant'
                );
            }
            if (speciesData['observer-present']) {
                const obsText = speciesData['observer-present'] === 'yes'
                    ? 'Present'
                    : speciesData['observer-present'] === 'no'
                        ? 'REQUIRED BUT NOT PRESENT'
                        : 'Not Required';
                html += buildReportRow(
                    'Observer',
                    `${escapeHtml(obsText)} <span class="cfr-cite">(50 CFR 648.11)</span>`,
                    speciesData['observer-present'] === 'no' ? 'violation' : 'compliant'
                );
            }
            if (speciesData['tdd-installed']) {
                const tddText = speciesData['tdd-installed'] === 'yes'
                    ? 'Installed'
                    : speciesData['tdd-installed'] === 'no'
                        ? 'REQUIRED BUT NOT INSTALLED'
                        : 'Not Required';
                html += buildReportRow(
                    'TDD Status',
                    `${escapeHtml(tddText)} <span class="cfr-cite">(50 CFR 223.206)</span>`,
                    speciesData['tdd-installed'] === 'no' ? 'violation' : 'compliant'
                );
            }
        }

        if (typeof AssessmentViolations !== 'undefined' && AssessmentViolations.formatDynamicReportRows) {
            const dynamicRows = AssessmentViolations.formatDynamicReportRows(speciesId, species, speciesData);
            dynamicRows.forEach(row => {
                const rowViolation = hasViolations && violations.some(v =>
                    row.label && v.toLowerCase().includes(row.label.toLowerCase().slice(0, 12))
                );
                html += buildReportRow(row.label, escapeHtml(row.value), rowViolation ? 'violation' : '');
            });
        }

        html += buildPotentialIssuesBlock(violations);
        html += closeReportSection();
        return html;
    }

    /**
     * Assemble full compliance report HTML.
     */
    function buildFullReport(opts) {
        const {
            generatedAt = new Date(),
            allViolations = [],
            speciesEntries = [],
            dataSource = {},
            getPossessionCount = () => null,
            isProhibitedSpecies = () => false
        } = opts;

        let html = buildReportHeader(generatedAt) + '<div class="report-body">';
        html += buildSummaryBanner(allViolations.length);

        for (const entry of speciesEntries) {
            html += buildSpeciesSection({
                speciesId: entry.speciesId,
                species: entry.species,
                speciesData: entry.speciesData,
                violations: entry.violations,
                dataSource,
                getPossessionCount,
                isProhibitedSpecies
            });
        }

        html += buildVerdictBox(allViolations) + '</div>';
        return html;
    }

    function buildPreReportBody(options) {
        const { allViolations = [], speciesSummaries = [] } = options || {};
        if (allViolations.length === 0) {
            return `
            <div class="pre-report-status compliant" role="status">
                <p><strong>No potential violations identified</strong> from the information entered.</p>
                <p class="pre-report-note">You can still generate the full report for documentation. Always verify against current NOAA regulations.</p>
            </div>`;
        }
        const speciesHtml = speciesSummaries.map(s => {
            if (!s.violations || s.violations.length === 0) {
                return `<p class="pre-report-species-ok">✓ ${escapeHtml(s.name)}</p>`;
            }
            return `
                <div class="pre-report-species-block">
                    <strong>${escapeHtml(s.name)}</strong>
                    <ul class="violation-list-small">${s.violations.map(v => `<li>${escapeHtml(v)}</li>`).join('')}</ul>
                </div>`;
        }).join('');
        return `
            <div class="pre-report-status violation" role="alert">
                <p><strong>${allViolations.length} potential issue(s) identified</strong></p>
                <ul class="violation-list pre-report-violation-list">
                    ${allViolations.map(v => `<li>${escapeHtml(v)}</li>`).join('')}
                </ul>
            </div>
            <div class="pre-report-by-species">
                <h3>By species</h3>
                ${speciesHtml}
            </div>`;
    }

    return {
        escapeHtml,
        formatPermitStatus,
        formatSizeCompliance,
        formatGearType,
        formatMeshCompliance,
        getPossessionUnit,
        buildReportHeader,
        buildSummaryBanner,
        buildVerdictBox,
        buildReportRow,
        buildSpeciesSectionOpen,
        buildMissingSpeciesSection,
        buildSpeciesSection,
        buildFullReport,
        buildPotentialIssuesBlock,
        closeReportSection,
        buildPreReportBody
    };
});
