class AdvancedFilters {
    constructor() {
        this.filters = {
            tier: [],
            category: [],
            enchantment: [],
            minPrice: null,
            maxPrice: null,
            minProfit: null,
            maxRisk: 3,
            sortBy: 'profit',
            sortOrder: 'desc'
        };
    }

    renderFilterPanel(context) {
        return `
            <div class="advanced-filters">
                <div class="filter-section">
                    <h4>Advanced Filters</h4>
                    
                    <div class="filter-group">
                        <label>Tier</label>
                        <div class="tier-filters">
                            ${[1,2,3,4,5,6,7,8].map(tier => `
                                <label class="filter-checkbox">
                                    <input type="checkbox" value="${tier}" checked 
                                           onchange="advancedFilters.updateTierFilter(${tier}, this.checked, '${context}')">
                                    T${tier}
                                </label>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="filter-group">
                        <label>Category</label>
                        <select onchange="advancedFilters.updateCategoryFilter(this.value, '${context}')">
                            <option value="">All Categories</option>
                            ${Object.keys(window.itemDatabase.categories).map(cat => `
                                <option value="${cat}">${this.formatCategoryName(cat)}</option>
                            `).join('')}
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label>Enchantment</label>
                        <select onchange="advancedFilters.updateEnchantmentFilter(this.value, '${context}')">
                            <option value="">All</option>
                            <option value="0">Normal</option>
                            <option value="1">Uncommon</option>
                            <option value="2">Rare</option>
                            <option value="3">Legendary</option>
                            <option value="4">Mythical</option>
                        </select>
                    </div>
                    
                    <div class="filter-group grid grid-2">
                        <div>
                            <label>Min Price</label>
                            <input type="number" placeholder="0" 
                                   onchange="advancedFilters.updatePriceFilter('min', this.value, '${context}')">
                        </div>
                        <div>
                            <label>Max Price</label>
                            <input type="number" placeholder="Any" 
                                   onchange="advancedFilters.updatePriceFilter('max', this.value, '${context}')">
                        </div>
                    </div>
                    
                    <div class="filter-group">
                        <label>Sort By</label>
                        <select onchange="advancedFilters.updateSorting(this.value, '${context}')">
                            <option value="name">Name</option>
                            <option value="tier">Tier</option>
                            <option value="price">Price</option>
                            <option value="profit" selected>Profit</option>
                            <option value="margin">Margin</option>
                            <option value="risk">Risk</option>
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label>Sort Order</label>
                        <select onchange="advancedFilters.updateSortOrder(this.value, '${context}')">
                            <option value="asc">Ascending</option>
                            <option value="desc" selected>Descending</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
    }

    formatCategoryName(category) {
        return category.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    updateTierFilter(tier, checked, context) {
        if (checked) {
            this.filters.tier.push(tier);
        } else {
            this.filters.tier = this.filters.tier.filter(t => t !== tier);
        }
        this.applyFilters(context);
    }

    updateCategoryFilter(category, context) {
        this.filters.category = category ? [category] : [];
        this.applyFilters(context);
    }

    updateEnchantmentFilter(enchantment, context) {
        this.filters.enchantment = enchantment ? [parseInt(enchantment)] : [];
        this.applyFilters(context);
    }

    updatePriceFilter(type, value, context) {
        this.filters[`${type}Price`] = value ? parseInt(value) : null;
        this.applyFilters(context);
    }

    updateSorting(sortBy, context) {
        this.filters.sortBy = sortBy;
        this.applyFilters(context);
    }

    updateSortOrder(order, context) {
        this.filters.sortOrder = order;
        this.applyFilters(context);
    }

    applyFilters(context) {
        // Dispatch custom event that components can listen for
        const event = new CustomEvent('filtersUpdated', {
            detail: {
                filters: this.filters,
                context: context
            }
        });
        document.dispatchEvent(event);
    }

    filterItems(items) {
        return items.filter(item => {
            // Tier filter
            if (this.filters.tier.length > 0 && !this.filters.tier.includes(item.tier)) {
                return false;
            }
            
            // Category filter
            if (this.filters.category.length > 0 && !this.filters.category.includes(item.category)) {
                return false;
            }
            
            // Enchantment filter
            if (this.filters.enchantment.length > 0 && !this.filters.enchantment.includes(item.enchantment || 0)) {
                return false;
            }
            
            // Price filters would be applied by the specific component
            // since prices come from API
            
            return true;
        });
    }

    sortItems(items, sortBy, sortOrder) {
        const order = sortOrder === 'desc' ? -1 : 1;
        
        return items.sort((a, b) => {
            let aValue, bValue;
            
            switch (sortBy) {
                case 'name':
                    aValue = a.name;
                    bValue = b.name;
                    return aValue.localeCompare(bValue) * order;
                    
                case 'tier':
                    aValue = a.tier;
                    bValue = b.tier;
                    break;
                    
                case 'price':
                    aValue = a.price || 0;
                    bValue = b.price || 0;
                    break;
                    
                case 'profit':
                    aValue = a.profit || 0;
                    bValue = b.profit || 0;
                    break;
                    
                case 'margin':
                    aValue = a.margin || 0;
                    bValue = b.margin || 0;
                    break;
                    
                case 'risk':
                    aValue = a.risk || 0;
                    bValue = b.risk || 0;
                    break;
                    
                default:
                    return 0;
            }
            
            return (aValue - bValue) * order;
        });
    }
}

// Global instance
window.advancedFilters = new AdvancedFilters();