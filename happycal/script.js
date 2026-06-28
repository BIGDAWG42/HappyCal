class HappyCal {
    constructor() {
        this.video = document.getElementById('video');
        this.canvas = document.getElementById('canvas');
        this.startCameraBtn = document.getElementById('startCamera');
        this.captureBtn = document.getElementById('captureBtn');
        this.scanBtn = document.getElementById('scanBtn');
        this.resultContainer = document.getElementById('resultContainer');
        this.resultsDiv = document.getElementById('results');
        this.historyList = document.getElementById('historyList');
        
        this.mediaStream = null;
        this.capturedImage = null;
        
        this.initEventListeners();
        this.loadHistory();
    }
    
    initEventListeners() {
        this.startCameraBtn.addEventListener('click', () => this.startCamera());
        this.captureBtn.addEventListener('click', () => this.capturePhoto());
        this.scanBtn.addEventListener('click', () => this.scanCalories());
    }
    
    async startCamera() {
        try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });
            this.video.srcObject = this.mediaStream;
            this.startCameraBtn.disabled = true;
            this.captureBtn.disabled = false;
        } catch (error) {
            console.error('Error accessing camera:', error);
            this.showError('Could not access camera. Please ensure you have granted permission.');
        }
    }
    
    capturePhoto() {
        const context = this.canvas.getContext('2d');
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        context.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
        
        this.capturedImage = this.canvas.toDataURL('image/png');
        this.captureBtn.disabled = true;
        this.scanBtn.disabled = false;
        this.scanBtn.classList.remove('hidden');
        
        // Stop camera after capturing
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
        }
    }
    
    async scanCalories() {
        if (!this.capturedImage) return;
        
        // Show loading state
        this.scanBtn.textContent = 'Analyzing...';
        this.scanBtn.disabled = true;
        
        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Mock AI analysis results
            const mockResults = this.generateMockResults();
            
            // Display results
            this.displayResults(mockResults);
            
            // Save to history
            this.saveToHistory(mockResults);
            
        } catch (error) {
            this.showError('Failed to analyze image. Please try again.');
        } finally {
            this.scanBtn.textContent = 'Scan Calories';
            this.scanBtn.disabled = false;
        }
    }
    
    generateMockResults() {
        const foods = [
            { name: 'Avocado', calories: 160, protein: 2, carbs: 9, fat: 15 },
            { name: 'Chicken Salad', calories: 320, protein: 25, carbs: 15, fat: 20 },
            { name: 'Apple', calories: 95, protein: 1, carbs: 25, fat: 0 },
            { name: 'Salmon', calories: 206, protein: 22, carbs: 0, fat: 13 },
            { name: 'Pizza Slice', calories: 285, protein: 12, carbs: 36, fat: 10 },
            { name: 'Banana', calories: 105, protein: 1, carbs: 27, fat: 0 },
            { name: 'Greek Yogurt', calories: 130, protein: 20, carbs: 6, fat: 0 },
            { name: 'Chocolate Bar', calories: 210, protein: 3, carbs: 32, fat: 11 }
        ];
        
        const randomFood = foods[Math.floor(Math.random() * foods.length)];
        const timestamp = new Date().toLocaleString();
        
        return {
            ...randomFood,
            timestamp: timestamp,
            confidence: Math.floor(Math.random() * 30) + 70 // 70-99%
        };
    }
    
    displayResults(results) {
        this.resultsDiv.innerHTML = `
            <div class="result-item">
                <h3>${results.name}</h3>
                <div class="nutrition-grid">
                    <div class="nutrition-card">
                        <span class="calories">${results.calories} cal</span>
                        <span class="label">Calories</span>
                    </div>
                    <div class="nutrition-card">
                        <span class="protein">${results.protein}g</span>
                        <span class="label">Protein</span>
                    </div>
                    <div class="nutrition-card">
                        <span class="carbs">${results.carbs}g</span>
                        <span class="label">Carbs</span>
                    </div>
                    <div class="nutrition-card">
                        <span class="fat">${results.fat}g</span>
                        <span class="label">Fat</span>
                    </div>
                </div>
                <div class="confidence">
                    Confidence: ${results.confidence}%
                </div>
                <div class="timestamp">
                    Scanned at: ${results.timestamp}
                </div>
            </div>
        `;
        
        this.resultContainer.classList.remove('hidden');
    }
    
    saveToHistory(results) {
        const history = JSON.parse(localStorage.getItem('happycal_history') || '[]');
        history.unshift({
            ...results,
            id: Date.now()
        });
        
        // Keep only last 10 items
        if (history.length > 10) {
            history.pop();
        }
        
        localStorage.setItem('happycal_history', JSON.stringify(history));
        this.loadHistory();
    }
    
    loadHistory() {
        const history = JSON.parse(localStorage.getItem('happycal_history') || '[]');
        this.historyList.innerHTML = '';
        
        if (history.length === 0) {
            this.historyList.innerHTML = '<p class="empty-history">No scans yet. Take a photo to get started!</p>';
            return;
        }
        
        history.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <div class="item-info">
                    <div class="item-name">${item.name}</div>
                    <div class="item-date">${item.timestamp}</div>
                </div>
                <div class="item-calories">${item.calories} cal</div>
            `;
            this.historyList.appendChild(historyItem);
        });
    }
    
    showError(message) {
        this.resultsDiv.innerHTML = `<div class="error-message">${message}</div>`;
        this.resultContainer.classList.remove('hidden');
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HappyCal();
});
