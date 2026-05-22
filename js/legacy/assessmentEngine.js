// FIN - Fisheries Inspection Navigator
// Legacy assessment engine: grouped steps, violation logic, report generation.
// State: AppState (js/state/stateManager.js) is authoritative; bound via StateBridge in app/main.js.

let selectedSpecies;
let currentStep = 0;
let totalSteps = 9;
let assessmentData;

/** Rebind legacy locals to AppState after reset or orchestrator init */
function syncLegacyStateRefs() {
    if (typeof window !== 'undefined' && window.appState) {
        selectedSpecies = window.appState.selectedSpecies;
        assessmentData = window.appState.assessmentData;
        currentStep = window.appState.currentStep;
    } else {
        selectedSpecies = window.selectedSpecies || [];
        assessmentData = window.assessmentData || { vessel: {}, species: {} };
    }
    if (typeof window !== 'undefined') {
        window.selectedSpecies = selectedSpecies;
        window.assessmentData = assessmentData;
    }
}

syncLegacyStateRefs();

// Favorites Management Functions (define early so they're available everywhere)
function getFavorites() {
    try {
        const favorites = localStorage.getItem('fisheries-favorites');
        return favorites ? JSON.parse(favorites) : [];
    } catch (error) {
        console.error('Error reading favorites from localStorage:', error);
        return [];
    }
}

function saveFavorites(favorites) {
    try {
        localStorage.setItem('fisheries-favorites', JSON.stringify(favorites));
    } catch (error) {
        console.error('Error saving favorites to localStorage:', error);
    }
}

function toggleFavorite(speciesId) {
    const favorites = getFavorites();
    const index = favorites.indexOf(speciesId);
    
    if (index > -1) {
        // Remove from favorites
        favorites.splice(index, 1);
    } else {
        // Add to favorites
        favorites.push(speciesId);
    }
    
    saveFavorites(favorites);
    
    // Get the updated favorite status
    const isFavorited = favorites.includes(speciesId);
    const favoriteIcon = isFavorited ? '⭐' : '☆';
    const favoriteTitle = isFavorited ? 'Remove from favorites' : 'Add to favorites';
    
    // Update ALL cards with this species ID (both in favorites section and main grid)
    const allCards = document.querySelectorAll(`[data-species-id="${speciesId}"]`);
    allCards.forEach(card => {
        const favoriteButton = card.querySelector('.favorite-button');
        if (favoriteButton) {
            favoriteButton.textContent = favoriteIcon;
            favoriteButton.title = favoriteTitle;
        }
    });
    
    // Refresh the species grid to update card positions (favorites move to top)
    populateSpeciesGrid();
    
    // Refresh favorites section to reflect updated favorites
    const favoritesGrid = document.getElementById('favorites-grid');
    const favoritesSection = document.getElementById('favorites-section');
    
    if (isFavorited) {
        // If favorited, ensure it's in favorites section
        // populateSpeciesGrid will handle this, but we also refresh favorites section explicitly
        const currentFavorites = getFavorites(); // Get fresh list after save
        const favoriteSpecies = currentFavorites.map(id => {
            const s = SPECIES_DATA[id];
            if (!s) return null;
            return {
                id: id,
                species: s,
                name: s.name,
                commonName: s.commonName || ''
            };
        }).filter(item => item !== null);
        
        // Re-populate favorites section with updated list
        if (favoriteSpecies.length > 0) {
            populateFavoritesSection(favoriteSpecies);
        }
    } else {
        // If unfavorited, remove from favorites section
        if (favoritesGrid) {
            const favoriteCard = favoritesGrid.querySelector(`[data-species-id="${speciesId}"]`);
            if (favoriteCard) {
                favoriteCard.remove();
                // Hide favorites section if empty
                if (favoritesSection && favoritesGrid.children.length === 0) {
                    favoritesSection.style.display = 'none';
                }
            }
        }
    }
}

// Make toggleFavorite globally accessible
window.toggleFavorite = toggleFavorite;
window.getFavorites = getFavorites;

// Populate favorites section
function populateFavoritesSection(favoriteSpeciesList = null) {
    const favoritesSection = document.getElementById('favorites-section');
    const favoritesGrid = document.getElementById('favorites-grid');
    
    if (!favoritesSection || !favoritesGrid) {
        console.warn('Favorites section elements not found - HTML may not be loaded yet');
        // Try again after a short delay
        setTimeout(() => populateFavoritesSection(favoriteSpeciesList), 100);
        return;
    }
    
    // If no list provided, get it from favorites
    if (!favoriteSpeciesList) {
        const favorites = getFavorites();
        favoriteSpeciesList = favorites.map(speciesId => {
            const species = SPECIES_DATA[speciesId];
            if (!species) return null;
            return {
                id: speciesId,
                species: species,
                name: species.name,
                commonName: species.commonName || ''
            };
        }).filter(item => item !== null);
    }
    
    if (favoriteSpeciesList.length > 0) {
        favoritesSection.style.display = 'block';
        favoritesGrid.innerHTML = '';
        
        favoriteSpeciesList.forEach(item => {
            try {
                let card;
                if (item.species.available === false) {
                    const image = (typeof generateFishImage === 'function') 
                        ? generateFishImage(item.id, item.species.name, item.species.color)
                        : generatePlaceholderImage(item.species.name, item.species.color);
                    card = createSpeciesCard(item.id, {
                        name: item.species.name,
                        image: image,
                        color: item.species.color,
                        available: false
                    });
                } else {
                    card = createSpeciesCard(item.id, item.species);
                }
                card.dataset.speciesName = item.name.toLowerCase();
                card.dataset.speciesCommonName = (item.commonName || '').toLowerCase();
                card.classList.add('favorite-card');
                
                // Ensure favorite icon is shown on favorites section cards
                const favoriteButton = card.querySelector('.favorite-button');
                if (favoriteButton) {
                    favoriteButton.textContent = '⭐';
                    favoriteButton.title = 'Remove from favorites';
                } else if (item.species.available !== false) {
                    // Add favorite button if it doesn't exist (for placeholder species)
                    const button = document.createElement('div');
                    button.className = 'favorite-button';
                    button.textContent = '⭐';
                    button.title = 'Remove from favorites';
                    button.onclick = (e) => {
                        e.stopPropagation();
                        toggleFavorite(item.id);
                    };
                    card.appendChild(button);
                }
                
                favoritesGrid.appendChild(card);
            } catch (error) {
                console.error('Error creating favorite card for', item.id, ':', error);
            }
        });
    } else {
        favoritesSection.style.display = 'none';
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Set homepage update date
    updateHomepageUpdateDate();
    
    // Start at homepage
    currentStep = -1; // Homepage is step -1, species selection is step 0
    showStep(-1);
    
    // Populate species selection grid (will be shown when Northeast is selected)
    populateSpeciesGrid();
});

// Populate species selection grid
// NOTE: May be overridden by app/main.js (SpeciesGrid / Navigation)
function populateSpeciesGrid() {
    // If new modular system is active, don't run old code
    if (window.speciesGrid && window.speciesGrid.populate) {
        console.log('Using new modular species grid');
        // Still need to populate favorites if using new system
        populateFavoritesSection();
        return;
    }
    
    const grid = document.getElementById('species-grid');
    if (!grid) {
        console.error('Species grid element not found');
        return;
    }
    
    grid.innerHTML = '';
    
    // Collect all species with their data
    const allSpecies = [];
    
    // Add individual species with full data
    Object.keys(SPECIES_DATA).forEach(speciesId => {
        try {
            const species = SPECIES_DATA[speciesId];
            allSpecies.push({
                id: speciesId,
                species: species,
                name: species.name,
                commonName: species.commonName || ''
            });
        } catch (error) {
            console.error('Error processing species for', speciesId, ':', error);
        }
    });
    
    // Filter out species already in SPECIES_DATA and add remaining placeholders
    const existingSpeciesIds = Object.keys(SPECIES_DATA);
    const newPlaceholders = SPECIES_PLACEHOLDERS.filter(p => !existingSpeciesIds.includes(p.id));
    newPlaceholders.forEach(placeholder => {
        allSpecies.push({
            id: placeholder.id,
            species: {
                name: placeholder.name,
                image: null,
                color: placeholder.color,
                available: false
            },
            name: placeholder.name,
            commonName: ''
        });
    });
    
    // Get favorites from localStorage
    const favorites = getFavorites();
    
    // Separate favorites from other species
    const favoriteSpecies = [];
    const otherSpecies = [];
    
    allSpecies.forEach(item => {
        if (favorites.includes(item.id)) {
            favoriteSpecies.push(item);
        } else {
            otherSpecies.push(item);
        }
    });
    
    // Sort both lists alphabetically
    favoriteSpecies.sort((a, b) => {
        const nameA = a.name.toUpperCase();
        const nameB = b.name.toUpperCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
    });
    
    otherSpecies.sort((a, b) => {
        const nameA = a.name.toUpperCase();
        const nameB = b.name.toUpperCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
    });
    
    // Display favorites section
    populateFavoritesSection(favoriteSpecies);
    
    // Create and append cards in alphabetical order (non-favorites)
    otherSpecies.forEach(item => {
        try {
            let card;
            if (item.species.available === false) {
                // Placeholder species
                const image = (typeof generateFishImage === 'function') 
                    ? generateFishImage(item.id, item.species.name, item.species.color)
                    : generatePlaceholderImage(item.species.name, item.species.color);
                card = createSpeciesCard(item.id, {
                    name: item.species.name,
                    image: image,
                    color: item.species.color,
                    available: false
                });
            } else {
                // Full species data
                card = createSpeciesCard(item.id, item.species);
            }
            card.dataset.speciesName = item.name.toLowerCase();
            card.dataset.speciesCommonName = (item.commonName || '').toLowerCase();
            grid.appendChild(card);
        } catch (error) {
            console.error('Error creating species card for', item.id, ':', error);
        }
    });
}

// Filter species grid based on search input
function filterSpeciesGrid(searchTerm) {
    const grid = document.getElementById('species-grid');
    const favoritesGrid = document.getElementById('favorites-grid');
    if (!grid) return;
    
    const searchLower = searchTerm.toLowerCase().trim();
    const allCards = [
        ...(grid.querySelectorAll('.species-card, .multispecies-card')),
        ...(favoritesGrid ? favoritesGrid.querySelectorAll('.species-card, .multispecies-card') : [])
    ];
    let visibleCount = 0;
    
    if (searchLower === '') {
        // Show all cards
        allCards.forEach(card => {
            card.style.display = '';
            visibleCount++;
        });
        // Show/hide favorites section based on whether it has visible cards
        const favoritesSection = document.getElementById('favorites-section');
        if (favoritesSection && favoritesGrid) {
            const favoriteCards = favoritesGrid.querySelectorAll('.species-card');
            favoritesSection.style.display = favoriteCards.length > 0 ? 'block' : 'none';
        }
    } else {
        // Filter cards based on search term
        allCards.forEach(card => {
            const speciesName = card.dataset.speciesName || '';
            const commonName = card.dataset.speciesCommonName || '';
            const cardText = card.textContent.toLowerCase();
            
            // Check if search term matches species name, common name, or any text in the card
            const matches = speciesName.includes(searchLower) || 
                          commonName.includes(searchLower) || 
                          cardText.includes(searchLower);
            
            if (matches) {
                card.style.display = '';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });
        
        // Show/hide favorites section based on whether it has visible cards
        const favoritesSection = document.getElementById('favorites-section');
        if (favoritesSection && favoritesGrid) {
            const visibleFavorites = Array.from(favoritesGrid.querySelectorAll('.species-card'))
                .filter(card => card.style.display !== 'none');
            favoritesSection.style.display = visibleFavorites.length > 0 ? 'block' : 'none';
        }
    }
    
    // Show "no results" message if no cards are visible
    let noResultsMsg = document.getElementById('no-species-results');
    if (visibleCount === 0 && searchLower !== '') {
        if (!noResultsMsg) {
            noResultsMsg = document.createElement('div');
            noResultsMsg.id = 'no-species-results';
            noResultsMsg.className = 'no-results-message';
            noResultsMsg.textContent = `No species found matching "${searchTerm}"`;
            grid.parentNode.insertBefore(noResultsMsg, grid);
        }
        noResultsMsg.style.display = 'block';
    } else if (noResultsMsg) {
        noResultsMsg.style.display = 'none';
    }
}

function createSpeciesCard(speciesId, species) {
    const card = document.createElement('div');
    card.className = `species-card ${species.available === false ? 'unavailable' : ''}`;
    card.dataset.speciesId = speciesId;
    
    // Determine if species is available
    const isAvailable = species.available !== false;
    
    // Generate or use fish image - handle errors gracefully
    let fishImage = species.image;
    try {
        // First, check if there's an image file path specified
        if (species.imagePath) {
            fishImage = species.imagePath;
        } else if (!fishImage) {
            // Fall back to generated image if no file path
            if (typeof generateFishImage === 'function') {
                fishImage = generateFishImage(speciesId, species.name, species.color);
            } else {
                fishImage = generatePlaceholderImage(species.name, species.color);
            }
        }
    } catch (error) {
        console.error('Error generating image for', speciesId, ':', error);
        // Use fallback placeholder
        fishImage = generatePlaceholderImage(species.name, species.color);
    }
    
    // Ensure we have a valid image
    if (!fishImage) {
        fishImage = generatePlaceholderImage(species.name || speciesId, species.color || '#696969');
    }
    
    // Set up click handler BEFORE setting innerHTML (important!)
    if (isAvailable) {
        card.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleSpecies(speciesId);
        };
        card.style.cursor = 'pointer';
    } else {
        card.style.cursor = 'not-allowed';
    }
    
    // Set the card content
    try {
        // Use lazy loading for images (only load when visible) - improves initial page load
        const loadingAttr = species.imagePath ? 'loading="lazy"' : ''; // Lazy load file images, eager for SVG data URIs
        const decodingAttr = species.imagePath ? 'decoding="async"' : ''; // Async decode for better performance
        
        if (!isAvailable) {
            card.innerHTML = `
                <img src="${fishImage}" alt="${species.name}" class="species-image" ${loadingAttr} ${decodingAttr} onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iI2Y1ZjVmNSIgcng9IjgiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0cHgiIGZpbGw9IiM3MzYzNDciIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZQ==';">
                <div class="species-name">${species.name}</div>
                <div class="species-badge unavailable-badge">Coming Soon</div>
            `;
        } else {
            // Check if this species is favorited
            const isFavorited = getFavorites().includes(speciesId);
            const favoriteIcon = isFavorited ? '⭐' : '☆';
            
            card.innerHTML = `
                <div class="favorite-button" onclick="event.stopPropagation(); toggleFavorite('${speciesId}')" title="${isFavorited ? 'Remove from favorites' : 'Add to favorites'}">
                    ${favoriteIcon}
                </div>
                <img src="${fishImage}" alt="${species.name}" class="species-image" ${loadingAttr} ${decodingAttr} onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iI2Y1ZjVmNSIgcng9IjgiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0cHgiIGZpbGw9IiM3MzYzNDciIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZQ==';">
                <div class="species-name">${species.name}</div>
                <div class="species-badge">Available</div>
            `;
        }
    } catch (error) {
        console.error('Error setting card HTML for', speciesId, ':', error);
        // Ultimate fallback
        card.innerHTML = `
            <div class="species-name">${species.name || speciesId}</div>
            <div class="species-badge">${isAvailable ? 'Available' : 'Coming Soon'}</div>
        `;
    }
    
    return card;
}

// Toggle species selection
// NOTE: May be overridden by app/main.js (SpeciesGrid / Navigation)
function toggleSpecies(speciesId) {
    // If new modular system is active, use it
    if (window.speciesGrid && window.speciesGrid.toggleSpecies) {
        window.speciesGrid.toggleSpecies(speciesId);
        return;
    }
    
    try {
        console.log('toggleSpecies called for:', speciesId);
        
        // Temporarily disable validation to debug
        // if (!validateSpeciesData(speciesId)) {
        //     return;
        // }
        
        const index = selectedSpecies.indexOf(speciesId);
        const card = document.querySelector(`[data-species-id="${speciesId}"]`);
        
        if (!card) {
            console.error('Card not found for species:', speciesId);
            return;
        }
        
        if (index === -1) {
            selectedSpecies.push(speciesId);
            card.classList.add('selected');
            console.log('Species selected:', speciesId, 'Total:', selectedSpecies.length);
        } else {
            selectedSpecies.splice(index, 1);
            card.classList.remove('selected');
            console.log('Species deselected:', speciesId, 'Total:', selectedSpecies.length);
        }
        
        updateSelectedSpeciesDisplay();
        const continueBtn = document.getElementById('continue-species');
        if (continueBtn) {
            continueBtn.disabled = selectedSpecies.length === 0;
        }
    } catch (error) {
        console.error(`Error toggling species ${speciesId}:`, error);
        showErrorMessage('Error selecting species. Please try again.');
    }
}

// Update selected species display
function updateSelectedSpeciesDisplay() {
    const display = document.getElementById('selected-species-display-top');
    const list = document.getElementById('selected-list-top');
    const continueBtn = document.getElementById('continue-species');
    
    if (selectedSpecies.length === 0) {
        if (display) display.style.display = 'none';
        if (continueBtn) continueBtn.disabled = true;
        return;
    }
    
    if (display) {
        display.style.display = 'block';
    }
    
    if (list) {
        list.innerHTML = selectedSpecies.map(id => {
            const species = SPECIES_DATA[id];
            return `<span class="selected-species-tag">${species.name}</span>`;
        }).join('');
    }
    
    if (continueBtn) {
        continueBtn.disabled = false;
    }
}

