// --- Core Data: Configuration ---
const gamesData = [
    { title: "Slope", path: "g/slope", category: "RACING" },
    { title: "Retro Bowl", path: "g/retro-bowl", category: "SPORTS" },
    { title: "DeadShot.io", path: "g/deadshotio", category: "ACTION" },
    { title: "Idle Breakout", path: "g/idle-breakout", category: "IDLE" },
    { title: "Temple Run 2", path: "g/temple-run-2", category: "ENDLESS RUNNER" },
    { title: "Pandemic 2", path: "g/pandemic2", category: "STRATEGY" },
    { title: "Riddle School Games", path: "g/riddleschool", category: "ADVENTURE" },
    { title: "Block Blast", path: "g/blockblast", category: "PUZZLE" },
    { title: "Stickman Golf", path: "g/stickman-golf", category: "SPORTS" },
];

const commonSites = [
    { name: "Discord", url: "discord.gg" },
    { name: "Google", url: "google.com" },
    { name: "YouTube", url: "youtube.com" },
    { name: "Khan Academy", url: "khanacademy.org" },
    { name: "Codecademy", url: "codecademy.com" },
];

const availableWidgets = {
    'clock': { name: 'Local Time', icon: 'fas fa-clock', category: 'Utility', initialSize: 'size-1x1', description: 'Displays your current time zone.' },
    'proxy-quick': { name: 'Proxy Quick Search', icon: 'fas fa-search', category: 'Utility', initialSize: 'size-2x1', description: 'A quick search bar for Atlas Proxy.' },
    'ai-status': { name: 'Atlas AI Status', icon: 'fas fa-robot', category: 'Status', initialSize: 'size-1x1', description: 'Shows AI connection status and message limits.' },
    'weather': { name: 'Weather Tracker', icon: 'fas fa-cloud-sun-rain', category: 'Utility', initialSize: 'size-2x2', description: 'Displays current weather based on your location.' },
    'news': { name: 'Curiosity Feed', icon: 'fas fa-newspaper', category: 'Feed', initialSize: 'size-2x2', description: 'Pulls top headlines related to science and tech exploration.' }
};

const widgetSizes = [
    'size-1x1', 'size-2x1', 'size-1x2', 'size-2x2', 'size-3x1', 'size-3x2'
];

let activeWidgets = JSON.parse(localStorage.getItem('activeWidgets')) || ['widget-clock', 'widget-proxy-quick', 'widget-ai-status']; 

// --- External Service URL ---
const REQUEST_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLScGkOaORdzmJNNvtRsS6YOQiYR62nGc7JBFHG2OzbKJVGA3_g/viewform?usp=publish-editor';

// --- 1. NAVIGATION & ROUTING ---

/**
 * Handles navigation, including internal page switching and the external request link.
 * @param {string} hash - The URL hash (e.g., '#dashboard').
 */
const navigateToPage = (hash) => {
    const targetHash = hash || window.location.hash;
    const targetId = targetHash ? targetHash.substring(1) : 'dashboard'; 
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const contentPages = document.querySelectorAll('.content-page');
    
    // 1. External Redirect for REQUEST Service
    if (targetId === 'request-service') {
        window.open(REQUEST_FORM_URL, '_blank');
        
        // After external redirect, force the view back to the Dashboard state
        const dashboardLink = document.querySelector('a[href="#dashboard"]');
        
        sidebarLinks.forEach(link => link.classList.remove('active'));
        if (dashboardLink) dashboardLink.classList.add('active');
        
        contentPages.forEach(page => {
            page.classList.remove('active');
            if (page.id === 'dashboard') page.classList.add('active');
        });
        
        return; 
    }

    // 2. Internal Page Navigation
    sidebarLinks.forEach(link => {
        link.classList.remove('active');
        const linkHash = link.getAttribute('href').substring(1);
        if (linkHash === targetId) {
            link.classList.add('active');
        }
    });

    contentPages.forEach(page => {
        page.classList.remove('active');
        if (page.id === targetId) {
            page.classList.add('active');
        }
    });
};

function updateClock() {
    const timeElement = document.getElementById('timeElement');
    if (timeElement) {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        timeElement.textContent = `${hours}:${minutes}:${seconds}`; 
    }
}


// --- 2. WIDGETS MANAGEMENT & RENDERING ---

let draggedWidget = null;

function handleDragStart(e) {
    // Prevent drag if clicking on the control button
    if (e.target.closest('.widget-controls')) {
        e.preventDefault();
        return;
    }
    draggedWidget = e.target.closest('.widget');
    setTimeout(() => {
        draggedWidget.classList.add('dragging');
    }, 0);
    e.dataTransfer.setData('text/plain', draggedWidget.id);
}

