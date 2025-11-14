class FarmingCalculator {
    constructor() {
        this.crops = {
            "T3_SEED_CARROT": { name: "Carrot Seed", yield: 9, growthTime: 86400, focusCost: 300 },
            "T4_SEED_WHEAT": { name: "Wheat Seed", yield: 9, growthTime: 86400, focusCost: 400 },
            "T5_SEED_TURNIP": { name: "Turnip Seed", yield: 9, growthTime: 86400, focusCost: 500 },
            "T6_SEED_CABBAGE": { name: "Cabbage Seed", yield: 9, growthTime: 86400, focusCost: 600 },
            "T7_SEED_POTATO": { name: "Potato Seed", yield: 9, growthTime: 86400, focusCost: 700 },
            "T8_SEED_CORN": { name: "Corn Seed", yield: 9, growthTime: 86400, focusCost: 800 }
        };
        
        this.animals = {
            "T3_CHICKEN": { name: "Chicken", yield: 9, growthTime: 86400, focusCost: 300 },
            "T4_GOOSE": { name: "Goose", yield: 9, growthTime: 86400, focusCost: 400 },
            "T5_GOAT": { name: "Goat", yield: 9, growthTime: 86400, focusCost: 500 },
            "T6_SHEEP": { name: "Sheep", yield: 9, growthTime: 86400, focusCost: 600 },
            "T7_COW": { name: "Cow", yield: 9, growthTime: 86400, focusCost: 700 },
            "T8_HORSE": { name: "Horse", yield: 9, growthTime: 86400, focusCost: 800 }
        };
    }

    async render() {
        return `
            <div class="farming-calculator">
                <div class="card">
                    <div class="card-header">
                        <h2>Farming & Resource Efficiency Calculator</h2>
                    </div>
                    
                    <div class="farming-tabs">
                        <button class="farming-tab active" data-tab="crops">Crop Farming</button>
                        <button class="farming-tab" data-tab="animals">Animal Farming</button>
                        <button class="farming-tab" data-tab="focus">Focus Efficiency</button>
                        <button class="farming-tab" data-tab="gathering">Gathering</button>
                    </div>
                    
                    <div id="farming-content">
                        ${await this.renderCropsTab()}
                    </div>
                </div>
            </div>
        `;
    }

    async renderCropsTab() {
        return `
            <div class="farming-tab-content active" id="crops-tab">
                <h3>Crop Profitability Calculator</h3>
                
                <div class="grid grid-2">
                    <div class="form-group">
                        <label class="form-label">Select Crop</label>
                        <select id="crop-select" class="form-select">
                            ${Object.entries(this.crops).map(([id, crop]) => `
                                <option value="${id}">${crop.name}</option>
                            `).join('')}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Number of Plots</label>
                        <input type="number" id="plot-count" class="form-input" value="1" min="1" max="100">
                    </div>
                </div>
                
                <div class="grid grid-3">
                    <div class="form-group">
                        <label class="form-label">Seed Cost (each)</label>
                        <input type="number" id="seed-cost" class="form-input" value="100">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Crop Sell Price (each)</label>
                        <input type="number" id="crop-price" class="form-input" value="150">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Use Focus</label>
                        <select id="use-focus" class="form-select">
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                        </select>
                    </div>
                </div>
                
                <button class="btn btn-primary" onclick="farmingCalculator.calculateCropProfit()">
                    Calculate Profit
                </button>
                
                <div id="crop-results" class="results-section" style="display: none;">
                    <!-- Results will be populated here -->
                </div>
            </div>
        `;
    }

    async init() {
        this.initFarmingTabs();
        window.farmingCalculator = this;
    }

    initFarmingTabs() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('farming-tab')) {
                // Switch tabs
                document.querySelectorAll('.farming-tab').forEach(tab => tab.classList.remove('active'));
                document.querySelectorAll('.farming-tab-content').forEach(content => content.classList.remove('active'));
                
                e.target.classList.add('active');
                const tabId = e.target.getAttribute('data-tab') + '-tab';
                document.getElementById(tabId)?.classList.add('active');
            }
        });
    }

    async calculateCropProfit() {
        const cropId = document.getElementById('crop-select').value;
        const plotCount = parseInt(document.getElementById('plot-count').value);
        const seedCost = parseInt(document.getElementById('seed-cost').value);
        const cropPrice = parseInt(document.getElementById('crop-price').value);
        const useFocus = document.getElementById('use-focus').value === 'true';
        
        const crop = this.crops[cropId];
        const totalSeedsCost = seedCost * plotCount;
        const totalYield = crop.yield * plotCount;
        
        // Calculate focus bonus
        const focusBonus = useFocus ? 1.43 : 1.0; // 43% bonus with focus
        const effectiveYield = Math.floor(totalYield * focusBonus);
        
        const totalRevenue = effectiveYield * cropPrice;
        const totalProfit = totalRevenue - totalSeedsCost;
        const profitPerPlot = totalProfit / plotCount;
        const roi = (totalProfit / totalSeedsCost) * 100;
        
        // Calculate silver per focus point
        const focusCost = useFocus ? crop.focusCost * plotCount : 0;
        const silverPerFocus = focusCost > 0 ? (totalProfit / focusCost) : 0;
        
        const resultsContainer = document.getElementById('crop-results');
        resultsContainer.innerHTML = `
            <div class="profit-breakdown">
                <h4>Profit Analysis</h4>
                <div class="profit-metric ${totalProfit >= 0 ? 'profit-positive' : 'profit-negative'}">
                    <span>Total Profit:</span>
                    <span>${Math.round(totalProfit).toLocaleString()} silver</span>
                </div>
                <div class="profit-metric">
                    <span>Profit per Plot:</span>
                    <span>${Math.round(profitPerPlot).toLocaleString()} silver</span>
                </div>
                <div class="profit-metric">
                    <span>ROI:</span>
                    <span>${roi.toFixed(1)}%</span>
                </div>
                ${useFocus ? `
                <div class="profit-metric">
                    <span>Silver per Focus:</span>
                    <span>${silverPerFocus.toFixed(1)}</span>
                </div>
                ` : ''}
                
                <div class="cost-breakdown">
                    <h5>Cost Breakdown</h5>
                    <div class="cost-item">
                        <span>Seed Cost:</span>
                        <span>${totalSeedsCost.toLocaleString()} silver</span>
                    </div>
                    <div class="cost-item">
                        <span>Expected Yield:</span>
                        <span>${effectiveYield} crops</span>
                    </div>
                    <div class="cost-item">
                        <span>Total Revenue:</span>
                        <span>${totalRevenue.toLocaleString()} silver</span>
                    </div>
                </div>
            </div>
        `;
        
        resultsContainer.style.display = 'block';
    }
}