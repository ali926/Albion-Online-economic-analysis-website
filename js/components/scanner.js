class ScreenScanner {
    constructor() {
        this.isScanning = false;
        this.tesseractWorker = null;
    }

    async render() {
        return `
            <div class="screen-scanner">
                <div class="card">
                    <div class="card-header">
                        <h2>Real-Time Screen Scanner</h2>
                        <p class="subtitle">Upload market screenshots to automatically extract prices</p>
                    </div>
                    
                    <div class="scanner-interface">
                        <div class="upload-area" id="upload-area">
                            <div class="upload-placeholder">
                                <div class="upload-icon">📷</div>
                                <h3>Drop Market Screenshot Here</h3>
                                <p>or click to select file</p>
                                <input type="file" id="screenshot-input" accept="image/*" style="display: none;">
                            </div>
                        </div>
                        
                        <div class="scanner-controls">
                            <div class="form-group">
                                <label class="form-label">Game Language</label>
                                <select id="ocr-language" class="form-select">
                                    <option value="eng">English</option>
                                    <option value="deu">German</option>
                                    <option value="rus">Russian</option>
                                    <option value="fra">French</option>
                                    <option value="spa">Spanish</option>
                                    <option value="por">Portuguese</option>
                                </select>
                            </div>
                            
                            <button class="btn btn-primary" id="start-scan" disabled>
                                Process Image
                            </button>
                        </div>
                    </div>
                    
                    <div id="scanner-results" class="scanner-results" style="display: none;">
                        <!-- OCR results will appear here -->
                    </div>
                    
                    <div class="scanner-tips">
                        <h4>Tips for Best Results:</h4>
                        <ul>
                            <li>Use high-contrast screenshots</li>
                            <li>Ensure text is clear and not blurred</li>
                            <li>Crop to market window for faster processing</li>
                            <li>Use English game client for best accuracy</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }

    async init() {
        this.initUploadArea();
        this.initTesseract();
        window.screenScanner = this;
    }

    initUploadArea() {
        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('screenshot-input');
        const startButton = document.getElementById('start-scan');

        // Click to select file
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type.startsWith('image/')) {
                this.handleImageFile(files[0]);
            }
        });

        // File input change
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleImageFile(e.target.files[0]);
            }
        });

        // Start scan button
        startButton.addEventListener('click', () => {
            this.processImage();
        });
    }

    async initTesseract() {
        try {
            // Initialize Tesseract worker
            this.tesseractWorker = await Tesseract.createWorker();
            await this.tesseractWorker.loadLanguage('eng');
            await this.tesseractWorker.initialize('eng');
            console.log('Tesseract OCR initialized');
        } catch (error) {
            console.error('Failed to initialize Tesseract:', error);
        }
    }

    handleImageFile(file) {
        const uploadArea = document.getElementById('upload-area');
        const startButton = document.getElementById('start-scan');
        
        // Display preview
        const reader = new FileReader();
        reader.onload = (e) => {
            uploadArea.innerHTML = `
                <div class="image-preview">
                    <img src="${e.target.result}" alt="Screenshot preview">
                    <button class="btn btn-sm btn-danger" onclick="screenScanner.clearImage()">Clear</button>
                </div>
            `;
            startButton.disabled = false;
        };
        reader.readAsDataURL(file);
        
        this.currentImageFile = file;
    }

    clearImage() {
        const uploadArea = document.getElementById('upload-area');
        const startButton = document.getElementById('start-scan');
        const fileInput = document.getElementById('screenshot-input');
        
        uploadArea.innerHTML = `
            <div class="upload-placeholder">
                <div class="upload-icon">📷</div>
                <h3>Drop Market Screenshot Here</h3>
                <p>or click to select file</p>
            </div>
        `;
        
        fileInput.value = '';
        startButton.disabled = true;
        this.currentImageFile = null;
        
        // Re-initialize event listeners
        this.initUploadArea();
    }

    async processImage() {
        if (!this.currentImageFile || !this.tesseractWorker) {
            alert('Please select an image first');
            return;
        }

        const resultsContainer = document.getElementById('scanner-results');
        const startButton = document.getElementById('start-scan');
        const language = document.getElementById('ocr-language').value;
        
        this.isScanning = true;
        startButton.disabled = true;
        startButton.textContent = 'Processing...';
        
        resultsContainer.innerHTML = '<div class="loading">Processing image with OCR... This may take a few seconds.</div>';
        resultsContainer.style.display = 'block';

        try {
            // Switch language if needed
            if (language !== 'eng') {
                await this.tesseractWorker.loadLanguage(language);
                await this.tesseractWorker.initialize(language);
            }

            const { data: { text, words } } = await this.tesseractWorker.recognize(this.currentImageFile);
            
            this.displayOCRResults(text, words);
            
        } catch (error) {
            console.error('OCR processing error:', error);
            resultsContainer.innerHTML = `
                <div class="error-message">
                    <h4>OCR Processing Failed</h4>
                    <p>${error.message}</p>
                    <p>Please try a different image or check the language settings.</p>
                </div>
            `;
        } finally {
            this.isScanning = false;
            startButton.disabled = false;
            startButton.textContent = 'Process Image';
        }
    }

    displayOCRResults(text, words) {
        const resultsContainer = document.getElementById('scanner-results');
        
        // Parse extracted text for market data
        const marketData = this.parseMarketText(text, words);
        
        resultsContainer.innerHTML = `
            <div class="ocr-results">
                <div class="results-header">
                    <h4>Extracted Market Data</h4>
                    <button class="btn btn-sm btn-secondary" onclick="screenScanner.exportOCRData()">
                        Export Data
                    </button>
                </div>
                
                ${marketData.items.length > 0 ? `
                    <div class="extracted-items">
                        <h5>Found Items (${marketData.items.length})</h5>
                        <div class="items-grid">
                            ${marketData.items.map(item => `
                                <div class="extracted-item">
                                    <div class="item-name">${item.name}</div>
                                    <div class="item-price">${item.price ? item.price.toLocaleString() + ' silver' : 'Price not found'}</div>
                                    <button class="btn btn-sm btn-primary" onclick="screenScanner.lookupItem('${item.name}')">
                                        Lookup
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : `
                    <div class="no-items">
                        <p>No market items detected in the image. Try a clearer screenshot.</p>
                    </div>
                `}
                
                <div class="raw-text">
                    <h5>Raw Extracted Text</h5>
                    <div class="text-preview">
                        <pre>${text}</pre>
                    </div>
                </div>
            </div>
        `;
    }

    parseMarketText(text, words) {
        const items = [];
        const lines = text.split('\n');
        
        // Simple pattern matching for item names and prices
        const pricePattern = /(\d{1,3}(?:,\d{3})*)\s*(silver|s)?/gi;
        const tierPattern = /T[1-8]/i;
        
        let currentItem = null;
        
        lines.forEach(line => {
            line = line.trim();
            if (!line) return;
            
            // Look for tier indicators (T4, T5, etc.)
            if (tierPattern.test(line)) {
                if (currentItem && currentItem.name) {
                    items.push(currentItem);
                }
                currentItem = { name: line, price: null };
            }
            
            // Look for prices
            const priceMatch = line.match(pricePattern);
            if (priceMatch && currentItem) {
                const price = parseInt(priceMatch[0].replace(/,/g, ''));
                if (!isNaN(price) && price > 0) {
                    currentItem.price = price;
                }
            }
            
            // If line looks like an item name (contains common item words)
            if (line.length > 3 && line.length < 50 && !line.match(pricePattern)) {
                // Check if it might be an item name
                const itemKeywords = ['bow', 'sword', 'armor', 'helmet', 'staff', 'axe', 'potion', 'food', 'rune', 'soul', 'relic'];
                const hasKeyword = itemKeywords.some(keyword => line.toLowerCase().includes(keyword));
                
                if (hasKeyword && !currentItem) {
                    currentItem = { name: line, price: null };
                } else if (currentItem && !currentItem.name.includes(line)) {
                    currentItem.name += ' ' + line;
                }
            }
        });
        
        // Add the last item
        if (currentItem && currentItem.name) {
            items.push(currentItem);
        }
        
        return { items, rawText: text };
    }

    lookupItem(itemName) {
        albionApp.switchTab('price-checker');
        setTimeout(() => {
            const searchInput = document.getElementById('item-search');
            if (searchInput) {
                searchInput.value = itemName;
                searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }, 100);
    }

    exportOCRData() {
        const resultsContainer = document.getElementById('scanner-results');
        const text = resultsContainer.querySelector('pre')?.textContent;
        
        if (text) {
            const blob = new Blob([text], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `albion-ocr-${new Date().toISOString().split('T')[0]}.txt`;
            a.click();
            URL.revokeObjectURL(url);
        }
    }

    async destroy() {
        if (this.tesseractWorker) {
            await this.tesseractWorker.terminate();
        }
    }
}