function handleDragEnd() {
    if(draggedWidget) {
        draggedWidget.classList.remove('dragging');
        draggedWidget = null;
    }
    saveWidgetOrder();
}

function handleDragOver(e) {
    e.preventDefault();
    const container = document.getElementById('widgetGrid');
    const targetWidget = e.target.closest('.widget');

    if (targetWidget && draggedWidget !== targetWidget) {
        const centerLine = targetWidget.offsetHeight / 2;
        const offset = e.clientY - targetWidget.getBoundingClientRect().top;

        // Insert before or after based on drag position
        if (offset < centerLine) {
            container.insertBefore(draggedWidget, targetWidget);
        } else {
            container.insertBefore(draggedWidget, targetWidget.nextSibling);
        }
    }
}

function addDragListeners() {
    const widgets = document.querySelectorAll('#widgetGrid .widget');
    const widgetGrid = document.getElementById('widgetGrid');

    widgets.forEach(widget => {
        widget.setAttribute('draggable', 'true'); 
        widget.removeEventListener('dragstart', handleDragStart);
        widget.removeEventListener('dragend', handleDragEnd);
        widget.addEventListener('dragstart', handleDragStart);
        widget.addEventListener('dragend', handleDragEnd);
    });
    
    if (widgetGrid) {
        widgetGrid.removeEventListener('dragover', handleDragOver);
        widgetGrid.addEventListener('dragover', handleDragOver);
    }
}

function saveWidgetOrder() {
    const grid = document.getElementById('widgetGrid');
    if (!grid) return;

    const newOrder = Array.from(grid.children).map(widget => widget.id);
    activeWidgets = newOrder;
    localStorage.setItem('activeWidgets', JSON.stringify(activeWidgets));
}

function createWidgetHTML(id, title, iconClass, sizeClass) {
    let innerContent = '';
    if (id === 'clock') {
        innerContent = `<p class="stat-value" id="timeElement">00:00:00</p>`;
    } else if (id === 'proxy-quick') {
        innerContent = `<input type="text" placeholder="Quick Search with Atlas Proxy..." class="proxy-quick-input">`;
    } else if (id === 'ai-status') {
        innerContent = `<p class="stat-value status-ok">ONLINE</p><p class="stat-detail">1 / 5 messages remaining today</p>`;
    } else if (id === 'weather') {
        innerContent = `<p class="widget-placeholder">Weather data loading...</p><p style="font-size: 3em;">--°C</p>`;
    } else if (id === 'news') {
        innerContent = `<ul class="news-list"><li>Science Headlines</li><li>Tech News Summary</li></ul>`;
    }

    // Use widget-${id} for the full ID, and id for the type identifier
    return `
        <div class="widget ${sizeClass}" draggable="true" id="widget-${id}" data-widget-type="${id}" data-current-size="${sizeClass}">
            <h3><i class="${iconClass}"></i> ${title}</h3>
            ${innerContent}
            <div class="widget-controls">
                <button class="control-btn size-cycle-btn" onclick="cycleWidgetSize('widget-${id}')" title="Change Size"><i class="fas fa-expand-alt"></i></button>
                <button class="control-btn remove-widget-action" onclick="removeWidget('widget-${id}')" title="Remove"><i class="fas fa-times"></i></button>
            </div>
        </div>
    `;
}

function renderDashboardWidgets() {
    const grid = document.getElementById('widgetGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    activeWidgets.forEach(widgetId => {
        const typeId = widgetId.replace('widget-', '');
        const config = availableWidgets[typeId];
        
        const storedSize = localStorage.getItem(`widgetSize-${widgetId}`) || (config ? config.initialSize : 'size-1x1'); 

        if (config) {
             grid.innerHTML += createWidgetHTML(
                typeId, 
                config.name, 
                config.icon, 
                storedSize
            );
        }
    });

    addDragListeners();
    updateClock(); 
    updateWidgetManagementUI(); 
    
    // Re-attach proxy search listener for quick widget
    const quickSearchInput = document.querySelector('.proxy-quick-input');
    if (quickSearchInput) {
        quickSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleProxySearch(e.target.value);
        });
    }
}

function addWidget(typeId) {
    const widgetKey = `widget-${typeId}`;
    if (!activeWidgets.includes(widgetKey)) {
        activeWidgets.push(widgetKey);
        localStorage.setItem('activeWidgets', JSON.stringify(activeWidgets));
        renderDashboardWidgets();
    }
}

