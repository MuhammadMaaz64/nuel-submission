import express from 'express';
import Scenario from '../models/Scenario.js';

const router = express.Router();

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

    const query = {};
    
    if (isPublic === 'true') {
      query['metadata.isPublic'] = true;
    }
    
    if (createdBy) {
      query['metadata.createdBy'] = createdBy;
    }
    
    if (search) {
      query.$text = { $search: search };
    }

    const sortOptions = {};
    sortOptions[sortBy] = order === 'asc' ? 1 : -1;

    const scenarios = await Scenario
      .find(query)
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .select('-simulationResults.timeSteps'); // Exclude heavy data for list view

    const total = await Scenario.countDocuments(query);

    res.json({
      scenarios,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single scenario by ID
router.get('/:id', async (req, res) => {
  try {
    const scenario = await Scenario.findById(req.params.id);
    
    if (!scenario) {
      return res.status(404).json({ error: 'Scenario not found' });
    }

    // Increment view count
    scenario.metadata.views += 1;
    await scenario.save();

    res.json(scenario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET popular scenarios
router.get('/popular', async (req, res) => {
  try {
    const scenarios = await Scenario.getPopular(10);
    res.json(scenarios);
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

    const scenario = new Scenario({
      name,
      description,
      parameters,
      simulationResults,
      metadata: {
        ...metadata,
        createdBy: metadata?.createdBy || 'anonymous'
      }
    });

    const savedScenario = await scenario.save();
    res.status(201).json(savedScenario);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

// PUT update scenario
router.put('/:id', async (req, res) => {
  try {
    const { name, description, parameters, simulationResults, metadata } = req.body;

    const scenario = await Scenario.findById(req.params.id);
    
    if (!scenario) {
      return res.status(404).json({ error: 'Scenario not found' });
    }

    // Update fields
    if (name) scenario.name = name;
    if (description) scenario.description = description;
    if (parameters) scenario.parameters = parameters;
    if (simulationResults) scenario.simulationResults = simulationResults;
    if (metadata) {
      scenario.metadata = { ...scenario.metadata.toObject(), ...metadata };
    }

    const updatedScenario = await scenario.save();
    res.json(updatedScenario);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

// DELETE scenario
router.delete('/:id', async (req, res) => {
  try {
    const scenario = await Scenario.findByIdAndDelete(req.params.id);
    
    if (!scenario) {
      return res.status(404).json({ error: 'Scenario not found' });
    }

    res.json({ message: 'Scenario deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST like scenario
router.post('/:id/like', async (req, res) => {
  try {
    const scenario = await Scenario.findById(req.params.id);
    
    if (!scenario) {
      return res.status(404).json({ error: 'Scenario not found' });
    }

    scenario.metadata.likes += 1;
    await scenario.save();

    res.json({ likes: scenario.metadata.likes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST duplicate scenario
router.post('/:id/duplicate', async (req, res) => {
  try {
    const original = await Scenario.findById(req.params.id);
    
    if (!original) {
      return res.status(404).json({ error: 'Scenario not found' });
    }

    const duplicate = new Scenario({
      name: `${original.name} (Copy)`,
      description: original.description,
      parameters: original.parameters,
      metadata: {
        createdBy: req.body.createdBy || 'anonymous',
        tags: original.metadata.tags,
        isPublic: false
      }
    });

    const savedDuplicate = await duplicate.save();
    res.status(201).json(savedDuplicate);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
