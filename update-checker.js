// NOAA Regulation Update Checker
// Checks for updates to fisheries regulations from official NOAA sources

// Version metadata: single source in js/config/regulationMeta.js (loaded before this file)
const APP_VERSION = typeof REGULATION_META !== 'undefined' ? REGULATION_META.appVersion : '1.0.0';
const DATA_LAST_UPDATED = typeof REGULATION_META !== 'undefined' ? REGULATION_META.dataLastUpdated : '2025-01-16';

// Update check sources - All official NOAA sources
const UPDATE_SOURCES = {
    // Primary: NOAA Greater Atlantic Regional Fisheries Office RSS feed
    noaaGARFO: 'https://www.greateratlantic.fisheries.noaa.gov/feed/rss.xml',
    
    // Secondary: NOAA Fisheries bulletins and announcements
    noaaFisheries: 'https://www.fisheries.noaa.gov/rss/bulletins',
    
    // Tertiary: Federal Register for official rule changes
    federalRegister: 'https://www.federalregister.gov/api/v1/articles.json?conditions[agencies][]=national-oceanic-and-atmospheric-administration&conditions[type]=Rule&per_page=20',
    
    // Hosted JSON file for manual updates (optional)
    hosted: 'https://raw.githubusercontent.com/jakekimishere/FIsheries-Inspection-Navigator/main/regulation-updates.json',
    
    // NOAA Northeast Multispecies updates
    multispecies: 'https://www.fisheries.noaa.gov/new-england-mid-atlantic/commercial-fishing/northeast-multispecies-groundfish'
};

// Store update check status
let updateCheckStatus = {
    lastChecked: null,
    isChecking: false,
    updatesAvailable: false,
    lastUpdateDate: null,
    newRegulations: []
};

// Initialize update checker
document.addEventListener('DOMContentLoaded', () => {
    loadUpdateStatus();
    displayUpdateStatus();
    updateFooterDate(); // Update footer date on page load
});

// Load last update check status from localStorage
function loadUpdateStatus() {
    const stored = localStorage.getItem('uscg-fisheries-update-status');
    if (stored) {
        try {
            updateCheckStatus = JSON.parse(stored);
        } catch (e) {
            console.error('Error loading update status:', e);
        }
    }
}

// Save update check status to localStorage
function saveUpdateStatus() {
    try {
        localStorage.setItem('uscg-fisheries-update-status', JSON.stringify(updateCheckStatus));
    } catch (e) {
        console.error('Error saving update status:', e);
    }
}

// Check for updates from multiple NOAA sources
async function checkForUpdates() {
    if (updateCheckStatus.isChecking) {
        return; // Already checking
    }
    
    updateCheckStatus.isChecking = true;
    updateCheckStatus.lastChecked = new Date().toISOString();
    saveUpdateStatus();
    displayUpdateStatus('checking');
    
    try {
        // Try to check hosted JSON file first (if available)
        const updates = await checkHostedUpdates();
        if (updates) {
            processUpdates(updates);
            return;
        }
    } catch (e) {
        console.log('Hosted update check failed:', e);
    }
    
    try {
        // Check NOAA Greater Atlantic Regional Fisheries Office RSS
        const garfoUpdates = await checkNOAAGARFO();
        if (garfoUpdates) {
            processRSSUpdates(garfoUpdates);
            return;
        }
    } catch (e) {
        console.log('NOAA GARFO RSS check failed:', e);
    }
    
    try {
        // Fallback: Check NOAA Fisheries bulletins
        const bulletinUpdates = await checkNOAABulletins();
        if (bulletinUpdates) {
            processRSSUpdates(bulletinUpdates);
            return;
        }
    } catch (e) {
        console.log('NOAA bulletins check failed:', e);
    }
    
    // If all checks fail, show offline message
    updateCheckStatus.isChecking = false;
    displayUpdateStatus('offline');
}

