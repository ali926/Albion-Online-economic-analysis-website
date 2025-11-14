class PriceCharts {
    constructor() {
        this.charts = new Map();
    }

    async renderPriceHistoryChart(itemId, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        try {
            // Get historical data (you'd need to implement this API)
            const historyData = await this.fetchPriceHistory(itemId);
            
            const ctx = document.createElement('canvas');
            container.innerHTML = '';
            container.appendChild(ctx);
            
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: historyData.dates,
                    datasets: [
                        {
                            label: 'Sell Price Min',
                            data: historyData.sellMin,
                            borderColor: 'rgb(75, 192, 192)',
                            tension: 0.1
                        },
                        {
                            label: 'Sell Price Max', 
                            data: historyData.sellMax,
                            borderColor: 'rgb(255, 99, 132)',
                            tension: 0.1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Price History (7 Days)'
                        }
                    }
                }
            });
            
        } catch (error) {
            container.innerHTML = `<p class="error">Unable to load price history: ${error.message}</p>`;
        }
    }

    async fetchPriceHistory(itemId) {
        // This would call your historical price API
        // For now, return mock data
        return {
            dates: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'],
            sellMin: [1000, 1200, 1100, 1300, 1250, 1400, 1350],
            sellMax: [1500, 1600, 1550, 1700, 1650, 1800, 1750]
        };
    }
}

window.priceCharts = new PriceCharts();