class CraftingCalculator {
    constructor() {
        this.selectedItem = null;
        this.recipe = null;
        this.calculationResult = null;
        this.settings = {
            premium: true,
            useFocus: false,
            taxRate: 0.03,
            resourceReturnRate: 0.15,
            journalReturn: 0
        };
    }

    async render() {
        return `
            <div class="crafting-calculator">
                <div class="grid grid-2">
                    <div class="card">
                        <div class="card-header">
                            <h2>Crafting Profit Calculator</h2>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Select Item to Craft</label>
                            <input type="text" 
                                   id="crafting-item-search" 
                                   class="form-input" 
                                   placeholder="Search craftable items..."
                                   autocomplete="off">
                            <div id="crafting-search-results" class="search-results"></div>
                        </div>

                        <div id="recipe-display" style="display: none;">
                            <!-- Recipe will be displayed here -->
                        </div>

                        <div class="settings-section">
                            <h3>Crafting Settings</h3>
                            <div class="grid grid-2">
                                <div class="form-group">
                                    <label class="form-label">
                                        <input type="checkbox" 
                                               id="premium-checkbox" 
                                               ${this.settings.premium ? 'checked' : ''}>
                                        Premium Status
                                    </label>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">
                                        <input type="checkbox" 
                                               id="focus-checkbox" 
                                               ${this.settings.useFocus ? 'checked' : ''}>
                                        Use Focus
                                    </label>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Tax Rate (%)</label>
                                    <input type="number" 
                                           id="tax-rate" 
                                           class="form-input" 
                                           value="${this.settings.taxRate * 100}" 
                                           min="0" 
                                           max="100" 
                                           step="0.1">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Resource Return Rate (%)</label>
                                    <input type="number" 
                                           id="resource-return" 
                                           class="form-input" 
                                           value="${this.settings.resourceReturnRate * 100}" 
                                           min="0" 
                                           max="100" 
                                           step="0.1">
                                </div>
                            </div>
                        </div>

                        <button class="btn btn-primary" onclick="craftingCalculator.calculateProfit()" style="width: 100%;">
                            Calculate Profit
                        </button>
                    </div>

                    <div class="card">
                        <div id="calculation-results">
                            <div class="card-header">
                                <h3>Profit Analysis</h3>
                            </div>
                            <div class="placeholder-message">
                                Select an item and click calculate to see profit analysis
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async init() {
        this.initSearch();
        this.initEventListeners();
        window.craftingCalculator = this;
    }

    initSearch() {
        const searchInput = document.getElementById('crafting-item-search');
        const searchResults = document.getElementById('crafting-search-results');

        let debounceTimer;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                this.handleCraftingSearch(e.target.value);
            }, 300);
        });
    }

    async handleCraftingSearch(query) {
        if (query.length < 2) {
            document.getElementById('crafting-search-results').style.display = 'none';
            return;
        }

        // Search only craftable items (those with recipes)
        const searchTerm = query.toLowerCase();
        const craftableItems = window.ITEM_DATABASE.filter(item => 
            window.RECIPE_DATABASE[item.id] && (
                item.name.toLowerCase().includes(searchTerm) ||
                item.id.toLowerCase().includes(searchTerm)
            )
        ).slice(0, 10);

        this.displayCraftingSearchResults(craftableItems);
    }

    displayCraftingSearchResults(results) {
        const container = document.getElementById('crafting-search-results');
        
        if (results.length === 0) {
            container.innerHTML = '<div class="search-result-item">No craftable items found</div>';
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
                this.setSelectedItem(item);
                container.style.display = 'none';
                document.getElementById('crafting-item-search').value = item.name;
            });
        });
    }

    setSelectedItem(item) {
        this.selectedItem = item;
        this.recipe = window.RECIPE_DATABASE[item.id];
        this.displayRecipe();
    }

    displayRecipe() {
        const container = document.getElementById('recipe-display');
        
        if (!this.recipe) {
            container.style.display = 'none';
            return;
        }

        container.innerHTML = `
            <h3>Recipe: ${this.selectedItem.name}</h3>
            <div class="recipe-ingredients">
                ${this.recipe.ingredients.map(ingredient => `
                    <div class="ingredient-item">
                        <span class="ingredient-name">${ingredient.name}</span>
                        <span class="ingredient-quantity">x${ingredient.quantity}</span>
                    </div>
                `).join('')}
            </div>
        `;
        container.style.display = 'block';
    }

    initEventListeners() {
        document.getElementById('premium-checkbox')?.addEventListener('change', (e) => {
            this.settings.premium = e.target.checked;
        });

        document.getElementById('focus-checkbox')?.addEventListener('change', (e) => {
            this.settings.useFocus = e.target.checked;
        });

        document.getElementById('tax-rate')?.addEventListener('change', (e) => {
            this.settings.taxRate = parseFloat(e.target.value) / 100;
        });

        document.getElementById('resource-return')?.addEventListener('change', (e) => {
            this.settings.resourceReturnRate = parseFloat(e.target.value) / 100;
        });
    }

    async calculateProfit() {
        if (!this.selectedItem || !this.recipe) {
            this.displayError('Please select an item to craft');
            return;
        }

        try {
            // Fetch prices for the crafted item and all ingredients
            const itemIds = [this.selectedItem.id, ...this.recipe.ingredients.map(i => i.id)];
            const prices = await albionAPI.getMultipleItemPrices(itemIds);

            this.calculationResult = this.performProfitCalculation(prices);
            this.displayCalculationResults();
        } catch (error) {
            this.displayError('Failed to calculate profit: ' + error.message);
        }
    }

    performProfitCalculation(prices) {
        const itemPrice = this.getBestSellPrice(prices, this.selectedItem.id);
        const ingredientCosts = this.calculateIngredientCosts(prices);
        
        const totalMaterialCost = ingredientCosts.totalCost;
        const adjustedMaterialCost = this.applyResourceReturn(totalMaterialCost);
        const taxAmount = itemPrice * this.settings.taxRate;
        const focusDiscount = this.settings.useFocus ? adjustedMaterialCost * 0.45 : 0;
        
        const finalCost = adjustedMaterialCost - focusDiscount;
        const profit = itemPrice - finalCost - taxAmount;
        const profitMargin = (profit / finalCost) * 100;

        return {
            itemPrice,
            totalMaterialCost,
            adjustedMaterialCost,
            taxAmount,
            focusDiscount,
            finalCost,
            profit,
            profitMargin,
            ingredientCosts: ingredientCosts.breakdown
        };
    }

    getBestSellPrice(prices, itemId) {
        const itemPrices = prices.filter(p => p.item_id === itemId);
        return Math.max(...itemPrices.map(p => p.sell_price_max || 0));
    }

    calculateIngredientCosts(prices) {
        let totalCost = 0;
        const breakdown = [];

        this.recipe.ingredients.forEach(ingredient => {
            const ingredientPrices = prices.filter(p => p.item_id === ingredient.id);
            const bestPrice = Math.min(...ingredientPrices.map(p => p.sell_price_min || Infinity));
            
            if (bestPrice === Infinity) {
                throw new Error(`No price data for ${ingredient.name}`);
            }

            const cost = bestPrice * ingredient.quantity;
            totalCost += cost;
            
            breakdown.push({
                name: ingredient.name,
                quantity: ingredient.quantity,
                unitPrice: bestPrice,
                totalCost: cost
            });
        });

        return { totalCost, breakdown };
    }

    applyResourceReturn(cost) {
        return cost * (1 - this.settings.resourceReturnRate);
    }

    displayCalculationResults() {
        const container = document.getElementById('calculation-results');
        const result = this.calculationResult;

        container.innerHTML = `
            <div class="card-header">
                <h3>Profit Analysis: ${this.selectedItem.name}</h3>
            </div>
            <div class="profit-breakdown">
                <div class="profit-metric ${result.profit >= 0 ? 'profit-positive' : 'profit-negative'}">
                    <span class="metric-label">Expected Profit:</span>
                    <span class="metric-value">${Math.round(result.profit).toLocaleString()} silver</span>
                </div>
                <div class="profit-metric">
                    <span class="metric-label">Profit Margin:</span>
                    <span class="metric-value ${result.profitMargin >= 0 ? 'profit-positive' : 'profit-negative'}">
                        ${result.profitMargin.toFixed(2)}%
                    </span>
                </div>
                <div class="profit-details">
                    <h4>Cost Breakdown</h4>
                    <div class="cost-item">
                        <span>Material Cost:</span>
                        <span>${Math.round(result.totalMaterialCost).toLocaleString()}</span>
                    </div>
                    <div class="cost-item">
                        <span>After Resource Return:</span>
                        <span>${Math.round(result.adjustedMaterialCost).toLocaleString()}</span>
                    </div>
                    <div class="cost-item">
                        <span>Focus Discount:</span>
                        <span>-${Math.round(result.focusDiscount).toLocaleString()}</span>
                    </div>
                    <div class="cost-item">
                        <span>Tax:</span>
                        <span>${Math.round(result.taxAmount).toLocaleString()}</span>
                    </div>
                    <div class="cost-item total">
                        <span>Final Cost:</span>
                        <span>${Math.round(result.finalCost).toLocaleString()}</span>
                    </div>
                    <div class="cost-item">
                        <span>Sell Price:</span>
                        <span>${Math.round(result.itemPrice).toLocaleString()}</span>
                    </div>
                </div>
                <div class="ingredient-costs">
                    <h4>Ingredient Costs</h4>
                    ${result.ingredientCosts.map(ing => `
                        <div class="ingredient-cost">
                            <span>${ing.name} x${ing.quantity}:</span>
                            <span>${Math.round(ing.totalCost).toLocaleString()}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    displayError(message) {
        const container = document.getElementById('calculation-results');
        container.innerHTML = `
            <div class="error-message">
                <h3>Calculation Error</h3>
                <p>${message}</p>
            </div>
        `;
    }
}