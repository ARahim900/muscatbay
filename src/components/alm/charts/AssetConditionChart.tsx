
import React from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface AssetConditionData {
  name: string
  value: number
  color: string
}

interface AssetConditionChartProps {
  data: AssetConditionData[]
  title?: string
  height?: number | string
}

const AssetConditionChart: React.FC<AssetConditionChartProps> = ({ data, title, height = 300 }) => {
  // Check if data is empty or invalid
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-gray-500">No condition data available</p>
      </div>
    )
  }

  const totalAssets = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="flex flex-col">
      {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
      <div style={{ height: typeof height === 'number' ? `${height}px` : height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => [`${value} assets (${((value / totalAssets) * 100).toFixed(1)}%)`, 'Count']}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default AssetConditionChart
