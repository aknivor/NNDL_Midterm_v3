// app.js
let gamesData = [];
let filteredData = [];

// Load and parse CSV data
async function loadData() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Please select a CSV file');
        return;
    }

    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const headers = lines[0].split(',').map(h => h.trim());
    
    gamesData = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const game = {};
        headers.forEach((header, index) => {
            // Handle numeric columns
            if (['Rank', 'Year', 'NA_Sales', 'EU_Sales', 'JP_Sales', 'Other_Sales', 'Global_Sales'].includes(header)) {
                game[header] = parseFloat(values[index]) || 0;
            } else {
                game[header] = values[index];
            }
        });
        return game;
    });

    filteredData = [...gamesData];
    displayDataInfo();
    displayDataPreview();
    populateFilters();
    createVisualizations();
}

// Display dataset information
function displayDataInfo() {
    const dataInfo = document.getElementById('dataInfo');
    dataInfo.innerHTML = `
        <p><strong>Dataset Shape:</strong> ${gamesData.length} rows × ${Object.keys(gamesData[0]).length} columns</p>
        <p><strong>Year Range:</strong> ${Math.min(...gamesData.map(g => g.Year))} - ${Math.max(...gamesData.map(g => g.Year))}</p>
        <p><strong>Total Global Sales:</strong> ${gamesData.reduce((sum, game) => sum + game.Global_Sales, 0).toFixed(2)} million</p>
    `;
}

// Display data preview table
function displayDataPreview() {
    const preview = document.getElementById('dataPreview');
    const headers = Object.keys(gamesData[0]);
    
    let tableHTML = '<table><tr>';
    headers.forEach(header => {
        tableHTML += `<th>${header}</th>`;
    });
    tableHTML += '</tr>';
    
    gamesData.slice(0, 10).forEach(game => {
        tableHTML += '<tr>';
        headers.forEach(header => {
            tableHTML += `<td>${game[header]}</td>`;
        });
        tableHTML += '</tr>';
    });
    tableHTML += '</table>';
    
    preview.innerHTML = `<h3>Data Preview (First 10 Rows)</h3>${tableHTML}`;
}

// Populate filter dropdowns
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
    select.innerHTML = '<option value="">All</option>';
    options.forEach(option => {
        select.innerHTML += `<option value="${option}">${option}</option>`;
    });
}

// Apply filters to data
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
    
    createVisualizations();
    updateSummaryStats();
}

function resetFilters() {
    filteredData = [...gamesData];
    document.getElementById('platformFilter').value = '';
    document.getElementById('genreFilter').value = '';
    document.getElementById('publisherFilter').value = '';
    document.getElementById('yearMin').value = '';
    document.getElementById('yearMax').value = '';
    createVisualizations();
    updateSummaryStats();
}

// Create all visualizations
function createVisualizations() {
    createSalesByYearChart();
    createSalesByPlatformChart();
    createSalesByGenreChart();
    createSalesByPublisherChart();
    createRegionalDistributionChart();
    createTopGamesChart();
}

// Sales by Year line chart
function createSalesByYearChart() {
    const salesByYear = filteredData.reduce((acc, game) => {
        const year = game.Year;
        if (!acc[year]) acc[year] = 0;
        acc[year] += game.Global_Sales;
        return acc;
    }, {});
    
    const years = Object.keys(salesByYear).sort();
    const values = years.map(year => salesByYear[year]);
    
    const data = [{
        x: years,
        y: values,
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Global Sales'
    }];
    
    const layout = {
        title: 'Global Sales by Year',
        xaxis: { title: 'Year' },
        yaxis: { title: 'Sales (millions)' }
    };
    
    tfvis.render.linechart({ name: 'Sales by Year', tab: 'Charts' }, data, layout);
}

// Sales by Platform bar chart
function createSalesByPlatformChart() {
    const salesByPlatform = filteredData.reduce((acc, game) => {
        const platform = game.Platform;
        if (!acc[platform]) acc[platform] = 0;
        acc[platform] += game.Global_Sales;
        return acc;
    }, {});
    
    const platforms = Object.keys(salesByPlatform).sort((a, b) => salesByPlatform[b] - salesByPlatform[a]).slice(0, 10);
    const values = platforms.map(platform => salesByPlatform[platform]);
    
    const data = [{
        x: platforms,
        y: values,
        type: 'bar'
    }];
    
    const layout = {
        title: 'Top 10 Platforms by Global Sales',
        xaxis: { title: 'Platform' },
        yaxis: { title: 'Sales (millions)' }
    };
    
    tfvis.render.barchart({ name: 'Sales by Platform', tab: 'Charts' }, data, layout);
}

