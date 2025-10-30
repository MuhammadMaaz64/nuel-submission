# 🌿 Ecosystem Dynamics Sandbox

An interactive web application for simulating predator-prey dynamics with environmental factors in real-time.

## 🎯 Concept

This sandbox allows users to explore complex ecosystem relationships by adjusting:
- **Prey Population** parameters (birth rate, carrying capacity)
- **Predator Population** parameters (hunting efficiency, death rate)
- **Environmental Factors** (resource availability, seasonal effects)

Users can visualize population dynamics through custom animated ecosystem visualization and interactive charts, with the ability to save and load different scenarios.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- MongoDB (local or cloud instance)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ecosystem-sandbox.git
cd ecosystem-sandbox
```

2. Install dependencies:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Set up environment variables:
```bash
# In backend directory, create .env file
cp .env.example .env
# Edit .env with your MongoDB connection string
```

4. Run the application:
```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev
```

5. Open http://localhost:5173 in your browser

### Docker Setup (Alternative)

```bash
docker-compose up
```

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React + TypeScript, Vite, TailwindCSS, Canvas API for custom visualization
- **Backend**: Node.js, Express, MongoDB, WebSocket for real-time updates
- **Simulation Engine**: Custom mathematical models based on Lotka-Volterra equations

### System Design

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│    React UI     │────▶│   Express API   │────▶│    MongoDB      │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                        │
        │                        │
        ▼                        ▼
┌─────────────────┐     ┌─────────────────┐
│  Custom Canvas  │     │   Simulation    │
│   Visualization │     │     Engine      │
└─────────────────┘     └─────────────────┘
```

### Key Features
- **Real-time Simulation**: Parameters update simulation instantly
- **Custom Visualization**: Animated ecosystem with prey/predator sprites
- **Persistence**: Save/load scenarios with MongoDB
- **Responsive Design**: Works on desktop and mobile
- **WebSocket Updates**: Live synchronization across tabs

### API Endpoints

- `GET /api/scenarios` - List saved scenarios
- `GET /api/scenarios/:id` - Get specific scenario
- `POST /api/scenarios` - Save new scenario
- `PUT /api/scenarios/:id` - Update scenario
- `DELETE /api/scenarios/:id` - Delete scenario
- `POST /api/simulate` - Run simulation with parameters
- `WS /api/live` - WebSocket for real-time updates

## 📊 Simulation Model

The simulation uses modified Lotka-Volterra equations:

```
dPrey/dt = αP - βPQ - γP²/K
dPredator/dt = δPQ - εQ
```

Where:
- α = prey birth rate
- β = predation rate
- γ = competition factor
- K = carrying capacity
- δ = predator efficiency
- ε = predator death rate

## 🎨 UI Features

- **Parameter Sliders**: Intuitive controls with real-time feedback
- **Ecosystem Canvas**: Custom animated visualization showing populations
- **Time Series Chart**: Population dynamics over time
- **Scenario Manager**: Save, load, and share configurations
- **Statistics Panel**: Key metrics and equilibrium predictions

## 📝 Development

### Project Structure
```
ecosystem-sandbox/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   └── simulation/
│   └── package.json
├── docker-compose.yml
└── README.md
```

### Testing
```bash
# Run backend tests
cd backend && npm test

# Run frontend tests
cd frontend && npm test
```

## 📄 License

MIT

## 🤝 Contributing

Pull requests are welcome! Please read CONTRIBUTING.md first.
