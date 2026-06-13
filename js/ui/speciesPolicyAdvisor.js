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
        'surf-clam', 'ocean-quahog',
        'atlantic-cod', 'haddock', 'yellowtail-flounder', 'monkfish'
    ]);

    const COMPLEX_SPECIES = new Set([
        'bluefin-tuna', 'swordfish', 'billfish', 'atlantic-sea-scallop',
        'summer-flounder', 'atlantic-cod', 'haddock', 'yellowtail-flounder',
        'atlantic-mackerel', 'longfin-squid', 'shortfin-squid',
        'winter-flounder', 'pollock', 'atlantic-halibut', 'monkfish'
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

    function renderSelectedPanel(speciesIds) {
        if (!speciesIds?.length) return '';
        const cards = speciesIds.map(id => {
            const species = typeof SPECIES_DATA !== 'undefined' ? SPECIES_DATA[id] : null;
            if (!species) return '';
            return renderPanelHtml(id, species);
        }).filter(Boolean).join('');
        return `
            <div class="species-policy-panel">
                <h4 class="policy-panel-title">Federal policy at a glance</h4>
                <p class="policy-panel-intro">Selected species — what current FIN data says about compliance. Record amounts in assessment for a formal violation list.</p>
                ${cards}
            </div>
        `;
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
        renderBadgeHtml,
        renderSelectedPanel,
        dataAsOf
    };
})();

if (typeof window !== 'undefined') {
    window.SpeciesPolicyAdvisor = SpeciesPolicyAdvisor;
}
