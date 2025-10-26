import React from 'react';

const SimpleChart = ({ data, type = 'bar', title, height = 200 }) => {
  const renderBarChart = () => {
    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-2">📊</div>
            <p>No data available</p>
          </div>
        </div>
      );
    }

    const maxValue = Math.max(...data.map(item => item.value || item.amount || item.orders || 0));
    
    return (
      <div className="space-y-2">
        {data.map((item, index) => {
          const value = item.value || item.amount || item.orders || 0;
          const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
          
          return (
            <div key={index} className="flex items-center space-x-3">
              <div className="w-20 text-sm text-gray-600 truncate">
                {item.label || item.date || item.name || `Item ${index + 1}`}
              </div>
              <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                <div
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-6 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${percentage}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
                  {value.toLocaleString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderLineChart = () => {
    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-2">📈</div>
            <p>No data available</p>
          </div>
        </div>
      );
    }

    const maxValue = Math.max(...data.map(item => item.value || item.amount || item.orders || 0));
    const minValue = Math.min(...data.map(item => item.value || item.amount || item.orders || 0));
    const range = maxValue - minValue;
    
    return (
      <div className="relative h-full">
        <svg className="w-full h-full" viewBox="0 0 400 200">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
          </defs>
          
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((percent, index) => (
            <line
              key={index}
              x1="0"
              y1={percent * 2}
              x2="400"
              y2={percent * 2}
              stroke="#E5E7EB"
              strokeWidth="1"
            />
          ))}
          
          {/* Data line */}
          <polyline
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="3"
            points={data.map((item, index) => {
              const value = item.value || item.amount || item.orders || 0;
              const y = range > 0 ? 200 - ((value - minValue) / range) * 180 : 100;
              const x = (index / (data.length - 1)) * 380 + 10;
              return `${x},${y}`;
            }).join(' ')}
          />
          
          {/* Data points */}
          {data.map((item, index) => {
            const value = item.value || item.amount || item.orders || 0;
            const y = range > 0 ? 200 - ((value - minValue) / range) * 180 : 100;
            const x = (index / (data.length - 1)) * 380 + 10;
            
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="4"
                fill="#3B82F6"
                className="hover:r-6 transition-all duration-200"
              />
            );
          })}
        </svg>
        
        {/* X-axis labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-600 mt-2">
          {data.map((item, index) => (
            <span key={index} className="truncate">
              {item.label || item.date || item.name || `${index + 1}`}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const renderPieChart = () => {
    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-2">🥧</div>
            <p>No data available</p>
          </div>
        </div>
      );
    }

    const total = data.reduce((sum, item) => sum + (item.value || item.amount || item.orders || 0), 0);
    let currentAngle = 0;
    
    const colors = [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
      '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
    ];

    return (
      <div className="flex items-center justify-center h-full">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {data.map((item, index) => {
              const value = item.value || item.amount || item.orders || 0;
              const percentage = (value / total) * 100;
              const angle = (percentage / 100) * 360;
              
              const x1 = 50 + 50 * Math.cos((currentAngle * Math.PI) / 180);
              const y1 = 50 + 50 * Math.sin((currentAngle * Math.PI) / 180);
              const x2 = 50 + 50 * Math.cos(((currentAngle + angle) * Math.PI) / 180);
              const y2 = 50 + 50 * Math.sin(((currentAngle + angle) * Math.PI) / 180);
              
              const largeArcFlag = angle > 180 ? 1 : 0;
              
              const pathData = [
                `M 50 50`,
                `L ${x1} ${y1}`,
                `A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                'Z'
              ].join(' ');
              
              currentAngle += angle;
              
              return (
                <path
                  key={index}
                  d={pathData}
                  fill={colors[index % colors.length]}
                  className="hover:opacity-80 transition-opacity duration-200"
                />
              );
            })}
          </svg>
          
          {/* Center text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{total.toLocaleString()}</div>
              <div className="text-xs text-gray-600">Total</div>
            </div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="ml-4 space-y-1">
          {data.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span className="text-xs text-gray-700">
                {item.label || item.name || `Item ${index + 1}`}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderChart = () => {
    switch (type) {
      case 'line':
        return renderLineChart();
      case 'pie':
        return renderPieChart();
      case 'bar':
      default:
        return renderBarChart();
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 h-full">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <div style={{ height: `${height}px` }}>
        {renderChart()}
      </div>
    </div>
  );
};

export default SimpleChart;


