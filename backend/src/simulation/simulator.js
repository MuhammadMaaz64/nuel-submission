// Ecosystem Simulation Engine
// Implements modified Lotka-Volterra equations with environmental factors

export class EcosystemSimulator {
  constructor(parameters) {
    this.params = parameters;
    this.history = [];
    this.currentTime = 0;
    this.dt = 0.01; // Time step for numerical integration
    this.maxTime = 100; // Maximum simulation time
    
    // Initialize populations
    this.preyPop = parameters.prey.initialPopulation;
    this.predatorPop = parameters.predator.initialPopulation;
    
    // Track equilibrium detection
    this.equilibriumBuffer = [];
    this.equilibriumBufferSize = 50;
    this.equilibriumTolerance = 0.01;
    
    // Results tracking
    this.equilibriumReached = false;
    this.equilibriumPoint = null;
    this.extinctionOccurred = false;
  }

  // Calculate resource availability with seasonal variation
  calculateResourceLevel(time) {
    const base = this.params.environment.resourceAvailability;
    
    if (!this.params.environment.seasonalVariation) {
      return base;
    }
    
    const amplitude = this.params.environment.seasonalAmplitude;
    const seasonalFactor = Math.sin(2 * Math.PI * time / 12); // Annual cycle
    
    return Math.max(0, Math.min(1, base + amplitude * seasonalFactor));
  }

  // Modified Lotka-Volterra equations
  calculateDerivatives(prey, predator, resourceLevel) {
    const p = this.params;
    
    // Adjust birth rate based on resource availability
    const effectiveBirthRate = p.prey.birthRate * resourceLevel;
    
    // Prey equation with logistic growth
    const preyGrowth = effectiveBirthRate * prey;
    const predation = p.predator.huntingEfficiency * prey * predator;
    const preyCompetition = (p.prey.birthRate * prey * prey) / p.prey.carryingCapacity;
    
    const dPreyDt = preyGrowth - predation - preyCompetition;
    
    // Predator equation
    const predatorGrowth = p.predator.huntingEfficiency * 0.5 * prey * predator;
    const predatorDeath = p.predator.deathRate * predator;
    
    // Add starvation factor when prey is scarce
    const starvationFactor = prey < 10 ? 2.0 : 1.0;
    
    const dPredatorDt = predatorGrowth - predatorDeath * starvationFactor;
    
    return { dPreyDt, dPredatorDt };
  }

  // Runge-Kutta 4th order integration for accuracy
  rungeKutta4Step(prey, predator, time) {
    const resourceLevel = this.calculateResourceLevel(time);
    
    // k1
    const k1 = this.calculateDerivatives(prey, predator, resourceLevel);
    
    // k2
    const k2Prey = prey + 0.5 * this.dt * k1.dPreyDt;
    const k2Predator = predator + 0.5 * this.dt * k1.dPredatorDt;
    const k2 = this.calculateDerivatives(k2Prey, k2Predator, resourceLevel);
    
    // k3
    const k3Prey = prey + 0.5 * this.dt * k2.dPreyDt;
    const k3Predator = predator + 0.5 * this.dt * k2.dPredatorDt;
    const k3 = this.calculateDerivatives(k3Prey, k3Predator, resourceLevel);
    
    // k4
    const k4Prey = prey + this.dt * k3.dPreyDt;
    const k4Predator = predator + this.dt * k3.dPredatorDt;
    const k4 = this.calculateDerivatives(k4Prey, k4Predator, resourceLevel);
    
    // Combine
    const newPrey = Math.max(0, prey + (this.dt / 6) * 
      (k1.dPreyDt + 2*k2.dPreyDt + 2*k3.dPreyDt + k4.dPreyDt));
    
    const newPredator = Math.max(0, predator + (this.dt / 6) * 
      (k1.dPredatorDt + 2*k2.dPredatorDt + 2*k3.dPredatorDt + k4.dPredatorDt));
    
    return { prey: newPrey, predator: newPredator };
  }

  // Check for equilibrium
  checkEquilibrium() {
    if (this.history.length < this.equilibriumBufferSize) {
      return false;
    }
    
    const recent = this.history.slice(-this.equilibriumBufferSize);
    const avgPrey = recent.reduce((sum, h) => sum + h.preyPopulation, 0) / recent.length;
    const avgPredator = recent.reduce((sum, h) => sum + h.predatorPopulation, 0) / recent.length;
    
    // Check if populations are stable (low variance)
    const preyVariance = recent.reduce((sum, h) => 
      sum + Math.pow(h.preyPopulation - avgPrey, 2), 0) / recent.length;
    const predatorVariance = recent.reduce((sum, h) => 
      sum + Math.pow(h.predatorPopulation - avgPredator, 2), 0) / recent.length;
    
    const preyStable = Math.sqrt(preyVariance) / avgPrey < this.equilibriumTolerance;
    const predatorStable = Math.sqrt(predatorVariance) / avgPredator < this.equilibriumTolerance;
    
    if (preyStable && predatorStable) {
      this.equilibriumReached = true;
      this.equilibriumPoint = {
        prey: avgPrey,
        predator: avgPredator,
        timeToReach: this.currentTime
      };
      return true;
    }
    
    return false;
  }