// Progress bar update
function updateProgress() {
    // Hide progress bar on homepage
    const progressContainer = document.querySelector('.progress-container');
    if (currentStep === -1) {
        if (progressContainer) progressContainer.style.display = 'none';
        return;
    } else {
        if (progressContainer) progressContainer.style.display = 'flex';
    }
    
    // Calculate total steps for grouped approach
    const multispeciesSelected = selectedSpecies.filter(id => isMultispecies(id));
    const hasMultispecies = multispeciesSelected.length > 0;
    
    const baseSteps = 1; // Species selection
    const vesselClassificationStep = hasMultispecies ? 1 : 0; // Vessel classification for multispecies
    const groupedSteps = 4; // Permits, Possession, Size/Gear, Vessel Requirements
    const finalStep = 1; // Results
    const calculatedTotalSteps = baseSteps + vesselClassificationStep + groupedSteps + finalStep;
    
    // Adjust currentStep for display (homepage is -1, species selection is 0)
    let displayStep = currentStep;
    if (currentStep < 0) {
        displayStep = 0;
    }
    
    const progress = (displayStep / calculatedTotalSteps) * 100;
    document.getElementById('progress-bar').style.setProperty('--progress', `${progress}%`);
    document.getElementById('progress-text').textContent = `Step ${displayStep + 1} of ${calculatedTotalSteps}`;
}

// Update homepage update date
function updateHomepageUpdateDate() {
    // Get date from update-checker.js - wait for it to load
    const tryUpdate = () => {
        if (typeof DATA_LAST_UPDATED !== 'undefined' && typeof formatDate === 'function') {
            const homepageDateElement = document.getElementById('homepage-last-update-date');
            if (homepageDateElement) {
                homepageDateElement.textContent = formatDate(DATA_LAST_UPDATED);
            }
        } else {
            // Retry after a short delay if update-checker.js hasn't loaded yet
            setTimeout(tryUpdate, 50);
        }
    };
    tryUpdate();
}

// Select regional fishery
function selectRegionalFishery(region) {
    if (region === 'northeast') {
        // Navigate to species selection
        showStep(0);
    }
    // Future: handle other regions here
}

