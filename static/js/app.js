// State Management
let state = {
    updates: [],
    selectedUpdateId: null,
    activeCategory: 'all',
    searchQuery: '',
    lastSynced: null
};

// DOM Elements
const btnRefresh = document.getElementById('btn-refresh');
const refreshIcon = document.getElementById('refresh-icon');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search');
const categoryFilters = document.querySelectorAll('.tag-filter');
const totalUpdatesCount = document.getElementById('total-updates-count');
const lastUpdatedTime = document.getElementById('last-updated-time');
const feedContainer = document.getElementById('feed-container');
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const errorMessage = document.getElementById('error-message');
const emptyState = document.getElementById('empty-state');
const btnRetry = document.getElementById('btn-retry');

// Composer Elements
const shareCard = document.getElementById('share-card');
const composerEmptyView = document.getElementById('composer-empty-view');
const composerActiveView = document.getElementById('composer-active-view');
const composerBadge = document.getElementById('composer-badge');
const composerDate = document.getElementById('composer-date');
const tweetTextarea = document.getElementById('tweet-textarea');
const charCount = document.getElementById('char-count');
const btnCopy = document.getElementById('btn-copy');
const btnTweet = document.getElementById('btn-tweet');
const copyToast = document.getElementById('copy-toast');
const globalToast = document.getElementById('global-toast');

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    fetchFeed();
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    // Refresh Feed
    btnRefresh.addEventListener('click', fetchFeed);
    btnRetry.addEventListener('click', fetchFeed);

    // Search Input
    searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.toLowerCase().trim();
        clearSearchBtn.style.display = state.searchQuery ? 'block' : 'none';
        renderFeed();
    });

    // Clear Search
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        state.searchQuery = '';
        clearSearchBtn.style.display = 'none';
        renderFeed();
        searchInput.focus();
    });

    // Category Filters
    categoryFilters.forEach(button => {
        button.addEventListener('click', () => {
            categoryFilters.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            state.activeCategory = button.getAttribute('data-category');
            renderFeed();
        });
    });

    // Tweet Textarea Typing
    tweetTextarea.addEventListener('input', updateCharCount);

    // Copy to Clipboard
    btnCopy.addEventListener('click', copyTweetToClipboard);

    // Tweet on Twitter
    btnTweet.addEventListener('click', publishTweet);
}

// Fetch Feed Data from API
async function fetchFeed() {
    setLoading(true);
    try {
        const response = await fetch('/api/feed');
        const data = await response.json();
        
        if (data.success) {
            state.updates = data.entries;
            state.lastSynced = new Date();
            updateStats();
            renderFeed();
            showGlobalToast("Feed updated successfully!");
        } else {
            showError(data.error || "Failed parsing the feed.");
        }
    } catch (err) {
        showError("Network error. Please make sure the Flask server is running.");
        console.error(err);
    } finally {
        setLoading(false);
    }
}

// UI State Toggles
function setLoading(isLoading) {
    if (isLoading) {
        loadingState.classList.remove('hidden');
        feedContainer.classList.add('hidden');
        errorState.classList.add('hidden');
        emptyState.classList.add('hidden');
        refreshIcon.classList.add('spinning');
        btnRefresh.disabled = true;
    } else {
        loadingState.classList.add('hidden');
        feedContainer.classList.remove('hidden');
        refreshIcon.classList.remove('spinning');
        btnRefresh.disabled = false;
    }
}

function showError(msg) {
    errorMessage.textContent = msg;
    errorState.classList.remove('hidden');
    feedContainer.classList.add('hidden');
    loadingState.classList.add('hidden');
    emptyState.classList.add('hidden');
}

function updateStats() {
    totalUpdatesCount.textContent = state.updates.length;
    if (state.lastSynced) {
        const timeStr = state.lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        lastUpdatedTime.textContent = timeStr;
    }
}

