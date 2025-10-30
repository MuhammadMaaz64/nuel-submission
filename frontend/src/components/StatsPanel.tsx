import React from 'react';
import { motion } from 'framer-motion';
import { 
  FaChartLine, 
  FaBalanceScale, 
  FaSkull, 
  FaClock,
  FaArrowUp,
  FaArrowDown,
  FaEquals
} from 'react-icons/fa';
import { SimulationResults } from '../types';

interface StatsPanelProps {
  results: SimulationResults;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ results }) => {
  const { summary, equilibriumReached, equilibriumPoint, extinctionOccurred } = results;

  const getStatusColor = () => {
    if (extinctionOccurred) return 'red';
    if (equilibriumReached) return 'green';
    return 'yellow';
  };

  const getStatusIcon = () => {
    if (extinctionOccurred) return <FaSkull className="text-red-500" />;
    if (equilibriumReached) return <FaBalanceScale className="text-green-500" />;
    return <FaChartLine className="text-yellow-500" />;
  };

  const getStatusText = () => {
    if (extinctionOccurred) return 'Extinction Occurred';
    if (equilibriumReached) return 'Equilibrium Reached';
    return 'Dynamic System';
  };

  const stats = [
    {
      label: 'System Status',
      value: getStatusText(),
      icon: getStatusIcon(),
      color: getStatusColor(),
    },
    {
      label: 'Simulation Duration',
      value: `${summary.duration.toFixed(1)} time units`,
      icon: <FaClock className="text-blue-500" />,
      color: 'blue',
    },
    {
      label: 'Max Prey',
      value: Math.round(summary.maxPrey).toLocaleString(),
      icon: <FaArrowUp className="text-blue-500" />,
      color: 'blue',
    },
    {
      label: 'Max Predator',
      value: Math.round(summary.maxPredator).toLocaleString(),
      icon: <FaArrowUp className="text-red-500" />,
      color: 'red',
    },
    {
      label: 'Min Prey',
      value: Math.round(summary.minPrey).toLocaleString(),
      icon: <FaArrowDown className="text-blue-500" />,
      color: 'blue',
    },
    {
      label: 'Min Predator',
      value: Math.round(summary.minPredator).toLocaleString(),
      icon: <FaArrowDown className="text-red-500" />,
      color: 'red',
    },
    {
      label: 'Final Prey',
      value: Math.round(summary.finalPrey).toLocaleString(),
      icon: <FaEquals className="text-blue-500" />,
      color: 'blue',
    },
    {
      label: 'Final Predator',
      value: Math.round(summary.finalPredator).toLocaleString(),
      icon: <FaEquals className="text-red-500" />,
      color: 'red',
    },
    {
      label: 'Avg Resources',
      value: `${Math.round(summary.averageResourceLevel * 100)}%`,
      icon: <FaChartLine className="text-green-500" />,
      color: 'green',
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Simulation Statistics</h2>
      
      {/* Main Status Card */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`mb-6 p-4 rounded-lg border-2 bg-gradient-to-r 
          ${extinctionOccurred 
            ? 'from-red-50 to-red-100 border-red-300' 
            : equilibriumReached
            ? 'from-green-50 to-green-100 border-green-300'
            : 'from-yellow-50 to-yellow-100 border-yellow-300'
          }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              {getStatusIcon()}
              <h3 className="text-lg font-bold text-gray-800">{getStatusText()}</h3>
            </div>
            {equilibriumReached && equilibriumPoint && (
              <div className="text-sm text-gray-600">
                <p>Equilibrium reached at t={equilibriumPoint.timeToReach.toFixed(1)}</p>
                <p>Prey: {Math.round(equilibriumPoint.prey)} | Predator: {Math.round(equilibriumPoint.predator)}</p>
              </div>
            )}
            {extinctionOccurred && (
              <div className="text-sm text-gray-600">
                <p>One or more populations went extinct</p>
              </div>
            )}
          </div>
          <div className="text-4xl opacity-20">
            {extinctionOccurred ? '☠️' : equilibriumReached ? '⚖️' : '📊'}
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        {stats.slice(1).map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-gray-50 rounded-lg p-3"
          >
            <div className="flex items-center space-x-2 mb-1">
              {stat.icon}
              <span className="text-xs text-gray-500">{stat.label}</span>
            </div>
            <div className="text-sm font-semibold text-gray-800">
              {stat.value}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Insights */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Key Insights</h4>
        <ul className="space-y-1 text-xs text-gray-600">
          {equilibriumReached && (
            <li className="flex items-start space-x-1">
              <span className="text-green-500 mt-0.5">•</span>
              <span>The ecosystem reached a stable equilibrium, indicating balanced parameters.</span>
            </li>
          )}
          {extinctionOccurred && (
            <li className="flex items-start space-x-1">
              <span className="text-red-500 mt-0.5">•</span>
              <span>Extinction occurred - consider adjusting predator efficiency or prey birth rate.</span>
            </li>
          )}
          {summary.maxPrey > summary.finalPrey * 2 && (
            <li className="flex items-start space-x-1">
              <span className="text-yellow-500 mt-0.5">•</span>
              <span>Prey population experienced significant decline from its peak.</span>
            </li>
          )}
          {summary.averageResourceLevel < 0.3 && (
            <li className="flex items-start space-x-1">
              <span className="text-orange-500 mt-0.5">•</span>
              <span>Low average resource availability may be limiting population growth.</span>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default StatsPanel;