// Navigation
function showStep(step) {
    document.querySelectorAll('.step-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const multispeciesSelected = selectedSpecies.filter(id => isMultispecies(id));
    const hasMultispecies = multispeciesSelected.length > 0;
    
    if (step === -1) {
        // Homepage
        document.getElementById('step-homepage').classList.add('active');
    } else if (step === 0) {
        // Species selection - hide assessment sections and results
        const step0 = document.getElementById('step-0');
        if (step0) {
            step0.classList.add('active');
            step0.style.display = 'block';
        }
        
        // Hide all grouped assessment steps first
        document.querySelectorAll('.grouped-assessment').forEach(groupedStep => {
            groupedStep.classList.remove('active');
            groupedStep.style.display = 'none';
        });
        
        // Hide assessment sections
        const assessmentSections = document.getElementById('assessment-sections');
        if (assessmentSections) {
            assessmentSections.style.display = 'none';
        }
        
        // Hide results section
        const resultsSection = document.getElementById('results-section');
        if (resultsSection) {
            resultsSection.classList.remove('active');
            resultsSection.style.display = 'none';
        }
    } else if (step === 1) {
        // Step 1 (vessel info) removed - skip directly to assessment
        // Generate grouped assessment steps
        if (selectedSpecies.length > 0) {
            generateGroupedAssessmentSteps();
            if (hasMultispecies) {
                showGroupedStep('vessel-classification');
            } else {
                showGroupedStep('permits');
            }
        }
    } else if (hasMultispecies && step >= 2 && step <= 6) {
        // Show specific grouped assessment step (with vessel classification)
        // Step 1 is assessment start, so step 2 = vessel-classification(0), step 3 = permits(1), step 4 = possession(2), etc.
        const stepNames = ['vessel-classification', 'permits', 'possession', 'size-gear', 'vessel-requirements'];
        const stepIndex = step - 2;
        const stepName = stepNames[stepIndex];
        console.log(`showStep(${step}) for multispecies: stepIndex=${stepIndex}, stepName=${stepName}`);
        if (stepName) {
            showGroupedStep(stepName);
        } else {
            console.error(`Invalid step index ${stepIndex} for multispecies (step ${step})`);
        }
    } else if (!hasMultispecies && step >= 2 && step <= 5) {
        // Show specific grouped assessment step (without vessel classification)
        // Step 2 = permits(0), step 3 = possession(1), step 4 = size-gear(2), step 5 = vessel-requirements(3)
        const stepNames = ['permits', 'possession', 'size-gear', 'vessel-requirements'];
        const stepIndex = step - 2;
        const stepName = stepNames[stepIndex];
        console.log(`showStep(${step}) for non-multispecies: stepIndex=${stepIndex}, stepName=${stepName}`);
        if (stepName) {
            showGroupedStep(stepName);
        } else {
            console.error(`Invalid step index ${stepIndex} for non-multispecies (step ${step})`);
        }
    } else if ((hasMultispecies && step === 7) || (!hasMultispecies && step === 6)) {
        // Results step
        // Results - hide all grouped assessment steps first
        document.querySelectorAll('.grouped-assessment').forEach(groupedStep => {
            groupedStep.style.display = 'none';
        });
        
        // Hide assessment sections container
        const assessmentSections = document.getElementById('assessment-sections');
        if (assessmentSections) {
            assessmentSections.style.display = 'none';
        }
        
        // Generate and show report
        generateReport();
        const resultsSection = document.getElementById('results-section');
        if (resultsSection) {
            resultsSection.classList.add('active');
            resultsSection.style.display = 'block';
        }
    }
    
    currentStep = step;
    updateProgress();
}

// Generate vessel classification step for multispecies
function generateVesselClassificationStep() {
    const container = document.getElementById('assessment-sections');
    
    // Remove existing vessel classification section if it exists
    const existingSection = document.getElementById('grouped-vessel-classification');
    if (existingSection) {
        existingSection.remove();
    }
    
    const section = document.createElement('section');
    section.className = 'step-section grouped-assessment';
    section.id = 'grouped-vessel-classification';
    
    const multispData = NORTHEAST_MULTISPECIES_DATA;
    
    let html = `
        <div class="grouped-header">
            <h2>Vessel Classification</h2>
            <p class="grouped-subtitle">Determine vessel enrollment status for Northeast Multispecies fishery</p>
        </div>
        
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
    container.appendChild(section);
}

// Handle vessel classification selection
function selectVesselClassification(btn) {
    try {
        const value = btn.dataset.value;
        
        // Check if this button is already selected - if so, deselect it
        const isCurrentlySelected = btn.classList.contains('selected');
        const currentValue = assessmentData.vessel?.multispecies?.classification || assessmentData.vesselClassification;
        
        // Find the choice group container
        const choiceGroup = btn.closest('.choice-group');
        
        // Remove selection from all vessel classification buttons in this group first
        if (choiceGroup) {
            choiceGroup.querySelectorAll('.vessel-class-btn').forEach(b => {
                b.classList.remove('selected');
            });
        } else {
            // Fallback: remove from all vessel class buttons
            document.querySelectorAll('.vessel-class-btn').forEach(b => {
                b.classList.remove('selected');
            });
        }
        
        // If clicking the same button that was already selected, deselect it
        if (isCurrentlySelected && currentValue === value) {
            // Clear the stored classification
            if (assessmentData.vessel?.multispecies) {
                delete assessmentData.vessel.multispecies.classification;
            }
            assessmentData.vesselClassification = null;
            
            // Disable continue button
            const continueBtn = document.getElementById('continue-vessel-classification');
            if (continueBtn) {
                continueBtn.disabled = true;
            }
            
            // Update quick reference
            updateQuickReference('possession');
            return;
        }
        
        // Select this button
        btn.classList.add('selected');
        
        // Store classification
        if (!assessmentData.vessel) {
            assessmentData.vessel = {};
        }
        if (!assessmentData.vessel.multispecies) {
            assessmentData.vessel.multispecies = {};
        }
        assessmentData.vessel.multispecies.classification = value;
        assessmentData.vesselClassification = value;
        
        // Enable continue button
        const continueBtn = document.getElementById('continue-vessel-classification');
        if (continueBtn) {
            continueBtn.disabled = false;
        }
        
        // Update species data based on classification
        updateSpeciesDataForClassification(value);
        
        // Update quick reference for possession step (vessel classification affects possession limits)
        updateQuickReference('possession');
        
    } catch (error) {
        console.error('Error handling vessel classification:', error);
        const errorMessage = typeof Helpers !== 'undefined' && Helpers.showErrorMessage 
            ? Helpers.showErrorMessage 
            : (typeof showErrorMessage === 'function' ? showErrorMessage : alert);
        errorMessage('Error processing vessel classification. Please try again.');
    }
}

// Update species data based on vessel classification
function updateSpeciesDataForClassification(classification) {
    const multispData = NORTHEAST_MULTISPECIES_DATA;
    
    selectedSpecies.forEach(speciesId => {
        if (isMultispecies(speciesId)) {
            if (!assessmentData.species[speciesId]) {
                assessmentData.species[speciesId] = {};
            }
            
            assessmentData.species[speciesId].vesselClassification = classification;
            
            // Set possession limit type based on classification
            if (classification === 'sector') {
                assessmentData.species[speciesId].possessionType = 'ace-allocation';
            } else {
                assessmentData.species[speciesId].possessionType = 'trip-limit';
            }
        }
    });
}

// Check if species is part of multispecies complex
function isMultispecies(speciesId) {
    const multispeciesIds = [
        'atlantic-cod', 'haddock', 'yellowtail-flounder', 'winter-flounder', 
        'windowpane-flounder', 'atlantic-wolffish', 'redfish', 'atlantic-halibut',
        'white-hake', 'pollock', 'witch-flounder', 'american-plaice', 'ocean-pout'
    ];
    return multispeciesIds.includes(speciesId);
}

// Generate grouped assessment steps for all selected species
function generateGroupedAssessmentSteps() {
    try {
        const container = document.getElementById('assessment-sections');
        container.innerHTML = '';
        
        // Check if we have multispecies groundfish selected
        const multispeciesSelected = selectedSpecies.filter(id => isMultispecies(id));
        const otherSpeciesSelected = selectedSpecies.filter(id => !isMultispecies(id));
        
        // Validate all species data first
        for (const speciesId of selectedSpecies) {
            if (!validateSpeciesData(speciesId)) {
                showErrorMessage(`Cannot generate assessment for ${speciesId}. Skipping this species.`);
                return;
            }
            // Initialize assessment data
            assessmentData.species[speciesId] = {};
        }
        
        // If we have multispecies, add vessel classification step
        if (multispeciesSelected.length > 0) {
            createVesselClassificationSection(container);
        }
        
        // Create grouped assessment sections
        createGroupedPermitsSection(container);
        createGroupedPossessionSection(container);
        createGroupedSizeGearSection(container);
        createGroupedVesselRequirementsSection(container);
        
    } catch (error) {
        console.error('Error generating grouped assessment steps:', error);
        showErrorMessage('Error setting up assessments. Please refresh and try again.');
    }
}

// Check if species is part of Northeast Multispecies complex
function isMultispecies(speciesId) {
    const multispeciesIds = [
        'atlantic-cod', 'haddock', 'yellowtail-flounder', 'winter-flounder', 
        'windowpane-flounder', 'atlantic-wolffish', 'redfish', 'atlantic-halibut',
        'white-hake', 'pollock', 'witch-flounder', 'american-plaice', 'ocean-pout'
    ];
    return multispeciesIds.includes(speciesId);
}

// Generate quick reference requirements for a step
function generateQuickReference(stepName) {
    let requirements = [];
    
    if (stepName === 'vessel-classification') {
        const multispeciesSelected = selectedSpecies.filter(id => isMultispecies(id));
        if (multispeciesSelected.length > 0) {
            requirements.push({
                title: 'Required for Northeast Multispecies',
                items: [
                    'Determine if vessel is enrolled in a Sector or fishing under Common Pool',
                    'Sector vessels: Must have ACE allocation for each species',
                    'Common Pool vessels: Must comply with DAS and trip limits',
                    'CFR: Sector (50 CFR 648.87), Common Pool (50 CFR 648.82)'
                ]
            });
        }
    } else if (stepName === 'permits') {
        const multispeciesSelected = selectedSpecies.filter(id => isMultispecies(id));
        const otherSpeciesSelected = selectedSpecies.filter(id => !isMultispecies(id));
        
        if (multispeciesSelected.length > 0) {
            requirements.push({
                title: 'Northeast Multispecies Permit Required',
                items: [
                    'Valid federal Northeast Multispecies permit required',
                    'Covers: ' + multispeciesSelected.map(id => SPECIES_DATA[id].name).join(', '),
                    'CFR: 50 CFR 648.4'
                ]
            });
        }
        
        otherSpeciesSelected.forEach(speciesId => {
            const species = SPECIES_DATA[speciesId];
            if (species && species.regulations && species.regulations.permits) {
                const permitTypes = Object.keys(species.regulations.permits);
                const commercialPermits = permitTypes.filter(p => p !== 'recreational' && species.regulations.permits[p].required);
                const hasRecreational = permitTypes.includes('recreational');
                
                let permitReqs = [];
                if (commercialPermits.length > 0) {
                    permitReqs.push('Commercial: Federal permit required');
                    commercialPermits.forEach(p => {
                        const permit = species.regulations.permits[p];
                        permitReqs.push(`  • ${permit.name}${permit.cfr ? ` (${permit.cfr})` : ''}`);
                    });
                }
                if (hasRecreational) {
                    permitReqs.push('Recreational: No federal permit required');
                }
                
                requirements.push({
                    title: `${species.name} Permit Requirements`,
                    items: permitReqs
                });
            }
        });
    } else if (stepName === 'possession') {
        selectedSpecies.forEach(speciesId => {
            const species = SPECIES_DATA[speciesId];
            if (!species || !species.regulations || !species.regulations.possession) return;
            
            let possessionReqs = [];
            
            if (isMultispecies(speciesId)) {
                const vesselClassification = assessmentData.vessel.multispecies?.classification || assessmentData.species[speciesId]?.vesselClassification;
                if (vesselClassification === 'sector') {
                    possessionReqs.push('Sector Vessel: Check ACE allocation for this species');
                    possessionReqs.push('No specific possession limit - based on ACE allocation');
                    possessionReqs.push('CFR: 50 CFR 648.87');
                } else if (vesselClassification === 'common-pool') {
                    possessionReqs.push('Common Pool: Check current trip limits by DAS category');
                    possessionReqs.push('Trip limits vary by DAS category');
                    possessionReqs.push('CFR: 50 CFR 648.82');
                } else {
                    possessionReqs.push('Determine vessel classification first (Sector or Common Pool)');
                }
            } else if (speciesId === 'summer-flounder') {
                const permitType = assessmentData.species[speciesId]?.['permit-type'];
                if (permitType === 'commercial') {
                    const gearType = assessmentData.species[speciesId]?.['gear-type'];
                    if (gearType === 'otter-trawl' || gearType === 'large-mesh') {
                        possessionReqs.push('Commercial (Large Mesh ≥5.5"): No possession limit');
                        possessionReqs.push('CFR: 50 CFR 648.106');
                    } else {
                        const currentMonth = new Date().getMonth() + 1;
                        const isMayOct = currentMonth >= 5 && currentMonth <= 10;
                        possessionReqs.push(`Commercial (Small Mesh): ${isMayOct ? '100 lbs (May-Oct)' : '200 lbs (Nov-Apr)'}`);
                        possessionReqs.push('CFR: 50 CFR 648.106(b)');
                    }
                } else if (permitType === 'recreational') {
                    possessionReqs.push('Recreational: 4 fish per person per day');
                    possessionReqs.push('CFR: 50 CFR 648.105');
                } else {
                    possessionReqs.push('Determine permit type first (Commercial or Recreational)');
                }
            } else if (speciesId === 'atlantic-sea-scallop') {
                const permitType = assessmentData.species[speciesId]?.['permit-type'];
                if (permitType && species.regulations.possession[permitType]) {
                    const limit = species.regulations.possession[permitType].limit;
                    if (limit.shucked) {
                        possessionReqs.push(`${species.regulations.possession[permitType].name}:`);
                        possessionReqs.push(`  • Shucked: ${limit.shucked.toLocaleString()} lbs`);
                        possessionReqs.push(`  • In-Shell: ${limit.inshell.toLocaleString()} bushels`);
                        possessionReqs.push(`CFR: ${species.regulations.possession[permitType].cfr}`);
                    }
                } else {
                    possessionReqs.push('Determine permit type first');
                    possessionReqs.push('Permit types: LA Full-Time, Part-Time, Occasional, LAGC IFQ, LAGC NGOM, LAGC Incidental');
                }
            } else if (speciesId === 'bluefin-tuna') {
                const permitType = assessmentData.species[speciesId]?.['permit-type'];
                const currentDate = (window.dateManager && window.dateManager.getAssessmentDate) 
                    ? window.dateManager.getAssessmentDate() 
                    : new Date();
                const currentMonth = currentDate.getMonth() + 1;
                
                if (permitType === 'commercial') {
                    // Check closures using date manager
                    let isClosed = false;
                    let closureInfo = null;
                    
                    if (typeof isClosureActive === 'function') {
                        isClosed = isClosureActive('bluefin-tuna', 'commercial');
                        closureInfo = getClosureInfo('bluefin-tuna', 'commercial');
                    } else {
                        // Fallback to hardcoded dates
                        const closureStart = new Date('2026-01-14T23:30:00');
                        const closureEnd = new Date('2026-03-31T23:59:59');
                        isClosed = currentDate >= closureStart && currentDate <= closureEnd;
                    }
                    
                    if (isClosed) {
                        const closure = closureInfo?.closures?.[0];
                        const startDate = closure?.startDate ? (window.dateManager ? window.dateManager.formatDate(closure.startDate, 'datetime') : 'January 14, 2026 (11:30 PM)') : 'January 14, 2026 (11:30 PM)';
                        const endDate = closure?.endDate ? (window.dateManager ? window.dateManager.formatDate(closure.endDate, 'short') : 'March 31, 2026') : 'March 31, 2026';
                        
                        possessionReqs.push('⚠️ COMMERCIAL FISHERY CLOSED');
                        possessionReqs.push(`Closure: ${startDate} - ${endDate}`);
                        possessionReqs.push('Cannot retain, possess, or land large medium or giant bluefin (≥73" CFL)');
                        possessionReqs.push('CFR: 50 CFR 635.23');
                    } else if (currentMonth >= 6 && currentMonth <= 8) {
                        const reopening = closureInfo?.reopenings?.[0];
                        const reopenDate = reopening?.date ? (window.dateManager ? window.dateManager.formatDate(reopening.date, 'short') : 'June 1, 2026') : 'June 1, 2026';
                        
                        possessionReqs.push('Commercial (June-August): 1 fish >73" CFL per vessel per day');
                        possessionReqs.push(`Fishery reopens automatically ${reopenDate}`);
                        possessionReqs.push('CFR: 50 CFR 635.23');
                    } else {
                        possessionReqs.push('Commercial: Check current retention limits and seasonal closures');
                        possessionReqs.push('CFR: 50 CFR 635.23');
                    }
                } else if (permitType === 'recreational') {
                    possessionReqs.push('Recreational: 1 fish per vessel per trip');
                    possessionReqs.push('Size: 27" to <73" CFL minimum');
                    possessionReqs.push('CFR: 50 CFR 635.23');
                } else if (permitType === 'charter-headboat') {
                    possessionReqs.push('Charter/Headboat: 1 fish per vessel per trip');
                    possessionReqs.push('Size: 27" to <73" CFL minimum');
                    possessionReqs.push('CFR: 50 CFR 635.23');
                } else {
                    possessionReqs.push('Determine permit type first (Commercial, Recreational, or Charter/Headboat)');
                }
            } else {
                possessionReqs.push('Check species-specific possession limits');
                possessionReqs.push('CFR: 50 CFR 648');
            }
            
            if (possessionReqs.length > 0) {
                requirements.push({
                    title: `${species.name} Possession Limits`,
                    items: possessionReqs
                });
            }
        });
    } else if (stepName === 'size-gear') {
        selectedSpecies.forEach(speciesId => {
            const species = SPECIES_DATA[speciesId];
            if (!species || !species.regulations) return;
            
            let sizeGearReqs = [];
            
            // Size requirements
            if (species.regulations.size) {
                const sizeRegs = species.regulations.size;
                if (sizeRegs.minimum !== null && sizeRegs.minimum !== undefined) {
                    sizeGearReqs.push(`Minimum Size: ${sizeRegs.minimum} ${sizeRegs.unit || 'inches'}`);
                    if (sizeRegs.commercialMinimum) {
                        sizeGearReqs.push(`Commercial Minimum: ${sizeRegs.commercialMinimum} ${sizeRegs.unit || 'inches'}`);
                    }
                    if (sizeRegs.cfr) {
                        sizeGearReqs.push(`CFR: ${sizeRegs.cfr}`);
                    }
                }
            }
            
            // Gear requirements
            if (species.regulations.gear) {
                if (speciesId === 'summer-flounder') {
                    sizeGearReqs.push('Gear Requirements:');
                    sizeGearReqs.push('  • Otter Trawl: 5.5" diamond or 6.0" square mesh');
                    sizeGearReqs.push('  • Mesh must be compliant throughout net body, extensions, and codend');
                    sizeGearReqs.push('CFR: 50 CFR 648.106');
                } else if (speciesId === 'atlantic-sea-scallop') {
                    sizeGearReqs.push('Gear Requirements:');
                    sizeGearReqs.push('  • Dredge: Min 4" ring diameter, Max 10" twine top');
                    sizeGearReqs.push('  • Trawl: Check area-specific restrictions');
                    sizeGearReqs.push('CFR: 50 CFR 648.51');
                } else if (isMultispecies(speciesId)) {
                    sizeGearReqs.push('Gear Requirements:');
                    sizeGearReqs.push('  • Check mesh size, net configuration, and area-specific restrictions');
                    sizeGearReqs.push('CFR: 50 CFR 648.80');
                }
            }
            
            if (sizeGearReqs.length > 0) {
                requirements.push({
                    title: `${species.name} Size & Gear Requirements`,
                    items: sizeGearReqs
                });
            }
        });
    } else if (stepName === 'vessel-requirements') {
        const requiresVMS = selectedSpecies.includes('atlantic-sea-scallop');
        const requiresObserver = selectedSpecies.includes('atlantic-sea-scallop');
        const requiresTDD = selectedSpecies.includes('atlantic-sea-scallop');
        const hmsReportingSpecies = ['bluefin-tuna', 'swordfish', 'billfish'];
        const requiresHMSReporting = selectedSpecies.some(id => hmsReportingSpecies.includes(id));
        
        if (requiresVMS || requiresObserver || requiresTDD || requiresHMSReporting) {
            let vesselReqs = [];
            if (requiresVMS) {
                vesselReqs.push('VMS: Must be operational and transmitting');
                vesselReqs.push('CFR: 50 CFR 648.10');
            }
            if (requiresObserver) {
                vesselReqs.push('Observer: Required on some trips (NMFS-certified)');
                vesselReqs.push('CFR: 50 CFR 648.11');
            }
            if (requiresTDD) {
                vesselReqs.push('TDD: Turtle Deflector Dredge required in certain areas');
                vesselReqs.push('CFR: 50 CFR 223.206');
            }
            if (requiresHMSReporting) {
                const reportingSpecies = selectedSpecies.filter(id => hmsReportingSpecies.includes(id));
                const speciesNames = reportingSpecies.map(id => {
                    const species = SPECIES_DATA[id];
                    return species ? species.name : id;
                }).join(', ');
                vesselReqs.push(`HMS Reporting: Required for ${speciesNames}`);
                vesselReqs.push('Must be reported within 24 hours of landing');
                vesselReqs.push('CFR: 50 CFR 635.5');
            }
            
            requirements.push({
                title: 'Vessel Requirements',
                items: vesselReqs
            });
        }
    }
    
    if (requirements.length === 0) {
        return '';
    }
    
    let html = `
        <div class="quick-reference-box">
            <div class="quick-reference-header" onclick="toggleQuickReference(this)">
                <span class="quick-reference-icon">📋</span>
                <span class="quick-reference-title">Quick Reference: Required Items for This Step</span>
                <span class="quick-reference-toggle">▼</span>
            </div>
            <div class="quick-reference-content" style="display: block;">
    `;
    
    requirements.forEach(req => {
        html += `
            <div class="quick-reference-section">
                <h4>${req.title}</h4>
                <ul class="quick-reference-list">
                    ${req.items.map(item => `<li>${item}</li>`).join('')}
                </ul>
            </div>
        `;
    });
    
    html += `
            </div>
        </div>
    `;
    
    return html;
}

// Toggle quick reference box
function toggleQuickReference(header) {
    const content = header.nextElementSibling;
    const toggle = header.querySelector('.quick-reference-toggle');
    
    if (content.style.display === 'none') {
        content.style.display = 'block';
        toggle.textContent = '▼';
    } else {
        content.style.display = 'none';
        toggle.textContent = '▶';
    }
}

// Update quick reference for current step
function updateQuickReference(stepName) {
    const currentSection = document.querySelector(`#grouped-${stepName}`);
    if (!currentSection) return;
    
    const existingRef = currentSection.querySelector('.quick-reference-box');
    if (existingRef) {
        const newRef = generateQuickReference(stepName);
        if (newRef) {
            existingRef.outerHTML = newRef;
        }
    }
}

// Create vessel classification section for multispecies
function createVesselClassificationSection(container) {
    const section = document.createElement('section');
    section.className = 'step-section grouped-assessment';
    section.id = 'grouped-vessel-classification';
    
    const multispData = NORTHEAST_MULTISPECIES_DATA;
    
    let html = `
        <div class="grouped-header">
            <h2>Vessel Classification</h2>
            <p class="grouped-subtitle">Determine vessel enrollment status for Northeast Multispecies fishery</p>
        </div>
        
        ${generateQuickReference('vessel-classification')}
        
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
    container.appendChild(section);
}

// Create permits section (grouped by species)
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
    
    html += `
        <div class="nav-buttons">
            <button class="btn-secondary" onclick="prevGroupedStep('size-gear')">← Back</button>
            <button class="btn-primary" onclick="nextGroupedStep('size-gear')">Continue to Vessel Requirements →</button>
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
// Create assessment section for a species
function createSpeciesAssessmentSection(speciesId, species, index) {
    const section = document.createElement('section');
    section.className = 'step-section species-assessment';
    section.id = `assessment-${speciesId}`;
    section.dataset.speciesId = speciesId;
    
    section.innerHTML = `
        <div class="species-header">
            <h2>${species.name} Assessment</h2>
            <div class="species-progress">Species ${index + 1} of ${selectedSpecies.length}</div>
        </div>
        
        <!-- Permit Step -->
        <div class="assessment-step" id="${speciesId}-permit">
            <h3>Federal Permit</h3>
            <p class="question">Does the vessel possess a valid federal ${species.name.toLowerCase()} permit?</p>
            <div class="choice-group">
                <button class="choice-btn" data-field="has-permit" data-value="yes" onclick="selectChoice('${speciesId}', this)">
                    <span class="choice-icon">✓</span>
                    Yes - Valid permit on board
                </button>
                <button class="choice-btn" data-field="has-permit" data-value="no" onclick="selectChoice('${speciesId}', this)">
                    <span class="choice-icon">✗</span>
                    No - No valid permit
                </button>
                <button class="choice-btn" data-field="has-permit" data-value="expired" onclick="selectChoice('${speciesId}', this)">
                    <span class="choice-icon">!</span>
                    Expired permit
                </button>
            </div>
        </div>
        
        <!-- Permit Type Step -->
        <div class="assessment-step" id="${speciesId}-permit-type" style="display: none;">
            <h3>Permit Type</h3>
            <p class="question">What type of permit does the vessel hold?</p>
            <div class="choice-group" id="${speciesId}-permit-options">
                <!-- Will be populated based on species -->
            </div>
        </div>
        
        <!-- Possession Step -->
        <div class="assessment-step" id="${speciesId}-possession" style="display: none;">
            <h3>Possession/Catch</h3>
            <p class="question">What is the quantity on board?</p>
            <div id="${speciesId}-possession-inputs">
                <!-- Will be populated based on species -->
            </div>
            <div class="limit-info" id="${speciesId}-limit-info"></div>
        </div>
        
        <!-- Size Compliance Step -->
        <div class="assessment-step" id="${speciesId}-size" style="display: none;">
            <h3>Size Compliance</h3>
            <p class="question">Do the fish meet the minimum size requirement?</p>
            <div id="${speciesId}-size-info"></div>
            <div class="choice-group">
                <button class="choice-btn" data-field="size-compliant" data-value="yes" onclick="selectChoice('${speciesId}', this)">
                    <span class="choice-icon">✓</span>
                    Yes - All meet minimum size
                </button>
                <button class="choice-btn" data-field="size-compliant" data-value="no" onclick="selectChoice('${speciesId}', this)">
                    <span class="choice-icon">✗</span>
                    No - Undersized fish present
                </button>
                <button class="choice-btn" data-field="size-compliant" data-value="not-applicable" onclick="selectChoice('${speciesId}', this)">
                    <span class="choice-icon">—</span>
                    N/A - Not applicable
                </button>
            </div>
        </div>
        
        <!-- Gear Step (species-specific) -->
        <div class="assessment-step" id="${speciesId}-gear" style="display: none;">
            <div id="${speciesId}-gear-content">
                <!-- Will be populated based on species -->
            </div>
        </div>
        
        <!-- Additional Checks Step (for scallops) -->
        <div class="assessment-step" id="${speciesId}-additional" style="display: none;">
            <div id="${speciesId}-additional-content">
                <!-- Will be populated for species that need additional checks -->
            </div>
        </div>
        
        <!-- Navigation -->
        <div class="nav-buttons">
            <button class="btn-secondary" onclick="prevSpeciesStep('${speciesId}')">← Back</button>
            <button class="btn-primary" onclick="nextSpeciesStep('${speciesId}')" id="${speciesId}-next">Continue →</button>
        </div>
    `;
    
    // Populate species-specific content
    populateSpeciesAssessmentContent(speciesId, species);
    
    return section;
}

// Populate species-specific assessment content
function populateSpeciesAssessmentContent(speciesId, species) {
    try {
        const regs = species.regulations;
        
        // Populate permit options
        const permitOptions = document.getElementById(`${speciesId}-permit-options`);
        if (permitOptions && regs.permits) {
            permitOptions.innerHTML = '';
            Object.keys(regs.permits).forEach(permitKey => {
                const permit = regs.permits[permitKey];
                const btn = document.createElement('button');
                btn.className = 'choice-btn';
                btn.dataset.field = 'permit-type';
                btn.dataset.value = permitKey;
                btn.innerHTML = `<span class="choice-label">${permit.name}</span>`;
                btn.onclick = () => selectChoice(speciesId, btn);
                permitOptions.appendChild(btn);
            });
        }
        
        // Populate size info
        const sizeInfo = document.getElementById(`${speciesId}-size-info`);
        if (sizeInfo && regs.size) {
            sizeInfo.innerHTML = `
                <p class="info-note">
                    <strong>Minimum Size: ${regs.size.minimum} ${regs.size.unit}</strong><br>
                    ${regs.size.commercialMinimum ? `Commercial minimum: ${regs.size.commercialMinimum} ${regs.size.unit}` : ''}
                    ${regs.size.cfr ? `(CFR: ${regs.size.cfr})` : ''}
                </p>
            `;
        }
        
        // Populate possession inputs
        const possessionInputs = document.getElementById(`${speciesId}-possession-inputs`);
        if (possessionInputs) {
            if (speciesId === 'atlantic-sea-scallop') {
                possessionInputs.innerHTML = `
                    <div class="form-group">
                        <label for="${speciesId}-possession-type">Possession Type:</label>
                        <div class="choice-group small">
                            <button class="choice-btn" data-field="possession-type" data-value="shucked" onclick="selectChoice('${speciesId}', this)">
                                Shucked (lbs)
                            </button>
                            <button class="choice-btn" data-field="possession-type" data-value="inshell" onclick="selectChoice('${speciesId}', this)">
                                In-Shell (bushels)
                            </button>
                        </div>
                    </div>
                    <div class="form-group" id="${speciesId}-amount-input" style="display: none;">
                        <label for="${speciesId}-possession-amount" id="${speciesId}-amount-label">Amount:</label>
                        <input type="number" id="${speciesId}-possession-amount" placeholder="Enter amount" min="0" step="0.1">
                    </div>
                `;
            } else {
                // Default input for other species
                const unit = speciesId === 'summer-flounder' ? 'fish or lbs' : 'amount';
                possessionInputs.innerHTML = `
                    <div class="form-group">
                        <label for="${speciesId}-possession-amount">Amount (${unit}):</label>
                        <input type="number" id="${speciesId}-possession-amount" placeholder="Enter amount" min="0" step="0.1">
                    </div>
                `;
            }
        }
        
        // Populate gear content (species-specific)
        const gearContent = document.getElementById(`${speciesId}-gear-content`);
        if (gearContent) {
            if (speciesId === 'summer-flounder') {
                populateSummerFlounderGear(speciesId, gearContent);
            } else if (speciesId === 'atlantic-sea-scallop') {
                populateScallopGear(speciesId, gearContent);
            }
        }
        
        // Populate additional checks (for scallops)
        const additionalContent = document.getElementById(`${speciesId}-additional-content`);
        if (additionalContent && speciesId === 'atlantic-sea-scallop') {
            populateScallopAdditionalChecks(speciesId, additionalContent);
        }
    } catch (error) {
        console.error(`Error populating assessment content for ${speciesId}:`, error);
        showErrorMessage(`Failed to load assessment content for ${species.name}. Please refresh and try again.`);
    }
}
// Summer Flounder gear content
function populateSummerFlounderGear(speciesId, gearContent) {
    gearContent.innerHTML = `
        <h3>Gear Compliance</h3>
        <p class="question">What type of gear is the vessel using?</p>
        <div class="choice-group">
            <button class="choice-btn" data-field="gear-type" data-value="otter-trawl" onclick="selectChoice('${speciesId}', this)">
                <span class="choice-label">Otter Trawl</span>
            </button>
            <button class="choice-btn" data-field="gear-type" data-value="gillnet" onclick="selectChoice('${speciesId}', this)">
                <span class="choice-label">Gillnet</span>
            </button>
            <button class="choice-btn" data-field="gear-type" data-value="other" onclick="selectChoice('${speciesId}', this)">
                <span class="choice-label">Other</span>
            </button>
        </div>
        
        <div id="${speciesId}-gear-details" style="display: none; margin-top: 20px;">
            <h4>Mesh Size Requirements</h4>
            <p class="info-note">Minimum mesh: 5.5" diamond or 6.0" square mesh (CFR: 50 CFR 648.106)</p>
            <div class="choice-group small">
                <button class="choice-btn" data-field="mesh-compliant" data-value="yes" onclick="selectChoice('${speciesId}', this)">Compliant</button>
                <button class="choice-btn" data-field="mesh-compliant" data-value="no" onclick="selectChoice('${speciesId}', this)">Non-Compliant</button>
                <button class="choice-btn" data-field="mesh-compliant" data-value="exemption" onclick="selectChoice('${speciesId}', this)">Small Mesh Exemption (LOA)</button>
            </div>
        </div>
    `;
}

// Atlantic Sea Scallop gear content
function populateScallopGear(speciesId, gearContent) {
    gearContent.innerHTML = `
        <h3>Gear Compliance</h3>
        <p class="question">What type of gear is the vessel using?</p>
        <div class="choice-group">
            <button class="choice-btn" data-field="gear-type" data-value="dredge" onclick="selectChoice('${speciesId}', this)">
                <span class="choice-label">New Bedford Scallop Dredge</span>
                <span class="choice-desc">Standard scallop dredge</span>
            </button>
            <button class="choice-btn" data-field="gear-type" data-value="trawl" onclick="selectChoice('${speciesId}', this)">
                <span class="choice-label">Otter Trawl</span>
                <span class="choice-desc">Net trawl gear</span>
            </button>
        </div>
        
        <div id="${speciesId}-dredge-details" style="display: none; margin-top: 20px;">
            <h4>Dredge Requirements</h4>
            <div class="info-note">
                <strong>Ring Size:</strong> Minimum 4" inside diameter (CFR: 50 CFR 648.51)<br>
                <strong>Twine Top:</strong> Maximum 10" twine top (CFR: 50 CFR 648.51)
            </div>
            <p class="question">Are the dredge specifications compliant?</p>
            <div class="choice-group small">
                <button class="choice-btn" data-field="dredge-compliant" data-value="yes" onclick="selectChoice('${speciesId}', this)">
                    <span class="choice-icon">✓</span>
                    Compliant
                </button>
                <button class="choice-btn" data-field="dredge-compliant" data-value="no" onclick="selectChoice('${speciesId}', this)">
                    <span class="choice-icon">✗</span>
                    Non-Compliant
                </button>
            </div>
        </div>
        
        <div id="${speciesId}-trawl-details" style="display: none; margin-top: 20px;">
            <h4>Trawl Requirements</h4>
            <div class="info-note">
                <strong>Sweep Length:</strong> Maximum sweep length restrictions apply in some areas<br>
                <strong>Mesh Size:</strong> Check for area-specific mesh requirements
            </div>
            <p class="question">Is the trawl gear compliant?</p>
            <div class="choice-group small">
                <button class="choice-btn" data-field="trawl-compliant" data-value="yes" onclick="selectChoice('${speciesId}', this)">
                    <span class="choice-icon">✓</span>
                    Compliant
                </button>
                <button class="choice-btn" data-field="trawl-compliant" data-value="no" onclick="selectChoice('${speciesId}', this)">
                    <span class="choice-icon">✗</span>
                    Non-Compliant
                </button>
            </div>
        </div>
    `;
}

// Atlantic Sea Scallop additional checks
function populateScallopAdditionalChecks(speciesId, additionalContent) {
    additionalContent.innerHTML = `
        <h3>Additional Compliance Checks</h3>
        
        <!-- VMS Check -->
        <div class="assessment-substep">
            <h4>Vessel Monitoring System (VMS)</h4>
            <p class="question">Is the vessel's VMS operational and transmitting?</p>
            <div class="info-note">
                All scallop vessels must have operational VMS (CFR: 50 CFR 648.10)
            </div>
            <div class="choice-group small">
                <button class="choice-btn" data-field="vms-operational" data-value="yes" onclick="selectChoice('${speciesId}', this)">
                    <span class="choice-icon">✓</span>
                    Operational
                </button>
                <button class="choice-btn" data-field="vms-operational" data-value="no" onclick="selectChoice('${speciesId}', this)">
                    <span class="choice-icon">✗</span>
                    Not Operational
                </button>
                <button class="choice-btn" data-field="vms-operational" data-value="unknown" onclick="selectChoice('${speciesId}', this)">
                    <span class="choice-icon">?</span>
                    Unable to Verify
                </button>
            </div>
        </div>
        
        <!-- Observer Check -->
        <div class="assessment-substep">
            <h4>At-Sea Observer</h4>
            <p class="question">Does the vessel have a required observer on board?</p>
            <div class="info-note">
                Some scallop trips require NMFS-certified observers (CFR: 50 CFR 648.11)
            </div>
            <div class="choice-group small">
                <button class="choice-btn" data-field="observer-present" data-value="yes" onclick="selectChoice('${speciesId}', this)">
                    <span class="choice-icon">✓</span>
                    Observer Present
                </button>
                <button class="choice-btn" data-field="observer-present" data-value="no" onclick="selectChoice('${speciesId}', this)">
                    <span class="choice-icon">✗</span>
                    No Observer
                </button>
                <button class="choice-btn" data-field="observer-present" data-value="not-required" onclick="selectChoice('${speciesId}', this)">
                    <span class="choice-icon">—</span>
                    Not Required
                </button>
            </div>
        </div>
        
        <!-- TDD Check -->
        <div class="assessment-substep">
            <h4>Turtle Deflector Dredge (TDD)</h4>
            <p class="question">Are Turtle Deflector Dredges installed when required?</p>
            <div class="info-note">
                TDDs required in Sea Turtle Protection Areas during certain seasons (CFR: 50 CFR 223.206)
            </div>
            <div class="choice-group small">
                <button class="choice-btn" data-field="tdd-installed" data-value="yes" onclick="selectChoice('${speciesId}', this)">
                    <span class="choice-icon">✓</span>
                    TDD Installed
                </button>
                <button class="choice-btn" data-field="tdd-installed" data-value="no" onclick="selectChoice('${speciesId}', this)">
                    <span class="choice-icon">✗</span>
                    No TDD
                </button>
                <button class="choice-btn" data-field="tdd-installed" data-value="not-required" onclick="selectChoice('${speciesId}', this)">
                    <span class="choice-icon">—</span>
                    Not Required (Area/Season)
                </button>
            </div>
        </div>
        
        <!-- Fishing Area -->
        <div class="assessment-substep">
            <h4>Fishing Area</h4>
            <p class="question">What area was the vessel fishing in?</p>
            <div class="info-note">
                Access Area trips use lower per-trip possession limits (Framework 39). Open-area limits apply otherwise.
            </div>
            <div class="choice-group small">
                <button class="choice-btn" data-field="fishing-area" data-value="open-area" onclick="selectChoice('${speciesId}', this)">
                    Open Area
                </button>
                <button class="choice-btn" data-field="fishing-area" data-value="access-area" onclick="selectChoice('${speciesId}', this)">
                    Access Area
                </button>
                <button class="choice-btn" data-field="fishing-area" data-value="ngom" onclick="selectChoice('${speciesId}', this)">
                    NGOM
                </button>
                <button class="choice-btn" data-field="fishing-area" data-value="closed-area" onclick="selectChoice('${speciesId}', this)">
                    Closed Area
                </button>
            </div>
        </div>
    `;
}
// Show grouped assessment step
function showGroupedStep(stepName) {
    // Hide species selection (step 0) - ensure it's completely hidden
    const speciesStep = document.getElementById('step-0');
    if (speciesStep) {
        speciesStep.classList.remove('active');
        speciesStep.style.display = 'none';
    }
    
    // Ensure assessment sections container is visible
    const assessmentSections = document.getElementById('assessment-sections');
    if (assessmentSections) {
        assessmentSections.style.display = 'block';
    }
    
    // Hide results section
    const resultsSection = document.getElementById('results-section');
    if (resultsSection) {
        resultsSection.classList.remove('active');
        resultsSection.style.display = 'none';
    }
    
    // Hide all grouped steps
    document.querySelectorAll('.grouped-assessment').forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });
    
    // Show the requested step
    const section = document.getElementById(`grouped-${stepName}`);
    if (section) {
        section.classList.add('active');
        section.style.display = 'block';
    }
}

