import mongoose from 'mongoose';

const scenarioSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxLength: 100
  },
  description: {
    type: String,
    maxLength: 500
  },
  parameters: {
    prey: {
      initialPopulation: {
        type: Number,
        required: true,
        min: 0,
        max: 10000
      },
      birthRate: {
        type: Number,
        required: true,
        min: 0,
        max: 5
      },
      carryingCapacity: {
        type: Number,
        required: true,
        min: 100,
        max: 50000
      }
    },
    predator: {
      initialPopulation: {
        type: Number,
        required: true,
        min: 0,
        max: 5000
      },
      huntingEfficiency: {
        type: Number,
        required: true,
        min: 0,
        max: 1
      },
      deathRate: {
        type: Number,
        required: true,
        min: 0,
        max: 2
      }
    },
    environment: {
      resourceAvailability: {
        type: Number,
        required: true,
        min: 0,
        max: 1,
        default: 0.5
      },
      seasonalVariation: {
        type: Boolean,
        default: false
      },
      seasonalAmplitude: {
        type: Number,
        min: 0,
        max: 1,
        default: 0.2
      }
    }
  },
  simulationResults: {
    timeSteps: [{
      time: Number,
      preyPopulation: Number,
      predatorPopulation: Number,
      resourceLevel: Number
    }],
    equilibriumReached: {
      type: Boolean,
      default: false
    },
    equilibriumPoint: {
      prey: Number,
      predator: Number,
      timeToReach: Number
    },
    extinctionOccurred: {
      type: Boolean,
      default: false
    }
  },
  metadata: {
    createdBy: {
      type: String,
      default: 'anonymous'
    },
    tags: [{
      type: String,
      trim: true
    }],
    isPublic: {
      type: Boolean,
      default: false
    },
    views: {
      type: Number,
      default: 0
    },
    likes: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
scenarioSchema.index({ name: 'text', description: 'text' });
scenarioSchema.index({ 'metadata.isPublic': 1, createdAt: -1 });
scenarioSchema.index({ 'metadata.createdBy': 1 });

// Virtual for scenario age
scenarioSchema.virtual('age').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24)); // days
});

// Method to check if scenario leads to stable ecosystem
scenarioSchema.methods.isStable = function() {
  return this.simulationResults.equilibriumReached && 
         !this.simulationResults.extinctionOccurred;
};

// Static method to get popular scenarios
scenarioSchema.statics.getPopular = function(limit = 10) {
  return this.find({ 'metadata.isPublic': true })
    .sort({ 'metadata.likes': -1, 'metadata.views': -1 })
    .limit(limit);
};

const Scenario = mongoose.model('Scenario', scenarioSchema);

export default Scenario;
