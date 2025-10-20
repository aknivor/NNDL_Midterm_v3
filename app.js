// app.js
// Global variables
let dataLoader = new VideoGamesDataLoader();
let predictor = new GRUPredictor();
let currentTab = 'eda';

// Tab navigation
function showTab(tabName) {
    currentTab = tabName;
    
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    document.querySelector(`[onclick="showTab('${tabName}')"]`).classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

// EDA Functions
function loadSampleData() {
    try {
        const gamesData = dataLoader.loadSampleData();
        initializeEDA(gamesData);
        showSuccess('Sample data loaded successfully!');
    } catch (error) {
        showError('Failed to load sample data: ' + error.message);
    }
}

function initializeEDA(gamesData) {
    displayDataInfo(gamesData);
    populateFilters(gamesData);
    applyFilters();
}

function displayDataInfo(gamesData) {
    const dataInfo = document.getElementById('dataInfo');
    const totalSales = gamesData.reduce((sum, game) => sum + game.Global_Sales, 0);
    const yearRange = gamesData.reduce((acc, game) => {
        acc.min = Math.min(acc.min, game.Year);
        acc.max = Math.max(acc.max, game.Year);
        return acc;
    }, { min: Infinity, max: -Infinity });

    dataInfo.innerHTML = `
        <div class="stat-card">
            <h3>📊 Total Games</h3>
            <p style="font-size: 24px; font-weight: bold; color: #007bff;">${gamesData.length}</p>
        </div>
        <div class="stat-card">
            <h3>💰 Total Sales</h3>
            <p style="font-size: 24px; font-weight: bold; color: #28a745;">${totalSales.toFixed(1)}M</p>
        </div>
        <div class="stat-card">
            <h3>📅 Year Range</h3>
            <p style="font-size: 24px; font-weight: bold; color: #dc3545;">${yearRange.min}-${yearRange.max}</p>
        </div>
        <div class="stat-card">
            <h3>🎮 Platforms</h3>
            <p style="font-size: 24px; font-weight: bold; color: #ffc107;">${new Set(gamesData.map(g => g.Platform)).size}</p>
        </div>
    `;
}

function populateFilters(gamesData) {
    const platforms = [...new Set(gamesData.map(g => g.Platform))].sort();
    const genres = [...new Set(gamesData.map(g => g.Genre))].sort();
    const publishers = [...new Set(gamesData.map(g => g.Publisher))].sort();

    populateSelect('platformFilter', platforms);
    populateSelect('genreFilter', genres);
    populateSelect('publisherFilter', publishers);
}

function populateSelect(selectId, options) {
    const select = document.getElementById(selectId);
    select.innerHTML = `<option value="">All ${selectId.replace('Filter', '').replace(/([A-Z])/g, ' $1').trim()}</option>`;
    options.forEach(option => {
        select.innerHTML += `<option value="${option}">${option}</option>`;
    });
}

function applyFilters() {
    const platform = document.getElementById('platformFilter').value;
    const genre = document.getElementById('genreFilter').value;
    const publisher = document.getElementById('publisherFilter').value;
    
    const filteredData = dataLoader.gamesData.filter(game => {
        return (!platform || game.Platform === platform) &&
               (!genre || game.Genre === genre) &&
               (!publisher || game.Publisher === publisher);
    });

    updateFilterStats(filteredData);
    createEDAVisualizations(filteredData);
}

function resetFilters() {
    document.getElementById('platformFilter').value = '';
    document.getElementById('genreFilter').value = '';
    document.getElementById('publisherFilter').value = '';
    applyFilters();
}

function updateFilterStats(filteredData) {
    const stats = document.getElementById('filterStats');
    const totalSales = filteredData.reduce((sum, game) => sum + game.Global_Sales, 0);
    const avgSales = filteredData.length > 0 ? totalSales / filteredData.length : 0;

    stats.innerHTML = `
        <div class="stat-card">
            <h3>Filtered Games</h3>
            <p style="font-size: 20px; font-weight: bold;">${filteredData.length}</p>
        </div>
        <div class="stat-card">
            <h3>Filtered Sales</h3>
            <p style="font-size: 20px; font-weight: bold;">${totalSales.toFixed(1)}M</p>
        </div>
        <div class="stat-card">
            <h3>Avg Sales/Game</h3>
            <p style="font-size: 20px; font-weight: bold;">${avgSales.toFixed(2)}M</p>
        </div>
    `;
}

function createEDAVisualizations(filteredData) {
    createSalesTrendChart(filteredData);
    createPlatformChart(filteredData);
    createGenreChart(filteredData);
    createPublisherChart(filteredData);
    createRegionalChart(filteredData);
    createTopGamesTable(filteredData);
}

// EDA Visualization functions (similar to previous implementation)
function createSalesTrendChart(filteredData) {
    const salesByYear = filteredData.reduce((acc, game) => {
        const year = game.Year;
        if (!acc[year]) acc[year] = 0;
        acc[year] += game.Global_Sales;
        return acc;
    }, {});

    const years = Object.keys(salesByYear).sort();
    const sales = years.map(year => salesByYear[year]);

    const trace = {
        x: years,
        y: sales,
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Global Sales',
        line: { color: '#007bff', width: 3 },
        marker: { size: 8 }
    };

    const layout = {
        title: 'Global Sales Trend by Year',
        xaxis: { title: 'Year', tickangle: -45 },
        yaxis: { title: 'Sales (Millions)' }
    };

    Plotly.newPlot('salesTrendChart', [trace], layout, { responsive: true });
}

function createPlatformChart(filteredData) {
    const salesByPlatform = filteredData.reduce((acc, game) => {
        const platform = game.Platform;
        if (!acc[platform]) acc[platform] = 0;
        acc[platform] += game.Global_Sales;
        return acc;
    }, {});

    const platforms = Object.keys(salesByPlatform)
        .sort((a, b) => salesByPlatform[b] - salesByPlatform[a])
        .slice(0, 10);
    const sales = platforms.map(platform => salesByPlatform[platform]);

    const trace = {
        x: platforms,
        y: sales,
        type: 'bar',
        marker: { color: platforms.map((_, i) => `hsl(${i * 30}, 70%, 50%)`) }
    };

    const layout = {
        title: 'Top 10 Platforms by Sales',
        xaxis: { title: 'Platform', tickangle: -45 },
        yaxis: { title: 'Sales (Millions)' }
    };

    Plotly.newPlot('platformChart', [trace], layout, { responsive: true });
}

function createGenreChart(filteredData) {
    const salesByGenre = filteredData.reduce((acc, game) => {
        const genre = game.Genre;
        if (!acc[genre]) acc[genre] = 0;
        acc[genre] += game.Global_Sales;
        return acc;
    }, {});

    const genres = Object.keys(salesByGenre).sort((a, b) => salesByGenre[b] - salesByGenre[a]);
    const sales = genres.map(genre => salesByGenre[genre]);

    const trace = {
        labels: genres,
        values: sales,
        type: 'pie',
        hole: 0.4
    };

    const layout = { title: 'Sales Distribution by Genre' };
    Plotly.newPlot('genreChart', [trace], layout, { responsive: true });
}

function createPublisherChart(filteredData) {
    const salesByPublisher = filteredData.reduce((acc, game) => {
        const publisher = game.Publisher;
        if (!acc[publisher]) acc[publisher] = 0;
        acc[publisher] += game.Global_Sales;
        return acc;
    }, {});

    const publishers = Object.keys(salesByPublisher)
        .sort((a, b) => salesByPublisher[b] - salesByPublisher[a])
        .slice(0, 8);
    const sales = publishers.map(publisher => salesByPublisher[publisher]);

    const trace = {
        x: sales,
        y: publishers,
        type: 'bar',
        orientation: 'h',
        marker: { color: 'rgba(55,128,191,0.6)' }
    };

    const layout = {
        title: 'Top Publishers by Sales',
        xaxis: { title: 'Sales (Millions)' },
        margin: { l: 150 }
    };

    Plotly.newPlot('publisherChart', [trace], layout, { responsive: true });
}

function createRegionalChart(filteredData) {
    const totalNA = filteredData.reduce((sum, game) => sum + game.NA_Sales, 0);
    const totalEU = filteredData.reduce((sum, game) => sum + game.EU_Sales, 0);
    const totalJP = filteredData.reduce((sum, game) => sum + game.JP_Sales, 0);
    const totalOther = filteredData.reduce((sum, game) => sum + game.Other_Sales, 0);

    const trace = {
        values: [totalNA, totalEU, totalJP, totalOther],
        labels: ['North America', 'Europe', 'Japan', 'Other Regions'],
        type: 'pie',
        marker: { colors: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728'] }
    };

    const layout = { title: 'Regional Sales Distribution' };
    Plotly.newPlot('regionalChart', [trace], layout, { responsive: true });
}

function createTopGamesTable(filteredData) {
    const topGames = [...filteredData]
        .sort((a, b) => b.Global_Sales - a.Global_Sales)
        .slice(0, 10);

    let tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Game</th>
                    <th>Platform</th>
                    <th>Year</th>
                    <th>Global Sales (M)</th>
                </tr>
            </thead>
            <tbody>
    `;

    topGames.forEach(game => {
        tableHTML += `
            <tr>
                <td>${game.Rank}</td>
                <td><strong>${game.Name}</strong></td>
                <td>${game.Platform}</td>
                <td>${game.Year}</td>
                <td style="font-weight: bold; color: #28a745;">${game.Global_Sales}</td>
            </tr>
        `;
    });

    tableHTML += `</tbody></table>`;
    document.getElementById('topGames').innerHTML = `<h3>Top 10 Games by Global Sales</h3>${tableHTML}`;
}

// Prediction Functions
async function initializePrediction() {
    try {
        showLoading('Initializing prediction model...');
        
        // Prepare time series data
        const processedData = dataLoader.prepareTimeSeriesData();
        
        // Build model
        predictor.buildModel(processedData.inputShape, processedData.outputShape);
        
        // Enable training button
        document.getElementById('trainBtn').disabled = false;
        
        // Show model info
        document.getElementById('modelInfo').innerHTML = `
            <div class="success">
                <strong>Model Initialized Successfully!</strong><br>
                Input Shape: ${processedData.inputShape.join(' x ')}<br>
                Output Shape: ${processedData.outputShape} (${processedData.platforms.length} platforms × ${processedData.predictionHorizon} time steps)<br>
                Platforms: ${processedData.platforms.join(', ')}
            </div>
        `;
        
        hideLoading();
        showSuccess('Prediction model initialized and ready for training!');
        
    } catch (error) {
        hideLoading();
        showError('Failed to initialize prediction model: ' + error.message);
    }
}

async function trainModel() {
    try {
        if (!predictor.model) {
            throw new Error('Model not initialized. Click "Initialize Prediction Model" first.');
        }

        showLoading('Training model...');
        document.getElementById('trainBtn').disabled = true;
        
        const processedData = dataLoader.processedData;
        await predictor.train(
            processedData.X_train, 
            processedData.y_train, 
            processedData.X_test, 
            processedData.y_test,
            30,  // epochs
            4    // batch size
        );
        
        document.getElementById('evaluateBtn').disabled = false;
        hideLoading();
        showSuccess('Model training completed! Click "Evaluate Model" to see results.');
        
    } catch (error) {
        hideLoading();
        document.getElementById('trainBtn').disabled = false;
        showError('Training failed: ' + error.message);
    }
}

async function evaluateModel() {
    try {
        if (!predictor.isTrained) {
            throw new Error('Model not trained. Train the model first.');
        }

        showLoading('Evaluating model...');
        
        const processedData = dataLoader.processedData;
        
        // Get predictions
        const predictions = await predictor.predict(processedData.X_test);
        const yTrue = processedData.y_test;
        
        // Calculate platform accuracies
        const platformAccuracies = await predictor.calculatePlatformAccuracy(
            yTrue, predictions, 
            processedData.platforms, 
            processedData.predictionHorizon
        );
        
        // Display results
        displayPredictionResults(platformAccuracies, processedData.platforms);
        createAccuracyChart(platformAccuracies);
        createPredictionTimeline(yTrue, predictions, processedData.platforms, processedData.predictionHorizon);
        
        hideLoading();
        showSuccess('Model evaluation completed!');
        
    } catch (error) {
        hideLoading();
        showError('Evaluation failed: ' + error.message);
    }
}

function displayPredictionResults(platformAccuracies, platforms) {
    const resultsDiv = document.getElementById('predictionResults');
    
    // Sort platforms by accuracy
    const sortedPlatforms = Object.entries(platformAccuracies)
        .sort(([,a], [,b]) => b - a);
    
    let resultsHTML = `
        <div class="success">
            <h3>Prediction Results</h3>
            <table>
                <thead>
                    <tr>
                        <th>Platform</th>
                        <th>Accuracy</th>
                        <th>Performance</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    sortedPlatforms.forEach(([platform, accuracy]) => {
        const percentage = (accuracy * 100).toFixed(1);
        const performance = accuracy > 0.6 ? '🟢 Good' : accuracy > 0.5 ? '🟡 Fair' : '🔴 Poor';
        const colorClass = accuracy > 0.6 ? 'prediction-correct' : accuracy > 0.5 ? '' : 'prediction-wrong';
        
        resultsHTML += `
            <tr>
                <td><strong>${platform}</strong></td>
                <td class="${colorClass}">${percentage}%</td>
                <td>${performance}</td>
            </tr>
        `;
    });
    
    resultsHTML += `</tbody></table></div>`;
    resultsDiv.innerHTML = resultsHTML;
}

function createAccuracyChart(platformAccuracies) {
    const sortedEntries = Object.entries(platformAccuracies)
        .sort(([,a], [,b]) => b - a);
    
    const platforms = sortedEntries.map(([platform]) => platform);
    const accuracies = sortedEntries.map(([,accuracy]) => accuracy * 100);
    
    const trace = {
        x: accuracies,
        y: platforms,
        type: 'bar',
        orientation: 'h',
        marker: {
            color: accuracies.map(acc => 
                acc > 60 ? '#28a745' : acc > 50 ? '#ffc107' : '#dc3545'
            )
        }
    };
    
    const layout = {
        title: 'Prediction Accuracy by Platform',
        xaxis: { title: 'Accuracy (%)', range: [0, 100] },
        yaxis: { title: 'Platform' },
        margin: { l: 150 }
    };
    
    Plotly.newPlot('accuracyChart', [trace], layout, { responsive: true });
}

async function createPredictionTimeline(yTrue, yPred, platforms, predictionHorizon) {
    const trueData = await yTrue.array();
    const predData = await yPred.array();
    
    // For demonstration, show first 20 predictions
    const sampleSize = Math.min(20, trueData.length);
    const timePoints = Array.from({length: sampleSize}, (_, i) => i + 1);
    
    const traces = platforms.map((platform, platformIndex) => {
        const correctPredictions = [];
        
        for (let i = 0; i < sampleSize; i++) {
            let correctCount = 0;
            for (let offset = 0; offset < predictionHorizon; offset++) {
                const outputIndex = platformIndex * predictionHorizon + offset;
                const trueVal = trueData[i][outputIndex];
                const predVal = predData[i][outputIndex] > 0.5 ? 1 : 0;
                
                if (trueVal === predVal) {
                    correctCount++;
                }
            }
            correctPredictions.push((correctCount / predictionHorizon) * 100);
        }
        
        return {
            x: timePoints,
            y: correctPredictions,
            type: 'scatter',
            mode: 'lines+markers',
            name: platform
        };
    });
    
    const layout = {
        title: 'Prediction Accuracy Timeline',
        xaxis: { title: 'Test Sample' },
        yaxis: { title: 'Accuracy (%)', range: [0, 100] }
    };
    
    Plotly.newPlot('predictionTimelineChart', traces, layout, { responsive: true });
}

// Utility Functions
function showLoading(message = 'Loading...') {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading';
    loadingDiv.id = 'loadingIndicator';
    loadingDiv.innerHTML = `<p>⏳ ${message}</p>`;
    document.body.appendChild(loadingDiv);
}

function hideLoading() {
    const loadingDiv = document.getElementById('loadingIndicator');
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.innerHTML = `❌ ${message}`;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
}

function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success';
    successDiv.innerHTML = `✅ ${message}`;
    document.body.appendChild(successDiv);
    setTimeout(() => successDiv.remove(), 5000);
}

// Initialize app when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Video Games Sales Analysis & Prediction Tool Loaded');
    console.log('Click "Load Sample Data" to start exploring!');
});

// Clean up when page unloads
window.addEventListener('beforeunload', function() {
    dataLoader.dispose();
    predictor.dispose();
});
