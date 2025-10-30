import axios from 'axios';
import { 
  SimulationParameters, 
  SimulationResults, 
  Scenario,
  LiveSimulationUpdate 
} from '../types';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const simulationApi = {
  // Run a simulation
  async runSimulation(parameters: SimulationParameters, saveResults = false, scenarioId?: string) {
    const response = await api.post('/simulation/run', {
      parameters,
      saveResults,
      scenarioId,
    });
    return response.data;
  },

  // Get simulation presets
  async getPresets() {
    const response = await api.get('/simulation/presets');
    return response.data;
  },

  // Predict equilibrium
  async predictEquilibrium(parameters: SimulationParameters) {
    const response = await api.post('/simulation/predict', { parameters });
    return response.data;
  },

  // Get phase space data
  async getPhaseSpace(parameters: SimulationParameters, resolution = 15) {
    const response = await api.post('/simulation/phase-space', { 
      parameters, 
      resolution 
    });
    return response.data;
  },

  // Stream simulation updates
  streamSimulation(
    parameters: SimulationParameters, 
    onUpdate: (update: LiveSimulationUpdate) => void,
    onComplete: () => void
  ) {
    const eventSource = new EventSource('/api/simulation/stream');
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'complete') {
        onComplete();
        eventSource.close();
      } else {
        onUpdate(data);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      onComplete();
    };

    // Send parameters to start streaming
    api.post('/simulation/stream', { parameters });

    return eventSource;
  },
};

export const scenarioApi = {
  // Get all scenarios
  async getScenarios(params?: {
    public?: boolean;
    createdBy?: string;
    search?: string;
    sortBy?: string;
    order?: 'asc' | 'desc';
    limit?: number;
    page?: number;
  }) {
    const response = await api.get('/scenarios', { params });
    return response.data;
  },

  // Get single scenario
  async getScenario(id: string) {
    const response = await api.get(`/scenarios/${id}`);
    return response.data;
  },

  // Get popular scenarios
  async getPopularScenarios() {
    const response = await api.get('/scenarios/popular');
    return response.data;
  },

  // Create scenario
  async createScenario(scenario: Omit<Scenario, '_id' | 'createdAt' | 'updatedAt'>) {
    const response = await api.post('/scenarios', scenario);
    return response.data;
  },

  // Update scenario
  async updateScenario(id: string, updates: Partial<Scenario>) {
    const response = await api.put(`/scenarios/${id}`, updates);
    return response.data;
  },

  // Delete scenario
  async deleteScenario(id: string) {
    const response = await api.delete(`/scenarios/${id}`);
    return response.data;
  },

  // Like scenario
  async likeScenario(id: string) {
    const response = await api.post(`/scenarios/${id}/like`);
    return response.data;
  },

  // Duplicate scenario
  async duplicateScenario(id: string, createdBy?: string) {
    const response = await api.post(`/scenarios/${id}/duplicate`, { createdBy });
    return response.data;
  },
};

// WebSocket connection for real-time updates
export class SimulationWebSocket {
  private ws: WebSocket | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  
  constructor(
    private onMessage: (data: any) => void,
    private onConnect: () => void,
    private onDisconnect: () => void
  ) {}

  connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/live`;
    
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.onConnect();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.onMessage(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.onDisconnect();
      this.attemptReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket is not connected');
    }
  }
}

export default api;
