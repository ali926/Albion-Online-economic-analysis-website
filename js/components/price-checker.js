class PriceChecker {
    constructor() {
        this.searchInput = '';
        this.searchResults = [];
        this.selectedItem = null;
        this.priceData = null;
        this.isLoading = false;
    }

    async render() {
        return `
            <div class="price-checker">
                <div class="card">
                    <div class="card-header">
                        <h2>Multi-Market Price Checker</h2>
                    </div>
                    <div class="search-section">
                        <div class="form-group">
                            <label class="form-label">Search Items</label>
                            <input type="text" 
                                   id="item-search" 
                                   class="form-input" 
                                   placeholder="Type item name..."
                                   autocomplete="off">
                            <div id="search-results" class="search-results"></div>
                        </div>
                    </div>
                </div>

                <div id="price-results" class="price-results" style="display: none;">
                    <!-- Price data will be populated here -->
                </div>

                <div class="watchlist-section card">
                    <div class="card-header">
                        <h3>Watchlist</h3>
                    </div>
                    <div id="watchlist-items" class="watchlist-items">
                        ${this.renderWatchlist()}
                    </div>
                </div>
            </div>
        `;
    }

    async init() {
        this.initSearch();
        this.loadWatchlist();
    }

    initSearch() {
        const searchInput = document.getElementById('item-search');
        const searchResults = document.getElementById('search-results');

        let debounceTimer;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                this.handleSearch(e.target.value);
            }, 300);
        });

        // Close search results when clicking outside
        document.addEventListener('click', (e) => {
            if (!searchResults.contains(e.target) && e.target !== searchInput) {
                searchResults.style.display = 'none';
            }
        });
    }

    async handleSearch(query) {
        if (query.length < 2) {
            document.getElementById('search-results').style.display = 'none';
            return;
        }

        this.isLoading = true;
        const results = await this.searchItems(query);
        this.searchResults = results;
        this.displaySearchResults(results);
        this.isLoading = false;
    }

    async searchItems(query) {
        // Filter from the global items database
        const searchTerm = query.toLowerCase();
        return window.ITEM_DATABASE.filter(item => 
            item.name.toLowerCase().includes(searchTerm) ||
            item.id.toLowerCase().includes(searchTerm)
        ).slice(0, 10); // Limit to 10 results
    }

    displaySearchResults(results) {
        const container = document.getElementById('search-results');
        
        if (results.length === 0) {
            container.innerHTML = '<div class="search-result-item">No items found</div>';
        } else {
            container.innerHTML = results.map(item => `
                <div class="search-result-item" data-item-id="${item.id}">
                    <span class="item-name">${item.name}</span>
                    <span class="item-tier">T${item.tier}</span>
                </div>
            `).join('');
        }
        
        container.style.display = 'block';

        // Add click handlers
        container.querySelectorAll('.search-result-item').forEach(element => {
            element.addEventListener('click', () => {
                const itemId = element.getAttribute('data-item-id');
                const item = results.find(i => i.id === itemId);
                this.selectItem(item);
                container.style.display = 'none';
                document.getElementById('item-search').value = item.name;
            });
        });
    }

    async selectItem(item) {
        this.selectedItem = item;
        this.isLoading = true;

        try {
            this.priceData = await albionAPI.getItemPrices(item.id);
            this.displayPriceData();
            this.addToRecentSearches(item);
        } catch (error) {
            this.displayError('Failed to fetch price data');
        } finally {
            this.isLoading = false;
        }
    }

    displayPriceData() {
        const container = document.getElementById('price-results');
        
        if (!this.priceData || this.priceData.length === 0) {
            container.innerHTML = '<div class="no-data">No price data available</div>';
            container.style.display = 'block';
            return;
        }

        const groupedData = this.groupPriceDataByLocation(this.priceData);
        
        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3>${this.selectedItem.name} - Market Prices</h3>
                    <div class="item-actions">
                        <button class="btn btn-primary" onclick="priceChecker.addToWatchlist()">
                            Add to Watchlist
                        </button>
                        <button class="btn btn-secondary" onclick="priceChecker.calculateCraftProfit()">
                            Calculate Craft Profit
                        </button>
                    </div>
                </div>
                <div class="price-table-container">
                    <table class="price-table">
                        <thead>
                            <tr>
                                <th>Location</th>
                                <th>Sell Price Min</th>
                                <th>Sell Price Max</th>
                                <th>Buy Price Min</th>
                                <th>Buy Price Max</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.entries(groupedData).map(([location, data]) => `
                                <tr>
                                    <td><strong>${location}</strong></td>
                                    <td>${data.sell_price_min?.toLocaleString() || 'N/A'}</td>
                                    <td>${data.sell_price_max?.toLocaleString() || 'N/A'}</td>
                                    <td>${data.buy_price_min?.toLocaleString() || 'N/A'}</td>
                                    <td>${data.buy_price_max?.toLocaleString() || 'N/A'}</td>
                                    <td>
                                        <button class="btn btn-sm" onclick="priceChecker.findFlipOpportunities('${location}')">
                                            Find Flips
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        container.style.display = 'block';
    }

    groupPriceDataByLocation(priceData) {
        const grouped = {};
        
        priceData.forEach(item => {
            if (!grouped[item.city]) {
                grouped[item.city] = {};
            }
            
            // Take the best prices for each quality level
            if (!grouped[item.city].sell_price_min || item.sell_price_min < grouped[item.city].sell_price_min) {
                grouped[item.city].sell_price_min = item.sell_price_min;
            }
            
            if (!grouped[item.city].sell_price_max || item.sell_price_max > grouped[item.city].sell_price_max) {
                grouped[item.city].sell_price_max = item.sell_price_max;
            }
            
            // Similar logic for buy prices...
        });
        
        return grouped;
    }

    addToWatchlist() {
        if (!this.selectedItem) return;

        const watchlist = albionApp.watchlist;
        if (!watchlist.find(item => item.id === this.selectedItem.id)) {
            watchlist.push({
                ...this.selectedItem,
                addedAt: new Date().toISOString()
            });
            albionApp.saveWatchlist();
            this.loadWatchlist();
        }
    }

    renderWatchlist() {
        const watchlist = albionApp.watchlist;
        
        if (watchlist.length === 0) {
            return '<p>No items in watchlist</p>';
        }

        return `
            <div class="watchlist-grid">
                ${watchlist.map(item => `
                    <div class="watchlist-item" data-item-id="${item.id}">
                        <div class="item-info">
                            <span class="item-name">${item.name}</span>
                            <span class="item-tier">T${item.tier}</span>
                        </div>
                        <button class="btn btn-sm btn-danger" onclick="priceChecker.removeFromWatchlist('${item.id}')">
                            Remove
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    }

    loadWatchlist() {
        const container = document.getElementById('watchlist-items');
        if (container) {
            container.innerHTML = this.renderWatchlist();
        }
    }

    removeFromWatchlist(itemId) {
        albionApp.watchlist = albionApp.watchlist.filter(item => item.id !== itemId);
        albionApp.saveWatchlist();
        this.loadWatchlist();
    }

    calculateCraftProfit() {
        albionApp.switchTab('crafting');
        // Trigger crafting calculator to pre-fill with selected item
        setTimeout(() => {
            if (window.craftingCalculator && this.selectedItem) {
                window.craftingCalculator.setSelectedItem(this.selectedItem);
            }
        }, 100);
    }

    findFlipOpportunities(location) {
        albionApp.switchTab('flipping');
        // Trigger flipping calculator with location filter
        setTimeout(() => {
            if (window.marketFlipping && this.selectedItem) {
                window.marketFlipping.setSearchFilters(this.selectedItem, location);
            }
        }, 100);
    }

    displayError(message) {
        const container = document.getElementById('price-results');
        container.innerHTML = `
            <div class="card">
                <div class="error-message">
                    <h3>Error</h3>
                    <p>${message}</p>
                </div>
            </div>
        `;
        container.style.display = 'block';
    }
}

// Global instance
window.priceChecker = new PriceChecker();