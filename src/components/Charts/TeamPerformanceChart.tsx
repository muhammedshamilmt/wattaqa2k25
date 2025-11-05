"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface TeamData {
  name: string;
  points: number;
  wins: number;
  color: string;
  [key: string]: any;
}

interface TeamPerformanceChartProps {
  data: TeamData[];
  type?: 'bar' | 'pie';
  title?: string;
}

const COLORS = ['#10B981', '#3B82F6', '#EF4444', '#F59E0B', '#8B5CF6'];

export function TeamPerformanceChart({ data, type = 'bar', title = 'Team Performance' }: TeamPerformanceChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-gray-500">No data available for chart</p>
        </div>
      </div>
    );
  }

  // Custom bar component to use team colors
  const CustomBar = ({ fill, ...props }: any) => {
    const teamData = data.find(team => team.name === props.payload?.name);
    return <Bar {...props} fill={teamData?.color || fill} />;
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>
      
      {type === 'bar' ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#ffffff', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value, name) => [value, name === 'points' ? 'Total Points' : 'Total Wins']}
            />
            <Legend />
            {data.map((entry, index) => (
              <Bar 
                key={`points-${index}`}
                dataKey="points" 
                fill={entry.color || COLORS[index % COLORS.length]}
                name="Total Points"
                radius={[2, 2, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value, percent }: any) => `${name}: ${value} (${((percent as number) * 100).toFixed(1)}%)`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="points"
              stroke="#ffffff"
              strokeWidth={2}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color || COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => [`${value} points`, 'Total Points']}
              contentStyle={{ 
                backgroundColor: '#ffffff', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}