// Handle grouped choice selection
function selectGroupedChoice(speciesId, btn) {
    try {
        if (!btn || !speciesId) {
            console.error('Invalid parameters to selectGroupedChoice');
            if (typeof Helpers !== 'undefined' && Helpers.showErrorMessage) {
                Helpers.showErrorMessage('Error: Invalid selection. Please try again.');
            }
            return;
        }

        const field = btn.dataset.field;
        const value = btn.dataset.value;
        
        // Ensure we have valid values
        if (!field || !value) {
            console.error('Missing field or value:', { field, value, btn });
            if (typeof Helpers !== 'undefined' && Helpers.showErrorMessage) {
                Helpers.showErrorMessage('Error: Missing selection data. Please refresh and try again.');
            }
            return;
        }
        
        // Find the closest choice-group container - this ensures we only affect buttons in the same group
        const choiceGroup = btn.closest('.choice-group');
        
        // Handle multispecies permit selection
        if (speciesId === 'multispecies') {
            // Check if this button is already selected - if so, deselect it
            const isCurrentlySelected = btn.classList.contains('selected');
            
            // Remove selection from ALL buttons in this choice group first
            if (choiceGroup) {
                choiceGroup.querySelectorAll('.choice-btn').forEach(b => {
                    b.classList.remove('selected');
                });
            }
            
            // If clicking the same button that was already selected, deselect it
            if (isCurrentlySelected) {
                // Clear the stored value for all multispecies
                const multispeciesSelected = selectedSpecies.filter(id => isMultispecies(id));
                multispeciesSelected.forEach(id => {
                    if (assessmentData.species[id]) {
                        delete assessmentData.species[id][field];
                    }
                });
                // Handle special logic for deselection
                handleGroupedChoiceLogic('multispecies', field, null);
                return;
            }
            
            // Apply to all multispecies
            const multispeciesSelected = selectedSpecies.filter(id => isMultispecies(id));
            multispeciesSelected.forEach(id => {
                if (!assessmentData.species[id]) {
                    assessmentData.species[id] = {};
                }
                assessmentData.species[id][field] = value;
            });
            
            // Select this button
            btn.classList.add('selected');
            
            // Handle special logic
            handleGroupedChoiceLogic('multispecies', field, value);
        } else {
            // Initialize species data if needed
            if (!assessmentData.species[speciesId]) {
                assessmentData.species[speciesId] = {};
            }
            
            // Check if this button is already selected - if so, deselect it
            const isCurrentlySelected = btn.classList.contains('selected');
            const currentValue = assessmentData.species[speciesId][field];
            
            // Remove selection from ALL buttons in this choice group first
            if (choiceGroup) {
                choiceGroup.querySelectorAll('.choice-btn').forEach(b => {
                    b.classList.remove('selected');
                });
            } else {
                // Fallback: find all buttons with same field and species in the same container
                const container = btn.closest(`[data-species="${speciesId}"]`) || 
                                 btn.closest('.species-permit-group, .species-possession-group, .species-size-gear-group');
                if (container) {
                    container.querySelectorAll(`[data-field="${field}"]`).forEach(b => {
                        b.classList.remove('selected');
                    });
                }
            }
            
            // If clicking the same button that was already selected, deselect it
            if (isCurrentlySelected && currentValue === value) {
                // Clear the stored value
                delete assessmentData.species[speciesId][field];
                // Handle special logic for deselection
                handleGroupedChoiceLogic(speciesId, field, null);
                return;
            }
            
            // Store value
            assessmentData.species[speciesId][field] = value;
            
            // Also update window.assessmentData to keep it in sync
            if (!window.assessmentData) {
                window.assessmentData = { vessel: {}, species: {} };
            }
            if (!window.assessmentData.species[speciesId]) {
                window.assessmentData.species[speciesId] = {};
            }
            window.assessmentData.species[speciesId][field] = value;
            
            // Force sync back to local variable
            assessmentData = window.assessmentData;
            
            // Debug logging
            
            // Select this button
            btn.classList.add('selected');
            
            // Handle special logic
            handleGroupedChoiceLogic(speciesId, field, value);
        }
        
    } catch (error) {
        console.error(`Error handling grouped choice for ${speciesId}:`, error);
        showErrorMessage('Error processing selection. Please try again.');
    }
}

// Make selectGroupedChoice globally accessible
window.selectGroupedChoice = selectGroupedChoice;

// Handle vessel-level choice selection
function selectVesselChoice(btn) {
    try {
        const field = btn.dataset.field;
        const value = btn.dataset.value;
        
        // Find the closest choice-group container
        const choiceGroup = btn.closest('.choice-group');
        
        // Check if this button is already selected - if so, deselect it
        const isCurrentlySelected = btn.classList.contains('selected');
        const currentValue = assessmentData.vessel.requirements?.[field];
        
        // Remove selection from ALL buttons in this choice group first
        if (choiceGroup) {
            choiceGroup.querySelectorAll('.choice-btn').forEach(b => {
                b.classList.remove('selected');
            });
        } else {
            // Fallback: find all buttons with same field in vessel requirements
            const vesselGroup = btn.closest('.vessel-requirement-item') || btn.closest('.vessel-requirements-group');
            if (vesselGroup) {
                vesselGroup.querySelectorAll(`[data-field="${field}"]`).forEach(b => {
                    b.classList.remove('selected');
                });
            }
        }
        
        // If clicking the same button that was already selected, deselect it
        if (isCurrentlySelected && currentValue === value) {
            // Clear the stored value
            if (assessmentData.vessel.requirements) {
                delete assessmentData.vessel.requirements[field];
            }
            // Clear from relevant species
            selectedSpecies.forEach(speciesId => {
                if (speciesId === 'atlantic-sea-scallop' && assessmentData.species[speciesId]) {
                    delete assessmentData.species[speciesId][field];
                }
                // Clear HMS reporting for HMS species
                if (field === 'hms-reported') {
                    const hmsSpecies = ['bluefin-tuna', 'swordfish', 'billfish'];
                    if (hmsSpecies.includes(speciesId) && assessmentData.species[speciesId]) {
                        delete assessmentData.species[speciesId][field];
                    }
                }
            });
            return;
        }
        
        // Select this button
        btn.classList.add('selected');
        
        // Store value in vessel data
        if (!assessmentData.vessel.requirements) {
            assessmentData.vessel.requirements = {};
        }
        assessmentData.vessel.requirements[field] = value;
        
        // Apply to relevant species
        selectedSpecies.forEach(speciesId => {
            if (speciesId === 'atlantic-sea-scallop') {
                if (!assessmentData.species[speciesId]) {
                    assessmentData.species[speciesId] = {};
                }
                assessmentData.species[speciesId][field] = value;
            }
            // Store HMS reporting for HMS species
            if (field === 'hms-reported') {
                const hmsSpecies = ['bluefin-tuna', 'swordfish', 'billfish'];
                if (hmsSpecies.includes(speciesId)) {
                    if (!assessmentData.species[speciesId]) {
                        assessmentData.species[speciesId] = {};
                    }
                    assessmentData.species[speciesId][field] = value;
                }
            }
        });
        
    } catch (error) {
        console.error('Error handling vessel choice:', error);
        showErrorMessage('Error processing vessel requirement. Please try again.');
    }
}

// Handle special logic for grouped choices
function handleGroupedChoiceLogic(speciesId, field, value) {
    if (field === 'has-permit' && value === 'yes') {
        // Show permit type options
        const permitTypeSection = document.getElementById(`${speciesId}-permit-types`);
        if (permitTypeSection) {
            permitTypeSection.style.display = 'block';
        }
    } else if (field === 'has-permit' && (value !== 'yes' || value === null)) {
        // Hide permit type options when deselected or not yes
        const permitTypeSection = document.getElementById(`${speciesId}-permit-types`);
        if (permitTypeSection) {
            permitTypeSection.style.display = 'none';
        }
    } else if (field === 'permit-type') {
        // Update possession limits info
        if (value) {
            updateGroupedPossessionLimitInfo(speciesId);
            // Update quick reference for possession step
            updateQuickReference('possession');
        }
    } else if (field === 'gear-type' && speciesId === 'summer-flounder') {
        // Update quick reference for possession step when gear type changes (affects possession limits)
        updateQuickReference('possession');
    } else if (field === 'possession-type' && speciesId === 'atlantic-sea-scallop') {
        // Show amount input and update label
        const amountInput = document.getElementById(`${speciesId}-amount-input-grouped`);
        const amountLabel = document.getElementById(`${speciesId}-amount-label-grouped`);
        if (amountInput && amountLabel) {
            if (value) {
                amountInput.style.display = 'block';
                amountLabel.textContent = value === 'shucked' ? 'Amount (lbs):' : 'Amount (bushels):';
            } else {
                amountInput.style.display = 'none';
            }
        }
    } else if (field === 'gear-type') {
        // Show gear-specific details
        if (value) {
            showGroupedGearDetails(speciesId, value);
        } else {
            // Hide all gear details when deselected
            const allDetails = document.querySelectorAll(`[id*="${speciesId}"][id*="details-grouped"]`);
            allDetails.forEach(detail => detail.style.display = 'none');
        }
    }
}

// Navigation between grouped steps
function nextGroupedStep(currentStepName) {
    try {
        // Ensure we're using the latest data from window FIRST
        if (window.assessmentData) {
            assessmentData = window.assessmentData;
        }
        
        if (window.selectedSpecies) {
            selectedSpecies = window.selectedSpecies;
        }
        
        const multispeciesSelected = selectedSpecies.filter(id => isMultispecies(id));
        const hasMultispecies = multispeciesSelected.length > 0;
        
        // Validate current step before proceeding
        if (currentStepName === 'permits') {
            
            let validationError = null;
            try {
                validationError = validatePermitsStep();
            } catch (valErr) {
                console.error('❌ ERROR in validatePermitsStep:', valErr);
                console.error('Error stack:', valErr.stack);
                validationError = 'Error during validation: ' + valErr.message;
            }
            
            if (validationError) {
                console.error('Validation failed:', validationError);
                alert(validationError);
                return;
            }
        }
        
        // Define step order based on whether we have multispecies
        const stepOrder = hasMultispecies ? 
            ['vessel-classification', 'permits', 'possession', 'size-gear', 'vessel-requirements'] :
            ['permits', 'possession', 'size-gear', 'vessel-requirements'];
        
        const currentIndex = stepOrder.indexOf(currentStepName);
        
        if (currentIndex === -1) {
            console.error('Current step not found in step order:', currentStepName);
            return;
        }
        
        // Save any input data before moving
        saveGroupedStepData(currentStepName);
        
        if (currentIndex < stepOrder.length - 1) {
            let nextStep = stepOrder[currentIndex + 1];
            
            // If next step is 'vessel-requirements', check if there are any requirements
            if (nextStep === 'vessel-requirements') {
                const requiresVMS = selectedSpecies.includes('atlantic-sea-scallop');
                const requiresObserver = selectedSpecies.includes('atlantic-sea-scallop');
                const requiresTDD = selectedSpecies.includes('atlantic-sea-scallop');
                const hmsReportingSpecies = ['bluefin-tuna', 'swordfish', 'billfish'];
                const requiresHMSReporting = selectedSpecies.some(id => hmsReportingSpecies.includes(id));
                
                // If no vessel requirements, skip directly to report generation
                if (!requiresVMS && !requiresObserver && !requiresTDD && !requiresHMSReporting) {
                    // Generate report - step numbers must match showStep logic
                    // With multispecies: step 7, without: step 6 (vessel info step removed)
                    const reportStep = hasMultispecies ? 7 : 6;
                    showStep(reportStep);
                    return;
                }
            }
            
            // Step 0 = species selection, Step 1 = assessment starts (vessel info removed)
            // For multispecies: step 2=vessel-classification(0), 3=permits(1), 4=possession(2), 5=size-gear(3), 6=vessel-requirements(4)
            // For non-multispecies: step 2=permits(0), 3=possession(1), 4=size-gear(2), 5=vessel-requirements(3)
            const nextIndex = currentIndex + 1;
            const stepNumber = hasMultispecies ? 2 + nextIndex : 2 + nextIndex;
            showStep(stepNumber);
        } else {
            // Generate report - step numbers must match showStep logic
            // With multispecies: step 7, without: step 6 (vessel info step removed)
            const reportStep = hasMultispecies ? 7 : 6;
            showStep(reportStep);
        }
    } catch (error) {
        console.error('❌ ERROR in nextGroupedStep:', error);
        console.error('Error stack:', error.stack);
        showErrorMessage('Error proceeding to next step. Please try again.');
    }
}

