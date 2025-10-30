import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import ParameterPanel from './components/ParameterPanel';
import EcosystemCanvas from './components/EcosystemCanvas';
import SimulationChart from './components/SimulationChart';
import ScenarioManager from './components/ScenarioManager';
import StatsPanel from './components/StatsPanel';
import { SimulationParameters, SimulationResults } from './types';
import { simulationApi } from './services/api';
import { useSimulationStore } from './store/simulationStore';
import './App.css';

const defaultParameters: SimulationParameters = {
  prey: {
    initialPopulation: 1000,
    birthRate: 1.0,
    carryingCapacity: 5000,
  },
  predator: {
    initialPopulation: 100,
    huntingEfficiency: 0.01,
    deathRate: 0.5,
  },
  environment: {
    resourceAvailability: 0.7,
    seasonalVariation: false,
    seasonalAmplitude: 0.2,
  },
};

function App() {
  const [parameters, setParameters] = useState<SimulationParameters>(defaultParameters);
  const [results, setResults] = useState<SimulationResults | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'simulation' | 'scenarios'>('simulation');
  
  const { 
    isConnected, 
    connectWebSocket, 
    disconnectWebSocket,
    liveData 
  } = useSimulationStore();

  useEffect(() => {
    // Connect to WebSocket on mount
    connectWebSocket();
    
    return () => {
      disconnectWebSocket();
    };
  }, [connectWebSocket, disconnectWebSocket]);

  const runSimulation = async () => {
    setIsSimulating(true);
    try {
      const response = await simulationApi.runSimulation(parameters);
      setResults(response.results);
    } catch (error) {
      console.error('Simulation failed:', error);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleParameterChange = (newParams: Partial<SimulationParameters>) => {
    setParameters(prev => ({
      ...prev,
      ...newParams,
    }));
  };

  const loadScenario = (scenarioParams: SimulationParameters) => {
    setParameters(scenarioParams);
    setResults(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-white shadow-lg border-b border-gray-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">🌿</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                Ecosystem Dynamics Sandbox
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-gray-600">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setSelectedTab('simulation')}
                  className={`px-4 py-2 rounded ${
                    selectedTab === 'simulation'
                      ? 'bg-white shadow-sm text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Simulation
                </button>
                <button
                  onClick={() => setSelectedTab('scenarios')}
                  className={`px-4 py-2 rounded ${
                    selectedTab === 'scenarios'
                      ? 'bg-white shadow-sm text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Scenarios
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedTab === 'simulation' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel - Parameters */}
            <motion.div 
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="lg:col-span-1"
            >
              <ParameterPanel
                parameters={parameters}
                onChange={handleParameterChange}
                onRun={runSimulation}
                isSimulating={isSimulating}
              />
            </motion.div>

            {/* Middle Panel - Visualization */}
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2 space-y-6"
            >
              {/* Ecosystem Canvas */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Ecosystem Visualization
                </h2>
                <EcosystemCanvas
                  preyCount={liveData?.populations?.prey || parameters.prey.initialPopulation}
                  predatorCount={liveData?.populations?.predator || parameters.predator.initialPopulation}
                  resourceLevel={liveData?.resourceLevel || parameters.environment.resourceAvailability}
                  maxPrey={parameters.prey.carryingCapacity}
                  maxPredator={500}
                />
              </div>

              {/* Charts */}
              {results && (
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-white rounded-xl shadow-lg p-6"
                >
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    Population Dynamics
                  </h2>
                  <SimulationChart data={results.timeSteps} />
                </motion.div>
              )}

              {/* Statistics */}
              {results && (
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <StatsPanel results={results} />
                </motion.div>
              )}
            </motion.div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <ScenarioManager 
              currentParameters={parameters}
              onLoadScenario={loadScenario}
            />
          </motion.div>
        )}
      </main>
    </div>
  );
}

export default App;