// Sales by Genre bar chart
function createSalesByGenreChart() {
    const salesByGenre = filteredData.reduce((acc, game) => {
        const genre = game.Genre;
        if (!acc[genre]) acc[genre] = 0;
        acc[genre] += game.Global_Sales;
        return acc;
    }, {});
    
    const genres = Object.keys(salesByGenre).sort((a, b) => salesByGenre[b] - salesByGenre[a]);
    const values = genres.map(genre => salesByGenre[genre]);
    
    const data = [{
        x: genres,
        y: values,
        type: 'bar'
    }];
    
    const layout = {
        title: 'Sales by Genre',
        xaxis: { title: 'Genre' },
        yaxis: { title: 'Sales (millions)' }
    };
    
    tfvis.render.barchart({ name: 'Sales by Genre', tab: 'Charts' }, data, layout);
}

// Sales by Publisher bar chart
function createSalesByPublisherChart() {
    const salesByPublisher = filteredData.reduce((acc, game) => {
        const publisher = game.Publisher;
        if (!acc[publisher]) acc[publisher] = 0;
        acc[publisher] += game.Global_Sales;
        return acc;
    }, {});
    
    const publishers = Object.keys(salesByPublisher).sort((a, b) => salesByPublisher[b] - salesByPublisher[a]).slice(0, 10);
    const values = publishers.map(publisher => salesByPublisher[publisher]);
    
    const data = [{
        x: publishers,
        y: values,
        type: 'bar'
    }];
    
    const layout = {
        title: 'Top 10 Publishers by Global Sales',
        xaxis: { title: 'Publisher' },
        yaxis: { title: 'Sales (millions)' }
    };
    
    tfvis.render.barchart({ name: 'Sales by Publisher', tab: 'Charts' }, data, layout);
}

// Regional distribution pie chart
function createRegionalDistributionChart() {
    const totalNA = filteredData.reduce((sum, game) => sum + game.NA_Sales, 0);
    const totalEU = filteredData.reduce((sum, game) => sum + game.EU_Sales, 0);
    const totalJP = filteredData.reduce((sum, game) => sum + game.JP_Sales, 0);
    const totalOther = filteredData.reduce((sum, game) => sum + game.Other_Sales, 0);
    
    const data = [{
        values: [totalNA, totalEU, totalJP, totalOther],
        labels: ['North America', 'Europe', 'Japan', 'Other'],
        type: 'pie'
    }];
    
    const layout = {
        title: 'Regional Sales Distribution'
    };
    
    tfvis.render.piechart({ name: 'Regional Distribution', tab: 'Charts' }, data, layout);
}

// Top games table
function createTopGamesChart() {
    const topGames = [...filteredData]
        .sort((a, b) => b.Global_Sales - a.Global_Sales)
        .slice(0, 10);
    
    let tableHTML = '<table><tr><th>Rank</th><th>Name</th><th>Platform</th><th>Global Sales</th></tr>';
    topGames.forEach(game => {
        tableHTML += `<tr>
            <td>${game.Rank}</td>
            <td>${game.Name}</td>
            <td>${game.Platform}</td>
            <td>${game.Global_Sales}</td>
        </tr>`;
    });
    tableHTML += '</table>';
    
    document.getElementById('topGames').innerHTML = `<h3>Top 10 Games by Global Sales</h3>${tableHTML}`;
}

// Update summary statistics
function updateSummaryStats() {
    const stats = document.getElementById('summaryStats');
    const globalSales = filteredData.map(g => g.Global_Sales);
    
    stats.innerHTML = `
        <p><strong>Filtered Dataset:</strong> ${filteredData.length} games</p>
        <p><strong>Average Global Sales:</strong> ${(globalSales.reduce((a, b) => a + b, 0) / globalSales.length).toFixed(2)} million</p>
        <p><strong>Max Global Sales:</strong> ${Math.max(...globalSales).toFixed(2)} million</p>
        <p><strong>Total Global Sales:</strong> ${globalSales.reduce((a, b) => a + b, 0).toFixed(2)} million</p>
    `;
}
