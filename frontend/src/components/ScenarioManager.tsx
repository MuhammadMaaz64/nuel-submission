import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaSave,
  FaFolder,
  FaTrash,
  FaHeart,
  FaCopy,
  FaGlobe,
  FaLock,
  FaSearch,
  FaEye,
  FaTags,
} from 'react-icons/fa';
import { SimulationParameters, Scenario } from '../types';
import { scenarioApi } from '../services/api';
import toast from 'react-hot-toast';

interface ScenarioManagerProps {
  currentParameters: SimulationParameters;
  onLoadScenario: (params: SimulationParameters) => void;
}

const ScenarioManager: React.FC<ScenarioManagerProps> = ({
  currentParameters,
  onLoadScenario,
}) => {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'public' | 'mine'>('all');
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  
  const [saveForm, setSaveForm] = useState({
    name: '',
    description: '',
    tags: '',
    isPublic: false,
    createdBy: localStorage.getItem('username') || 'anonymous',
  });

  useEffect(() => {
    loadScenarios();
  }, [filter]);

  const loadScenarios = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (filter === 'public') params.public = true;
      if (filter === 'mine') params.createdBy = saveForm.createdBy;
      if (searchQuery) params.search = searchQuery;
      
      const data = await scenarioApi.getScenarios(params);
      setScenarios(data.scenarios);
    } catch (error) {
      toast.error('Failed to load scenarios');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!saveForm.name) {
      toast.error('Please enter a scenario name');
      return;
    }

    try {
      const scenario = await scenarioApi.createScenario({
        name: saveForm.name,
        description: saveForm.description,
        parameters: currentParameters,
        metadata: {
          createdBy: saveForm.createdBy,
          tags: saveForm.tags.split(',').map(t => t.trim()).filter(Boolean),
          isPublic: saveForm.isPublic,
          views: 0,
          likes: 0,
        },
      });
      
      toast.success('Scenario saved successfully!');
      setShowSaveModal(false);
      loadScenarios();
      
      // Save username for future use
      localStorage.setItem('username', saveForm.createdBy);
    } catch (error) {
      toast.error('Failed to save scenario');
    }
  };

  const handleLoad = (scenario: Scenario) => {
    onLoadScenario(scenario.parameters);
    setSelectedScenario(scenario);
    toast.success(`Loaded: ${scenario.name}`);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this scenario?')) {
      try {
        await scenarioApi.deleteScenario(id);
        toast.success('Scenario deleted');
        loadScenarios();
      } catch (error) {
        toast.error('Failed to delete scenario');
      }
    }
  };

  const handleLike = async (id: string) => {
    try {
      await scenarioApi.likeScenario(id);
      loadScenarios();
    } catch (error) {
      toast.error('Failed to like scenario');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await scenarioApi.duplicateScenario(id, saveForm.createdBy);
      toast.success('Scenario duplicated');
      loadScenarios();
    } catch (error) {
      toast.error('Failed to duplicate scenario');
    }
  };

  const filteredScenarios = scenarios.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Scenario Library</h2>
          <button
            onClick={() => setShowSaveModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <FaSave />
            <span>Save Current</span>
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex space-x-4 mb-6">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search scenarios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadScenarios()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['all', 'public', 'mine'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded capitalize transition-colors ${
                  filter === f
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {f === 'mine' ? 'My Scenarios' : f}
              </button>
            ))}
          </div>
        </div>

        {/* Scenarios Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filteredScenarios.map((scenario, index) => (
                <motion.div
                  key={scenario._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-gray-50 rounded-lg p-4 hover:shadow-lg transition-all cursor-pointer border border-gray-200 hover:border-blue-300"
                  onClick={() => handleLoad(scenario)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-800 flex items-center space-x-2">
                      {scenario.metadata.isPublic ? (
                        <FaGlobe className="text-green-500 text-sm" />
                      ) : (
                        <FaLock className="text-gray-400 text-sm" />
                      )}
                      <span>{scenario.name}</span>
                    </h3>
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="flex items-center space-x-1 text-gray-500">
                        <FaEye size={12} />
                        <span>{scenario.metadata.views}</span>
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLike(scenario._id);
                        }}
                        className="flex items-center space-x-1 text-red-500 hover:text-red-600"
                      >
                        <FaHeart size={12} />
                        <span>{scenario.metadata.likes}</span>
                      </button>
                    </div>
                  </div>
                  
                  {scenario.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {scenario.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>By {scenario.metadata.createdBy}</span>
                    <span>{new Date(scenario.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  {scenario.metadata.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {scenario.metadata.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex space-x-2 mt-3 pt-3 border-t border-gray-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLoad(scenario);
                      }}
                      className="flex-1 text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                    >
                      Load
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicate(scenario._id);
                      }}
                      className="flex-1 text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                    >
                      <FaCopy className="inline mr-1" /> Copy
                    </button>
                    {scenario.metadata.createdBy === saveForm.createdBy && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(scenario._id);
                        }}
                        className="flex-1 text-xs px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                      >
                        <FaTrash className="inline mr-1" /> Delete
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Save Modal */}
      <AnimatePresence>
        {showSaveModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowSaveModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4">Save Scenario</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={saveForm.name}
                    onChange={(e) => setSaveForm({ ...saveForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="My Ecosystem Scenario"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={saveForm.description}
                    onChange={(e) => setSaveForm({ ...saveForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Describe your scenario..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={saveForm.tags}
                    onChange={(e) => setSaveForm({ ...saveForm, tags: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="stable, cyclic, extinction"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Created By
                  </label>
                  <input
                    type="text"
                    value={saveForm.createdBy}
                    onChange={(e) => setSaveForm({ ...saveForm, createdBy: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your name"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={saveForm.isPublic}
                      onChange={(e) => setSaveForm({ ...saveForm, isPublic: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Make public</span>
                  </label>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ScenarioManager;