// Make nextGroupedStep globally accessible
window.nextGroupedStep = nextGroupedStep;

// Validate permits step
function validatePermitsStep() {
    try {
        // Use window references to ensure we have the latest data
        const currentAssessmentData = window.assessmentData || assessmentData;
        const currentSelectedSpecies = window.selectedSpecies || selectedSpecies;
        
        const otherSpeciesSelected = currentSelectedSpecies.filter(id => !isMultispecies(id));
        const multispeciesSelected = currentSelectedSpecies.filter(id => isMultispecies(id));
        
        // Check multispecies permit if applicable
        if (multispeciesSelected.length > 0) {
            // Check if multispecies permit status is set (either directly or through any multispecies species)
            let hasMultispeciesPermit = false;
            
            // First check if set directly on multispecies
            if (currentAssessmentData.species['multispecies']?.['has-permit']) {
                hasMultispeciesPermit = true;
            } else {
                // Check if any individual multispecies has permit status
                hasMultispeciesPermit = multispeciesSelected.some(id => {
                    const permitStatus = currentAssessmentData.species[id]?.['has-permit'];
                    return permitStatus && (permitStatus === 'yes' || permitStatus === 'no' || permitStatus === 'expired');
                });
            }
            
            if (!hasMultispeciesPermit) {
                return 'Please select a permit status for Northeast Multispecies.';
            }
        }
        
        // Check each individual species
        for (const speciesId of otherSpeciesSelected) {
            // Initialize if not exists (shouldn't happen, but safety check)
            if (!currentAssessmentData.species[speciesId]) {
                currentAssessmentData.species[speciesId] = {};
            }
            
            const speciesData = currentAssessmentData.species[speciesId];
            const permitStatus = speciesData['has-permit'];
            
            // Check if permit status is set and is a valid value
            if (!permitStatus || 
                (permitStatus !== 'yes' && permitStatus !== 'no' && permitStatus !== 'expired')) {
                const species = SPECIES_DATA[speciesId];
                const speciesName = species ? species.name : speciesId;
                console.error(`❌ VALIDATION FAILED for ${speciesName}`);
                console.error('  permitStatus:', permitStatus);
                console.error('  speciesData:', speciesData);
                console.error('  currentAssessmentData.species:', currentAssessmentData.species);
                return `Please select a permit status for ${speciesName}.`;
            }
            
            // If permit is "yes", require permit type (unless recreational which doesn't need a type)
            if (permitStatus === 'yes') {
                const permitType = speciesData['permit-type'];
                console.log(`Checking permit type for ${speciesId}:`, permitType);
                if (!permitType || permitType.trim() === '') {
                    const species = SPECIES_DATA[speciesId];
                    const speciesName = species ? species.name : speciesId;
                    // Check if this species has recreational option (which might not require permit-type)
                    const hasRecreational = species?.regulations?.permits?.recreational;
                    if (!hasRecreational) {
                        console.error(`❌ Missing permit type for ${speciesName}`);
                        return `Please select a permit type for ${speciesName} (permit status is "Valid Permit").`;
                    }
                }
            }
        }
        
        return null; // No validation errors
    } catch (error) {
        console.error('Error validating permits step:', error);
        return 'Error validating permits. Please check your selections and try again.';
    }
}

function prevGroupedStep(currentStepName) {
    try {
        // Ensure we're using the latest data from window FIRST
        if (window.assessmentData) {
            assessmentData = window.assessmentData;
        }
        if (window.selectedSpecies) {
            selectedSpecies = window.selectedSpecies;
        }
        
        const multispeciesSelected = selectedSpecies.filter(id => isMultispecies(id));
        const hasMultispecies = multispeciesSelected.length > 0;
        
        // Define step order based on whether we have multispecies
        const stepOrder = hasMultispecies ? 
            ['vessel-classification', 'permits', 'possession', 'size-gear', 'vessel-requirements'] :
            ['permits', 'possession', 'size-gear', 'vessel-requirements'];
        
        const currentIndex = stepOrder.indexOf(currentStepName);
        
        if (currentIndex === -1) {
            console.error('Current step not found in step order:', currentStepName);
            // Fallback: go back to species selection
            showStep(0);
            return;
        }
        
        if (currentIndex > 0) {
            const prevStep = stepOrder[currentIndex - 1];
            // Step 0 = species selection, Step 1 = assessment starts (vessel info removed)
            // For multispecies: step 2=vessel-classification(0), 3=permits(1), 4=possession(2), 5=size-gear(3), 6=vessel-requirements(4)
            // For non-multispecies: step 2=permits(0), 3=possession(1), 4=size-gear(2), 5=vessel-requirements(3)
            const prevIndex = currentIndex - 1;
            const stepNumber = hasMultispecies ? 2 + prevIndex : 2 + prevIndex;
            showStep(stepNumber);
        } else {
            // Go back to species selection (step 0)
            showStep(0);
        }
    } catch (error) {
        console.error('❌ ERROR in prevGroupedStep:', error);
        console.error('Error stack:', error.stack);
        showErrorMessage('Error going back. Please try again.');
    }
}

// Make prevGroupedStep and showStep globally accessible
window.prevGroupedStep = prevGroupedStep;
window.showStep = showStep;

// Save data from current grouped step
function saveGroupedStepData(stepName) {
    try {
        if (typeof StateBridge !== 'undefined') {
            StateBridge.syncFromWindow();
        }

        if (stepName === 'possession' || stepName === 'dynamic-assessment') {
            // Save possession amounts for all species
            const speciesIds = window.appState ? window.appState.selectedSpecies : selectedSpecies;
            speciesIds.forEach(speciesId => {
                const possessionInput = document.getElementById(`${speciesId}-possession-amount-grouped`);
                if (possessionInput && possessionInput.value) {
                    const amount = parseFloat(possessionInput.value) || 0;
                    assessmentData.species[speciesId].possessionAmount = amount;
                    
                    // For scallops, handle possession type conversion
                    if (speciesId === 'atlantic-sea-scallop') {
                        const possessionType = assessmentData.species[speciesId]['possession-type'];
                        assessmentData.species[speciesId].possessionType = possessionType;
                        
                        if (possessionType === 'inshell') {
                            assessmentData.species[speciesId].possessionAmountStandard = amount * 8;
                        } else {
                            assessmentData.species[speciesId].possessionAmountStandard = amount;
                        }
                    }
                }
            });
        }

        if (stepName === 'dynamic-assessment' && window.questionRenderer &&
            typeof window.questionRenderer.flushToState === 'function') {
            window.questionRenderer.flushToState();
        }

        if (typeof StateBridge !== 'undefined') {
            StateBridge.syncToWindow();
        }
    } catch (error) {
        console.error(`Error saving grouped step data for ${stepName}:`, error);
        showErrorMessage('Error saving assessment data. Please try again.');
    }
}

// Populate permit options for grouped view
function populatePermitOptions(speciesId) {
    try {
        const species = SPECIES_DATA[speciesId];
        if (!species) {
            console.error(`Species data not found for ${speciesId}`);
            return;
        }
        
        const permitOptions = document.getElementById(`${speciesId}-permit-options`);
        
        if (permitOptions && species.regulations && species.regulations.permits) {
            permitOptions.innerHTML = '';
            Object.keys(species.regulations.permits).forEach(permitKey => {
                const permit = species.regulations.permits[permitKey];
                if (permit) {
                    const btn = document.createElement('button');
                    btn.className = 'choice-btn';
                    btn.dataset.species = speciesId;
                    btn.dataset.field = 'permit-type';
                    btn.dataset.value = permitKey;
                    btn.innerHTML = `<span class="choice-label">${permit.name || permitKey}</span>`;
                    btn.onclick = () => selectGroupedChoice(speciesId, btn);
                    permitOptions.appendChild(btn);
                }
            });
        }
    } catch (error) {
        console.error(`Error populating permit options for ${speciesId}:`, error);
    }
}

// Populate possession inputs for grouped view
function populateGroupedPossessionInputs(speciesId) {
    try {
        const possessionInputs = document.getElementById(`${speciesId}-possession-inputs-grouped`);
        if (!possessionInputs) {
            console.warn(`Possession inputs element not found for ${speciesId}`);
            return;
        }
        
        const species = SPECIES_DATA[speciesId];
        if (!species) {
            console.error(`Species data not found for ${speciesId}`);
            possessionInputs.innerHTML = `<p class="info-note">Species data not available</p>`;
            return;
        }
        
        if (speciesId === 'atlantic-sea-scallop') {
            possessionInputs.innerHTML = `
                <div class="form-group">
                    <label>Possession Type:</label>
                    <div class="choice-group small">
                        <button class="choice-btn" data-species="${speciesId}" data-field="possession-type" data-value="shucked" onclick="selectGroupedChoice('${speciesId}', this)">
                            Shucked (lbs)
                        </button>
                        <button class="choice-btn" data-species="${speciesId}" data-field="possession-type" data-value="inshell" onclick="selectGroupedChoice('${speciesId}', this)">
                            In-Shell (bushels)
                        </button>
                    </div>
                </div>
                <div class="form-group" id="${speciesId}-amount-input-grouped" style="display: none;">
                    <label for="${speciesId}-possession-amount-grouped" id="${speciesId}-amount-label-grouped">Amount:</label>
                    <input type="number" id="${speciesId}-possession-amount-grouped" placeholder="Enter amount" min="0" step="0.1">
                </div>
            `;
        } else {
            // Handle other species (groundfish, etc.)
            const species = SPECIES_DATA[speciesId];
            let unit = 'lbs';
            let placeholder = 'Enter amount';
            
            if (speciesId === 'summer-flounder') {
                unit = 'fish or lbs';
            } else if (isMultispecies(speciesId)) {
                // For multispecies, check vessel classification to determine unit
                const vesselClassification = assessmentData.vessel.multispecies?.classification;
                if (vesselClassification === 'sector') {
                    unit = 'lbs (check ACE allocation)';
                    placeholder = 'Enter amount - verify against ACE';
                } else {
                    unit = 'lbs (check trip limits)';
                    placeholder = 'Enter amount - verify against trip limits';
                }
            } else if (species?.regulations?.possession?.recreational) {
                // Check if recreational limit uses count
                const recLimit = species.regulations.possession.recreational.limit;
                if (recLimit && recLimit.count) {
                    unit = 'fish';
                }
            }
            
            possessionInputs.innerHTML = `
                <div class="form-group">
                    <label for="${speciesId}-possession-amount-grouped">Amount (${unit}):</label>
                    <input type="number" id="${speciesId}-possession-amount-grouped" placeholder="${placeholder}" min="0" step="0.1">
                </div>
            `;
            
            // Show limit info if available
            const limitInfo = document.getElementById(`${speciesId}-limit-info-grouped`);
            if (limitInfo && species?.regulations?.possession) {
                updateGroupedPossessionLimitInfo(speciesId);
            }
        }
    } catch (error) {
        console.error(`Error populating possession inputs for ${speciesId}:`, error);
    }
}

// Populate size info for grouped view
function populateGroupedSizeInfo(speciesId) {
    try {
        const species = SPECIES_DATA[speciesId];
        const sizeInfo = document.getElementById(`${speciesId}-size-info-grouped`);
        
        if (!sizeInfo || !species || !species.regulations) return;
        
        if (species.regulations.size) {
            const sizeRegs = species.regulations.size;
            let sizeText = '';
            
            if (sizeRegs.minimum !== null && sizeRegs.minimum !== undefined) {
                sizeText = `<strong>Minimum Size: ${sizeRegs.minimum} ${sizeRegs.unit || 'inches'}</strong>`;
                if (sizeRegs.commercialMinimum) {
                    sizeText += `<br>Commercial minimum: ${sizeRegs.commercialMinimum} ${sizeRegs.unit || 'inches'}`;
                }
            } else {
                sizeText = `<strong>Size Requirements:</strong> Varies by species and area`;
                if (sizeRegs.notes) {
                    sizeText += `<br>${sizeRegs.notes}`;
                }
            }
            
            const cfrText = sizeRegs.cfr ? `<br>CFR: ${sizeRegs.cfr}` : '';
            const notesText = sizeRegs.notes && sizeRegs.minimum !== null ? `<br>${sizeRegs.notes}` : '';
            
            sizeInfo.innerHTML = `
                <div class="info-note">
                    ${sizeText}${cfrText}${notesText}
                </div>
            `;
        } else {
            // No size regulations - show generic note
            sizeInfo.innerHTML = `
                <div class="info-note">
                    <strong>Size Requirements:</strong> Check species-specific regulations (CFR: 50 CFR 648.83)
                </div>
            `;
        }
    } catch (error) {
        console.error(`Error populating size info for ${speciesId}:`, error);
    }
}

// Populate gear content for grouped view
function populateGroupedGearContent(speciesId) {
    try {
        const gearContent = document.getElementById(`${speciesId}-gear-content-grouped`);
        if (!gearContent) {
            console.warn(`Gear content element not found for ${speciesId}`);
            return;
        }
        
        const species = SPECIES_DATA[speciesId];
        if (!species) {
            console.error(`Species data not found for ${speciesId}`);
            gearContent.innerHTML = `
                <p class="info-note">
                    <strong>Gear Assessment:</strong> Verify gear compliance against current regulations (CFR: 50 CFR 648)
                </p>
            `;
            return;
        }
        
        if (speciesId === 'summer-flounder') {
            gearContent.innerHTML = `
                <p class="question">What type of gear is being used?</p>
                <div class="choice-group small">
                    <button class="choice-btn" data-species="${speciesId}" data-field="gear-type" data-value="otter-trawl" onclick="selectGroupedChoice('${speciesId}', this)">
                        Otter Trawl
                    </button>
                    <button class="choice-btn" data-species="${speciesId}" data-field="gear-type" data-value="gillnet" onclick="selectGroupedChoice('${speciesId}', this)">
                        Gillnet
                    </button>
                    <button class="choice-btn" data-species="${speciesId}" data-field="gear-type" data-value="other" onclick="selectGroupedChoice('${speciesId}', this)">
                        Other
                    </button>
                </div>
                
                <div id="${speciesId}-gear-details-grouped" style="display: none; margin-top: 15px;">
                    <div class="info-note">
                        <strong>Mesh Requirements:</strong> 5.5" diamond or 6.0" square mesh (CFR: 50 CFR 648.106)
                    </div>
                    <p class="question">Is the mesh size compliant?</p>
                    <div class="choice-group small">
                        <button class="choice-btn" data-species="${speciesId}" data-field="mesh-compliant" data-value="yes" onclick="selectGroupedChoice('${speciesId}', this)">Compliant</button>
                        <button class="choice-btn" data-species="${speciesId}" data-field="mesh-compliant" data-value="no" onclick="selectGroupedChoice('${speciesId}', this)">Non-Compliant</button>
                        <button class="choice-btn" data-species="${speciesId}" data-field="mesh-compliant" data-value="exemption" onclick="selectGroupedChoice('${speciesId}', this)">Exemption</button>
                    </div>
                </div>
            `;
        } else if (speciesId === 'atlantic-sea-scallop') {
            gearContent.innerHTML = `
                <p class="question">What type of gear is being used?</p>
                <div class="choice-group small">
                    <button class="choice-btn" data-species="${speciesId}" data-field="gear-type" data-value="dredge" onclick="selectGroupedChoice('${speciesId}', this)">
                        Scallop Dredge
                    </button>
                    <button class="choice-btn" data-species="${speciesId}" data-field="gear-type" data-value="trawl" onclick="selectGroupedChoice('${speciesId}', this)">
                        Otter Trawl
                    </button>
                </div>
                
                <div id="${speciesId}-dredge-details-grouped" style="display: none; margin-top: 15px;">
                    <div class="info-note">
                        <strong>Dredge Requirements:</strong> Min 4" ring diameter, Max 10" twine top (CFR: 50 CFR 648.51)
                    </div>
                    <p class="question">Are dredge specifications compliant?</p>
                    <div class="choice-group small">
                        <button class="choice-btn" data-species="${speciesId}" data-field="dredge-compliant" data-value="yes" onclick="selectGroupedChoice('${speciesId}', this)">Compliant</button>
                        <button class="choice-btn" data-species="${speciesId}" data-field="dredge-compliant" data-value="no" onclick="selectGroupedChoice('${speciesId}', this)">Non-Compliant</button>
                    </div>
                </div>
                
                <div id="${speciesId}-trawl-details-grouped" style="display: none; margin-top: 15px;">
                    <div class="info-note">
                        <strong>Trawl Requirements:</strong> Check area-specific restrictions
                    </div>
                    <p class="question">Is trawl gear compliant?</p>
                    <div class="choice-group small">
                        <button class="choice-btn" data-species="${speciesId}" data-field="trawl-compliant" data-value="yes" onclick="selectGroupedChoice('${speciesId}', this)">Compliant</button>
                        <button class="choice-btn" data-species="${speciesId}" data-field="trawl-compliant" data-value="no" onclick="selectGroupedChoice('${speciesId}', this)">Non-Compliant</button>
                    </div>
                </div>
            `;
        } else if (isMultispecies(speciesId)) {
            // Groundfish/multispecies gear assessment
            gearContent.innerHTML = `
                <p class="question">What type of gear is being used?</p>
                <div class="choice-group small">
                    <button class="choice-btn" data-species="${speciesId}" data-field="gear-type" data-value="otter-trawl" onclick="selectGroupedChoice('${speciesId}', this)">
                        Otter Trawl
                    </button>
                    <button class="choice-btn" data-species="${speciesId}" data-field="gear-type" data-value="gillnet" onclick="selectGroupedChoice('${speciesId}', this)">
                        Gillnet
                    </button>
                    <button class="choice-btn" data-species="${speciesId}" data-field="gear-type" data-value="hook-gear" onclick="selectGroupedChoice('${speciesId}', this)">
                        Hook Gear
                    </button>
                    <button class="choice-btn" data-species="${speciesId}" data-field="gear-type" data-value="other" onclick="selectGroupedChoice('${speciesId}', this)">
                        Other
                    </button>
                </div>
                
                <div id="${speciesId}-gear-details-grouped" style="display: none; margin-top: 15px;">
                    <div class="info-note">
                        <strong>Gear Requirements:</strong> Check mesh size, net configuration, and area-specific gear restrictions (CFR: 50 CFR 648.80)
                    </div>
                    <p class="question">Is the gear compliant with Northeast Multispecies regulations?</p>
                    <div class="choice-group small">
                        <button class="choice-btn" data-species="${speciesId}" data-field="gear-compliant" data-value="yes" onclick="selectGroupedChoice('${speciesId}', this)">Compliant</button>
                        <button class="choice-btn" data-species="${speciesId}" data-field="gear-compliant" data-value="no" onclick="selectGroupedChoice('${speciesId}', this)">Non-Compliant</button>
                        <button class="choice-btn" data-species="${speciesId}" data-field="gear-compliant" data-value="unknown" onclick="selectGroupedChoice('${speciesId}', this)">Unable to Verify</button>
                    </div>
                </div>
            `;
        } else {
            // Default gear assessment for other species
            gearContent.innerHTML = `
                <p class="question">What type of gear is being used?</p>
                <div class="choice-group small">
                    <button class="choice-btn" data-species="${speciesId}" data-field="gear-type" data-value="trawl" onclick="selectGroupedChoice('${speciesId}', this)">
                        Trawl
                    </button>
                    <button class="choice-btn" data-species="${speciesId}" data-field="gear-type" data-value="gillnet" onclick="selectGroupedChoice('${speciesId}', this)">
                        Gillnet
                    </button>
                    <button class="choice-btn" data-species="${speciesId}" data-field="gear-type" data-value="hook-gear" onclick="selectGroupedChoice('${speciesId}', this)">
                        Hook Gear
                    </button>
                    <button class="choice-btn" data-species="${speciesId}" data-field="gear-type" data-value="other" onclick="selectGroupedChoice('${speciesId}', this)">
                        Other
                    </button>
                </div>
                
                <div class="info-note" style="margin-top: 15px;">
                    <strong>Note:</strong> Verify gear compliance against species-specific regulations (CFR: 50 CFR 648)
                </div>
            `;
        }
    } catch (error) {
        console.error(`Error populating gear content for ${speciesId}:`, error);
    }
}

