/**
 * Shared assessment-question violation evaluation (browser + Node validator).
 */
(function (root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    } else {
        root.AssessmentViolations = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    const COUNT_FIELDS = new Set([
        'numberOfFish',
        'numberOfSharks',
        'possessionAmount',
        'possession-amount'
    ]);

    function coerceAnswerValue(value) {
        if (value === true || value === 'true' || value === 'yes' || value === 'Yes') return true;
        if (value === false || value === 'false' || value === 'no' || value === 'No') return false;
        if (value !== '' && value !== null && value !== undefined && !Number.isNaN(Number(value))) {
            return Number(value);
        }
        return value;
    }

    function mapPermitTypeToPossessionKey(permitType) {
        if (!permitType) return null;
        if (permitType.startsWith('commercial')) return 'commercial';
        if (permitType.startsWith('recreational')) return 'recreational';
        return permitType;
    }

    function getQuotaConfigLimit(speciesId, permitType, speciesData) {
        if (typeof getCommercialPossessionLimit !== 'function' || !permitType) {
            return null;
        }
        return getCommercialPossessionLimit(speciesId, permitType, speciesData);
    }

    function isProhibitedSpecies(speciesId, entry) {
        if (speciesId === 'atlantic-salmon') return true;
        if (!entry && typeof SPECIES_DATA !== 'undefined') {
            entry = SPECIES_DATA[speciesId];
        }
        if (!entry) return false;
        if (entry.prohibited) return true;
        if (entry.regulations?.protectedSpecies?.prohibited) return true;
        if (entry.regulations?.possession?.recreational?.prohibited) return true;
        const possession = entry.regulations?.possession;
        if (possession && typeof possession === 'object') {
            const rules = Object.values(possession);
            if (rules.length > 0 && rules.every(r =>
                r && (r.prohibited || (r.limit && r.limit.count === 0))
            )) {
                return true;
            }
        }
        return false;
    }

    function resolveSummerFlounderCommercialLimit(speciesData, plc) {
        if (!plc?.limits) return { count: null, prohibited: false };
        const mesh = speciesData.meshSize || speciesData.meshSizeCompliance || speciesData['mesh-compliant'];
        const isLargeMesh = mesh === 'large-mesh' || mesh === 'large-mesh-compliant' || mesh === 'yes';
        if (isLargeMesh) {
            return { count: null, prohibited: false };
        }
        const seasonal = plc.limits['commercial-small-mesh']?.seasonal;
        if (!seasonal) return { count: null, prohibited: false };
        const month = new Date().getMonth() + 1;
        let limit = null;
        if (seasonal['may-oct']?.months?.includes(month)) {
            limit = seasonal['may-oct'].limit;
        } else if (seasonal['nov-apr']?.months?.includes(month)) {
            limit = seasonal['nov-apr'].limit;
        }
        return { count: limit, prohibited: false };
    }

    function getPossessionLimitRule(questions, permitType, speciesId, speciesData) {
        const plc = questions && questions.possessionLimitCheck;
        if (!plc || !plc.limits || !permitType) {
            return { count: null, prohibited: false, message: null };
        }
        if (speciesId === 'summer-flounder' && permitType === 'commercial' && speciesData) {
            const sf = resolveSummerFlounderCommercialLimit(speciesData, plc);
            return { ...sf, message: plc.violation?.ifExceeds || null };
        }
        if (speciesId === 'bluefin-tuna' && permitType && typeof getBFTRecreationalVesselLimit === 'function') {
            const bftRec = getBFTRecreationalVesselLimit(permitType);
            if (bftRec?.count != null) {
                return {
                    count: bftRec.count,
                    prohibited: false,
                    message: plc?.violation?.ifExceeds || null
                };
            }
        }
        if (speciesId === 'swordfish' && permitType && typeof getSwordfishRecreationalVesselLimit === 'function') {
            const sfRec = getSwordfishRecreationalVesselLimit(permitType);
            if (sfRec?.count != null) {
                return {
                    count: sfRec.count,
                    prohibited: false,
                    message: plc?.violation?.ifExceeds || null
                };
            }
        }
        let lim = plc.limits[permitType];
        if (lim === undefined) {
            const mapped = mapPermitTypeToPossessionKey(permitType);
            lim = mapped ? plc.limits[mapped] : undefined;
        }
        if (lim === null || lim === undefined) {
            const quotaLim = getQuotaConfigLimit(speciesId, permitType, speciesData);
            if (quotaLim && (quotaLim.count != null || quotaLim.prohibited)) {
                return {
                    count: quotaLim.count,
                    prohibited: !!quotaLim.prohibited,
                    message: quotaLim.message || plc?.violation?.ifExceeds || plc?.violation?.ifProhibited || null
                };
            }
            return { count: null, prohibited: false, message: null };
        }
        if (typeof lim === 'object') {
            let count = lim.count != null ? lim.count : null;
            let prohibited = !!(lim.prohibited || lim.count === 0);
            if (count == null && !prohibited) {
                const quotaLim = getQuotaConfigLimit(speciesId, permitType, speciesData);
                if (quotaLim) {
                    count = quotaLim.count;
                    prohibited = !!quotaLim.prohibited;
                }
            }
            return {
                count,
                prohibited,
                message: plc.violation?.ifExceeds || plc.violation?.ifProhibited || null
            };
        }
        if (typeof lim === 'number') {
            return { count: lim, prohibited: lim === 0, message: plc.violation?.ifExceeds || null };
        }
        const quotaLim = getQuotaConfigLimit(speciesId, permitType, speciesData);
        if (quotaLim && (quotaLim.count != null || quotaLim.prohibited)) {
            return {
                count: quotaLim.count,
                prohibited: !!quotaLim.prohibited,
                message: quotaLim.message || null
            };
        }
        return { count: null, prohibited: false, message: null };
    }

    function getCountFromData(speciesData) {
        if (!speciesData) return null;
        for (const field of COUNT_FIELDS) {
            const val = speciesData[field];
            if (val !== undefined && val !== null && val !== '') {
                const n = Number(val);
                return Number.isFinite(n) ? n : 0;
            }
        }
        return null;
    }

    function evaluateViolationRule(v, answer, questionData, ctx) {
        const messages = [];
        if (!v) return messages;

        if (v.ifGreaterThan !== undefined && typeof answer === 'number' && answer > v.ifGreaterThan) {
            messages.push(v.message || v.ifExceeds || `VIOLATION: ${ctx.speciesName} — exceeds allowed amount`);
        }
        if (v.ifTrue && answer === true) {
            messages.push(typeof v.ifTrue === 'string' ? v.ifTrue : v.message);
        }
        if (v.ifFalse && answer === false) {
            messages.push(typeof v.ifFalse === 'string' ? v.ifFalse : v.message);
        }
        if (v.ifEquals !== undefined && (answer === v.ifEquals || String(answer) === String(v.ifEquals))) {
            messages.push(v.message || 'VIOLATION DETECTED');
        }
        if (v.ifValue !== undefined && answer === v.ifValue) {
            messages.push(v.message || (typeof v.ifValue === 'string' ? `VIOLATION: ${v.ifValue}` : 'VIOLATION DETECTED'));
        }
        if (v.ifNonCompliant && (answer === false || answer === 'no')) {
            messages.push(typeof v.ifNonCompliant === 'string' ? v.ifNonCompliant : v.message);
        }
        if (v.ifBelow !== undefined && typeof answer === 'number') {
            const min = questionData.minimum != null
                ? questionData.minimum
                : (ctx.species?.regulations?.size?.minimum);
            if (min != null && answer < min) {
                messages.push(typeof v.ifBelow === 'string' ? v.ifBelow : v.message);
            }
        }
        if (v.ifExceeds && typeof answer === 'number') {
            const limit = getPossessionLimitRule(ctx.questions, ctx.permitType, ctx.speciesId, ctx.speciesData);
            if (limit.count != null && answer > limit.count) {
                messages.push(typeof v.ifExceeds === 'string' ? v.ifExceeds : (v.message || 'VIOLATION: exceeds limit'));
            }
        }
        if (v.ifProhibited && typeof answer === 'number' && answer > 0) {
            const limit = getPossessionLimitRule(ctx.questions, ctx.permitType, ctx.speciesId, ctx.speciesData);
            if (limit.prohibited) {
                messages.push(typeof v.ifProhibited === 'string' ? v.ifProhibited : (v.message || 'VIOLATION: retention prohibited'));
            }
        }
        if (v.ifUnauthorized && ctx.permitType && questionData.gearByPermit) {
            const authorized = questionData.gearByPermit[ctx.permitType]?.authorized;
            if (Array.isArray(authorized) && answer && !authorized.includes(answer)) {
                messages.push(typeof v.ifUnauthorized === 'string' ? v.ifUnauthorized : v.message);
            }
        }
        if (v.ifMissing && questionData.requiredPermits) {
            const gear = ctx.speciesData.gearType;
            const gearApplies = !questionData.applicableGear
                || !gear
                || questionData.applicableGear.includes(gear);
            if (gearApplies) {
                const anyMissing = questionData.requiredPermits.some(p => {
                    const val = ctx.speciesData[p.field];
                    return val === false || val === 'no' || val === 'No' || !val;
                });
                if (anyMissing) {
                    messages.push(typeof v.ifMissing === 'string' ? v.ifMissing : v.message);
                }
            }
        }
        return messages;
    }

    function checkBlacknoseLatitudeViolation(speciesId, speciesData, speciesName) {
        if (speciesId !== 'blacknose-shark') return [];
        const count = getCountFromData(speciesData);
        if (!count || count <= 0) return [];
        const checker = typeof isBlacknoseRetentionProhibited === 'function'
            ? isBlacknoseRetentionProhibited
            : (data) => (data?.catchLatitudeZone || data?.['catch-latitude-zone']) === 'north';
        if (checker(speciesData)) {
            return [`VIOLATION: ${speciesName} — retention prohibited north of 34°00′ N (50 CFR 635.22)`];
        }
        return [];
    }

    function checkCountFieldViolations(speciesData, questions, ctx) {
        const messages = [];
        const count = getCountFromData(speciesData);
        if (count === null || count <= 0) return messages;

        const plc = questions.possessionLimitCheck;
        const limit = getPossessionLimitRule(questions, ctx.permitType, ctx.speciesId, speciesData);
        if (limit.prohibited) {
            messages.push(
                plc?.violation?.ifProhibited
                || `PROHIBITED: ${ctx.speciesName} — retention not allowed (${plc?.cfr || '50 CFR 635.23'})`
            );
        } else if (limit.count != null && count > limit.count) {
            messages.push(
                plc?.violation?.ifExceeds
                || `VIOLATION: ${ctx.speciesName} possession exceeds limit: ${count} vs ${limit.count}`
            );
        }

        for (const q of Object.values(questions)) {
            if (q?.violation?.ifGreaterThan !== undefined && q.field && COUNT_FIELDS.has(q.field)) {
                if (count > q.violation.ifGreaterThan) {
                    messages.push(q.violation.message || q.violation.ifExceeds);
                }
            }
        }
        return messages;
    }

    function evaluateAssessmentQuestionViolations(speciesId, species, speciesData) {
        const violations = [];
        if (!species || !speciesData) return violations;

        const questions = species.regulations?.assessmentQuestions;
        if (!questions) return violations;

        const ctx = {
            speciesId,
            species,
            speciesData,
            questions,
            speciesName: species.name || speciesId,
            permitType: speciesData.permitType || speciesData['permit-type'],
            vesselCategory: speciesData.vesselCategory || speciesData['vessel-category']
                || speciesData.vesselClassification
        };

        violations.push(...checkCountFieldViolations(speciesData, questions, ctx));
        violations.push(...checkBlacknoseLatitudeViolation(speciesId, speciesData, ctx.speciesName));

        const assessmentDate = typeof parseAssessmentDate === 'function'
            ? parseAssessmentDate(speciesData)
            : (speciesData.dateOfCatch ? new Date(speciesData.dateOfCatch) : null);

        const count = getCountFromData(speciesData);
        if (count > 0 && speciesData.quotaStatus === 'closed') {
            violations.push(
                `VIOLATION: ${ctx.speciesName} — commercial fishery closed due to quota (${questions.quotaStatus?.cfr || '50 CFR'})`
            );
        }
        if (count > 0 && speciesData.fishingArea === 'closed-area') {
            violations.push(`VIOLATION: ${ctx.speciesName} — fishing in closed area`);
        }

        for (const questionData of Object.values(questions)) {
            if (!questionData?.violation || !questionData.field) continue;

            if (typeof questionAppliesToAssessment === 'function') {
                if (!questionAppliesToAssessment(questionData, ctx)) continue;
            } else {
                if (questionData.applicablePermits && ctx.permitType) {
                    if (!questionData.applicablePermits.includes(ctx.permitType)) continue;
                }
                if (questionData.applicableVesselCategories && ctx.vesselCategory) {
                    if (!questionData.applicableVesselCategories.includes(ctx.vesselCategory)) continue;
                }
                if (questionData.dateFilter?.months && Array.isArray(questionData.dateFilter.months)) {
                    const d = assessmentDate instanceof Date && !Number.isNaN(assessmentDate.getTime())
                        ? assessmentDate
                        : new Date();
                    if (!questionData.dateFilter.months.includes(d.getMonth() + 1)) continue;
                }
            }

            const raw = speciesData[questionData.field];
            if (raw === undefined || raw === null || raw === '') continue;

            const answer = coerceAnswerValue(raw);
            if (typeof answer === 'string' && answer.startsWith('EXCEEDS LIMIT')) {
                violations.push(
                    questionData.violation.ifExceeds
                    || questionData.violation.message
                    || answer
                );
                continue;
            }

            violations.push(...evaluateViolationRule(questionData.violation, answer, questionData, ctx));
        }

        return [...new Set(violations)];
    }

    function simulateProhibitedRetentionViolation(speciesId, entry) {
        if (!isProhibitedSpecies(speciesId, entry)) return null;
        const questions = entry.regulations?.assessmentQuestions;
        const data = { numberOfFish: 1 };
        if (questions) {
            const v = evaluateAssessmentQuestionViolations(speciesId, entry, data);
            if (v.length) return v;
        }
        return [`PROHIBITED: ${entry.name}`];
    }

    const REPORT_FIELD_LABELS = {
        permitType: 'Permit Type',
        possessionAmount: 'Possession',
        numberOfFish: 'Fish on Board',
        numberOfSharks: 'Sharks on Board',
        totalLength: 'Total Length',
        lowerJawForkLength: 'Lower Jaw Fork Length',
        gearType: 'Gear Type',
        meshSize: 'Mesh Size',
        meshSizeCompliance: 'Mesh Compliance',
        hasShark: 'Shark on Board',
        isProhibited: 'Prohibited Species',
        released: 'Released',
        vesselCategory: 'Vessel Category',
        fishingArea: 'Fishing Area',
        dasCategory: 'DAS Category',
        'size-compliant': 'Size Compliance',
        'has-permit': 'Federal Permit',
        'permit-type': 'Permit Type'
    };

    function formatDynamicReportRows(speciesId, species, speciesData) {
        const rows = [];
        const questions = species.regulations?.assessmentQuestions;
        const skip = new Set(['exceedsLimit']);
        if (questions) {
            Object.values(questions).forEach(q => {
                if (!q.field || skip.has(q.field)) return;
                const val = speciesData[q.field];
                if (val === undefined || val === null || val === '') return;
                const label = q.question ? q.question.replace(/\?$/, '') : (REPORT_FIELD_LABELS[q.field] || q.field);
                let display = val;
                if (val === true) display = 'Yes';
                if (val === false) display = 'No';
                rows.push({ label, value: String(display) });
            });
        }
        Object.keys(REPORT_FIELD_LABELS).forEach(field => {
            if (questions && Object.values(questions).some(q => q.field === field)) return;
            const val = speciesData[field];
            if (val === undefined || val === null || val === '') return;
            rows.push({ label: REPORT_FIELD_LABELS[field], value: String(val) });
        });
        return rows;
    }

    return {
        COUNT_FIELDS,
        coerceAnswerValue,
        mapPermitTypeToPossessionKey,
        isProhibitedSpecies,
        getPossessionLimitRule,
        getCountFromData,
        evaluateViolationRule,
        checkCountFieldViolations,
        evaluateAssessmentQuestionViolations,
        simulateProhibitedRetentionViolation,
        formatDynamicReportRows,
        REPORT_FIELD_LABELS
    };
});
