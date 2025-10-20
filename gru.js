// gru.js
class GRUPredictor {
    constructor() {
        this.model = null;
        this.history = null;
        this.isTrained = false;
    }

    // Build the GRU model
    buildModel(inputShape, outputShape) {
        this.model = tf.sequential({
            layers: [
                tf.layers.gru({
                    units: 32,
                    returnSequences: true,
                    inputShape: inputShape
                }),
                tf.layers.dropout({ rate: 0.2 }),
                tf.layers.gru({
                    units: 16,
                    returnSequences: false
                }),
                tf.layers.dense({
                    units: outputShape,
                    activation: 'sigmoid'
                })
            ]
        });

        this.model.compile({
            optimizer: 'adam',
            loss: 'binaryCrossentropy',
            metrics: ['accuracy']
        });

        return this.model;
    }

    // Train the model
    async train(X_train, y_train, X_test, y_test, epochs = 50, batchSize = 8) {
        if (!this.model) {
            throw new Error('Model not built. Call buildModel() first.');
        }

        this.history = await this.model.fit(X_train, y_train, {
            epochs: epochs,
            batchSize: batchSize,
            validationData: [X_test, y_test],
            callbacks: {
                onEpochEnd: (epoch, logs) => {
                    console.log(`Epoch ${epoch + 1}: loss = ${logs.loss.toFixed(4)}, accuracy = ${logs.acc.toFixed(4)}`);
                    this.updateTrainingProgress(epoch, logs);
                }
            }
        });

        this.isTrained = true;
        return this.history;
    }

    // Update training progress in UI
    updateTrainingProgress(epoch, logs) {
        const progressDiv = document.getElementById('trainingProgress');
        if (progressDiv) {
            progressDiv.innerHTML = `
                <div class="success">
                    <strong>Epoch ${epoch + 1}</strong><br>
                    Loss: ${logs.loss.toFixed(4)} | Accuracy: ${logs.acc.toFixed(4)}<br>
                    Val Loss: ${logs.val_loss ? logs.val_loss.toFixed(4) : 'N/A'} | Val Accuracy: ${logs.val_acc ? logs.val_acc.toFixed(4) : 'N/A'}
                </div>
            `;
        }
    }

    // Evaluate model on test data
    async evaluate(X_test, y_test) {
        if (!this.isTrained) {
            throw new Error('Model not trained. Call train() first.');
        }

        const evaluation = this.model.evaluate(X_test, y_test);
        const loss = await evaluation[0].data();
        const accuracy = await evaluation[1].data();

        evaluation[0].dispose();
        evaluation[1].dispose();

        return {
            loss: loss[0],
            accuracy: accuracy[0]
        };
    }

    // Make predictions
    async predict(X) {
        if (!this.isTrained) {
            throw new Error('Model not trained. Call train() first.');
        }

        const predictions = this.model.predict(X);
        return predictions;
    }

    // Calculate per-platform accuracy
    async calculatePlatformAccuracy(y_true, y_pred, platforms, predictionHorizon) {
        const trueData = await y_true.array();
        const predData = await y_pred.array();
        
        const platformAccuracies = {};
        platforms.forEach((platform, platformIndex) => {
            let correct = 0;
            let total = 0;
            
            for (let i = 0; i < trueData.length; i++) {
                for (let offset = 0; offset < predictionHorizon; offset++) {
                    const outputIndex = platformIndex * predictionHorizon + offset;
                    const trueVal = trueData[i][outputIndex];
                    const predVal = predData[i][outputIndex] > 0.5 ? 1 : 0;
                    
                    if (trueVal === predVal) {
                        correct++;
                    }
                    total++;
                }
            }
            
            platformAccuracies[platform] = total > 0 ? correct / total : 0;
        });

        return platformAccuracies;
    }

    // Get model summary
    getModelSummary() {
        if (!this.model) {
            return 'Model not built.';
        }
        
        let summary = 'Model Architecture:\n';
        this.model.layers.forEach((layer, i) => {
            summary += `${i + 1}. ${layer.getClassName()}: ${JSON.stringify(layer.outputShape)}\n`;
        });
        
        return summary;
    }

    // Save model (for future use)
    async saveModel() {
        if (!this.isTrained) {
            throw new Error('Model not trained.');
        }
        await this.model.save('downloads://video-games-gru-model');
    }

    // Clean up
    dispose() {
        if (this.model) {
            this.model.dispose();
        }
    }
}