  // Check for extinction
  checkExtinction() {
    if (this.preyPop < 1 || this.predatorPop < 1) {
      this.extinctionOccurred = true;
      return true;
    }
    return false;
  }

  // Run the complete simulation
  simulate() {
    const recordInterval = 0.1; // Record data every 0.1 time units
    let lastRecord = 0;
    
    while (this.currentTime < this.maxTime) {
      // Store history at intervals
      if (this.currentTime - lastRecord >= recordInterval) {
        this.history.push({
          time: Math.round(this.currentTime * 100) / 100,
          preyPopulation: Math.round(this.preyPop * 10) / 10,
          predatorPopulation: Math.round(this.predatorPop * 10) / 10,
          resourceLevel: this.calculateResourceLevel(this.currentTime)
        });
        lastRecord = this.currentTime;
      }
      
      // Perform integration step
      const newPops = this.rungeKutta4Step(this.preyPop, this.predatorPop, this.currentTime);
      this.preyPop = newPops.prey;
      this.predatorPop = newPops.predator;
      
      // Check for extinction
      if (this.checkExtinction()) {
        break;
      }
      
      // Check for equilibrium
      if (!this.equilibriumReached && this.checkEquilibrium()) {
        // Continue for a bit after equilibrium to confirm stability
        const extraTime = Math.min(10, this.maxTime - this.currentTime);
        this.maxTime = this.currentTime + extraTime;
      }
      
      this.currentTime += this.dt;
    }
    
    // Add final state
    this.history.push({
      time: Math.round(this.currentTime * 100) / 100,
      preyPopulation: Math.round(this.preyPop * 10) / 10,
      predatorPopulation: Math.round(this.predatorPop * 10) / 10,
      resourceLevel: this.calculateResourceLevel(this.currentTime)
    });
    
    return this.getResults();
  }

  // Get simulation results
  getResults() {
    return {
      timeSteps: this.history,
      equilibriumReached: this.equilibriumReached,
      equilibriumPoint: this.equilibriumPoint,
      extinctionOccurred: this.extinctionOccurred,
      summary: {
        duration: this.currentTime,
        maxPrey: Math.max(...this.history.map(h => h.preyPopulation)),
        maxPredator: Math.max(...this.history.map(h => h.predatorPopulation)),
        minPrey: Math.min(...this.history.map(h => h.preyPopulation)),
        minPredator: Math.min(...this.history.map(h => h.predatorPopulation)),
        finalPrey: this.preyPop,
        finalPredator: this.predatorPop,
        averageResourceLevel: this.history.reduce((sum, h) => 
          sum + h.resourceLevel, 0) / this.history.length
      }
    };
  }

  // Static analysis methods
  static predictEquilibrium(parameters) {
    // Simplified equilibrium prediction using linearization
    const p = parameters;
    
    // For simple Lotka-Volterra without carrying capacity
    const preyEquilibrium = p.predator.deathRate / 
      (p.predator.huntingEfficiency * 0.5);
    
    const predatorEquilibrium = (p.prey.birthRate * p.environment.resourceAvailability) / 
      p.predator.huntingEfficiency;
    
    // Adjust for carrying capacity
    const adjustedPreyEq = Math.min(preyEquilibrium, p.prey.carryingCapacity * 0.8);
    
    return {
      prey: adjustedPreyEq,
      predator: predatorEquilibrium,
      isStable: adjustedPreyEq > 0 && predatorEquilibrium > 0
    };
  }

  // Calculate phase space trajectory for visualization
  static calculatePhaseSpace(parameters, points = 20) {
    const trajectory = [];
    const preyRange = parameters.prey.carryingCapacity;
    const predatorRange = parameters.predator.initialPopulation * 10;
    
    for (let i = 0; i < points; i++) {
      const prey = (i / points) * preyRange;
      
      for (let j = 0; j < points; j++) {
        const predator = (j / points) * predatorRange;
        
        const sim = new EcosystemSimulator({
          ...parameters,
          prey: { ...parameters.prey, initialPopulation: prey },
          predator: { ...parameters.predator, initialPopulation: predator }
        });
        
        const derivatives = sim.calculateDerivatives(prey, predator, 
          parameters.environment.resourceAvailability);
        
        trajectory.push({
          x: prey,
          y: predator,
          dx: derivatives.dPreyDt,
          dy: derivatives.dPredatorDt
        });
      }
    }
    
    return trajectory;
  }
}

export default EcosystemSimulator;
