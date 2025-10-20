// data-loader.js
class VideoGamesDataLoader {
    constructor() {
        this.gamesData = [];
        this.processedData = null;
        this.stockSymbols = [];
        this.features = ['NA_Sales', 'EU_Sales', 'JP_Sales', 'Other_Sales', 'Global_Sales'];
    }

    // Parse CSV data
    parseCSV(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim() !== '');
        const headers = lines[0].split(',').map(h => h.trim());
        
        return lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim());
            const game = {};
            headers.forEach((header, index) => {
                let value = values[index];
                if (['Rank', 'Year', 'NA_Sales', 'EU_Sales', 'JP_Sales', 'Other_Sales', 'Global_Sales'].includes(header)) {
                    value = parseFloat(value) || 0;
                }
                game[header] = value;
            });
            return game;
        });
    }

    // Load sample data for demonstration
    loadSampleData() {
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
10,Duck Hunt,NES,1984,Shooter,Nintendo,26.93,0.63,0.28,0.47,28.31
11,Nintendogs,DS,2005,Simulation,Nintendo,9.07,11,1.93,2.75,24.76
12,Mario Kart DS,DS,2005,Racing,Nintendo,9.81,7.57,4.13,1.92,23.42
13,Pokemon Gold/Pokemon Silver,GB,1999,Role-Playing,Nintendo,9,6.18,7.2,0.71,23.1
14,Wii Fit,Wii,2007,Sports,Nintendo,8.94,8.03,3.6,2.15,22.72
15,Wii Fit Plus,Wii,2009,Sports,Nintendo,9.09,8.59,2.53,1.79,22
16,Kinect Adventures!,X360,2010,Misc,Microsoft Game Studios,14.97,4.94,0.24,1.67,21.82
17,Grand Theft Auto V,PS3,2013,Action,Take-Two Interactive,7.01,9.27,0.97,4.14,21.4
18,Grand Theft Auto: San Andreas,PS2,2004,Action,Take-Two Interactive,9.43,0.4,0.41,10.57,20.81
19,Super Mario World,SNES,1990,Platform,Nintendo,12.78,3.75,3.54,0.55,20.61
20,Brain Age: Train Your Brain in Minutes a Day,DS,2005,Misc,Nintendo,4.75,9.26,4.16,2.05,20.22`;
        
        this.gamesData = this.parseCSV(sampleData);
        return this.gamesData;
    }

    // Prepare data for time series prediction
    prepareTimeSeriesData() {
        if (this.gamesData.length === 0) {
            throw new Error('No data loaded. Please load data first.');
        }

        // Group by year and calculate average sales per year for each platform
        const yearlyData = {};
        this.gamesData.forEach(game => {
            const year = game.Year;
            if (!yearlyData[year]) {
                yearlyData[year] = {};
            }
            if (!yearlyData[year][game.Platform]) {
                yearlyData[year][game.Platform] = {
                    NA_Sales: 0, EU_Sales: 0, JP_Sales: 0, Other_Sales: 0, Global_Sales: 0, count: 0
                };
            }
            const platformData = yearlyData[year][game.Platform];
            this.features.forEach(feature => {
                platformData[feature] += game[feature];
            });
            platformData.count++;
        });

        // Calculate averages and create time series
        const platforms = [...new Set(this.gamesData.map(g => g.Platform))].slice(0, 5); // Top 5 platforms
        const years = Object.keys(yearlyData).map(Number).sort((a, b) => a - b);
        
        // Create time series array
        const timeSeries = years.map(year => {
            const row = { year };
            platforms.forEach(platform => {
                if (yearlyData[year] && yearlyData[year][platform]) {
                    const data = yearlyData[year][platform];
                    this.features.forEach(feature => {
                        row[`${platform}_${feature}`] = data[feature] / data.count;
                    });
                } else {
                    this.features.forEach(feature => {
                        row[`${platform}_${feature}`] = 0;
                    });
                }
            });
            return row;
        });

        this.stockSymbols = platforms;
        return this.createSlidingWindows(timeSeries, platforms);
    }

    // Create sliding window samples for time series prediction
    createSlidingWindows(timeSeries, platforms) {
        const sequenceLength = 3; // 3 years of history
        const predictionHorizon = 2; // Predict next 2 years
        const samples = [];
        const targets = [];

        for (let i = sequenceLength; i < timeSeries.length - predictionHorizon; i++) {
            // Input: sequence of previous years
            const inputSequence = [];
            for (let j = i - sequenceLength; j < i; j++) {
                const features = [];
                platforms.forEach(platform => {
                    this.features.forEach(feature => {
                        features.push(timeSeries[j][`${platform}_${feature}`] || 0);
                    });
                });
                inputSequence.push(features);
            }

            // Output: binary classification for next 2 years for each platform
            const output = [];
            platforms.forEach(platform => {
                const currentGlobalSales = timeSeries[i][`${platform}_Global_Sales`] || 0;
                for (let offset = 1; offset <= predictionHorizon; offset++) {
                    const futureGlobalSales = timeSeries[i + offset][`${platform}_Global_Sales`] || 0;
                    // Binary label: 1 if sales increase, 0 if decrease
                    output.push(futureGlobalSales > currentGlobalSales ? 1 : 0);
                }
            });

            samples.push(inputSequence);
            targets.push(output);
        }

        // Convert to tensors
        const X = tf.tensor3d(samples);
        const y = tf.tensor2d(targets);

        // Split into train/test (80/20)
        const splitIndex = Math.floor(samples.length * 0.8);
        const X_train = X.slice([0, 0, 0], [splitIndex, -1, -1]);
        const X_test = X.slice([splitIndex, 0, 0], [-1, -1, -1]);
        const y_train = y.slice([0, 0], [splitIndex, -1]);
        const y_test = y.slice([splitIndex, 0], [-1, -1]);

        this.processedData = {
            X_train, X_test, y_train, y_test,
            inputShape: [sequenceLength, platforms.length * this.features.length],
            outputShape: platforms.length * predictionHorizon,
            platforms,
            features: this.features,
            predictionHorizon
        };

        return this.processedData;
    }

    // Normalize features (Min-Max scaling)
    normalizeFeatures(data) {
        // For simplicity, we'll assume data is already normalized in preparation
        return data;
    }

    // Get platform names (equivalent to stock symbols)
    getPlatforms() {
        return this.stockSymbols;
    }

    // Clean up tensors
    dispose() {
        if (this.processedData) {
            this.processedData.X_train.dispose();
            this.processedData.X_test.dispose();
            this.processedData.y_train.dispose();
            this.processedData.y_test.dispose();
        }
    }
}
