class AlbionAPI {
    constructor() {
        this.baseURL = 'https://www.albion-online-data.com/api/v2/stats';
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    async getItemPrices(itemId, locations = ['Lymhurst', 'Bridgewatch', 'Martlock', 'Thetford', 'Fort Sterling', 'Caerleon'], qualities = [1, 2, 3, 4, 5]) {
        const cacheKey = `prices-${itemId}-${locations.join(',')}-${qualities.join(',')}`;
        const cached = this.getFromCache(cacheKey);
        
        if (cached) {
            return cached;
        }

        try {
            const locationParam = locations.join(',');
            const qualityParam = qualities.join(',');
            const url = `${this.baseURL}/prices/${itemId}.json?locations=${locationParam}&qualities=${qualityParam}`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`API responded with status: ${response.status}`);
            }
            
            const data = await response.json();
            this.setCache(cacheKey, data);
            return data;
        } catch (error) {
            console.error('Error fetching item prices:', error);
            throw error;
        }
    }

    async getMultipleItemPrices(itemIds, locations = ['all'], qualities = [1, 2, 3, 4, 5]) {
        try {
            const itemParam = itemIds.join(',');
            const locationParam = locations.join(',');
            const qualityParam = qualities.join(',');
            const url = `${this.baseURL}/prices/${itemParam}.json?locations=${locationParam}&qualities=${qualityParam}`;
            
            const response = await fetch(url);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching multiple item prices:', error);
            throw error;
        }
    }

    async getGoldPrice() {
        try {
            const response = await fetch('https://www.albion-online-data.com/api/v2/stats/Gold?count=1');
            const data = await response.json();
            return data[0]?.price || 0;
        } catch (error) {
            console.error('Error fetching gold price:', error);
            return 0;
        }
    }

    getFromCache(key) {
        const item = this.cache.get(key);
        if (item && Date.now() - item.timestamp < this.cacheTimeout) {
            return item.data;
        }
        this.cache.delete(key);
        return null;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    clearCache() {
        this.cache.clear();
    }
}

// Global API instance
window.albionAPI = new AlbionAPI();