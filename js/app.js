class AlbionEconomicTools {
    constructor() {
        this.currentTab = 'price-checker';
        this.settings = this.loadSettings();
        this.watchlist = this.loadWatchlist();
        this.init();
    }

    init() {
        this.initTheme();
        this.initNavigation();
        this.initEventListeners();
        this.loadTabContent(this.currentTab);
    }

    initTheme() {
        const savedTheme = localStorage.getItem('albion-theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeToggle(savedTheme);
    }

    initNavigation() {
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const targetTab = e.target.getAttribute('data-tab');
                this.switchTab(targetTab);
            });
        });
    }

    initEventListeners() {
        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Export data
        document.getElementById('export-data').addEventListener('click', () => {
            this.exportData();
        });
    }

    switchTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Remove active class from all nav buttons
        document.querySelectorAll('.nav-tab').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show target tab
        document.getElementById(tabName).classList.add('active');
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        this.currentTab = tabName;
        this.loadTabContent(tabName);
    }

    async loadTabContent(tabName) {
        const tabElement = document.getElementById(tabName);
        
        if (tabElement.getAttribute('data-loaded') !== 'true') {
            try {
                let component;
                switch(tabName) {
                    case 'price-checker':
                        component = new PriceChecker();
                        break;
                    case 'crafting':
                        component = new CraftingCalculator();
                        break;
                    case 'flipping':
                        component = new MarketFlipping();
                        break;
                    case 'farming':
                        component = new FarmingCalculator();
                        break;
                    case 'scanner':
                        component = new ScreenScanner();
                        break;
                }
                
                if (component) {
                    tabElement.innerHTML = await component.render();
                    await component.init();
                    tabElement.setAttribute('data-loaded', 'true');
                }
            } catch (error) {
                console.error(`Error loading ${tabName}:`, error);
                tabElement.innerHTML = this.getErrorHTML('Failed to load component');
            }
        }
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('albion-theme', newTheme);
        this.updateThemeToggle(newTheme);
    }

    updateThemeToggle(theme) {
        const toggleBtn = document.getElementById('theme-toggle');
        toggleBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
    }

    loadSettings() {
        return JSON.parse(localStorage.getItem('albion-settings')) || {
            premium: true,
            taxRate: 0.03,
            focusDiscount: 0.45,
            resourceReturnRate: 0.15,
            defaultLocations: ['Lymhurst', 'Bridgewatch', 'Martlock', 'Thetford', 'Fort Sterling', 'Caerleon']
        };
    }

    loadWatchlist() {
        return JSON.parse(localStorage.getItem('albion-watchlist')) || [];
    }

    saveSettings() {
        localStorage.setItem('albion-settings', JSON.stringify(this.settings));
    }

    saveWatchlist() {
        localStorage.setItem('albion-watchlist', JSON.stringify(this.watchlist));
    }

    exportData() {
        const data = {
            settings: this.settings,
            watchlist: this.watchlist,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `albion-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    getErrorHTML(message) {
        return `
            <div class="card">
                <div class="error-message">
                    <h3>Error</h3>
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="location.reload()">Reload Page</button>
                </div>
            </div>
        `;
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.albionApp = new AlbionEconomicTools();
});