function removeWidget(widgetId) {
    activeWidgets = activeWidgets.filter(id => id !== widgetId);
    localStorage.setItem('activeWidgets', JSON.stringify(activeWidgets));
    localStorage.removeItem(`widgetSize-${widgetId}`); 
    renderDashboardWidgets();
}

// Attach to window scope for HTML onclick
window.removeWidget = removeWidget; 

function cycleWidgetSize(widgetId) {
    const widget = document.getElementById(widgetId);
    if (!widget) return;
    
    const currentSize = widget.dataset.currentSize;
    const currentIndex = widgetSizes.indexOf(currentSize);
    
    const nextIndex = (currentIndex + 1) % widgetSizes.length;
    const nextSize = widgetSizes[nextIndex];
    
    widget.classList.remove(currentSize);
    widget.classList.add(nextSize);
    
    widget.dataset.currentSize = nextSize; 
    
    localStorage.setItem(`widgetSize-${widgetId}`, nextSize);
}

// Attach to window scope for HTML onclick
window.cycleWidgetSize = cycleWidgetSize; 


function updateWidgetManagementUI() {
    const listContainer = document.getElementById('widgetConfigList');
    if (!listContainer) return;

    listContainer.innerHTML = ''; 

    Object.keys(availableWidgets).forEach(typeId => {
        const config = availableWidgets[typeId];
        const widgetKey = `widget-${typeId}`;
        const isActive = activeWidgets.includes(widgetKey);
        
        const card = document.createElement('div');
        card.className = `widget-config-card ${isActive ? 'active-widget' : ''}`;
        card.dataset.widgetId = typeId;

        let cardHTML = `
            <h4><i class="${config.icon}"></i> ${config.name}</h4>
            <p>${config.description}</p>
        `;

        const button = document.createElement('button');
        button.classList.add('action-btn');

        if (isActive) {
            button.classList.add('remove-widget-btn');
            button.textContent = 'Remove from Dashboard';
            button.onclick = () => removeWidget(widgetKey);
        } else {
            button.classList.add('add-widget-btn');
            button.textContent = 'Add to Dashboard';
            button.onclick = () => addWidget(typeId);
        }

        card.innerHTML = cardHTML;
        card.appendChild(button);
        listContainer.appendChild(card);
    });
}


// --- 3. SETTINGS & THEME ---

function toggleTheme() {
    const body = document.body;
    const button = document.getElementById('theme-switch-btn');

    body.classList.toggle('light-mode');

    const isLight = body.classList.contains('light-mode');
    button.textContent = isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode';
    localStorage.setItem('atlasTheme', isLight ? 'light' : 'dark');
}

function handleBackgroundUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageUrl = e.target.result;
            const body = document.body;
            
            body.style.backgroundImage = `url('${imageUrl}')`;
            body.classList.add('custom-bg');
            
            localStorage.setItem('atlasBackground', imageUrl);
        };
        reader.readAsDataURL(file);
    }
}

function resetBackground() {
    const body = document.body;
    body.style.backgroundImage = '';
    body.classList.remove('custom-bg');
    localStorage.removeItem('atlasBackground');
    document.getElementById('bg-upload-input').value = null;
}

function handleOpacitySlider() {
    const slider = document.getElementById('widget-opacity-slider');
    const valueSpan = document.getElementById('opacity-value');
    
    if (!slider) return;

    const savedOpacity = localStorage.getItem('widgetOpacity') || 0.3; 
    document.documentElement.style.setProperty('--widget-opacity', savedOpacity);
    slider.value = savedOpacity * 100;
    valueSpan.textContent = `${Math.round(savedOpacity * 100)}%`;

    slider.addEventListener('input', () => {
        const opacityPercent = slider.value;
        const opacityDecimal = opacityPercent / 100;
        
        valueSpan.textContent = `${opacityPercent}%`;
        
        document.documentElement.style.setProperty('--widget-opacity', opacityDecimal);
        localStorage.setItem('widgetOpacity', opacityDecimal);
    });
}

function applySavedSettings() {
    if (localStorage.getItem('atlasTheme') === 'light') {
        document.body.classList.add('light-mode');
        const themeButton = document.getElementById('theme-switch-btn');
        if (themeButton) themeButton.textContent = 'Switch to Dark Mode';
    }

    const savedBackground = localStorage.getItem('atlasBackground');
    if (savedBackground) {
        document.body.style.backgroundImage = `url('${savedBackground}')`;
        document.body.classList.add('custom-bg');
    }
    
    const savedOpacity = localStorage.getItem('widgetOpacity') || 0.3; 
    document.documentElement.style.setProperty('--widget-opacity', savedOpacity);
}


