export interface PreyParameters {
  initialPopulation: number;
  birthRate: number;
  carryingCapacity: number;
}

export interface PredatorParameters {
  initialPopulation: number;
  huntingEfficiency: number;
  deathRate: number;
}

export interface EnvironmentParameters {
  resourceAvailability: number;
  seasonalVariation: boolean;
  seasonalAmplitude: number;
}

export interface SimulationParameters {
  prey: PreyParameters;
  predator: PredatorParameters;
  environment: EnvironmentParameters;
}

export interface TimeStep {
  time: number;
  preyPopulation: number;
  predatorPopulation: number;
  resourceLevel: number;
}

export interface EquilibriumPoint {
  prey: number;
  predator: number;
  timeToReach: number;
}

export interface SimulationSummary {
  duration: number;
  maxPrey: number;
  maxPredator: number;
  minPrey: number;
  minPredator: number;
  finalPrey: number;
  finalPredator: number;
  averageResourceLevel: number;
}

export interface SimulationResults {
  timeSteps: TimeStep[];
  equilibriumReached: boolean;
  equilibriumPoint: EquilibriumPoint | null;
  extinctionOccurred: boolean;
  summary: SimulationSummary;
}

export interface Scenario {
  _id: string;
  name: string;
  description?: string;
  parameters: SimulationParameters;
  simulationResults?: SimulationResults;
  metadata: {
    createdBy: string;
    tags: string[];
    isPublic: boolean;
    views: number;
    likes: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface LiveSimulationUpdate {
  type: 'update' | 'complete';
  step?: number;
  time?: number;
  populations?: {
    prey: number;
    predator: number;
  };
  resourceLevel?: number;
  results?: SimulationResults;
}

export interface WebSocketMessage {
  type: 'connected' | 'simulation_update' | 'simulation_complete' | 'simulation_state';
  message?: string;
  data?: any;
}
