// client/src/components/tabs/YearBarChart.js
import React, { useState, useEffect } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import api from '../../api';

const YearBarChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [visibleSeries, setVisibleSeries] = useState({
    sales: true,
    profit: true,
    yoyGrowth: true
  });

  useEffect(() => {
    fetchSalesData();
  }, []);

  const fetchSalesData = async () => {
    try {
      const response = await api.get('/api/sales');
      setData(response.data);
    } catch (err) {
      setError('获取销售数据失败：' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // 点击图例切换可见性
  const toggleSeries = (dataKey) => {
    setVisibleSeries(prev => ({
      ...prev,
      [dataKey]: !prev[dataKey]
    }));
  };

  // 自定义图例渲染（实现变灰效果）
  const renderLegend = (props) => {
    const { payload } = props;
    return (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', gap: '24px', justifyContent: 'center' }}>
        {payload.map((entry, index) => {
          const { dataKey, color, value } = entry;
          const isVisible = visibleSeries[dataKey];
          return (
            <li
              key={`item-${index}`}
              onClick={() => toggleSeries(dataKey)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                cursor: 'pointer',
                opacity: isVisible ? 1 : 0.5,
                transition: 'opacity 0.2s'
              }}
            >
              <span style={{ display: 'inline-block', width: '14px', height: '14px', backgroundColor: color, marginRight: '8px', borderRadius: '2px' }} />
              <span style={{ color: isVisible ? '#333' : '#aaa' }}>{value}</span>
            </li>
          );
        })}
      </ul>
    );
  };

  if (loading) return <div className="tab-container">加载数据中...</div>;
  if (error) return <div className="tab-container error-message">{error}</div>;

  return (
    <div className="tab-container">
      <h2>年份销售数据与同比折线图</h2>
      <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
        点击图例项目可显示/隐藏对应数据系列
      </p>
      <ResponsiveContainer width="100%" height={450}>
        <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis yAxisId="left" label={{ value: '销售额/利润 (万元)', angle: -90, position: 'insideLeft' }} />
          <YAxis yAxisId="right" orientation="right" label={{ value: '同比增长率 (%)', angle: 90, position: 'insideRight' }} />
          <Tooltip />
          <Legend content={renderLegend} />
          {visibleSeries.sales && (
            <Bar yAxisId="left" dataKey="sales" name="销售额" fill="#8884d8" barSize={30} />
          )}
          {visibleSeries.profit && (
            <Bar yAxisId="left" dataKey="profit" name="利润" fill="#82ca9d" barSize={30} />
          )}
          {visibleSeries.yoyGrowth && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="yoyGrowth"
              name="同比增长率 (%)"
              stroke="#ff7300"
              strokeWidth={3}
              dot={{ r: 5 }}
              activeDot={{ r: 8 }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default YearBarChart;