// --- 4. GAMES SERVICE LOGIC ---

function loadGames(games) {
    const gameListContainer = document.getElementById('game-list');
    if (!gameListContainer) return;

    gameListContainer.innerHTML = ''; 

    games.forEach(game => {
        const gameCard = document.createElement('div');
        gameCard.className = 'game-card';
        gameCard.innerHTML = `
            <h3>${game.title}</h3>
            <p class="game-category">${game.category}</p>
            <a href="${game.path}" target="_blank" class="action-btn play-btn">Play Now</a>
        `;
        gameListContainer.appendChild(gameCard);
    });
}

function filterGames() {
    const searchInput = document.getElementById('game-search-input');
    const filterSelect = document.getElementById('game-category-filter');
    
    if (!searchInput || !filterSelect) return;

    const searchTerm = searchInput.value.toLowerCase();
    const categoryFilter = filterSelect.value;

    const filteredGames = gamesData.filter(game => {
        const matchesSearch = game.title.toLowerCase().includes(searchTerm);
        const matchesCategory = categoryFilter === 'ALL' || game.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    loadGames(filteredGames);
}


// --- 5. ATLAS PROXY LOGIC ---

function showSuggestions(inputValue) {
    const suggestionsList = document.getElementById('proxy-suggestions');
    if (!suggestionsList) return;

    suggestionsList.innerHTML = ''; 
    const input = inputValue.toLowerCase();
    
    if (input.length === 0) return;

    const filteredSites = commonSites.filter(site => 
        site.name.toLowerCase().includes(input) || site.url.toLowerCase().includes(input)
    );

    filteredSites.slice(0, 5).forEach(site => { 
        const suggestionItem = document.createElement('div');
        suggestionItem.className = 'suggestion-item';
        suggestionItem.textContent = site.url;
        suggestionItem.onclick = () => {
            document.getElementById('proxy-search-input').value = site.url;
            suggestionsList.innerHTML = ''; 
            handleProxySearch(site.url);
        };
        suggestionsList.appendChild(suggestionItem);
    });
}

// Attach to window scope for HTML onclick
window.closeProxyView = function closeProxyView() {
    const container = document.getElementById('proxy-content-container');
    if (!container) return;
    
    // Restore the original search layout HTML
    container.innerHTML = `
        <div id="proxy-search-layout">
            <div class="proxy-search-area">
                <input type="text" id="proxy-search-input" placeholder="Enter URL or Search Term (e.g., google.com)">
                <button id="proxy-search-btn" class="proxy-search-btn"><i class="fas fa-search"></i></button>
                <div id="proxy-suggestions"></div>
            </div>
            <div class="setting-group" style="max-width: 600px;">
                <h4>Proxy Status</h4>
                <p>Current Status: <span style="color: #4CAF50; font-weight: 600;">ACTIVE (High Speed)</span></p>
                <p>Your connection is encrypted and routed through a dedicated secure protocol.</p>
            </div>
        </div>
    `;
    
    // Re-attach all necessary event listeners for the search bar
    attachProxyEventListeners();
}

function handleProxySearch(quickUrl = null) {
    const searchInput = document.getElementById('proxy-search-input');
    let url = quickUrl;

    if (!url && searchInput) {
        url = searchInput.value.trim();
        searchInput.value = '';
        const suggestionsList = document.getElementById('proxy-suggestions');
        if (suggestionsList) suggestionsList.innerHTML = '';
    }
    
    // Check quick search widget if main search is empty
    if (!url) {
        const quickInput = document.getElementById('widget-proxy-quick')?.querySelector('.proxy-quick-input');
        if (quickInput) {
             url = quickInput.value.trim();
             quickInput.value = '';
        }
    }

    if (!url) {
        alert("Please enter a URL or search term.");
        return;
    }
    
    // Simple URL cleanup/prefixing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }
    
    const container = document.getElementById('proxy-content-container');
    if (!container) return;

    // Inject the iframe view
    container.innerHTML = `
        <div class="proxy-iframe-container">
            <div class="proxy-top-bar">
                <span id="proxy-address-display">Atlas Proxy: ${url}</span>
                <button class="proxy-close-btn" onclick="closeProxyView()">
                    <i class="fas fa-times"></i> Close Proxy
                </button>
            </div>
            <iframe 
                src="${url}" 
                class="proxy-iframe" 
                title="Proxied Content"
                sandbox="allow-forms allow-scripts allow-same-origin allow-popups" 
                allow="fullscreen"
            ></iframe>
        </div>
    `;
    
    // Force switch to the Proxy tab if not already there
    if (window.location.hash !== '#atlas-proxy') {
        window.location.hash = '#atlas-proxy';
    }
}

function attachProxyEventListeners() {
    const proxySearchInput = document.getElementById('proxy-search-input');
    const proxySearchBtn = document.getElementById('proxy-search-btn');

    if (proxySearchInput) {
        proxySearchInput.addEventListener('input', (e) => showSuggestions(e.target.value));
        proxySearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleProxySearch(e.target.value);
        });
    }
    if (proxySearchBtn) {
        proxySearchBtn.addEventListener('click', () => handleProxySearch());
    }
}