// Show gear details for grouped view
function showGroupedGearDetails(speciesId, gearType) {
    try {
        // Hide all gear details first
        const allDetails = document.querySelectorAll(`[id*="${speciesId}"][id*="details-grouped"]`);
        allDetails.forEach(detail => detail.style.display = 'none');
        
        // Show relevant details based on species and gear type
        if (speciesId === 'summer-flounder' && (gearType === 'otter-trawl' || gearType === 'gillnet')) {
            const gearDetails = document.getElementById(`${speciesId}-gear-details-grouped`);
            if (gearDetails) gearDetails.style.display = 'block';
        } else if (speciesId === 'atlantic-sea-scallop') {
            if (gearType === 'dredge') {
                const dredgeDetails = document.getElementById(`${speciesId}-dredge-details-grouped`);
                if (dredgeDetails) dredgeDetails.style.display = 'block';
            } else if (gearType === 'trawl') {
                const trawlDetails = document.getElementById(`${speciesId}-trawl-details-grouped`);
                if (trawlDetails) trawlDetails.style.display = 'block';
            }
        } else if (isMultispecies(speciesId) && (gearType === 'otter-trawl' || gearType === 'gillnet' || gearType === 'hook-gear')) {
            // Show gear compliance check for multispecies
            const gearDetails = document.getElementById(`${speciesId}-gear-details-grouped`);
            if (gearDetails) gearDetails.style.display = 'block';
        }
    } catch (error) {
        console.error(`Error showing gear details for ${speciesId}:`, error);
    }
}

// Update possession limit info for grouped view
function updateGroupedPossessionLimitInfo(speciesId) {
    try {
        const species = SPECIES_DATA[speciesId];
        if (!species || !species.regulations) {
            console.warn(`Species or regulations not found for ${speciesId}`);
            return;
        }
        
        const permitType = assessmentData.species[speciesId]?.['permit-type'];
        const limitInfo = document.getElementById(`${speciesId}-limit-info-grouped`);
        
        if (!limitInfo) {
            console.warn(`Limit info element not found for ${speciesId}`);
            return;
        }
        
        if (!species.regulations.possession) {
            // No possession regulations defined
            limitInfo.innerHTML = `
                <div class="info-note">
                    <strong>Possession Limits:</strong> Check current trip limits or ACE allocation (CFR: 50 CFR 648)
                </div>
            `;
            return;
        }
        
        // Special handling for bluefin tuna commercial closure
        if (speciesId === 'bluefin-tuna' && permitType === 'commercial') {
            // Use date manager if available
            const currentDate = (window.dateManager && window.dateManager.getAssessmentDate) 
                ? window.dateManager.getAssessmentDate() 
                : new Date();
            
            // Check closures using date manager or fallback
            let isClosed = false;
            let closureInfo = null;
            
            if (typeof isClosureActive === 'function') {
                isClosed = isClosureActive('bluefin-tuna', 'commercial');
                closureInfo = getClosureInfo('bluefin-tuna', 'commercial');
            } else {
                // Fallback to hardcoded dates
                const closureStart = new Date('2026-01-14T23:30:00');
                const closureEnd = new Date('2026-03-31T23:59:59');
                isClosed = currentDate >= closureStart && currentDate <= closureEnd;
            }
            
            if (isClosed && limitInfo) {
                const closure = closureInfo?.closures?.[0];
                const startDate = closure?.startDate ? (window.dateManager ? window.dateManager.formatDate(closure.startDate, 'datetime') : 'January 14, 2026 (11:30 PM)') : 'January 14, 2026 (11:30 PM)';
                const endDate = closure?.endDate ? (window.dateManager ? window.dateManager.formatDate(closure.endDate, 'short') : 'March 31, 2026') : 'March 31, 2026';
                
                limitInfo.innerHTML = `
                    <div class="info-note" style="background: #fee2e2; border-left-color: #dc2626;">
                        <strong>⚠️ COMMERCIAL FISHERY CLOSED</strong>
                        <p style="margin: 8px 0 0 0;"><strong>Closure Period:</strong> ${startDate} - ${endDate}</p>
                        <p style="margin: 8px 0 0 0;">Vessels with commercial sale endorsement <strong>cannot retain, possess, or land</strong> large medium or giant Atlantic bluefin tuna (≥73" CFL) during this period.</p>
                        <p style="margin: 8px 0 0 0; font-size: 0.9rem;">CFR: 50 CFR 635.23</p>
                    </div>
                `;
                return;
            } else if (!isClosed && limitInfo) {
                const currentMonth = currentDate.getMonth() + 1;
                if (currentMonth >= 6 && currentMonth <= 8) {
                    const reopening = closureInfo?.reopenings?.[0];
                    const reopenDate = reopening?.date ? (window.dateManager ? window.dateManager.formatDate(reopening.date, 'short') : 'June 1, 2026') : 'June 1, 2026';
                    
                    limitInfo.innerHTML = `
                        <div class="info-note">
                            <strong>Commercial Retention Limit (June-August):</strong>
                            <p style="margin: 8px 0 0 0;">1 fish greater than 73" curved fork length per vessel per day</p>
                            <p style="margin: 8px 0 0 0; font-size: 0.9rem;">Fishery automatically reopens ${reopenDate}. CFR: 50 CFR 635.23</p>
                        </div>
                    `;
                    return;
                }
            }
        }
        
        // Get possession data using existing helper functions
        let possessionData = null;
        if (speciesId === 'summer-flounder') {
            possessionData = getSummerFlounderPossessionData(permitType, assessmentData.species[speciesId]);
        } else if (speciesId === 'atlantic-sea-scallop') {
            possessionData = getScallopPossessionData(permitType, species.regulations.possession);
        } else if (isMultispecies(speciesId)) {
            // For multispecies, check vessel classification
            const vesselClassification = assessmentData.vessel.multispecies?.classification || assessmentData.species[speciesId]?.vesselClassification;
            if (vesselClassification && species.regulations.possession[vesselClassification]) {
                possessionData = species.regulations.possession[vesselClassification];
            } else if (species.regulations.possession['sector']) {
                // Default to sector if available
                possessionData = species.regulations.possession['sector'];
            } else if (species.regulations.possession['common-pool']) {
                // Fallback to common pool
                possessionData = species.regulations.possession['common-pool'];
            }
        } else if (permitType && species.regulations.possession[permitType]) {
            // Try to find possession data by permit type
            possessionData = species.regulations.possession[permitType];
        } else {
            // Use first available possession data
            const firstKey = Object.keys(species.regulations.possession)[0];
            if (firstKey) {
                possessionData = species.regulations.possession[firstKey];
            }
        }
        
        if (possessionData && limitInfo) {
            displayPossessionLimitInfo(limitInfo, possessionData);
        } else if (limitInfo) {
            // Show generic limit info
            limitInfo.innerHTML = `
                <div class="info-note">
                    <strong>Possession Limits:</strong> Check current regulations and trip limits (CFR: 50 CFR 648)
                </div>
            `;
        }
    } catch (error) {
        console.error(`Error updating grouped possession limit info for ${speciesId}:`, error);
    }
}

// Handle choice selection for species (legacy function - still used in some places)
function selectChoice(speciesId, btn) {
    try {
        const field = btn.dataset.field;
        const value = btn.dataset.value;
        
        // Initialize species data if needed
        if (!assessmentData.species[speciesId]) {
            assessmentData.species[speciesId] = {};
        }
        
        // Remove selection from ALL buttons with the same field
        // First try to find within the same container/group
        const container = btn.closest('.choice-group') || btn.closest('.assessment-step') || btn.closest('.species-permit-group') || btn.closest('.species-possession-group') || btn.closest('.species-size-gear-group');
        
        if (container) {
            container.querySelectorAll(`[data-field="${field}"]`).forEach(b => {
                b.classList.remove('selected');
            });
        } else {
            // Fallback: remove from all buttons with same field and species
            document.querySelectorAll(`[data-field="${field}"]`).forEach(b => {
                if (b.dataset.species === speciesId || b.closest(`[data-species="${speciesId}"]`)) {
                    b.classList.remove('selected');
                }
            });
        }
        
        // Select this button
        btn.classList.add('selected');
        
        // Store value
        assessmentData.species[speciesId][field] = value;
        
        // Special handling based on field and species
        handleSpecialChoiceLogic(speciesId, field, value);
        
    } catch (error) {
        console.error(`Error handling choice selection for ${speciesId}:`, error);
        showErrorMessage('Error processing selection. Please try again.');
    }
}

// Handle special logic for choice selections
function handleSpecialChoiceLogic(speciesId, field, value) {
    if (field === 'has-permit' && value !== 'yes') {
        // Skip to next species or results if no valid permit
        const nextSpecies = getNextSpecies(speciesId);
        if (nextSpecies) {
            showSpeciesAssessment(selectedSpecies.indexOf(nextSpecies));
        } else {
            generateReport();
            showStep(2 + selectedSpecies.length);
        }
    } else if (field === 'possession-type' && speciesId === 'atlantic-sea-scallop') {
        // Show amount input and update label
        const amountInput = document.getElementById(`${speciesId}-amount-input`);
        const amountLabel = document.getElementById(`${speciesId}-amount-label`);
        if (amountInput && amountLabel) {
            amountInput.style.display = 'block';
            amountLabel.textContent = value === 'shucked' ? 'Amount (lbs):' : 'Amount (bushels):';
        }
    } else if (field === 'gear-type') {
        // Show gear-specific details
        if (speciesId === 'summer-flounder') {
            document.getElementById(`${speciesId}-gear-details`).style.display = 'block';
        } else if (speciesId === 'atlantic-sea-scallop') {
            // Hide all gear details first
            const dredgeDetails = document.getElementById(`${speciesId}-dredge-details`);
            const trawlDetails = document.getElementById(`${speciesId}-trawl-details`);
            if (dredgeDetails) dredgeDetails.style.display = 'none';
            if (trawlDetails) trawlDetails.style.display = 'none';
            
            // Show relevant details
            if (value === 'dredge' && dredgeDetails) {
                dredgeDetails.style.display = 'block';
            } else if (value === 'trawl' && trawlDetails) {
                trawlDetails.style.display = 'block';
            }
        }
    } else if (field === 'permit-type') {
        // Update possession limits info
        updatePossessionLimitInfo(speciesId);
    }
}

// Show error message to user
function showErrorMessage(message) {
    // Create or update error message element
    let errorDiv = document.getElementById('error-message');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'error-message';
        errorDiv.className = 'error-message';
        document.querySelector('.container').insertBefore(errorDiv, document.querySelector('main'));
    }
    
    errorDiv.innerHTML = `
        <div class="error-content">
            <span class="error-icon">⚠️</span>
            <span class="error-text">${message}</span>
            <button class="error-close" onclick="hideErrorMessage()">×</button>
        </div>
    `;
    errorDiv.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(hideErrorMessage, 5000);
}

// Hide error message
function hideErrorMessage() {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}

// Validate species data structure
function validateSpeciesData(speciesId) {
    try {
        const species = SPECIES_DATA[speciesId];
        if (!species) {
            console.warn(`Species data not found for ${speciesId}, but continuing...`);
            return true; // Allow for now, might be multispecies
        }
        
        // For multispecies, we have different structure
        if (typeof isMultispecies === 'function' && isMultispecies(speciesId)) {
            // Multispecies validation - just check if it exists
            return true;
        }
        
        // For regular species, check full structure
        if (!species.regulations) {
            console.warn(`Regulations not defined for ${species.name}, but continuing...`);
            return true; // Allow for now
        }
        
        if (!species.regulations.permits) {
            console.warn(`Permits not defined for ${species.name}, but continuing...`);
            return true; // Allow for now
        }
        
        return true;
    } catch (error) {
        console.error(`Species data validation failed for ${speciesId}:`, error);
        // Don't show error message, just log and continue
        return true; // Allow to continue
    }
}
// Update possession limit info
function updatePossessionLimitInfo(speciesId) {
    try {
        const species = SPECIES_DATA[speciesId];
        const permitType = assessmentData.species[speciesId]['permit-type'];
        const limitInfo = document.getElementById(`${speciesId}-limit-info`);
        
        if (!limitInfo || !species.regulations.possession) return;
        
        // Find possession limit for this permit type
        let possessionData = null;
        for (let key in species.regulations.possession) {
            if (key === permitType || key.includes(permitType)) {
                possessionData = species.regulations.possession[key];
                break;
            }
        }
        
        // Species-specific logic
        if (speciesId === 'summer-flounder') {
            possessionData = getSummerFlounderPossessionData(permitType, assessmentData.species[speciesId]);
        } else if (speciesId === 'atlantic-sea-scallop') {
            possessionData = getScallopPossessionData(permitType, species.regulations.possession);
        }
        
        if (possessionData && limitInfo) {
            displayPossessionLimitInfo(limitInfo, possessionData);
        }
    } catch (error) {
        console.error(`Error updating possession limit info for ${speciesId}:`, error);
        showErrorMessage('Error loading possession limit information.');
    }
}

// Get Summer Flounder possession data
function getSummerFlounderPossessionData(permitType, speciesData) {
    const regs = SPECIES_DATA['summer-flounder'].regulations;
    
    if (permitType === 'recreational') {
        return regs.possession['recreational'];
    } else if (permitType === 'commercial') {
        const meshStatus = speciesData['mesh-compliant'];
        if (meshStatus === 'yes') {
            return regs.possession['commercial-large-mesh'];
        } else {
            return regs.possession['commercial-small-mesh'];
        }
    }
    return null;
}

// Get Scallop possession data
function getScallopPossessionData(permitType, possessionRegs) {
    // Map permit types to possession data
    const permitMap = {
        'la-full': 'la-full',
        'la-part': 'la-part', 
        'la-occ': 'la-occ',
        'lagc-ifq': 'lagc-ifq',
        'lagc-ngom': 'lagc-ngom',
        'lagc-incidental': 'lagc-incidental'
    };
    
    const mappedKey = permitMap[permitType];
    return mappedKey ? possessionRegs[mappedKey] : null;
}

