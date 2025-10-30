import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  ComposedChart,
} from 'recharts';
import { TimeStep } from '../types';

interface SimulationChartProps {
  data: TimeStep[];
}

const SimulationChart: React.FC<SimulationChartProps> = ({ data }) => {
  // Prepare data for the chart
  const chartData = data.map(step => ({
    time: step.time.toFixed(1),
    prey: Math.round(step.preyPopulation),
    predator: Math.round(step.predatorPopulation),
    resources: Math.round(step.resourceLevel * 100),
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-700 mb-1">Time: {label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value.toLocaleString()}
              {entry.name === 'Resources' && '%'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis 
            dataKey="time" 
            label={{ value: 'Time', position: 'insideBottom', offset: -5 }}
            stroke="#666"
          />
          <YAxis 
            label={{ value: 'Population', angle: -90, position: 'insideLeft' }}
            stroke="#666"
          />
          <YAxis 
            yAxisId="resources"
            orientation="right"
            label={{ value: 'Resources (%)', angle: 90, position: 'insideRight' }}
            stroke="#666"
            domain={[0, 100]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />
          
          <Area
            yAxisId="resources"
            type="monotone"
            dataKey="resources"
            stroke="none"
            fill="#22c55e"
            fillOpacity={0.1}
            name="Resources"
          />
          
          <Line
            type="monotone"
            dataKey="prey"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            name="Prey"
            animationDuration={1000}
          />
          
          <Line
            type="monotone"
            dataKey="predator"
            stroke="#ef4444"
            strokeWidth={2}
            dot={false}
            name="Predator"
            animationDuration={1000}
            animationBegin={200}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SimulationChart;
