// app.js
let gamesData = [];
let filteredData = [];

// Sample data from the provided CSV
const sampleData = `Rank,Name,Platform,Year,Genre,Publisher,NA_Sales,EU_Sales,JP_Sales,Other_Sales,Global_Sales
1,Wii Sports,Wii,2006,Sports,Nintendo,41.49,29.02,3.77,8.46,82.74
2,Super Mario Bros.,NES,1985,Platform,Nintendo,29.08,3.58,6.81,0.77,40.24
3,Mario Kart Wii,Wii,2008,Racing,Nintendo,15.85,12.88,3.79,3.31,35.82
4,Wii Sports Resort,Wii,2009,Sports,Nintendo,15.75,11.01,3.28,2.96,33
5,Pokemon Red/Pokemon Blue,GB,1996,Role-Playing,Nintendo,11.27,8.89,10.22,1,31.37
6,Tetris,GB,1989,Puzzle,Nintendo,23.2,2.26,4.22,0.58,30.26
7,New Super Mario Bros.,DS,2006,Platform,Nintendo,11.38,9.23,6.5,2.9,30.01
8,Wii Play,Wii,2006,Misc,Nintendo,14.03,9.2,2.93,2.85,29.02
9,New Super Mario Bros. Wii,Wii,2009,Platform,Nintendo,14.59,7.06,4.7,2.26,28.62
10,Duck Hunt,NES,1984,Shooter,Nintendo,26.93,0.63,0.28,0.47,28.31`;

function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const game = {};
        headers.forEach((header, index) => {
            let value = values[index];
            // Handle numeric columns
            if (['Rank', 'Year', 'NA_Sales', 'EU_Sales', 'JP_Sales', 'Other_Sales', 'Global_Sales'].includes(header)) {
                value = parseFloat(value) || 0;
            }
            game[header] = value;
        });
        return game;
    });
}

function loadSampleData() {
    try {
        gamesData = parseCSV(sampleData);
        filteredData = [...gamesData];
        initializeApp();
        document.getElementById('dataSection').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        showError('Failed to load sample data: ' + error.message);
    }
}

function initializeApp() {
    displayDataInfo();
    populateFilters();
    applyFilters();
    createAllCharts();
}

function displayDataInfo() {
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

function populateFilters() {
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
    const yearMin = parseInt(document.getElementById('yearMin').value) || 0;
    const yearMax = parseInt(document.getElementById('yearMax').value) || 9999;

    filteredData = gamesData.filter(game => {
        return (!platform || game.Platform === platform) &&
               (!genre || game.Genre === genre) &&
               (!publisher || game.Publisher === publisher) &&
               (game.Year >= yearMin && game.Year <= yearMax);
    });

    updateFilterStats();
    createAllCharts();
}

function resetFilters() {
    filteredData = [...gamesData];
    document.getElementById('platformFilter').value = '';
    document.getElementById('genreFilter').value = '';
    document.getElementById('publisherFilter').value = '';
    document.getElementById('yearMin').value = '';
    document.getElementById('yearMax').value = '';
    updateFilterStats();
    createAllCharts();
}

function updateFilterStats() {
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

function createAllCharts() {
    createSalesTrendChart();
    createPlatformChart();
    createGenreChart();
    createPublisherChart();
    createRegionalChart();
    createYearlyBreakdownChart();
    createTopGamesTable();
}

function createSalesTrendChart() {
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
        yaxis: { title: 'Sales (Millions)' },
        hovermode: 'closest'
    };

    Plotly.newPlot('salesTrendChart', [trace], layout, { responsive: true });
}

function createPlatformChart() {
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
        marker: {
            color: platforms.map((_, i) => `hsl(${i * 30}, 70%, 50%)`)
        }
    };

    const layout = {
        title: 'Top 10 Platforms by Sales',
        xaxis: { title: 'Platform', tickangle: -45 },
        yaxis: { title: 'Sales (Millions)' }
    };

    Plotly.newPlot('platformChart', [trace], layout, { responsive: true });
}

