import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaPlay, FaRedo, FaSave, FaQuestionCircle } from 'react-icons/fa';
import { SimulationParameters } from '../types';
import { simulationApi } from '../services/api';
import toast from 'react-hot-toast';

interface ParameterPanelProps {
  parameters: SimulationParameters;
  onChange: (params: Partial<SimulationParameters>) => void;
  onRun: () => void;
  isSimulating: boolean;
}

const ParameterPanel: React.FC<ParameterPanelProps> = ({
  parameters,
  onChange,
  onRun,
  isSimulating,
}) => {
  const [showHelp, setShowHelp] = useState<string | null>(null);
  const [presets, setPresets] = useState<any[]>([]);
  const [showPresets, setShowPresets] = useState(false);

  React.useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = async () => {
    try {
      const data = await simulationApi.getPresets();
      setPresets(data);
    } catch (error) {
      console.error('Failed to load presets:', error);
    }
  };

  const handlePresetSelect = (preset: any) => {
    onChange(preset.parameters);
    toast.success(`Loaded preset: ${preset.name}`);
    setShowPresets(false);
  };

  const parameterGroups = [
    {
      title: 'Prey Population',
      icon: '🐟',
      color: 'blue',
      params: [
        {
          key: 'prey.initialPopulation',
          label: 'Initial Population',
          min: 0,
          max: 10000,
          step: 100,
          value: parameters.prey.initialPopulation,
          help: 'Starting number of prey organisms in the ecosystem',
        },
        {
          key: 'prey.birthRate',
          label: 'Birth Rate',
          min: 0,
          max: 5,
          step: 0.1,
          value: parameters.prey.birthRate,
          help: 'Rate at which prey reproduce (per capita per time unit)',
        },
        {
          key: 'prey.carryingCapacity',
          label: 'Carrying Capacity',
          min: 100,
          max: 50000,
          step: 500,
          value: parameters.prey.carryingCapacity,
          help: 'Maximum sustainable prey population',
        },
      ],
    },
    {
      title: 'Predator Population',
      icon: '🦈',
      color: 'red',
      params: [
        {
          key: 'predator.initialPopulation',
          label: 'Initial Population',
          min: 0,
          max: 5000,
          step: 50,
          value: parameters.predator.initialPopulation,
          help: 'Starting number of predator organisms',
        },
        {
          key: 'predator.huntingEfficiency',
          label: 'Hunting Efficiency',
          min: 0,
          max: 0.1,
          step: 0.001,
          value: parameters.predator.huntingEfficiency,
          help: 'Effectiveness of predators at catching prey',
        },
        {
          key: 'predator.deathRate',
          label: 'Death Rate',
          min: 0,
          max: 2,
          step: 0.1,
          value: parameters.predator.deathRate,
          help: 'Natural death rate of predators',
        },
      ],
    },
    {
      title: 'Environment',
      icon: '🌿',
      color: 'green',
      params: [
        {
          key: 'environment.resourceAvailability',
          label: 'Resource Availability',
          min: 0,
          max: 1,
          step: 0.05,
          value: parameters.environment.resourceAvailability,
          help: 'Overall resource richness of the environment',
        },
        {
          key: 'environment.seasonalAmplitude',
          label: 'Seasonal Amplitude',
          min: 0,
          max: 1,
          step: 0.05,
          value: parameters.environment.seasonalAmplitude,
          help: 'Strength of seasonal variations',
          disabled: !parameters.environment.seasonalVariation,
        },
      ],
    },
  ];

  const handleParameterChange = (path: string, value: number | boolean) => {
    const keys = path.split('.');
    const newParams: any = { ...parameters };
    
    if (keys.length === 2) {
      newParams[keys[0]][keys[1]] = value;
    }
    
    onChange(newParams);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Simulation Parameters</h2>
        
        {/* Preset Selector */}
        <div className="mb-6">
          <button
            onClick={() => setShowPresets(!showPresets)}
            className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-left font-medium text-gray-700 transition-colors"
          >
            Load Preset Configuration ▼
          </button>
          
          {showPresets && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 bg-gray-50 rounded-lg p-2 space-y-1"
            >
              {presets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePresetSelect(preset)}
                  className="w-full text-left px-3 py-2 hover:bg-white rounded-lg transition-colors"
                >
                  <div className="font-medium text-gray-800">{preset.name}</div>
                  <div className="text-sm text-gray-500">{preset.description}</div>
                </button>
              ))}
            </motion.div>
          )}
        </div>

        {/* Parameter Groups */}
        {parameterGroups.map((group, groupIdx) => (
          <motion.div
            key={group.title}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: groupIdx * 0.1 }}
            className="mb-6"
          >
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-2xl">{group.icon}</span>
              <h3 className={`font-semibold text-${group.color}-600`}>
                {group.title}
              </h3>
            </div>

            <div className="space-y-3">
              {group.params.map((param) => (
                <div key={param.key} className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium text-gray-700">
                      {param.label}
                    </label>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-mono text-gray-600">
                        {param.value.toFixed(param.step < 1 ? 2 : 0)}
                      </span>
                      <button
                        onMouseEnter={() => setShowHelp(param.key)}
                        onMouseLeave={() => setShowHelp(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <FaQuestionCircle size={14} />
                      </button>
                    </div>
                  </div>
                  
                  <input
                    type="range"
                    min={param.min}
                    max={param.max}
                    step={param.step}
                    value={param.value}
                    onChange={(e) => handleParameterChange(param.key, parseFloat(e.target.value))}
                    disabled={param.disabled}
                    className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer 
                      ${param.disabled ? 'opacity-50' : ''} 
                      slider-${group.color}`}
                  />

                  {showHelp === param.key && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute z-10 top-0 right-0 transform translate-x-2 -translate-y-full
                        bg-gray-800 text-white text-xs rounded-lg p-2 max-w-xs"
                    >
                      {param.help}
                    </motion.div>
                  )}
                </div>
              ))}

              {/* Seasonal Variation Toggle */}
              {group.title === 'Environment' && (
                <div className="flex items-center justify-between pt-2">
                  <label className="text-sm font-medium text-gray-700">
                    Seasonal Variation
                  </label>
                  <button
                    onClick={() => handleParameterChange('environment.seasonalVariation', !parameters.environment.seasonalVariation)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                      ${parameters.environment.seasonalVariation ? 'bg-green-500' : 'bg-gray-300'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                        ${parameters.environment.seasonalVariation ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4 border-t">
          <button
            onClick={onRun}
            disabled={isSimulating}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all
              ${isSimulating 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-500 to-green-500 text-white hover:from-blue-600 hover:to-green-600 shadow-lg hover:shadow-xl'
              }`}
          >
            <FaPlay />
            <span>{isSimulating ? 'Simulating...' : 'Run Simulation'}</span>
          </button>
          
          <button
            onClick={() => onChange(parameters)}
            className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-gray-700 transition-colors"
          >
            <FaRedo />
          </button>
        </div>
      </div>

      <style jsx>{`
        input[type="range"].slider-blue::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          background: #3b82f6;
          border-radius: 50%;
          cursor: pointer;
        }
        
        input[type="range"].slider-red::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          background: #ef4444;
          border-radius: 50%;
          cursor: pointer;
        }
        
        input[type="range"].slider-green::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          background: #22c55e;
          border-radius: 50%;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default ParameterPanel;
