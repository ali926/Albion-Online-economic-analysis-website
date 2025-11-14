class ItemDatabaseLoader {
    constructor() {
        this.items = [];
        this.categories = {};
        this.loaded = false;
    }

    async load() {
        if (this.loaded) return;

        try {
            // Try to load from local JSON file
            const response = await fetch('data/items.json');
            const data = await response.json();
            
            this.items = data.items;
            this.categories = data.categories;
            this.loaded = true;
            
            console.log(`Loaded ${this.items.length} items from database`);
        } catch (error) {
            console.error('Failed to load item database:', error);
            // Fallback to the basic items.js
            this.items = window.ITEM_DATABASE || [];
            this.loaded = true;
        }
    }

    searchItems(query, filters = {}) {
        if (!this.loaded) return [];

        let results = this.items.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(query.toLowerCase()) ||
                                item.id.toLowerCase().includes(query.toLowerCase());
            
            const matchesTier = !filters.tier || item.tier === parseInt(filters.tier);
            const matchesCategory = !filters.category || item.category === filters.category;
            const matchesSubcategory = !filters.subcategory || item.subcategory === filters.subcategory;

            return matchesSearch && matchesTier && matchesCategory && matchesSubcategory;
        });

        // Sort by tier and name
        results.sort((a, b) => {
            if (a.tier !== b.tier) return a.tier - b.tier;
            return a.name.localeCompare(b.name);
        });

        return results.slice(0, filters.limit || 50);
    }

    getItemById(id) {
        return this.items.find(item => item.id === id);
    }

    getItemsByCategory(category) {
        return this.items.filter(item => item.category === category);
    }

    getCategories() {
        return this.categories;
    }
}

// Global instance
window.itemDatabase = new ItemDatabaseLoader();