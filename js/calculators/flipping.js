class MarketFlipping {
    constructor() {
        this.opportunities = [];
        this.filters = {
            minProfit: 1000,
            minMargin: 5,
            maxRisk: 3,
            locations: ['Lymhurst', 'Bridgewatch', 'Martlock', 'Thetford', 'Fort Sterling', 'Caerleon']
        };
    }

    async render() {
        return `
            <div class="market-flipping">
                <div class="grid grid-2">
                    <div class="card">
                        <div class="card-header">
                            <h2>Market Flipping Calculator</h2>
                        </div>
                        
                        <div class="filters-section">
                            <h3>Opportunity Filters</h3>
                            <div class="grid grid-2">
                                <div class="form-group">
                                    <label class="form-label">Min Profit (Silver)</label>
                                    <input type="number" id="min-profit" class="form-input" value="${this.filters.minProfit}">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Min Margin (%)</label>
                                    <input type="number" id="min-margin" class="form-input" value="${this.filters.minMargin}">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Max Risk Level</label>
                                    <select id="max-risk" class="form-select">
                                        <option value="1">Low</option>
                                        <option value="2">Medium</option>
                                        <option value="3" selected>High</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Trade Volume</label>
                                    <select id="min-volume" class="form-select">
                                        <option value="low">Low</option>
                                        <option value="medium" selected>Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Locations to Compare</label>
                                <div class="location-checkboxes">
                                    ${this.filters.locations.map(location => `
                                        <label class="checkbox-label">
                                            <input type="checkbox" value="${location}" checked> ${location}
                                        </label>
                                    `).join('')}
                                </div>
                            </div>
                            
                            <button class="btn btn-primary" onclick="marketFlipping.findOpportunities()" style="width: 100%;">
                                Find Flip Opportunities
                            </button>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h3>Flip Opportunities</h3>
                            <div class="result-stats" id="flipping-stats"></div>
                        </div>
                        <div id="flipping-results" class="flipping-results">
                            <div class="placeholder-message">
                                Configure filters and click "Find Flip Opportunities" to discover profitable trades
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async init() {
        this.initEventListeners();
        window.marketFlipping = this;
    }

    initEventListeners() {
        // Debounced filter updates
        ['min-profit', 'min-margin', 'max-risk', 'min-volume'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', (e) => {
                    this.filters[id.replace('-', '_')] = e.target.type === 'number' ? 
                        parseInt(e.target.value) : e.target.value;
                });
            }
        });
    }

    async findOpportunities() {
        const resultsContainer = document.getElementById('flipping-results');
        const statsContainer = document.getElementById('flipping-stats');
        
        resultsContainer.innerHTML = '<div class="loading">Scanning market for opportunities...</div>';
        
        try {
            // Get popular items for flipping analysis
            const popularItems = this.getPopularFlipItems();
            this.opportunities = [];
            
            for (const item of popularItems.slice(0, 50)) { // Limit for performance
                const opportunity = await this.analyzeItemFlipOpportunity(item);
                if (opportunity) {
                    this.opportunities.push(opportunity);
                }
            }
            
            this.displayOpportunities();
            
        } catch (error) {
            resultsContainer.innerHTML = `<div class="error-message">Error finding opportunities: ${error.message}</div>`;
        }
    }

    getPopularFlipItems() {
        // Common items that are good for flipping
        return window.itemDatabase.items.filter(item => 
            item.tier >= 4 && 
            item.tier <= 8 && 
            ['weapon', 'armor', 'resource', 'consumable'].includes(item.category)
        ).slice(0, 200);
    }

    async analyzeItemFlipOpportunity(item) {
        try {
            const prices = await albionAPI.getItemPrices(item.id, this.filters.locations);
            
            if (!prices || prices.length < 2) return null;
            
            const priceAnalysis = this.analyzePriceDifferences(prices, item);
            
            if (priceAnalysis.bestOpportunity && 
                priceAnalysis.bestOpportunity.profit >= this.filters.minProfit &&
                priceAnalysis.bestOpportunity.margin >= this.filters.minMargin) {
                
                return {
                    item: item,
                    ...priceAnalysis.bestOpportunity,
                    risk: this.calculateRiskLevel(priceAnalysis),
                    liquidity: this.calculateLiquidity(prices)
                };
            }
            
            return null;
        } catch (error) {
            console.error(`Error analyzing ${item.name}:`, error);
            return null;
        }
    }

    analyzePriceDifferences(prices, item) {
        const locationData = {};
        let bestOpportunity = null;
        
        // Group prices by location
        prices.forEach(price => {
            if (!locationData[price.city]) {
                locationData[price.city] = [];
            }
            locationData[price.city].push(price);
        });
        
        // Find best buy and sell locations
        const locations = Object.keys(locationData);
        
        for (let i = 0; i < locations.length; i++) {
            for (let j = 0; j < locations.length; j++) {
                if (i === j) continue;
                
                const buyLocation = locations[i];
                const sellLocation = locations[j];
                
                const bestBuyPrice = Math.min(...locationData[buyLocation].map(p => p.sell_price_min || Infinity));
                const bestSellPrice = Math.max(...locationData[sellLocation].map(p => p.buy_price_max || 0));
                
                if (bestBuyPrice === Infinity || bestSellPrice === 0) continue;
                
                const profit = bestSellPrice - bestBuyPrice;
                const margin = (profit / bestBuyPrice) * 100;
                const tax = bestSellPrice * 0.03; // 3% tax
                const netProfit = profit - tax;
                const netMargin = (netProfit / bestBuyPrice) * 100;
                
                if (netProfit > 0 && (!bestOpportunity || netProfit > bestOpportunity.netProfit)) {
                    bestOpportunity = {
                        buyLocation,
                        sellLocation,
                        buyPrice: bestBuyPrice,
                        sellPrice: bestSellPrice,
                        profit,
                        margin,
                        tax,
                        netProfit,
                        netMargin
                    };
                }
            }
        }
        
        return {
            locationData,
            bestOpportunity
        };
    }

    calculateRiskLevel(priceAnalysis) {
        // Simple risk calculation based on price stability and spread
        const spreads = Object.values(priceAnalysis.locationData).flat().map(p => 
            (p.sell_price_max - p.sell_price_min) / p.sell_price_min
        );
        
        const avgSpread = spreads.reduce((a, b) => a + b, 0) / spreads.length;
        
        if (avgSpread < 0.1) return 1; // Low risk
        if (avgSpread < 0.25) return 2; // Medium risk
        return 3; // High risk
    }

    calculateLiquidity(prices) {
        // Estimate liquidity based on available data
        const totalListings = prices.reduce((sum, p) => sum + (p.item_count || 0), 0);
        
        if (totalListings > 1000) return 'high';
        if (totalListings > 100) return 'medium';
        return 'low';
    }

    displayOpportunities() {
        const container = document.getElementById('flipping-results');
        const statsContainer = document.getElementById('flipping-stats');
        
        if (this.opportunities.length === 0) {
            container.innerHTML = '<div class="no-data">No profitable opportunities found with current filters</div>';
            statsContainer.innerHTML = '';
            return;
        }
        
        // Sort by net profit
        this.opportunities.sort((a, b) => b.netProfit - a.netProfit);
        
        // Filter by risk
        const filteredOpportunities = this.opportunities.filter(opp => 
            opp.risk <= this.filters.max_risk
        );
        
        statsContainer.innerHTML = `Showing ${filteredOpportunities.length} of ${this.opportunities.length} opportunities`;
        
        container.innerHTML = `
            <div class="opportunities-grid">
                ${filteredOpportunities.map(opp => this.renderOpportunityCard(opp)).join('')}
            </div>
        `;
    }

    renderOpportunityCard(opportunity) {
        const riskColors = { 1: 'success', 2: 'warning', 3: 'danger' };
        const liquidityColors = { low: 'danger', medium: 'warning', high: 'success' };
        
        return `
            <div class="opportunity-card">
                <div class="opportunity-header">
                    <h4>${opportunity.item.name}</h4>
                    <span class="tier-badge">T${opportunity.item.tier}</span>
                </div>
                
                <div class="opportunity-details">
                    <div class="trade-route">
                        <div class="location">
                            <strong>Buy:</strong> ${opportunity.buyLocation}
                            <div class="price">${opportunity.buyPrice.toLocaleString()} silver</div>
                        </div>
                        <div class="arrow">→</div>
                        <div class="location">
                            <strong>Sell:</strong> ${opportunity.sellLocation}
                            <div class="price">${opportunity.sellPrice.toLocaleString()} silver</div>
                        </div>
                    </div>
                    
                    <div class="profit-metrics">
                        <div class="metric">
                            <span>Net Profit:</span>
                            <span class="profit-positive">${Math.round(opportunity.netProfit).toLocaleString()} silver</span>
                        </div>
                        <div class="metric">
                            <span>Margin:</span>
                            <span class="profit-positive">${opportunity.netMargin.toFixed(1)}%</span>
                        </div>
                        <div class="metric">
                            <span>Tax:</span>
                            <span>${Math.round(opportunity.tax).toLocaleString()} silver</span>
                        </div>
                    </div>
                    
                    <div class="opportunity-meta">
                        <span class="badge badge-${riskColors[opportunity.risk]}">Risk: ${opportunity.risk}/3</span>
                        <span class="badge badge-${liquidityColors[opportunity.liquidity]}">Liquidity: ${opportunity.liquidity}</span>
                    </div>
                </div>
                
                <div class="opportunity-actions">
                    <button class="btn btn-sm btn-primary" onclick="marketFlipping.viewItemDetails('${opportunity.item.id}')">
                        View Details
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="marketFlipping.addToWatchlist('${opportunity.item.id}')">
                        Watch
                    </button>
                </div>
            </div>
        `;
    }

    viewItemDetails(itemId) {
        albionApp.switchTab('price-checker');
        setTimeout(() => {
            const item = window.itemDatabase.getItemById(itemId);
            if (item && window.priceChecker) {
                window.priceChecker.selectItem(item);
            }
        }, 100);
    }

    addToWatchlist(itemId) {
        const item = window.itemDatabase.getItemById(itemId);
        if (item && window.priceChecker) {
            window.priceChecker.selectedItem = item;
            window.priceChecker.addToWatchlist();
        }
    }
}