// Display possession limit information
function displayPossessionLimitInfo(limitInfo, possessionData) {
    let limitText = '';
    
    if (possessionData.limit === null) {
        limitText = 'No possession limit when using compliant gear';
    } else if (possessionData.seasonal) {
        // Use date manager if available
        const date = (window.dateManager && window.dateManager.getAssessmentDate) 
            ? window.dateManager.getAssessmentDate() 
            : new Date();
        const month = date.getMonth() + 1;
        
        let currentSeason = null;
        let seasonName = '';
        
        // Use date manager's seasonal limit function if available
        if (window.dateManager && window.dateManager.getSeasonalLimit) {
            const limit = window.dateManager.getSeasonalLimit(possessionData.seasonal);
            if (limit !== null) {
                // Find which season this limit belongs to
                for (let season in possessionData.seasonal) {
                    if (possessionData.seasonal[season].limit === limit) {
                        currentSeason = possessionData.seasonal[season];
                        seasonName = season === 'may-oct' ? 'May-Oct' : season === 'nov-apr' ? 'Nov-Apr' : season;
                        break;
                    }
                }
            }
        } else {
            // Fallback to month-based logic
            for (let season in possessionData.seasonal) {
                if (possessionData.seasonal[season].months && possessionData.seasonal[season].months.includes(month)) {
                    currentSeason = possessionData.seasonal[season];
                    seasonName = season === 'may-oct' ? 'May-Oct' : 'Nov-Apr';
                    break;
                }
            }
        }
        
        if (currentSeason) {
            limitText = `Limit: ${currentSeason.limit} ${possessionData.unit} (Seasonal - ${seasonName})`;
        }
    } else if (possessionData.limit) {
        if (possessionData.limit.count) {
            limitText = `Limit: ${possessionData.limit.count} ${possessionData.limit.unit}`;
        } else if (possessionData.limit.shucked && possessionData.limit.inshell) {
            limitText = `Limit: ${possessionData.limit.shucked} lbs shucked OR ${possessionData.limit.inshell} bushels in-shell`;
        } else {
            limitText = `Limit: ${possessionData.limit} ${possessionData.unit}`;
        }
    }
    
    limitInfo.innerHTML = `
        <h4>Possession Limits for ${possessionData.name}:</h4>
        <p><strong>${limitText}</strong></p>
        ${possessionData.cfr ? `<p style="margin-top: 8px; font-size: 0.9rem;">CFR: ${possessionData.cfr}</p>` : ''}
        ${possessionData.notes ? `<p style="margin-top: 4px; font-size: 0.85rem;">${possessionData.notes}</p>` : ''}
    `;
}
// Navigation between steps
function nextStep(fromStep) {
    if (fromStep === 0) {
        if (selectedSpecies.length === 0) {
            alert('Please select at least one species');
            return;
        }
        // Go directly to assessment
        showStep(1); // This will trigger grouped assessment generation
    }
}

function prevStep(fromStep) {
    if (fromStep === 0) {
        // Go back to homepage
        showStep(-1);
    } else if (fromStep > 0) {
        showStep(fromStep - 1);
    }
}

// Legacy functions - keeping for compatibility but not used in grouped approach
// These can be removed in future refactoring
// Generate comprehensive report
function generateReport() {
    try {
        if (typeof StateBridge !== 'undefined') {
            StateBridge.flushAssessmentInputs();
        } else if (typeof saveGroupedStepData === 'function') {
            saveGroupedStepData('possession');
            saveGroupedStepData('dynamic-assessment');
        }

        const reportContent = document.getElementById('report-content');
        if (!reportContent) {
            console.error('report-content element not found');
            const errorMessage = typeof Helpers !== 'undefined' && Helpers.showErrorMessage 
                ? Helpers.showErrorMessage 
                : (typeof showErrorMessage === 'function' ? showErrorMessage : alert);
            errorMessage('Error: Report container not found. Please refresh and try again.');
            return;
        }

        // Ensure we have selected species
        const currentSelectedSpecies = (typeof window !== 'undefined' && window.selectedSpecies) 
            ? window.selectedSpecies 
            : selectedSpecies;
        
        if (!currentSelectedSpecies || currentSelectedSpecies.length === 0) {
            const errorMessage = typeof Helpers !== 'undefined' && Helpers.showErrorMessage 
                ? Helpers.showErrorMessage 
                : (typeof showErrorMessage === 'function' ? showErrorMessage : alert);
            errorMessage('Error: No species selected. Please select species and complete assessment first.');
            return;
        }

        const now = new Date();
    
    let html = `
        <div class="report-header">
            <h2>FIN - FISHERIES INSPECTION NAVIGATOR</h2>
            <h3>NORTHEAST FISHERIES COMPLIANCE REPORT</h3>
            <p class="report-date">Generated: ${now.toLocaleString()}</p>
        </div>
        <div class="report-body">
    `;
    
    // Check all violations including combined limits (centralized check)
    const allViolations = checkAllViolations();
    
    // Generate report for each species
    selectedSpecies.forEach(speciesId => {
        const species = SPECIES_DATA[speciesId];
        if (!species) {
            console.error(`Species data not found for ${speciesId}`);
            html += `
                <div class="report-section">
                    <h3>SPECIES ASSESSMENT - ${speciesId.toUpperCase()}</h3>
                    <div class="report-row">
                        <span class="report-label">Status:</span>
                        <span class="report-value">Species data not available</span>
                    </div>
                </div>
            `;
            return;
        }
        
        const speciesData = assessmentData.species[speciesId] || {};
        // Get species-specific violations for this species
        const violations = checkSpeciesViolations(speciesId, species, speciesData);
        
        html += `
            <div class="report-section">
                <h3>${species.name ? species.name.toUpperCase() : speciesId.toUpperCase()} ASSESSMENT</h3>
        `;
        
        // Permit
        const permitCFR = species.regulations?.permits && Object.values(species.regulations.permits).length > 0 ? 
            Object.values(species.regulations.permits)[0]?.cfr : null;
        
        html += `
            <div class="report-row">
                <span class="report-label">Federal Permit:</span>
                <span class="report-value ${speciesData['has-permit'] !== 'yes' ? 'violation' : 'compliant'}">
                    ${formatPermitStatus(speciesData['has-permit'])}
                    ${permitCFR ? ` <span class="cfr-cite">(${permitCFR})</span>` : ''}
                </span>
            </div>
        `;
        
        if (speciesData['has-permit'] === 'yes' && speciesData['permit-type'] && species.regulations?.permits) {
            const permit = species.regulations.permits[speciesData['permit-type']];
            if (permit) {
                html += `
                    <div class="report-row">
                        <span class="report-label">Permit Type:</span>
                        <span class="report-value">${permit.name || speciesData['permit-type']} ${permit.cfr ? `<span class="cfr-cite">(${permit.cfr})</span>` : ''}</span>
                    </div>
                `;
            }
        }
        
        // Possession
        if (speciesData.possessionAmount !== undefined) {
            const isViolation = violations.some(v => v.includes('possession') || v.includes('Possession') || v.includes('PROHIBITED'));
            const isProhibited = isProhibitedSpecies(speciesId) && speciesData.possessionAmount > 0;
            html += `
                <div class="report-row">
                    <span class="report-label">Possession Amount:</span>
                    <span class="report-value ${isViolation || isProhibited ? 'violation' : ''}">
                        ${speciesData.possessionAmount} ${getPossessionUnit(speciesId, speciesData)}
                        ${isProhibited ? ' (PROHIBITED SPECIES)' : isViolation ? ' (OVER LIMIT)' : ''}
                    </span>
                </div>
            `;
        }
        
        // Size
        if (speciesData['size-compliant']) {
            const sizeCFR = species.regulations?.size?.cfr || species.regulations?.size?.commercialCFR;
            html += `
                <div class="report-row">
                    <span class="report-label">Size Compliance:</span>
                    <span class="report-value ${speciesData['size-compliant'] === 'no' ? 'violation' : 'compliant'}">
                        ${formatSizeCompliance(speciesData['size-compliant'])}
                        ${sizeCFR ? ` <span class="cfr-cite">(${sizeCFR})</span>` : ''}
                    </span>
                </div>
            `;
        }
        
        // Gear
        if (speciesData['gear-type']) {
            html += `
                <div class="report-row">
                    <span class="report-label">Gear Type:</span>
                    <span class="report-value">${formatGearType(speciesData['gear-type'])}</span>
                </div>
            `;
        }
        
        if (speciesData['mesh-compliant'] || speciesData['dredge-compliant'] || speciesData['trawl-compliant']) {
            const gearCompliance = speciesData['mesh-compliant'] || speciesData['dredge-compliant'] || speciesData['trawl-compliant'];
            const meshCFR = speciesId === 'summer-flounder' ? '50 CFR 648.106' : '50 CFR 648.51';
            html += `
                <div class="report-row">
                    <span class="report-label">Gear Compliance:</span>
                    <span class="report-value ${gearCompliance === 'no' ? 'violation' : 'compliant'}">
                        ${formatMeshCompliance(gearCompliance)}
                        ${meshCFR ? ` <span class="cfr-cite">(${meshCFR})</span>` : ''}
                    </span>
                </div>
            `;
        }
        
        // HMS Reporting requirements
        if (species.regulations?.reporting?.required) {
            const hmsReported = assessmentData.vessel.requirements?.['hms-reported'] || assessmentData.species[speciesId]?.['hms-reported'];
            html += `
                <div class="report-row">
                    <span class="report-label">HMS Catch Reporting:</span>
                    <span class="report-value ${hmsReported === 'no' ? 'violation' : 'compliant'}">
                        ${hmsReported === 'yes' ? 'Reported' : hmsReported === 'pending' ? 'Pending (Within 24hrs)' : hmsReported === 'no' ? 'NOT REPORTED (REQUIRED)' : 'Not Verified'}
                        <span class="cfr-cite">(${species.regulations.reporting.cfr})</span>
                    </span>
                </div>
            `;
        }
        
        // Additional checks for scallops
        if (speciesId === 'atlantic-sea-scallop') {
            if (speciesData['vms-operational']) {
                html += `
                    <div class="report-row">
                        <span class="report-label">VMS Status:</span>
                        <span class="report-value ${speciesData['vms-operational'] === 'no' ? 'violation' : 'compliant'}">
                            ${speciesData['vms-operational'] === 'yes' ? 'Operational' : speciesData['vms-operational'] === 'no' ? 'NOT OPERATIONAL' : 'Unable to Verify'}
                            <span class="cfr-cite">(50 CFR 648.10)</span>
                        </span>
                    </div>
                `;
            }
            
            if (speciesData['observer-present']) {
                html += `
                    <div class="report-row">
                        <span class="report-label">Observer:</span>
                        <span class="report-value ${speciesData['observer-present'] === 'no' ? 'violation' : 'compliant'}">
                            ${speciesData['observer-present'] === 'yes' ? 'Present' : speciesData['observer-present'] === 'no' ? 'REQUIRED BUT NOT PRESENT' : 'Not Required'}
                            <span class="cfr-cite">(50 CFR 648.11)</span>
                        </span>
                    </div>
                `;
            }
            
            if (speciesData['tdd-installed']) {
                html += `
                    <div class="report-row">
                        <span class="report-label">TDD Status:</span>
                        <span class="report-value ${speciesData['tdd-installed'] === 'no' ? 'violation' : 'compliant'}">
                            ${speciesData['tdd-installed'] === 'yes' ? 'Installed' : speciesData['tdd-installed'] === 'no' ? 'REQUIRED BUT NOT INSTALLED' : 'Not Required'}
                            <span class="cfr-cite">(50 CFR 223.206)</span>
                        </span>
                    </div>
                `;
            }
        }
        
        // Species violations
        if (violations.length > 0) {
            html += `
                <div class="report-row">
                    <span class="report-label">Violations:</span>
                    <span class="report-value violation">
                        <ul class="violation-list-small">
                            ${violations.map(v => `<li>${v}</li>`).join('')}
                        </ul>
                    </span>
                </div>
            `;
        }
        
        html += `</div>`;
    });
    
    // Final verdict
    html += `
            <div class="verdict-box ${allViolations.length > 0 ? 'violation' : 'compliant'}">
                <h3>${allViolations.length > 0 ? '⚠️ POTENTIAL VIOLATION(S) IDENTIFIED' : '✓ NO VIOLATIONS IDENTIFIED'}</h3>
                ${allViolations.length > 0 ? `
                <p>Possible violation(s) of <strong>50 USC 648</strong> - Magnuson-Stevens Fishery Conservation and Management Act</p>
                <ul class="violation-list">
                    ${allViolations.map(v => `<li>${v}</li>`).join('')}
                </ul>
                ` : `
                <p>Based on the information provided, the vessel appears to be in compliance with Northeast fisheries regulations.</p>
                `}
            </div>
        </div>
    `;
    
    if (reportContent) {
        reportContent.innerHTML = html;
        console.log('Report generated successfully');
    } else {
        console.error('report-content element not found when trying to set HTML');
    }
    } catch (error) {
        console.error('Error generating report:', error);
        const errorMessage = typeof Helpers !== 'undefined' && Helpers.showErrorMessage 
            ? Helpers.showErrorMessage 
            : (typeof showErrorMessage === 'function' ? showErrorMessage : alert);
        errorMessage('Error generating report. Please try again. If the problem persists, refresh the page.');
    }
}
// Check all violations including combined limits (called once after all species checked)
function checkAllViolations() {
    const allViolations = [];
    
    // First, save any unsaved possession data
    if (typeof saveGroupedStepData === 'function') {
        saveGroupedStepData('possession');
    }
    
    // Check individual species violations
    const speciesIds = (window.appState && window.appState.selectedSpecies.length)
        ? window.appState.selectedSpecies
        : (window.selectedSpecies || selectedSpecies);
    speciesIds.forEach(speciesId => {
        const species = SPECIES_DATA[speciesId];
        if (!species) return;
        
        const speciesData = (window.assessmentData || assessmentData).species[speciesId] || {};
        const violations = checkSpeciesViolations(speciesId, species, speciesData);
        allViolations.push(...violations);
    });
    
    // Check combined possession limits (run once after all species)
    if (typeof shareCombinedLimit === 'function' && typeof window.validators !== 'undefined' && window.validators.checkCombinedPossessionLimits) {
        const combinedViolations = window.validators.checkCombinedPossessionLimits(speciesIds);
        allViolations.push(...combinedViolations);
    }
    
    return allViolations;
}

// Check if species is prohibited
function isProhibitedSpecies(speciesId) {
    const prohibitedSpecies = [
        'atlantic-wolffish',  // Prohibited in Northeast Multispecies
        'windowpane-flounder', // Prohibited in Northeast Multispecies
        'ocean-pout'          // Prohibited in Northeast Multispecies
    ];
    return prohibitedSpecies.includes(speciesId);
}

// Check violations for a species
function checkSpeciesViolations(speciesId, species, speciesData) {
    const violations = [];
    
    // Safety check: ensure species exists
    if (!species) {
        console.warn(`Species data not found for ${speciesId}`);
        return violations;
    }
    
    try {
        const regs = species.regulations;
        const speciesName = species.name ? species.name.toLowerCase() : speciesId.replace(/-/g, ' ');
        
        // Check for prohibited species - ANY possession is a violation
        if (isProhibitedSpecies(speciesId)) {
            const possessionAmount = speciesData.possessionAmount || 0;
            if (possessionAmount > 0) {
                violations.push(`PROHIBITED SPECIES: ${species.name || speciesName} possession prohibited (50 CFR 648.81)`);
            }
        }
        
        // Permit violations
        if (speciesData['has-permit'] === 'no') {
            const cfr = regs?.permits && Object.values(regs.permits).length > 0 ? 
                Object.values(regs.permits)[0]?.cfr : null;
            violations.push(`No valid federal ${speciesName} permit${cfr ? ` (${cfr})` : ''}`);
        } else if (speciesData['has-permit'] === 'expired') {
            violations.push(`Expired federal ${speciesName} permit`);
        }
        
        // Only check other violations if permit exists and regulations are available
        if (speciesData['has-permit'] === 'yes' && regs) {
            // Possession limits (skip for prohibited species as they're already flagged)
            if (!isProhibitedSpecies(speciesId)) {
                const possessionViolations = checkPossessionViolations(speciesId, species, speciesData);
                violations.push(...possessionViolations);
            }
            
            // Size violations
            if (speciesData['size-compliant'] === 'no') {
                const cfr = regs.size?.cfr || regs.size?.commercialCFR;
                violations.push(`Undersized ${speciesName} present${cfr ? ` (${cfr})` : ''}`);
            }
            
            // Gear violations
            const gearViolations = checkGearViolations(speciesId, species, speciesData);
            violations.push(...gearViolations);
            
            // Additional violations (for scallops)
            if (speciesId === 'atlantic-sea-scallop') {
                const additionalViolations = checkScallopAdditionalViolations(speciesData);
                violations.push(...additionalViolations);
            }
            
            // HMS Reporting violations
            if (regs.reporting && regs.reporting.required) {
                const hmsReported = assessmentData.vessel.requirements?.['hms-reported'] || speciesData['hms-reported'];
                if (hmsReported === 'no') {
                    violations.push(`HMS catch reporting required but not completed for ${speciesName} (${regs.reporting.cfr})`);
                }
            }
        }
    } catch (error) {
        console.error(`Error checking violations for ${speciesId}:`, error);
        const speciesName = species?.name || speciesId;
        violations.push(`Error checking compliance for ${speciesName} - manual verification required`);
    }
    
    return violations;
}

// Check possession violations
function checkPossessionViolations(speciesId, species, speciesData) {
    const violations = [];
    
    if (!species || speciesData.possessionAmount === undefined) return violations;
    
    // Only check possession for species with defined possession rules
    if (!species.regulations || !species.regulations.possession) {
        return violations; // No possession rules defined for this species
    }
    
    try {
        if (speciesId === 'summer-flounder') {
            violations.push(...checkSummerFlounderPossession(species, speciesData));
        } else if (speciesId === 'atlantic-sea-scallop') {
            violations.push(...checkScallopPossession(species, speciesData));
        } else if (speciesId === 'bluefin-tuna') {
            violations.push(...checkBluefinTunaPossession(species, speciesData));
        } else if (isMultispecies(speciesId)) {
            // For multispecies, possession is checked via ACE allocation or trip limits
            // These are complex and require sector/common pool determination
            // For now, just note that possession limits apply but require manual verification
            if (speciesData.possessionAmount && speciesData.possessionAmount > 0) {
                // Add a note that limits must be verified manually for multispecies
                // This doesn't count as a violation, just informational
            }
        }
    } catch (error) {
        console.error(`Error checking possession violations for ${speciesId}:`, error);
        violations.push(`Error checking possession limits - manual verification required`);
    }
    
    return violations;
}

