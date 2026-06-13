/**
 * Species selection policy summaries — federal focus for inspectors.
 * Shows current policy and what "compliant" means before full assessment.
 */
const SpeciesPolicyAdvisor = (function () {
    const VERIFIED_SPECIES = new Set([
        'summer-flounder', 'atlantic-sea-scallop', 'bluefin-tuna', 'swordfish',
        'yellowfin-tuna', 'bigeye-tuna', 'skipjack-tuna', 'albacore-tuna',
        'atlantic-salmon', 'shortfin-mako-shark', 'oceanic-whitetip-shark',
        'atlantic-angel-shark', 'atlantic-cod', 'haddock', 'bluefish',
        'scup', 'black-sea-bass', 'atlantic-herring', 'king-mackerel',
        'spanish-mackerel', 'thorny-skate', 'smooth-skate', 'barndoor-skate',
        'atlantic-mackerel', 'longfin-squid', 'shortfin-squid', 'butterfish', 'atlantic-chub-mackerel',
        'surf-clam', 'ocean-quahog', 'scup', 'black-sea-bass',
        'atlantic-cod', 'haddock', 'yellowtail-flounder', 'monkfish'
    ]);

    const COMPLEX_SPECIES = new Set([
        'bluefin-tuna', 'swordfish', 'billfish', 'atlantic-sea-scallop',
        'summer-flounder', 'atlantic-cod', 'haddock', 'yellowtail-flounder',
        'atlantic-mackerel', 'longfin-squid', 'shortfin-squid',
        'winter-flounder', 'pollock', 'atlantic-halibut', 'monkfish', 'scup', 'black-sea-bass', 'atlantic-herring', 'spiny-dogfish', 'atlantic-deep-sea-red-crab', 'golden-tilefish', 'blueline-tilefish', 'skate', 'thorny-skate', 'smooth-skate', 'barndoor-skate', 'american-lobster', 'jonah-crab'
    ]);

    const CONSERVATION_EQUIVALENCY_SPECIES = new Set([
        'summer-flounder', 'scup', 'black-sea-bass', 'bluefish', 'tautog'
    ]);

    function dataAsOf() {
        if (typeof REGULATION_META !== 'undefined' && REGULATION_META.dataLastUpdated) {
            return REGULATION_META.dataLastUpdated;
        }
        return typeof DATA_LAST_UPDATED !== 'undefined' ? DATA_LAST_UPDATED : '—';
    }

    function isProhibited(speciesId, species) {
        if (typeof AssessmentViolations !== 'undefined') {
            return AssessmentViolations.isProhibitedSpecies(speciesId, species);
        }
        if (species?.prohibited) return true;
        const rec = species?.regulations?.possession?.recreational;
        return !!(rec?.prohibited || rec?.limit?.count === 0);
    }

    function countGenericPlaceholders(species) {
        if (!species?.regulations) return 0;
        const text = JSON.stringify(species.regulations);
        return (text.match(/Check current/gi) || []).length;
    }

    function hasConservationEquivalency(species) {
        const text = JSON.stringify(species?.regulations || {});
        return /conservation equivalency|state measures apply|federal recreational.*waived/i.test(text);
    }

    function extractLimitLine(species) {
        const possession = species?.regulations?.possession;
        if (!possession) return null;
        const rec = possession.recreational;
        if (rec?.prohibited) return 'Recreational retention: prohibited (federal EEZ)';
        if (rec?.limit?.count != null) {
            return `Recreational: ${rec.limit.count} ${rec.limit.unit || 'fish'} (verify state CE if waived federally)`;
        }
        const comm = possession.commercial || possession['commercial-general'];
        if (comm?.notes && !/check current/i.test(comm.notes)) {
            return `Commercial: ${comm.notes.replace(/\s+/g, ' ').slice(0, 120)}`;
        }
        if (comm?.seasonal) {
            return 'Commercial: seasonal possession limits apply (mesh/season)';
        }
        return null;
    }

    function extractSeasonNote(species) {
        return species?.regulations?.seasons?.federal?.notes
            || species?.regulations?.seasons?.federal?.open
            || null;
    }

    function extractPrimarySource(species) {
        const src = species?.regulations?.dataSources?.[0];
        if (!src) return null;
        return src.title ? `${src.title}${src.effective ? ` (${src.effective})` : ''}` : null;
    }

    function getProfile(speciesId, species) {
        if (typeof getHmsPolicyProfile === 'function') {
            const hms = getHmsPolicyProfile(speciesId);
            if (hms) {
                hms.dataAsOf = dataAsOf();
                return hms;
            }
        } else if (typeof getHmsTunasPolicyProfile === 'function') {
            const hms = getHmsTunasPolicyProfile(speciesId);
            if (hms) {
                hms.dataAsOf = dataAsOf();
                return hms;
            }
        }

        if (typeof getSmb648PolicyProfile === 'function') {
            const smb = getSmb648PolicyProfile(speciesId);
            if (smb) {
                smb.dataAsOf = dataAsOf();
                return smb;
            }
        }

        if (typeof getSalmon648PolicyProfile === 'function') {
            const salmon = getSalmon648PolicyProfile(speciesId);
            if (salmon) {
                salmon.dataAsOf = dataAsOf();
                return salmon;
            }
        }

        if (typeof getScallop648PolicyProfile === 'function') {
            const scallop = getScallop648PolicyProfile(speciesId);
            if (scallop) {
                scallop.dataAsOf = dataAsOf();
                return scallop;
            }
        }

        if (typeof getSurfClam648PolicyProfile === 'function') {
            const clam = getSurfClam648PolicyProfile(speciesId);
            if (clam) {
                clam.dataAsOf = dataAsOf();
                return clam;
            }
        }

        if (typeof getSummerFlounder648PolicyProfile === 'function') {
            const sf = getSummerFlounder648PolicyProfile(speciesId);
            if (sf) {
                sf.dataAsOf = dataAsOf();
                return sf;
            }
        }

        if (typeof getScup648PolicyProfile === 'function') {
            const scup = getScup648PolicyProfile(speciesId);
            if (scup) {
                scup.dataAsOf = dataAsOf();
                return scup;
            }
        }

        if (typeof getBsb648PolicyProfile === 'function') {
            const bsb = getBsb648PolicyProfile(speciesId);
            if (bsb) {
                bsb.dataAsOf = dataAsOf();
                return bsb;
            }
        }

        if (typeof getBluefish648PolicyProfile === 'function') {
            const bf = getBluefish648PolicyProfile(speciesId);
            if (bf) {
                bf.dataAsOf = dataAsOf();
                return bf;
            }
        }

        if (typeof getHerring648PolicyProfile === 'function') {
            const herring = getHerring648PolicyProfile(speciesId);
            if (herring) {
                herring.dataAsOf = dataAsOf();
                return herring;
            }
        }

        if (typeof getDogfish648PolicyProfile === 'function') {
            const dogfish = getDogfish648PolicyProfile(speciesId);
            if (dogfish) {
                dogfish.dataAsOf = dataAsOf();
                return dogfish;
            }
        }

        if (typeof getRedCrab648PolicyProfile === 'function') {
            const redCrab = getRedCrab648PolicyProfile(speciesId);
            if (redCrab) {
                redCrab.dataAsOf = dataAsOf();
                return redCrab;
            }
        }

        if (typeof getTilefish648PolicyProfile === 'function') {
            const tilefish = getTilefish648PolicyProfile(speciesId);
            if (tilefish) {
                tilefish.dataAsOf = dataAsOf();
                return tilefish;
            }
        }

        if (typeof getSkate648PolicyProfile === 'function') {
            const skate = getSkate648PolicyProfile(speciesId);
            if (skate) {
                skate.dataAsOf = dataAsOf();
                return skate;
            }
        }

        if (typeof getLobster697PolicyProfile === 'function') {
            const lobster = getLobster697PolicyProfile(speciesId);
            if (lobster) {
                lobster.dataAsOf = dataAsOf();
                return lobster;
            }
        }

        if (typeof getProhib697PolicyProfile === 'function') {
            const prohib697 = getProhib697PolicyProfile(speciesId);
            if (prohib697) {
                prohib697.dataAsOf = dataAsOf();
                return prohib697;
            }
        }

        if (typeof getDolphin622PolicyProfile === 'function') {
            const dolphin = getDolphin622PolicyProfile(speciesId);
            if (dolphin) {
                dolphin.dataAsOf = dataAsOf();
                return dolphin;
            }
        }

        if (typeof getCmp622PolicyProfile === 'function') {
            const cmp = getCmp622PolicyProfile(speciesId);
            if (cmp) {
                cmp.dataAsOf = dataAsOf();
                return cmp;
            }
        }

        if (typeof getForage648PolicyProfile === 'function') {
            const forage = getForage648PolicyProfile(speciesId);
            if (forage) {
                forage.dataAsOf = dataAsOf();
                return forage;
            }
        }

        if (typeof getMps24PolicyProfile === 'function') {
            const mps = getMps24PolicyProfile(speciesId);
            if (mps) {
                mps.dataAsOf = dataAsOf();
                return mps;
            }
        }

        if (typeof getNms648PolicyProfile === 'function') {
            const nms = getNms648PolicyProfile(speciesId);
            if (nms) {
                nms.dataAsOf = dataAsOf();
                return nms;
            }
        }

        if (typeof getMonkfish648PolicyProfile === 'function') {
            const monk = getMonkfish648PolicyProfile(speciesId);
            if (monk) {
                monk.dataAsOf = dataAsOf();
                return monk;
            }
        }

        if (!species) {
            return {
                level: 'advisory',
                badgeLabel: 'No data',
                badgeClass: 'policy-advisory',
                headline: 'Species data not found.',
                bullets: [],
                complianceNote: 'Verify with official NOAA sources.',
                dataAsOf: dataAsOf()
            };
        }

        const bullets = [];
        const asOf = dataAsOf();
        const genericCount = countGenericPlaceholders(species);
        const ce = hasConservationEquivalency(species) || CONSERVATION_EQUIVALENCY_SPECIES.has(speciesId);
        const limitLine = extractLimitLine(species);
        const seasonNote = extractSeasonNote(species);
        const sourceLine = extractPrimarySource(species);

        if (isProhibited(speciesId, species)) {
            bullets.push('Federal: retention/possession in the EEZ is prohibited.');
            bullets.push('Any fish on board → not compliant under federal rules.');
            if (sourceLine) bullets.push(`Source: ${sourceLine}`);
            return {
                level: 'prohibited',
                badgeLabel: 'Prohibited',
                badgeClass: 'policy-prohibited',
                headline: 'Not compliant if any are on board (federal EEZ).',
                bullets,
                complianceNote: 'Compliant only when zero on board and released immediately if taken incidentally.',
                dataAsOf: asOf
            };
        }

        if (ce) {
            bullets.push('Federal recreational measures may be waived — state conservation equivalency applies.');
            bullets.push('FIN may show federal reference limits; confirm state bag/size/season on board.');
        }

        if (limitLine) bullets.push(limitLine);
        if (seasonNote) bullets.push(String(seasonNote).slice(0, 200));
        if (COMPLEX_SPECIES.has(speciesId)) {
            bullets.push('Complex fishery: permit category, gear, area, or quota may change what is compliant.');
        }
        if (genericCount >= 3) {
            bullets.push('Limits not fully automated in FIN — confirm current NOAA bulletin before relying on pass/fail.');
        }
        if (sourceLine) bullets.push(`Policy verified against: ${sourceLine}`);
        bullets.push(`Data in FIN as of ${asOf}.`);

        let level = 'advisory';
        let badgeLabel = 'Verify bulletin';
        let badgeClass = 'policy-advisory';
        let headline = 'Confirm current federal policy before deciding compliance.';
        let complianceNote = 'Use assessment steps to record amounts and get a violation list.';

        if (VERIFIED_SPECIES.has(speciesId) && genericCount < 3) {
            level = COMPLEX_SPECIES.has(speciesId) ? 'complex' : 'verified';
            badgeLabel = level === 'complex' ? 'Complex — see policy' : 'Federal data';
            badgeClass = level === 'complex' ? 'policy-complex' : 'policy-verified';
            headline = level === 'complex'
                ? 'Current federal rules apply — several factors decide compliance.'
                : 'Federal limits loaded — compliance depends on amounts, permits, and gear.';
            complianceNote = ce
                ? 'Under federal reference rules + verify state recreational measures.'
                : 'Compliant when within limits, valid permit, size, gear, and area rules you enter in assessment.';
        }

        if (bullets.length === 0) {
            bullets.push('No detailed federal summary in FIN yet.');
            bullets.push('Check 50 CFR 648 / 635 and NOAA bulletins for this species.');
        }

        return {
            level,
            badgeLabel,
            badgeClass,
            headline,
            bullets,
            complianceNote,
            dataAsOf: asOf,
            conservationEquivalency: ce
        };
    }

    function renderBadgeHtml(profile) {
        return `<div class="species-badge policy-badge ${profile.badgeClass}" title="${escapeAttr(profile.headline)}">${profile.badgeLabel}</div>`;
    }

    function renderPanelHtml(speciesId, species) {
        const p = getProfile(speciesId, species);
        const bullets = p.bullets.map(b => `<li>${escapeHtml(b)}</li>`).join('');
        return `
            <div class="policy-card" data-species-id="${escapeAttr(speciesId)}">
                <div class="policy-card-header">
                    <strong>${escapeHtml(species.name || speciesId)}</strong>
                    <span class="policy-badge ${p.badgeClass}">${escapeHtml(p.badgeLabel)}</span>
                </div>
                <p class="policy-headline">${escapeHtml(p.headline)}</p>
                <ul class="policy-bullets">${bullets}</ul>
                <p class="policy-compliance-note"><strong>Inspector:</strong> ${escapeHtml(p.complianceNote)}</p>
            </div>
        `;
    }

    const STEP_BULLET_PATTERNS = {
        permits: /permit|operator|moratorium|limited access|open access|endorsement|not regulated|HMS|Angling Category|sector|ACE|DAS|LOA|IFQ|quota/i,
        possession: /possession|limit|\blb\b|per person|per trip|recreational|commercial|combined|prohibited|retention|unlimited|not to exceed|on board|EEZ|fish per|bag|quota|ACE|trip limit/i,
        'size-gear': /minimum size|mesh|gear|fork length|carcass|head and fins|TED|≤|≥|″|inch|CFL|curved|state bag|state size|season|size limit|head-on|gillnet|trawl/i,
        'vessel-requirements': /VMS|observer|transfer at sea|reporting|TDD|declar|at-sea/i,
        'dynamic-assessment': /closed|area|transit|reserve|RGA|GRA|zone|EEZ|management unit|chart|corridor|coordinates|closure|TED|observer|sector|common pool|multispecies/i,
        'vessel-classification': /sector|common pool|ACE|DAS|LOA|multispecies|trip limit|Cat [A-Z]|operator permit|limited access|open access/i
    };

    const META_BULLET = /^(Data in FIN|Policy verified against|Source:|No detailed federal summary|Check 50 CFR)/i;

    function isDedicatedPolicyProfile(profile) {
        return profile?.badgeClass === 'policy-complex'
            || profile?.badgeClass === 'policy-prohibited'
            || profile?.badgeClass === 'policy-verified'
            || profile?.level === 'complex'
            || profile?.level === 'prohibited';
    }

    function hasLocationChecklist(speciesId) {
        return typeof LOCATION_CHECKLIST_BY_SPECIES !== 'undefined'
            && !!LOCATION_CHECKLIST_BY_SPECIES[speciesId];
    }

    function extractPermitBulletsFromSpecies(species) {
        const items = [];
        const permits = species?.regulations?.permits;
        if (!permits) return items;
        Object.entries(permits).forEach(([key, permit]) => {
            if (!permit) return;
            if (permit.required === true) {
                items.push(`${permit.name || key} required${permit.cfr ? ` (${permit.cfr})` : ''}`);
            } else if (key === 'recreational' && permit.required === false) {
                items.push('Recreational: No federal permit required');
            }
            if (permit.notes && !/check current/i.test(permit.notes)) {
                items.push(String(permit.notes).replace(/\s+/g, ' ').slice(0, 160));
            }
        });
        return items;
    }

    function extractSizeGearBulletsFromSpecies(species) {
        const items = [];
        const size = species?.regulations?.size;
        if (size) {
            if (size.minimum != null && size.minimum !== undefined) {
                items.push(`Minimum size: ${size.minimum} ${size.unit || 'inches'}${size.cfr ? ` (${size.cfr})` : ''}`);
            } else if (size.notes && !/check current/i.test(size.notes)) {
                items.push(String(size.notes).replace(/\s+/g, ' ').slice(0, 160));
            }
        }
        const gear = species?.regulations?.gear;
        if (gear) {
            Object.values(gear).forEach(g => {
                if (g?.notes && !/check current/i.test(g.notes)) {
                    items.push(String(g.notes).replace(/\s+/g, ' ').slice(0, 160));
                }
            });
        }
        return items;
    }

    function actionableBullets(profile) {
        return (profile?.bullets || []).filter(b => !META_BULLET.test(String(b).trim()));
    }

    function filterBulletsByStep(bullets, stepName) {
        const pattern = STEP_BULLET_PATTERNS[stepName];
        if (!pattern || !bullets?.length) return [];
        return bullets.filter(b => pattern.test(b));
    }

    function getFallbackBulletsForStep(speciesId, stepName, species, profile, actionable) {
        switch (stepName) {
            case 'permits': {
                const permitItems = extractPermitBulletsFromSpecies(species);
                if (permitItems.length) return permitItems;
                if (profile.level === 'prohibited') {
                    const banned = filterBulletsByStep(actionable, 'possession');
                    if (banned.length) return banned.slice(0, 2);
                    return profile.headline ? [profile.headline] : ['Federal EEZ retention is prohibited — permit does not authorize possession.'];
                }
                if (profile.headline && STEP_BULLET_PATTERNS.permits.test(profile.headline)) {
                    return [profile.headline];
                }
                if (isDedicatedPolicyProfile(profile) && actionable.length) {
                    return actionable.slice(0, 2);
                }
                return [];
            }
            case 'possession': {
                if (profile.level === 'prohibited') {
                    const banned = filterBulletsByStep(actionable, 'possession');
                    return banned.length ? banned : actionable.slice(0, 3);
                }
                if (profile.headline && STEP_BULLET_PATTERNS.possession.test(profile.headline)) {
                    return [profile.headline, ...filterBulletsByStep(actionable, 'possession')].slice(0, 4);
                }
                return actionable.slice(0, 3);
            }
            case 'size-gear': {
                const sizeItems = extractSizeGearBulletsFromSpecies(species);
                if (sizeItems.length) return sizeItems;
                const matched = filterBulletsByStep(actionable, 'size-gear');
                if (matched.length) return matched;
                if (profile.conservationEquivalency || CONSERVATION_EQUIVALENCY_SPECIES.has(speciesId)) {
                    return actionable.filter(b => /state|conservation equivalency|size|season/i.test(b)).slice(0, 2);
                }
                return [];
            }
            case 'vessel-requirements':
                return filterBulletsByStep(actionable, 'vessel-requirements');
            case 'dynamic-assessment': {
                if (!hasLocationChecklist(speciesId)) return [];
                const area = filterBulletsByStep(actionable, 'dynamic-assessment');
                if (area.length) return area;
                if (profile.headline) return [profile.headline];
                return isDedicatedPolicyProfile(profile) ? actionable.slice(0, 2) : [];
            }
            case 'vessel-classification': {
                const nms = filterBulletsByStep(actionable, 'vessel-classification');
                if (nms.length) return nms;
                if (isMultispeciesSpecies(speciesId) && profile.headline) {
                    return [profile.headline, ...actionable.slice(0, 2)];
                }
                return [];
            }
            default:
                return [];
        }
    }

    function isMultispeciesSpecies(speciesId) {
        if (typeof isMultispecies === 'function') {
            return isMultispecies(speciesId);
        }
        return false;
    }

    function getBulletsForStep(speciesId, stepName) {
        const species = typeof SPECIES_DATA !== 'undefined' ? SPECIES_DATA[speciesId] : null;
        if (!species) return [];
        const profile = getProfile(speciesId, species);
        const actionable = actionableBullets(profile);
        const matched = filterBulletsByStep(actionable, stepName);
        if (matched.length) return matched;
        return getFallbackBulletsForStep(speciesId, stepName, species, profile, actionable);
    }

    function appendPolicyQuickReference(requirements, stepName, speciesIds) {
        if (!speciesIds?.length || !requirements) return;
        speciesIds.forEach(speciesId => {
            if (speciesId === 'northeast-multispecies') return;
            const species = SPECIES_DATA?.[speciesId];
            if (!species) return;
            const items = getBulletsForStep(speciesId, stepName);
            if (items.length === 0) return;
            const profile = getProfile(speciesId, species);
            const title = profile?.badgeLabel
                ? `${species.name} — ${profile.badgeLabel}`
                : `${species.name} — Federal Policy`;
            requirements.push({ title, items: [...items] });
            if (stepName === 'possession' && profile?.complianceNote) {
                requirements.push({
                    title: `${species.name} — Inspector Note`,
                    items: [profile.complianceNote]
                });
            }
        });
    }

    function renderPolicyContextBlock(speciesId, stepName) {
        const species = SPECIES_DATA?.[speciesId];
        if (!species) return '';
        const items = getBulletsForStep(speciesId, stepName);
        if (items.length === 0) return '';
        const list = items.map(b => `<li>${escapeHtml(b)}</li>`).join('');
        return `<div class="policy-step-context"><ul class="policy-bullets">${list}</ul></div>`;
    }

    function renderSelectedPanel(speciesIds) {
        return '';
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function escapeAttr(str) {
        return escapeHtml(str).replace(/'/g, '&#39;');
    }

    return {
        getProfile,
        getBulletsForStep,
        appendPolicyQuickReference,
        renderPolicyContextBlock,
        renderBadgeHtml,
        renderSelectedPanel,
        dataAsOf
    };
})();

if (typeof window !== 'undefined') {
    window.SpeciesPolicyAdvisor = SpeciesPolicyAdvisor;
}