// Filter and Render Feed Updates
function renderFeed() {
    // 1. Filter updates
    let filtered = state.updates.filter(update => {
        const matchesCategory = state.activeCategory === 'all' || update.type.toLowerCase() === state.activeCategory.toLowerCase();
        const matchesSearch = !state.searchQuery || 
            update.text.toLowerCase().includes(state.searchQuery) || 
            update.type.toLowerCase().includes(state.searchQuery) ||
            update.date.toLowerCase().includes(state.searchQuery);
        return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
        emptyState.classList.remove('hidden');
        feedContainer.innerHTML = '';
        return;
    }
    emptyState.classList.add('hidden');

    // 2. Group by Date
    const grouped = {};
    filtered.forEach(update => {
        if (!grouped[update.date]) {
            grouped[update.date] = [];
        }
        grouped[update.date].push(update);
    });

    // 3. Build HTML
    let html = '';
    Object.keys(grouped).forEach(date => {
        html += `
            <div class="date-group">
                <div class="date-header">
                    <span class="date-badge">
                        <i class="fa-solid fa-calendar-days"></i> ${date}
                    </span>
                </div>
        `;
        
        grouped[date].forEach(update => {
            const isSelected = state.selectedUpdateId === update.id;
            const badgeClass = update.type.toLowerCase();
            
            html += `
                <article id="${update.id}" class="update-card card-glass ${isSelected ? 'selected' : ''}" role="button" tabindex="0">
                    <div class="update-card-header">
                        <span class="badge ${badgeClass}">${update.type}</span>
                        <div class="card-select-checkbox">
                            <i class="fa-solid fa-check"></i>
                        </div>
                    </div>
                    <div class="update-card-body">
                        ${update.html}
                    </div>
                    <div class="card-footer-actions">
                        <a href="${update.link}" target="_blank" rel="noopener noreferrer" class="card-origin-link" onclick="event.stopPropagation();">
                            <i class="fa-solid fa-arrow-up-right-from-square"></i> Original release notes
                        </a>
                        <button class="quick-tweet-btn" aria-label="Prepare Tweet for this update">
                            <i class="fa-brands fa-x-twitter"></i> Tweet this
                        </button>
                    </div>
                </article>
            `;
        });
        
        html += `</div>`; // Close date-group
    });

    feedContainer.innerHTML = html;

    // 4. Attach click listeners to cards
    document.querySelectorAll('.update-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const updateId = card.id;
            selectUpdate(updateId);
        });

        const tweetBtn = card.querySelector('.quick-tweet-btn');
        if (tweetBtn) {
            tweetBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                selectUpdate(card.id);
                publishTweet();
            });
        }


        // Keydown support for accessibility
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selectUpdate(card.id);
            }
        });
    });
}

// Select Update to Populate Tweet Composer
function selectUpdate(id) {
    state.selectedUpdateId = id;
    
    // Highlight Card in UI
    document.querySelectorAll('.update-card').forEach(card => {
        if (card.id === id) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
    });

    const update = state.updates.find(u => u.id === id);
    if (!update) return;

    // Populate Composer
    shareCard.classList.remove('empty-composer');
    composerEmptyView.classList.add('hidden');
    composerActiveView.classList.remove('hidden');

    composerBadge.className = `badge ${update.type.toLowerCase()}`;
    composerBadge.textContent = update.type;
    composerDate.textContent = update.date;

    // Generate Default Tweet Text
    tweetTextarea.value = generateDefaultTweet(update);
    updateCharCount();
    
    // Pulse animation on the composer to show it updated
    composerActiveView.style.animation = 'none';
    composerActiveView.offsetHeight; // trigger reflow
    composerActiveView.style.animation = 'fadeIn 0.4s ease-out';
}

// Generate Tweet Template with Smart Truncation
function generateDefaultTweet(update) {
    const hashtag = '#BigQuery';
    const header = `${hashtag} Release (${update.date} - ${update.type}):\n`;
    const link = `\nSource: ${update.link}`;
    
    // Twitter character limit is 280
    // We must count URL length as 23 characters (standard Twitter shortener t.co length)
    const twitterLinkLength = 23;
    const bodyCharLimit = 280 - header.length - (link.length - update.link.length + twitterLinkLength) - 4; // 4 safety chars for spacing
    
    let description = update.text;
    if (description.length > bodyCharLimit) {
        description = description.substring(0, bodyCharLimit - 3) + "...";
    }
    
    return `${header}${description}${link}`;
}

// Update Character Count
function updateCharCount() {
    const text = tweetTextarea.value;
    
    // Twitter handles URLs uniquely (always counts as 23 characters)
    // Find URLs in text and adjust length count
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = text.match(urlRegex) || [];
    
    let length = text.length;
    urls.forEach(url => {
        length = length - url.length + 23;
    });

    charCount.textContent = length;

    // Style Char Counter
    if (length > 280) {
        charCount.parentElement.className = 'char-count-container error';
        btnTweet.disabled = true;
    } else if (length > 250) {
        charCount.parentElement.className = 'char-count-container warning';
        btnTweet.disabled = false;
    } else {
        charCount.parentElement.className = 'char-count-container';
        btnTweet.disabled = false;
    }
}

// Copy Tweet Text to Clipboard
function copyTweetToClipboard() {
    const text = tweetTextarea.value;
    navigator.clipboard.writeText(text).then(() => {
        // Show Toast
        copyToast.classList.remove('hidden');
        copyToast.style.opacity = '1';
        setTimeout(() => {
            copyToast.style.opacity = '0';
            setTimeout(() => copyToast.classList.add('hidden'), 300);
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
}

// Publish Tweet via Twitter Intent
function publishTweet() {
    const text = tweetTextarea.value;
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(tweetUrl, '_blank', 'noopener,noreferrer,width=550,height=420');
}

// Toast Notifications
function showGlobalToast(msg) {
    globalToast.textContent = msg;
    globalToast.classList.remove('hidden');
    globalToast.style.opacity = '1';
    
    setTimeout(() => {
        globalToast.style.opacity = '0';
        setTimeout(() => globalToast.classList.add('hidden'), 300);
    }, 3000);
}