// Display combined limit warnings in possession section
function displayCombinedLimitWarnings() {
    if (typeof shareCombinedLimit !== 'function') return;
    
    // Use global references to avoid circular reference issues
    const assessmentDataRef = window.assessmentData;
    const selectedSpeciesIds = window.selectedSpecies || [];
    
    if (!assessmentDataRef) {
        console.warn('assessmentData not available for combined limit warnings');
        return;
    }
    
    // Check each permit type
    const permitTypes = ['commercial', 'recreational', 'charter-headboat'];
    
    permitTypes.forEach(permitType => {
        // Get species with this permit type
        const speciesWithPermit = selectedSpeciesIds.filter(speciesId => {
            const speciesData = assessmentDataRef.species[speciesId];
            return speciesData && speciesData['permit-type'] === permitType;
        });
        
        if (speciesWithPermit.length === 0) return;
        
        // Check for combined limits
        const combinedLimitGroups = shareCombinedLimit(speciesWithPermit, permitType);
        
        combinedLimitGroups.forEach(groupData => {
            const { group, species, limit } = groupData;
            
            if (!limit || !limit.limit) return;
            
            // Create warning display for this group
            const warningId = `combined-limit-warning-${group.id}-${permitType}`;
            let warningDiv = document.getElementById(warningId);
            
            if (!warningDiv) {
                // Find the first species in the group to attach the warning
                const firstSpeciesId = species[0];
                const firstSpeciesGroup = document.querySelector(`[data-species="${firstSpeciesId}"]`);
                
                if (firstSpeciesGroup) {
                    warningDiv = document.createElement('div');
                    warningDiv.id = warningId;
                    warningDiv.className = 'combined-limit-warning';
                    warningDiv.style.cssText = 'background: #fff3cd; border: 2px solid #ffc107; border-radius: 6px; padding: 12px; margin: 10px 0;';
                    firstSpeciesGroup.insertBefore(warningDiv, firstSpeciesGroup.firstChild);
                }
            }
            
            if (warningDiv) {
                const speciesNames = species.map(id => {
                    const s = SPECIES_DATA[id];
                    return s ? s.name : id;
                }).join(', ');
                
                warningDiv.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                        <strong style="color: #856404;">⚠️ COMBINED LIMIT APPLIES</strong>
                    </div>
                    <p style="margin: 0; color: #856404; font-size: 14px;">
                        <strong>${group.name}:</strong> ${limit.limit.count} ${limit.limit.unit} total limit for: ${speciesNames}
                    </p>
                    <p style="margin: 4px 0 0 0; color: #856404; font-size: 12px; font-style: italic;">
                        ${limit.notes || ''} ${limit.cfr ? `(${limit.cfr})` : ''}
                    </p>
                    <div id="${warningId}-current-total" style="margin-top: 8px; font-weight: bold; color: #856404;">
                        Current Total: 0 ${limit.limit.unit}
                    </div>
                `;
            }
        });
    });
    
    // Update current totals
    updateCombinedLimitDisplay();
}

// Update combined limit display with current totals
function updateCombinedLimitDisplay() {
    if (typeof shareCombinedLimit !== 'function') return;
    
    // Use global references to avoid circular reference issues
    const assessmentDataRef = window.assessmentData;
    const selectedSpeciesIds = window.selectedSpecies || [];
    
    if (!assessmentDataRef) {
        return;
    }
    
    // Check each permit type
    const permitTypes = ['commercial', 'recreational', 'charter-headboat'];
    
    permitTypes.forEach(permitType => {
        // Get species with this permit type
        const speciesWithPermit = selectedSpeciesIds.filter(speciesId => {
            const speciesData = assessmentData.species[speciesId];
            return speciesData && speciesData['permit-type'] === permitType;
        });
        
        if (speciesWithPermit.length === 0) return;
        
        // Check for combined limits
        const combinedLimitGroups = shareCombinedLimit(speciesWithPermit, permitType);
        
        combinedLimitGroups.forEach(groupData => {
            const { group, species, limit } = groupData;
            
            if (!limit || !limit.limit) return;
            
            const warningId = `combined-limit-warning-${group.id}-${permitType}`;
            const totalDisplay = document.getElementById(`${warningId}-current-total`);
            
            if (totalDisplay) {
                // Calculate current total
                let totalPossession = 0;
                
                species.forEach(speciesId => {
                    const amountInput = document.getElementById(`${speciesId}-possession-amount-grouped`);
                    if (amountInput && amountInput.value) {
                        totalPossession += parseFloat(amountInput.value) || 0;
                    }
                });
                
                // Update display with color coding
                const isOverLimit = limit.limit.count && totalPossession > limit.limit.count;
                totalDisplay.style.color = isOverLimit ? '#dc2626' : '#856404';
                totalDisplay.innerHTML = `Current Total: <span style="font-weight: bold;">${totalPossession}</span> ${limit.limit.unit} ${isOverLimit ? '<span style="color: #dc2626;">⚠️ EXCEEDS LIMIT</span>' : ''}`;
            }
        });
    });
}

// Make function globally accessible
window.updateCombinedLimitDisplay = updateCombinedLimitDisplay;

// Check Summer Flounder possession
function checkSummerFlounderPossession(species, speciesData) {
    const violations = [];
    const regs = species.regulations;
    const permitType = speciesData['permit-type'];
    const meshStatus = speciesData['mesh-compliant'];
    
    if (permitType === 'commercial') {
        let limit = null;
        let cfr = '50 CFR 648.106(b)';
        
        if (meshStatus === 'yes') {
            // Large mesh - no limit
            limit = null;
        } else {
            // Small mesh - seasonal limits
            // Use date manager if available
            const date = (window.dateManager && window.dateManager.getAssessmentDate) 
                ? window.dateManager.getAssessmentDate() 
                : new Date();
            const month = date.getMonth() + 1;
            const seasonal = regs.possession['commercial-small-mesh'].seasonal;
            
            // Use date manager's seasonal limit function if available
            if (window.dateManager && window.dateManager.getSeasonalLimit) {
                limit = window.dateManager.getSeasonalLimit(seasonal);
            } else {
                // Fallback to month-based logic
                if (month >= 5 && month <= 10) {
                    limit = seasonal['may-oct'].limit;
                } else {
                    limit = seasonal['nov-apr'].limit;
                }
            }
        }
        
        if (limit !== null && speciesData.possessionAmount > limit) {
            violations.push(`Summer flounder possession exceeds limit: ${speciesData.possessionAmount} lbs vs ${limit} lbs limit (${cfr})`);
        }
    } else if (permitType === 'recreational') {
        const recLimit = regs.possession['recreational'].limit.count;
        if (speciesData.possessionAmount > recLimit) {
            const cfr = regs.possession['recreational'].cfr;
            violations.push(`Recreational possession exceeds limit: ${speciesData.possessionAmount} fish vs ${recLimit} fish limit${cfr ? ` (${cfr})` : ''}`);
        }
    }
    
    return violations;
}

// Check Bluefin Tuna possession
function checkBluefinTunaPossession(species, speciesData) {
    const violations = [];
    const regs = species.regulations;
    const permitType = speciesData['permit-type'];
    
    // Use date manager if available, otherwise fall back to current date
    const currentDate = (window.dateManager && window.dateManager.getAssessmentDate) 
        ? window.dateManager.getAssessmentDate() 
        : new Date();
    
    if (permitType === 'commercial') {
        // Check closures using date manager or fallback to hardcoded dates
        let isClosed = false;
        let closureInfo = null;
        
        if (typeof isClosureActive === 'function') {
            isClosed = isClosureActive('bluefin-tuna', 'commercial');
            closureInfo = getClosureInfo('bluefin-tuna', 'commercial');
        } else {
            // Fallback to hardcoded dates
            const closureStart = new Date('2026-01-14T23:30:00');
            const closureEnd = new Date('2026-03-31T23:59:59');
            isClosed = currentDate >= closureStart && currentDate <= closureEnd;
        }
        
        if (isClosed && speciesData.possessionAmount > 0) {
            const closurePeriod = closureInfo?.closures?.[0] 
                ? `${window.dateManager ? window.dateManager.formatDate(closureInfo.closures[0].startDate, 'short') : 'January 14'} - ${window.dateManager ? window.dateManager.formatDate(closureInfo.closures[0].endDate, 'short') : 'March 31'}`
                : 'January 14 - March 31, 2026';
            violations.push(`COMMERCIAL FISHERY CLOSED: Cannot retain, possess, or land large medium or giant bluefin tuna (≥73" CFL) during closure period (${closurePeriod}) (50 CFR 635.23)`);
        } else if (!isClosed) {
            // Check June-August limit if applicable
            const currentMonth = currentDate.getMonth() + 1;
            if (currentMonth >= 6 && currentMonth <= 8) {
                const possessionAmount = speciesData.possessionAmount || 0;
                if (possessionAmount > 1) {
                    violations.push(`Bluefin tuna possession exceeds limit: ${possessionAmount} fish vs 1 fish >73" CFL per vessel per day limit (June-August period) (50 CFR 635.23)`);
                }
            }
        }
    } else if (permitType === 'recreational' || permitType === 'charter-headboat') {
        const possessionAmount = speciesData.possessionAmount || 0;
        const limit = regs.possession[permitType]?.limit?.count || 1;
        if (possessionAmount > limit) {
            violations.push(`Bluefin tuna possession exceeds limit: ${possessionAmount} fish vs ${limit} fish per vessel per trip limit (50 CFR 635.23)`);
        }
    }
    
    return violations;
}

// Check Scallop possession
function checkScallopPossession(species, speciesData) {
    const violations = [];
    const regs = species.regulations;
    const permitType = speciesData['permit-type'];
    
    const fishingArea = speciesData.fishingArea || speciesData['fishing-area'];
    if (fishingArea === 'closed-area') {
        violations.push('Scallop fishing prohibited in closed areas (50 CFR 648.60)');
        return violations;
    }

    if (permitType && regs.possession[permitType]) {
        const possEntry = regs.possession[permitType];
        let limits = possEntry.limit;
        if (fishingArea === 'access-area' && possEntry.accessAreaTrip) {
            limits = possEntry.accessAreaTrip;
        }
        const cfr = possEntry.cfr;
        
        // Use standardized amount (converted to pounds shucked equivalent)
        const possessionAmount = speciesData.possessionAmountStandard || speciesData.possessionAmount || 0;
        const possessionType = speciesData.possessionType || speciesData['possession-type'] || 'shucked';
        
        if (limits) {
            let exceeded = false;
            let limitText = '';
            
            if (possessionType === 'shucked' && limits.shucked) {
                if (possessionAmount > limits.shucked) {
                    exceeded = true;
                    limitText = `${possessionAmount} lbs vs ${limits.shucked} lbs limit`;
                }
            } else if (possessionType === 'inshell' && limits.inshell) {
                const actualBushels = speciesData.possessionAmount || 0;
                if (actualBushels > limits.inshell) {
                    exceeded = true;
                    limitText = `${actualBushels} bushels vs ${limits.inshell} bushels limit`;
                }
            } else if (limits.shucked) {
                // Default to shucked limit check
                if (possessionAmount > limits.shucked) {
                    exceeded = true;
                    limitText = `${possessionAmount} lbs (equivalent) vs ${limits.shucked} lbs limit`;
                }
            }
            
            if (exceeded) {
                const areaNote = fishingArea === 'access-area' ? ' (access area trip limit)' : '';
                violations.push(`Scallop possession exceeds limit: ${limitText}${areaNote}${cfr ? ` (${cfr})` : ''}`);
            }
        }
    }
    
    return violations;
}

// Check gear violations
function checkGearViolations(speciesId, species, speciesData) {
    const violations = [];
    
    try {
        if (speciesId === 'summer-flounder') {
            if (speciesData['mesh-compliant'] === 'no') {
                violations.push(`Non-compliant mesh size (50 CFR 648.106)`);
            }
        } else if (speciesId === 'atlantic-sea-scallop') {
            if (speciesData['dredge-compliant'] === 'no') {
                violations.push(`Non-compliant dredge specifications (50 CFR 648.51)`);
            }
            if (speciesData['trawl-compliant'] === 'no') {
                violations.push(`Non-compliant trawl gear specifications`);
            }
        }
    } catch (error) {
        console.error(`Error checking gear violations for ${speciesId}:`, error);
        violations.push(`Error checking gear compliance - manual verification required`);
    }
    
    return violations;
}

// Check scallop additional violations
function checkScallopAdditionalViolations(speciesData) {
    const violations = [];
    
    try {
        if (speciesData['vms-operational'] === 'no') {
            violations.push(`VMS not operational (50 CFR 648.10)`);
        }
        
        if (speciesData['observer-present'] === 'no') {
            violations.push(`Required observer not present (50 CFR 648.11)`);
        }
        
        if (speciesData['tdd-installed'] === 'no') {
            violations.push(`Turtle Deflector Dredge not installed when required (50 CFR 223.206)`);
        }
    } catch (error) {
        console.error('Error checking scallop additional violations:', error);
        violations.push('Error checking additional requirements - manual verification required');
    }
    
    return violations;
}
// Helper functions
function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

function formatPermitStatus(status) {
    const statusMap = {
        'yes': 'Valid permit verified',
        'no': 'NO VALID PERMIT',
        'expired': 'EXPIRED PERMIT'
    };
    return statusMap[status] || 'Not assessed';
}

function formatSizeCompliance(status) {
    const statusMap = {
        'yes': 'Compliant - All meet minimum size',
        'no': 'NON-COMPLIANT - Undersized fish present',
        'not-applicable': 'N/A'
    };
    return statusMap[status] || 'Not assessed';
}

function formatGearType(type) {
    const typeMap = {
        'otter-trawl': 'Otter Trawl',
        'gillnet': 'Gillnet',
        'dredge': 'New Bedford Scallop Dredge',
        'trawl': 'Otter Trawl',
        'other': 'Other'
    };
    return typeMap[type] || type;
}

function formatMeshCompliance(status) {
    const statusMap = {
        'yes': 'Compliant',
        'no': 'NON-COMPLIANT',
        'exemption': 'Small Mesh Exemption (LOA)'
    };
    return statusMap[status] || 'Not assessed';
}

function getPossessionUnit(speciesId, speciesData) {
    if (speciesId === 'summer-flounder') {
        return speciesData['permit-type'] === 'recreational' ? 'fish' : 'lbs';
    } else if (speciesId === 'atlantic-sea-scallop') {
        const possessionType = speciesData['possession-type'] || speciesData.possessionType;
        return possessionType === 'inshell' ? 'bushels' : 'lbs';
    }
    return 'lbs';
}

function printReport() {
    window.print();
}

function goBackToEdit() {
    // Go back to the vessel requirements step (last step before results)
    // This allows users to edit their inputs and navigate back through all steps
    
    // Determine if we have multispecies to calculate correct step number
    let hasMultispecies = false;
    let selectedSpeciesList = [];
    
    // Try to get from new state system first
    if (typeof window.appState !== 'undefined' && window.appState.selectedSpecies) {
        selectedSpeciesList = window.appState.selectedSpecies;
        if (typeof window.navigation !== 'undefined' && window.navigation.isMultispecies) {
            hasMultispecies = selectedSpeciesList.some(id => window.navigation.isMultispecies(id));
        }
    }
    
    // Fallback to old system
    if (selectedSpeciesList.length === 0 && typeof selectedSpecies !== 'undefined') {
        selectedSpeciesList = selectedSpecies;
        if (typeof isMultispecies === 'function') {
            hasMultispecies = selectedSpeciesList.some(id => isMultispecies(id));
        }
    }
    
    // Calculate the step number for vessel requirements
    // For multispecies: step 6 = vessel-requirements (step 2 + 4)
    // For non-multispecies: step 5 = vessel-requirements (step 2 + 3)
    const vesselRequirementsStep = hasMultispecies ? 6 : 5;
    
    // Use navigation if available, otherwise use showStep
    if (typeof window.navigation !== 'undefined' && window.navigation.showStep) {
        window.navigation.showStep(vesselRequirementsStep);
    } else if (typeof showStep === 'function') {
        showStep(vesselRequirementsStep);
    } else {
        console.error('Navigation function not available');
        alert('Unable to navigate back. Please refresh the page.');
    }
}

function startOver() {
    if (window.appState && typeof window.appState.reset === 'function') {
        window.appState.reset();
        syncLegacyStateRefs();
    } else {
        selectedSpecies.length = 0;
        Object.keys(assessmentData.species || {}).forEach(k => delete assessmentData.species[k]);
        assessmentData.vessel = {};
    }
    currentStep = -1;
    
    // Reset species cards
    document.querySelectorAll('.species-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Reset selected species display
    const topDisplay = document.getElementById('selected-species-display-top');
    if (topDisplay) {
        topDisplay.style.display = 'none';
    }
    const continueBtn = document.getElementById('continue-species');
    if (continueBtn) {
        continueBtn.disabled = true;
    }
    
    // Clear assessment sections
    const assessmentContainer = document.getElementById('assessment-sections');
    if (assessmentContainer) {
        assessmentContainer.innerHTML = '';
    }
    
    showStep(-1); // Show homepage
}

// Ensure critical functions are globally accessible at the end of file
if (typeof window !== 'undefined') {
    if (typeof nextGroupedStep === 'function') {
        window.nextGroupedStep = nextGroupedStep;
    }
    if (typeof selectGroupedChoice === 'function') {
        window.selectGroupedChoice = selectGroupedChoice;
    }
    if (typeof validatePermitsStep === 'function') {
        window.validatePermitsStep = validatePermitsStep;
    }
    if (typeof goBackToEdit === 'function') {
        window.goBackToEdit = goBackToEdit;
    }
    
    // Test that functions are accessible
}