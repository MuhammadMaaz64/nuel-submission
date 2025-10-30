import { create } from 'zustand';
import { SimulationWebSocket } from '../services/api';
import { WebSocketMessage, LiveSimulationUpdate } from '../types';

interface SimulationStore {
  isConnected: boolean;
  liveData: LiveSimulationUpdate | null;
  wsConnection: SimulationWebSocket | null;
  connectWebSocket: () => void;
  disconnectWebSocket: () => void;
  sendMessage: (message: any) => void;
}

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  isConnected: false,
  liveData: null,
  wsConnection: null,

  connectWebSocket: () => {
    const { wsConnection } = get();
    
    if (wsConnection) {
      return; // Already connected
    }

    const ws = new SimulationWebSocket(
      // onMessage
      (data: WebSocketMessage) => {
        if (data.type === 'simulation_update' || data.type === 'simulation_state') {
          set({ liveData: data.data });
        }
      },
      // onConnect
      () => {
        set({ isConnected: true });
      },
      // onDisconnect
      () => {
        set({ isConnected: false });
      }
    );

    ws.connect();
    set({ wsConnection: ws });
  },

  disconnectWebSocket: () => {
    const { wsConnection } = get();
    
    if (wsConnection) {
      wsConnection.disconnect();
      set({ wsConnection: null, isConnected: false });
    }
  },

  sendMessage: (message: any) => {
    const { wsConnection } = get();
    
    if (wsConnection) {
      wsConnection.send(message);
    }
  },
}));