function createGenreChart() {
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
        hole: 0.4,
        textinfo: 'label+percent'
    };

    const layout = {
        title: 'Sales Distribution by Genre',
        showlegend: true
    };

    Plotly.newPlot('genreChart', [trace], layout, { responsive: true });
}

function createPublisherChart() {
    const salesByPublisher = filteredData.reduce((acc, game) => {
        const publisher = game.Publisher;
        if (!acc[publisher]) acc[publisher] = 0;
        acc[publisher] += game.Global_Sales;
        return acc;
    }, {});

    const publishers = Object.keys(salesByPublisher)
        .sort((a, b) => salesByPlatform[b] - salesByPlatform[a])
        .slice(0, 8);
    const sales = publishers.map(publisher => salesByPublisher[publisher]);

    const trace = {
        x: sales,
        y: publishers,
        type: 'bar',
        orientation: 'h',
        marker: {
            color: 'rgba(55,128,191,0.6)'
        }
    };

    const layout = {
        title: 'Top Publishers by Sales',
        xaxis: { title: 'Sales (Millions)' },
        yaxis: { title: 'Publisher' },
        margin: { l: 150 }
    };

    Plotly.newPlot('publisherChart', [trace], layout, { responsive: true });
}

function createRegionalChart() {
    const totalNA = filteredData.reduce((sum, game) => sum + game.NA_Sales, 0);
    const totalEU = filteredData.reduce((sum, game) => sum + game.EU_Sales, 0);
    const totalJP = filteredData.reduce((sum, game) => sum + game.JP_Sales, 0);
    const totalOther = filteredData.reduce((sum, game) => sum + game.Other_Sales, 0);

    const trace = {
        values: [totalNA, totalEU, totalJP, totalOther],
        labels: ['North America', 'Europe', 'Japan', 'Other Regions'],
        type: 'pie',
        marker: {
            colors: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728']
        }
    };

    const layout = {
        title: 'Regional Sales Distribution'
    };

    Plotly.newPlot('regionalChart', [trace], layout, { responsive: true });
}

function createYearlyBreakdownChart() {
    const yearlyData = filteredData.reduce((acc, game) => {
        const year = game.Year;
        if (!acc[year]) {
            acc[year] = { NA: 0, EU: 0, JP: 0, Other: 0 };
        }
        acc[year].NA += game.NA_Sales;
        acc[year].EU += game.EU_Sales;
        acc[year].JP += game.JP_Sales;
        acc[year].Other += game.Other_Sales;
        return acc;
    }, {});

    const years = Object.keys(yearlyData).sort();
    const regions = ['NA', 'EU', 'JP', 'Other'];
    const regionNames = ['North America', 'Europe', 'Japan', 'Other'];

    const traces = regions.map((region, i) => ({
        x: years,
        y: years.map(year => yearlyData[year][region]),
        name: regionNames[i],
        type: 'bar',
        marker: {
            color: [`rgba(31, 119, 180, 0.8)`, `rgba(255, 127, 14, 0.8)`, `rgba(44, 160, 44, 0.8)`, `rgba(214, 39, 40, 0.8)`][i]
        }
    }));

    const layout = {
        title: 'Yearly Sales by Region',
        xaxis: { title: 'Year', tickangle: -45 },
        yaxis: { title: 'Sales (Millions)' },
        barmode: 'stack'
    };

    Plotly.newPlot('yearlyBreakdownChart', traces, layout, { responsive: true });
}

function createTopGamesTable() {
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
                    <th>Genre</th>
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
                <td>${game.Genre}</td>
                <td style="font-weight: bold; color: #28a745;">${game.Global_Sales}</td>
            </tr>
        `;
    });

    tableHTML += `</tbody></table>`;

    document.getElementById('topGames').innerHTML = tableHTML;
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = message;
    document.body.prepend(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Video Games Sales EDA Tool Loaded');
    console.log('Click "Load Sample Data" to start exploring!');
});
