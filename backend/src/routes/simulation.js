import express from 'express';
import EcosystemSimulator from '../simulation/simulator.js';
import { broadcast } from '../server.js';

const router = express.Router();

// POST run simulation with given parameters
router.post('/run', async (req, res) => {
  try {
    const { parameters, saveResults = false, scenarioId } = req.body;

    // Validate parameters
    if (!parameters || !parameters.prey || !parameters.predator || !parameters.environment) {
      return res.status(400).json({ 
        error: 'Invalid parameters. Required: prey, predator, and environment configurations' 
      });
    }

    // Create and run simulation
    const simulator = new EcosystemSimulator(parameters);
    const results = simulator.simulate();

    // Broadcast initial results to WebSocket clients
    broadcast({
      type: 'simulation_complete',
      data: {
        parameters,
        results: {
          ...results,
          timeSteps: results.timeSteps.slice(0, 10) // Send only first 10 for preview
        }
      }
    });

    // If requested, save results to the scenario
    if (saveResults && scenarioId) {
      const Scenario = (await import('../models/Scenario.js')).default;
      await Scenario.findByIdAndUpdate(scenarioId, {
        simulationResults: results
      });
    }

    res.json({
      success: true,
      results,
      statistics: {
        totalTimeSteps: results.timeSteps.length,
        simulationDuration: results.summary.duration,
        equilibriumReached: results.equilibriumReached,
        extinctionOccurred: results.extinctionOccurred
      }
    });
  } catch (error) {
    console.error('Simulation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST run real-time simulation with streaming updates
router.post('/stream', async (req, res) => {
  try {
    const { parameters, updateInterval = 100 } = req.body;

    if (!parameters) {
      return res.status(400).json({ error: 'Parameters required' });
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    const simulator = new EcosystemSimulator(parameters);
    let lastUpdate = Date.now();
    let step = 0;

    // Stream simulation updates
    const interval = setInterval(() => {
      if (simulator.currentTime >= simulator.maxTime || 
          simulator.extinctionOccurred) {
        clearInterval(interval);
        const finalResults = simulator.getResults();
        res.write(`data: ${JSON.stringify({
          type: 'complete',
          results: finalResults
        })}\n\n`);
        res.end();
        return;
      }

      // Run simulation for a bit
      for (let i = 0; i < 10; i++) {
        const newPops = simulator.rungeKutta4Step(
          simulator.preyPop, 
          simulator.predatorPop, 
          simulator.currentTime
        );
        simulator.preyPop = newPops.prey;
        simulator.predatorPop = newPops.predator;
        simulator.currentTime += simulator.dt;

        if (simulator.checkExtinction()) {
          break;
        }
      }

      // Send update
      const update = {
        type: 'update',
        step: step++,
        time: simulator.currentTime,
        populations: {
          prey: simulator.preyPop,
          predator: simulator.predatorPop
        },
        resourceLevel: simulator.calculateResourceLevel(simulator.currentTime)
      };

      res.write(`data: ${JSON.stringify(update)}\n\n`);

      // Also broadcast to WebSocket clients
      broadcast({
        type: 'simulation_update',
        data: update
      });
    }, updateInterval);

    // Clean up on client disconnect
    req.on('close', () => {
      clearInterval(interval);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST predict equilibrium
router.post('/predict', async (req, res) => {
  try {
    const { parameters } = req.body;

    if (!parameters) {
      return res.status(400).json({ error: 'Parameters required' });
    }

    const prediction = EcosystemSimulator.predictEquilibrium(parameters);
    
    res.json({
      prediction,
      confidence: prediction.isStable ? 0.8 : 0.3,
      explanation: prediction.isStable 
        ? 'The system is likely to reach a stable equilibrium with these parameters.'
        : 'The system may be unstable or lead to extinction with these parameters.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST calculate phase space
router.post('/phase-space', async (req, res) => {
  try {
    const { parameters, resolution = 15 } = req.body;

    if (!parameters) {
      return res.status(400).json({ error: 'Parameters required' });
    }

    const phaseSpace = EcosystemSimulator.calculatePhaseSpace(parameters, resolution);
    
    res.json({
      phaseSpace,
      resolution,
      bounds: {
        preyMax: parameters.prey.carryingCapacity,
        predatorMax: parameters.predator.initialPopulation * 10
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET simulation presets
router.get('/presets', (req, res) => {
  const presets = [
    {
      name: 'Balanced Ecosystem',
      description: 'A stable ecosystem with moderate populations',
      parameters: {
        prey: {
          initialPopulation: 1000,
          birthRate: 1.0,
          carryingCapacity: 5000
        },
        predator: {
          initialPopulation: 100,
          huntingEfficiency: 0.01,
          deathRate: 0.5
        },
        environment: {
          resourceAvailability: 0.7,
          seasonalVariation: false,
          seasonalAmplitude: 0.2
        }
      }
    },
    {
      name: 'Predator Dominant',
      description: 'High predator pressure leading to potential prey extinction',
      parameters: {
        prey: {
          initialPopulation: 500,
          birthRate: 0.8,
          carryingCapacity: 3000
        },
        predator: {
          initialPopulation: 200,
          huntingEfficiency: 0.02,
          deathRate: 0.3
        },
        environment: {
          resourceAvailability: 0.5,
          seasonalVariation: false,
          seasonalAmplitude: 0.2
        }
      }
    },
    {
      name: 'Boom and Bust',
      description: 'Cyclic populations with seasonal variation',
      parameters: {
        prey: {
          initialPopulation: 2000,
          birthRate: 1.5,
          carryingCapacity: 8000
        },
        predator: {
          initialPopulation: 50,
          huntingEfficiency: 0.015,
          deathRate: 0.6
        },
        environment: {
          resourceAvailability: 0.6,
          seasonalVariation: true,
          seasonalAmplitude: 0.4
        }
      }
    },
    {
      name: 'Resource Scarcity',
      description: 'Limited resources constraining population growth',
      parameters: {
        prey: {
          initialPopulation: 800,
          birthRate: 0.6,
          carryingCapacity: 2000
        },
        predator: {
          initialPopulation: 80,
          huntingEfficiency: 0.008,
          deathRate: 0.7
        },
        environment: {
          resourceAvailability: 0.3,
          seasonalVariation: false,
          seasonalAmplitude: 0.1
        }
      }
    }
  ];

  res.json(presets);
});

export default router;
