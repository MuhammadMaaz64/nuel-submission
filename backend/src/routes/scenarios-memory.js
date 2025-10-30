import express from 'express';

const router = express.Router();

// In-memory storage for scenarios
let scenarios = [];
let nextId = 1;

// Seed with some initial scenarios
scenarios.push({
  _id: String(nextId++),
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
  },
  metadata: {
    createdBy: 'system',
    tags: ['stable', 'balanced'],
    isPublic: true,
    views: 0,
    likes: 0
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

scenarios.push({
  _id: String(nextId++),
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
  },
  metadata: {
    createdBy: 'system',
    tags: ['extinction', 'unstable'],
    isPublic: true,
    views: 0,
    likes: 0
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

// GET all scenarios
router.get('/', async (req, res) => {
  try {
    const { 
      public: isPublic, 
      createdBy, 
      search, 
      sortBy = 'createdAt',
      order = 'desc',
      limit = 20,
      page = 1 
    } = req.query;

    let filtered = [...scenarios];
    
    // Apply filters
    if (isPublic === 'true') {
      filtered = filtered.filter(s => s.metadata.isPublic);
    }
    
    if (createdBy) {
      filtered = filtered.filter(s => s.metadata.createdBy === createdBy);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(searchLower) ||
        s.description?.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortBy] || a.metadata[sortBy] || a.createdAt;
      let bVal = b[sortBy] || b.metadata[sortBy] || b.createdAt;
      
      if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }
      
      return order === 'asc' ? 
        (aVal > bVal ? 1 : -1) : 
        (aVal < bVal ? 1 : -1);
    });

    // Paginate
    const startIdx = (parseInt(page) - 1) * parseInt(limit);
    const endIdx = startIdx + parseInt(limit);
    const paginated = filtered.slice(startIdx, endIdx);

    res.json({
      scenarios: paginated,
      pagination: {
        total: filtered.length,
        page: parseInt(page),
        pages: Math.ceil(filtered.length / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single scenario by ID
router.get('/:id', async (req, res) => {
  try {
    const scenario = scenarios.find(s => s._id === req.params.id);
    
    if (!scenario) {
      return res.status(404).json({ error: 'Scenario not found' });
    }

    // Increment view count
    scenario.metadata.views += 1;

    res.json(scenario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET popular scenarios
router.get('/popular', async (req, res) => {
  try {
    const publicScenarios = scenarios
      .filter(s => s.metadata.isPublic)
      .sort((a, b) => {
        const scoreA = a.metadata.likes * 2 + a.metadata.views;
        const scoreB = b.metadata.likes * 2 + b.metadata.views;
        return scoreB - scoreA;
      })
      .slice(0, 10);
    
    res.json(publicScenarios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create new scenario
router.post('/', async (req, res) => {
  try {
    const { name, description, parameters, simulationResults, metadata } = req.body;

    // Validate required fields
    if (!name || !parameters) {
      return res.status(400).json({ error: 'Name and parameters are required' });
    }

    const newScenario = {
      _id: String(nextId++),
      name,
      description,
      parameters,
      simulationResults,
      metadata: {
        ...metadata,
        createdBy: metadata?.createdBy || 'anonymous',
        views: 0,
        likes: 0
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    scenarios.push(newScenario);
    res.status(201).json(newScenario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update scenario
router.put('/:id', async (req, res) => {
  try {
    const { name, description, parameters, simulationResults, metadata } = req.body;

    const scenarioIndex = scenarios.findIndex(s => s._id === req.params.id);
    
    if (scenarioIndex === -1) {
      return res.status(404).json({ error: 'Scenario not found' });
    }

    const scenario = scenarios[scenarioIndex];

    // Update fields
    if (name) scenario.name = name;
    if (description) scenario.description = description;
    if (parameters) scenario.parameters = parameters;
    if (simulationResults) scenario.simulationResults = simulationResults;
    if (metadata) {
      scenario.metadata = { ...scenario.metadata, ...metadata };
    }
    scenario.updatedAt = new Date().toISOString();

    scenarios[scenarioIndex] = scenario;
    res.json(scenario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE scenario
router.delete('/:id', async (req, res) => {
  try {
    const scenarioIndex = scenarios.findIndex(s => s._id === req.params.id);
    
    if (scenarioIndex === -1) {
      return res.status(404).json({ error: 'Scenario not found' });
    }

    scenarios.splice(scenarioIndex, 1);
    res.json({ message: 'Scenario deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST like scenario
router.post('/:id/like', async (req, res) => {
  try {
    const scenario = scenarios.find(s => s._id === req.params.id);
    
    if (!scenario) {
      return res.status(404).json({ error: 'Scenario not found' });
    }

    scenario.metadata.likes += 1;
    res.json({ likes: scenario.metadata.likes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST duplicate scenario
router.post('/:id/duplicate', async (req, res) => {
  try {
    const original = scenarios.find(s => s._id === req.params.id);
    
    if (!original) {
      return res.status(404).json({ error: 'Scenario not found' });
    }

    const duplicate = {
      _id: String(nextId++),
      name: `${original.name} (Copy)`,
      description: original.description,
      parameters: JSON.parse(JSON.stringify(original.parameters)), // Deep copy
      metadata: {
        ...original.metadata,
        createdBy: req.body.createdBy || 'anonymous',
        isPublic: false,
        views: 0,
        likes: 0
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    scenarios.push(duplicate);
    res.status(201).json(duplicate);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