// --- 6. ATLAS AI LOGIC (Placeholder) ---

function sendToAtlasAI() {
    const input = document.getElementById('ai-input');
    const responseText = document.getElementById('ai-response-text');
    
    if (!input || !responseText) return;

    const query = input.value.trim();
    if (query === "") return;

    responseText.classList.remove('response-placeholder');
    responseText.innerHTML = `Thinking... <i class="fas fa-spinner fa-spin"></i>`;
    input.value = ""; 
    
    setTimeout(() => {
        responseText.innerHTML = `**[ATLAS RESPONSE TO "${query.substring(0, 30)}..."]**<br><br>As an unrestricted information hub, I have processed your query. In a production environment, I would now provide a detailed, non-judgmental response. The primary focus of Atlas Central is to ensure access to diverse viewpoints and comprehensive information without censorship.`;
    }, 1500);
}


// --- 7. INITIALIZATION ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. Apply saved user settings immediately
    applySavedSettings(); 

    // 2. Initialize Navigation
    navigateToPage(window.location.hash);
    
    // Use click delegation for hash changes
    document.querySelector('.atlas-sidebar nav').addEventListener('click', (e) => {
        const link = e.target.closest('.sidebar-link');
        if (link) {
            e.preventDefault(); 
            const hash = link.getAttribute('href');
            
            // Check for external link hash
            if (hash === '#request-service') {
                navigateToPage(hash); // Executes window.open()
            } else {
                 // For internal links, update the hash
                 window.location.hash = hash;
            }
        }
    });

    // Handle hash changes for navigation when using browser back/forward or typing in URL
    window.addEventListener('hashchange', () => {
        navigateToPage(window.location.hash);
        
        // Ensure proxy search bar is restored if the user navigates back to the proxy tab
        if (window.location.hash === '#atlas-proxy') {
            closeProxyView(); 
        }
    });
    
    // 3. Render Dashboard and Clock
    renderDashboardWidgets(); 
    setInterval(updateClock, 1000); 

    // 4. Attach Event Listeners

    // Settings
    const themeButton = document.getElementById('theme-switch-btn');
    if (themeButton) themeButton.addEventListener('click', toggleTheme);
    
    const bgUploadInput = document.getElementById('bg-upload-input');
    if (bgUploadInput) bgUploadInput.addEventListener('change', handleBackgroundUpload);

    const bgResetButton = document.getElementById('bg-reset-btn');
    if (bgResetButton) bgResetButton.addEventListener('click', resetBackground);

    handleOpacitySlider();

    // Widget Management (Locking)
    const lockBtn = document.getElementById('lock-widgets-btn');
    const grid = document.getElementById('widgetGrid');
    if (lockBtn && grid) {
        lockBtn.addEventListener('click', () => {
            grid.classList.toggle('locked');
            lockBtn.textContent = grid.classList.contains('locked') ? 'Unlock Widgets' : 'Lock Widgets';
        });
    }

    // Atlas Arcade
    loadGames(gamesData); 
    const gameSearchInput = document.getElementById('game-search-input');
    const gameCategoryFilter = document.getElementById('game-category-filter');

    if (gameSearchInput) gameSearchInput.addEventListener('input', filterGames);
    if (gameCategoryFilter) gameCategoryFilter.addEventListener('change', filterGames);

    // Atlas Proxy
    attachProxyEventListeners();
    
    // Atlas AI
    const aiSendBtn = document.getElementById('ai-send-btn');
    if(aiSendBtn) aiSendBtn.addEventListener('click', sendToAtlasAI);
    
    // Allow enter key to trigger AI send
    const aiInput = document.getElementById('ai-input');
    if(aiInput) aiInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { // Shift+Enter for new line
            e.preventDefault();
            sendToAtlasAI();
        }
    });
});