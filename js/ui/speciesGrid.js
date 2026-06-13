// Species Grid UI Module
// Handles species selection, search, and display

class SpeciesGrid {
    constructor(state) {
        this.state = state || window.appState;
        this.grid = null;
        this.init();
    }

    init() {
        this.grid = document.getElementById('species-grid');
        if (!this.grid) {
            console.error('Species grid element not found');
            return;
        }

        // Subscribe to state changes
        this.state.subscribe((changeType, data) => {
            if (changeType === 'speciesAdded' || changeType === 'speciesRemoved' || changeType === 'speciesCleared') {
                this.updateSelectedDisplay();
            }
        });
    }

    // Populate the species grid with all available species
    populate() {
        if (!this.grid) return;

        this.grid.innerHTML = '';

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
        const favorites = typeof getFavorites === 'function' ? getFavorites() : [];
        
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
        
        // Display favorites section if there are favorites
        if (favoriteSpecies.length > 0 && typeof populateFavoritesSection === 'function') {
            populateFavoritesSection(favoriteSpecies);
        } else if (typeof populateFavoritesSection === 'function') {
            populateFavoritesSection([]);
        }

        // Create and append cards in alphabetical order (non-favorites)
        otherSpecies.forEach(item => {
            try {
                let card;
                if (item.species.available === false) {
                    // Placeholder species
                    const image = (typeof generateFishImage === 'function')
                        ? generateFishImage(item.id, item.species.name, item.species.color)
                        : generatePlaceholderImage(item.species.name, item.species.color);
                    card = this.createCard(item.id, {
                        name: item.species.name,
                        image: image,
                        color: item.species.color,
                        available: false
                    });
                } else {
                    // Full species data
                    card = this.createCard(item.id, item.species);
                }
                card.dataset.speciesName = item.name.toLowerCase();
                card.dataset.speciesCommonName = (item.commonName || '').toLowerCase();
                this.grid.appendChild(card);
            } catch (error) {
                console.error('Error creating species card for', item.id, ':', error);
            }
        });
    }

    // Create a species card element
    createCard(speciesId, species) {
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
                this.toggleSpecies(speciesId);
            };
            card.style.cursor = 'pointer';
        } else {
            card.style.cursor = 'not-allowed';
        }

        // Set the card content
        try {
            // Use lazy loading for images (only load when visible) - improves initial page load
            const loadingAttr = species.imagePath ? 'loading="lazy"' : '';
            const decodingAttr = species.imagePath ? 'decoding="async"' : '';

            if (!isAvailable) {
                card.innerHTML = `
                    <img src="${fishImage}" alt="${species.name}" class="species-image" ${loadingAttr} ${decodingAttr} onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iI2Y1ZjVmNSIgcng9IjgiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0cHgiIGZpbGw9IiM3MzYzNDciIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZQ==';">
                    <div class="species-name">${species.name}</div>
                    <div class="species-badge unavailable-badge">Coming Soon</div>
                `;
            } else {
                // Check if this species is favorited
                const isFavorited = typeof getFavorites === 'function' ? getFavorites().includes(speciesId) : false;
                const favoriteIcon = isFavorited ? '⭐' : '☆';
                
                card.innerHTML = `
                    <div class="favorite-button" onclick="event.stopPropagation(); toggleFavorite('${speciesId}')" title="${isFavorited ? 'Remove from favorites' : 'Add to favorites'}">
                        ${favoriteIcon}
                    </div>
                    <img src="${fishImage}" alt="${species.name}" class="species-image" ${loadingAttr} ${decodingAttr} onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iI2Y1ZjVmNSIgcng9IjgiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0cHgiIGZpbGw9IiM3MzYzNDciIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZQ==';">
                    <div class="species-name">${species.name}</div>
                `;
            }
        } catch (error) {
            console.error('Error setting card HTML for', speciesId, ':', error);
        }

        return card;
    }

    // Toggle species selection
    toggleSpecies(speciesId) {
        this.state.toggleSpecies(speciesId);
        this.updateCardSelection(speciesId);
    }

    // Update card visual selection state
    updateCardSelection(speciesId) {
        const card = document.querySelector(`[data-species-id="${speciesId}"]`);
        if (card) {
            if (this.state.selectedSpecies.includes(speciesId)) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        }
    }

    // Filter species grid based on search input
    filter(searchTerm) {
        if (!this.grid) return;

        const searchLower = searchTerm.toLowerCase().trim();
        const favoritesGrid = document.getElementById('favorites-grid');
        const allCards = [
            ...(this.grid.querySelectorAll('.species-card, .multispecies-card')),
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
                this.grid.parentNode.insertBefore(noResultsMsg, this.grid);
            }
            noResultsMsg.style.display = 'block';
        } else if (noResultsMsg) {
            noResultsMsg.style.display = 'none';
        }
    }

    // Update selected species display
    updateSelectedDisplay() {
        const display = document.getElementById('selected-species-display-top');
        const list = document.getElementById('selected-list-top');
        const continueBtn = document.getElementById('continue-species');

        if (this.state.selectedSpecies.length === 0) {
            if (display) display.style.display = 'none';
            if (continueBtn) continueBtn.disabled = true;
            return;
        }

        if (display) {
            display.style.display = 'block';
        }

        if (list) {
            list.innerHTML = '';
            this.state.selectedSpecies.forEach(speciesId => {
                const species = SPECIES_DATA[speciesId];
                if (species) {
                    const tag = document.createElement('span');
                    tag.className = 'selected-species-tag';
                    tag.textContent = species.name;
                    list.appendChild(tag);
                }
            });
        }

        const policyPanel = document.getElementById('species-policy-panel');
        if (policyPanel) {
            policyPanel.remove();
        }

        if (continueBtn) {
            continueBtn.disabled = this.state.selectedSpecies.length === 0;
        }
    }
}

// Export for use in main app
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpeciesGrid;
}