// Check hosted JSON file for updates
async function checkHostedUpdates() {
    try {
        const response = await fetch(UPDATE_SOURCES.hosted + '?t=' + Date.now(), {
            cache: 'no-cache'
        });
        
        if (!response.ok) {
            throw new Error('Hosted file not available');
        }
        
        const data = await response.json();
        return data;
    } catch (e) {
        // If hosted file doesn't exist, try to create a comparison with current date
        // For now, return null to try RSS
        return null;
    }
}

// Check NOAA Greater Atlantic Regional Fisheries Office RSS feed
async function checkNOAAGARFO() {
    try {
        const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(UPDATE_SOURCES.noaaGARFO)}`, {
            cache: 'no-cache'
        });
        
        if (!response.ok) {
            throw new Error('NOAA GARFO RSS feed unavailable');
        }
        
        const data = await response.json();
        return parseNOAARSSFeed(data.contents, 'GARFO');
    } catch (e) {
        console.error('NOAA GARFO RSS check error:', e);
        return null;
    }
}

// Check NOAA Fisheries bulletins
async function checkNOAABulletins() {
    try {
        const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(UPDATE_SOURCES.noaaFisheries)}`, {
            cache: 'no-cache'
        });
        
        if (!response.ok) {
            throw new Error('NOAA bulletins feed unavailable');
        }
        
        const data = await response.json();
        return parseNOAARSSFeed(data.contents, 'Bulletins');
    } catch (e) {
        console.error('NOAA bulletins check error:', e);
        return null;
    }
}

// Parse NOAA RSS feeds for relevant updates
function parseNOAARSSFeed(xmlContent, source) {
    try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
        
        const items = xmlDoc.querySelectorAll('item');
        const recentItems = [];
        
        items.forEach(item => {
            const title = item.querySelector('title')?.textContent || '';
            const pubDate = item.querySelector('pubDate')?.textContent || '';
            const link = item.querySelector('link')?.textContent || '';
            const description = item.querySelector('description')?.textContent || '';
            
            // Check if it's related to Northeast fisheries or our target species
            const isRelevant = (
                title.toLowerCase().includes('northeast') || 
                title.toLowerCase().includes('summer flounder') ||
                title.toLowerCase().includes('scallop') ||
                title.toLowerCase().includes('multispecies') ||
                title.toLowerCase().includes('groundfish') ||
                title.toLowerCase().includes('regulation') ||
                title.toLowerCase().includes('final rule') ||
                title.toLowerCase().includes('framework') ||
                title.toLowerCase().includes('possession') ||
                title.toLowerCase().includes('season') ||
                description.toLowerCase().includes('50 cfr 648')
            );
            
            if (isRelevant) {
                recentItems.push({
                    title,
                    date: pubDate,
                    link,
                    source: `NOAA ${source}`,
                    description: description.substring(0, 200) + '...'
                });
            }
        });
        
        return recentItems.length > 0 ? { items: recentItems } : null;
    } catch (e) {
        console.error('RSS parsing error:', e);
        return null;
    }
}

// Process updates from hosted JSON
function processUpdates(updates) {
    updateCheckStatus.isChecking = false;
    
    // Compare dates
    const lastUpdate = new Date(DATA_LAST_UPDATED);
    const latestUpdate = new Date(updates.lastUpdate || DATA_LAST_UPDATED);
    
    if (latestUpdate > lastUpdate) {
        updateCheckStatus.updatesAvailable = true;
        updateCheckStatus.lastUpdateDate = updates.lastUpdate;
        updateCheckStatus.newRegulations = updates.changes || [];
    } else {
        updateCheckStatus.updatesAvailable = false;
    }
    
    saveUpdateStatus();
    displayUpdateStatus(updateCheckStatus.updatesAvailable ? 'available' : 'current');
}

// Process updates from RSS
function processRSSUpdates(rssData) {
    updateCheckStatus.isChecking = false;
    
    // Check if any items are newer than our data
    const lastUpdate = new Date(DATA_LAST_UPDATED);
    const recentItems = rssData.items.filter(item => {
        try {
            const itemDate = new Date(item.date);
            return itemDate > lastUpdate;
        } catch (e) {
            return false;
        }
    });
    
    if (recentItems.length > 0) {
        updateCheckStatus.updatesAvailable = true;
        updateCheckStatus.newRegulations = recentItems.map(item => ({
            title: item.title,
            date: item.date,
            link: item.link
        }));
    } else {
        updateCheckStatus.updatesAvailable = false;
    }
    
    saveUpdateStatus();
    displayUpdateStatus(updateCheckStatus.updatesAvailable ? 'available' : 'current');
}

// Display update status in UI
function displayUpdateStatus(status) {
    const statusContainer = document.getElementById('update-status-container');
    if (!statusContainer) return;
    
    let html = '';
    
    if (status === 'checking') {
        html = `
            <div class="update-status checking">
                <span class="update-icon">⏳</span>
                <span class="update-text">Checking for updates...</span>
            </div>
        `;
    } else if (status === 'offline') {
        html = `
            <div class="update-status offline">
                <span class="update-icon">📡</span>
                <span class="update-text">Update check unavailable (offline or service unavailable)</span>
                <span class="update-date">Data last updated: ${formatDate(DATA_LAST_UPDATED)}</span>
            </div>
        `;
    } else if (status === 'available') {
        html = `
            <div class="update-status available">
                <span class="update-icon">⚠️</span>
                <span class="update-text">New regulation updates available!</span>
                <span class="update-date">Updates published: ${updateCheckStatus.lastUpdateDate ? formatDate(updateCheckStatus.lastUpdateDate) : 'Recently'}</span>
                ${updateCheckStatus.newRegulations.length > 0 ? `
                    <div class="update-details">
                        <strong>Recent Changes:</strong>
                        <ul>
                            ${updateCheckStatus.newRegulations.slice(0, 3).map(reg => 
                                `<li>${reg.title || reg}</li>`
                            ).join('')}
                        </ul>
                        <p class="update-note">⚠️ Please verify current regulations with official NOAA sources before conducting assessments.</p>
                    </div>
                ` : ''}
            </div>
        `;
    } else if (status === 'current') {
        html = `
            <div class="update-status current">
                <span class="update-icon">✓</span>
                <span class="update-text">Regulations are up to date</span>
                <span class="update-date">Data last updated: ${formatDate(DATA_LAST_UPDATED)}</span>
                ${updateCheckStatus.lastChecked ? `<span class="update-date">Last checked: ${formatDate(updateCheckStatus.lastChecked)}</span>` : ''}
            </div>
        `;
    } else {
        // Default: Show last update date (always visible on front screen)
        html = `
            <div class="update-status">
                <span class="update-icon">📅</span>
                <span class="update-text"><strong>Regulation Data Last Updated:</strong> ${formatDate(DATA_LAST_UPDATED)}</span>
                ${updateCheckStatus.lastChecked ? `<span class="update-date">Last checked: ${formatDate(updateCheckStatus.lastChecked)}</span>` : '<span class="update-date">Click "Check for Updates" to verify current regulations</span>'}
            </div>
        `;
    }
    
    statusContainer.innerHTML = html;
}

// Format date for display
function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    } catch (e) {
        return dateStr;
    }
}

// Get data version info (for display)
function getDataVersion() {
    return {
        version: APP_VERSION,
        lastUpdated: DATA_LAST_UPDATED
    };
}

// Update footer and homepage dates from REGULATION_META
function updateFooterDate() {
    const dateText = typeof formatDate === 'function'
        ? formatDate(DATA_LAST_UPDATED)
        : DATA_LAST_UPDATED;
    ['last-update-date', 'homepage-last-update-date'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = dateText;
    });
}

/** @deprecated Prefer updateFooterDate — kept for callers in assessmentEngine */
function updateHomepageUpdateDate() {
    updateFooterDate();
}

