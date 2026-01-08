'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, TrendingUp, Users, Calendar, Percent, ArrowUp, ArrowDown } from 'lucide-react';

const COLORS = ['#2d7f7f', '#d97706', '#8b6f47', '#75baba', '#fb923c'];

export function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year' | 'all' | 'custom'>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  useEffect(() => {
    fetchMetrics();
  }, [dateRange, customStart, customEnd]);

  const fetchMetrics = async () => {
    try {
      const params = new URLSearchParams();
      params.append('timeframe', dateRange);
      if (dateRange === 'custom' && customStart && customEnd) {
        params.append('customStart', customStart);
        params.append('customEnd', customEnd);
      }

      const response = await fetch(`/api/analytics?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Loading analytics...</div>;
  }

  if (!metrics) {
    return <div className="text-center py-12 text-gray-500">No data available</div>;
  }

  const formatCurrency = (value: number) => 
    `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  const getChangeColor = (change: number) => change >= 0 ? 'text-green-600' : 'text-red-600';
  const getChangeIcon = (change: number) => change >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, percentage }: any) => {
    if (!percentage || percentage <= 3) return null;
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 35;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="#374151"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="600"
        style={{ 
          textShadow: '1px 1px 2px white, -1px -1px 2px white, 1px -1px 2px white, -1px 1px 2px white',
          pointerEvents: 'none'
        }}
      >
        {name}: {percentage.toFixed(1)}%
      </text>
    );
  };

  const renderCustomLabelLine = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }: any) => {
    if (!percentage || percentage <= 3) return null;
    const RADIAN = Math.PI / 180;
    const mx = cx + (outerRadius + 5) * Math.cos(-midAngle * RADIAN);
    const my = cy + (outerRadius + 5) * Math.sin(-midAngle * RADIAN);
    const ex = mx + (mx > cx ? 1 : -1) * 30;
    const ey = my;

    return (
      <line
        x1={mx}
        y1={my}
        x2={ex}
        y2={ey}
        stroke="#94a3b8"
        strokeWidth={1.5}
      />
    );
  };

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {['week', 'month', 'quarter', 'year', 'all'].map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateRange === range
                  ? 'bg-teal-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {range === 'week' ? 'Last Week' :
               range === 'month' ? 'Last Month' :
               range === 'quarter' ? 'Last Quarter' :
               range === 'year' ? 'Last Year' : 'All Time'}
            </button>
          ))}
          <button
            onClick={() => setDateRange('custom')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              dateRange === 'custom'
                ? 'bg-teal-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Custom Range
          </button>
        </div>
        {dateRange === 'custom' && (
          <div className="flex gap-2">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        )}
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Net Event Income</p>
              <p className="text-2xl font-bold text-brown-800 mt-1">
                {formatCurrency(metrics.totalNetEventIncome || 0)}
              </p>
              {metrics.netIncomeChange !== undefined && (
                <div className={`flex items-center gap-1 mt-2 text-sm ${getChangeColor(metrics.netIncomeChange)}`}>
                  {getChangeIcon(metrics.netIncomeChange)}
                  <span>{Math.abs(metrics.netIncomeChange).toFixed(1)}% vs previous period</span>
                </div>
              )}
            </div>
            <DollarSign className="w-8 h-8 text-teal-600" />
          </div>
          <p className="text-xs text-gray-500 mt-2">Total profit after all expenses and artist payouts</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Net Margin %</p>
              <p className="text-2xl font-bold text-brown-800 mt-1">
                {formatPercent(metrics.avgNetMargin || 0)}
              </p>
              {metrics.marginChange !== undefined && (
                <div className={`flex items-center gap-1 mt-2 text-sm ${getChangeColor(metrics.marginChange)}`}>
                  {getChangeIcon(metrics.marginChange)}
                  <span>{metrics.marginChange > 0 ? '+' : ''}{metrics.marginChange.toFixed(1)}% vs previous</span>
                </div>
              )}
            </div>
            <Percent className="w-8 h-8 text-teal-600" />
          </div>
          <p className="text-xs text-gray-500 mt-2">Average profit margin across all shows</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Events</p>
              <p className="text-2xl font-bold text-brown-800 mt-1">
                {metrics.totalEvents || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {metrics.eventsWithPerformance || 0} with performance data
              </p>
            </div>
            <Calendar className="w-8 h-8 text-teal-600" />
          </div>
          <p className="text-xs text-gray-500 mt-2">Total shows during this period</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Capacity Utilization</p>
              <p className="text-2xl font-bold text-brown-800 mt-1">
                {formatPercent(metrics.capacityUtilization || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {metrics.totalTicketsSold || 0} / {metrics.totalCapacity || 0} tickets
              </p>
            </div>
            <Users className="w-8 h-8 text-teal-600" />
          </div>
          <p className="text-xs text-gray-500 mt-2">Average % of capacity filled</p>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Gross Receipts</p>
          <p className="text-xl font-bold text-brown-800 mt-1">
            {formatCurrency(metrics.totalGrossRevenue || 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Total ticket revenue before expenses</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Net Receipts</p>
          <p className="text-xl font-bold text-brown-800 mt-1">
            {formatCurrency(metrics.totalGrossRevenue - metrics.totalExpenses || 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Revenue after taxes and fees</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Total Expenses</p>
          <p className="text-xl font-bold text-brown-800 mt-1">
            {formatCurrency(metrics.totalExpenses || 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">All operating costs</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Artist Payouts</p>
          <p className="text-xl font-bold text-brown-800 mt-1">
            {formatCurrency(metrics.totalArtistPayout || 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Total paid to artists</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-brown-800 mb-4">Gross Profit Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics.grossProfitOverTime || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="profit" 
                stroke="#2d7f7f" 
                name="Net Profit"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-brown-800 mb-4">Events Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics.eventsOverTime || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#d97706" name="Events" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Genre Performance Table */}
      {metrics.genrePerformance && metrics.genrePerformance.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-brown-800 mb-4">Performance by Genre</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Genre</th>
                  <th className="text-right py-2 px-4"># Shows</th>
                  <th className="text-right py-2 px-4">Avg Attendance</th>
                  <th className="text-right py-2 px-4">Avg Capacity %</th>
                  <th className="text-right py-2 px-4">Avg Gross Revenue</th>
                  <th className="text-right py-2 px-4">Avg Net Profit</th>
                  <th className="text-right py-2 px-4">Avg Margin %</th>
                  <th className="text-right py-2 px-4">Total Net Profit</th>
                </tr>
              </thead>
              <tbody>
                {metrics.genrePerformance.map((genre: any, idx: number) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4 font-medium">{genre.genre}</td>
                    <td className="text-right py-2 px-4">{genre.showCount}</td>
                    <td className="text-right py-2 px-4">{genre.avgAttendance.toFixed(0)}</td>
                    <td className="text-right py-2 px-4">{genre.avgCapacity.toFixed(1)}%</td>
                    <td className="text-right py-2 px-4">{formatCurrency(genre.avgGrossRevenue)}</td>
                    <td className="text-right py-2 px-4">{formatCurrency(genre.avgNetProfit)}</td>
                    <td className={`text-right py-2 px-4 font-medium ${
                      genre.avgMargin >= 20 ? 'text-green-600' :
                      genre.avgMargin >= 10 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {genre.avgMargin.toFixed(1)}%
                    </td>
                    <td className="text-right py-2 px-4 font-semibold">{formatCurrency(genre.totalNetProfit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top Performing Artists */}
      {metrics.artistPerformance && metrics.artistPerformance.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-brown-800 mb-4">Top Performing Artists</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Artist Name</th>
                  <th className="text-right py-2 px-4"># Shows</th>
                  <th className="text-right py-2 px-4">Avg Attendance</th>
                  <th className="text-right py-2 px-4">Avg Capacity %</th>
                  <th className="text-right py-2 px-4">Avg Net Profit</th>
                  <th className="text-right py-2 px-4">Total Net Profit</th>
                  <th className="text-center py-2 px-4">Trend</th>
                </tr>
              </thead>
              <tbody>
                {metrics.artistPerformance.map((artist: any, idx: number) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4 font-medium">{artist.artistName}</td>
                    <td className="text-right py-2 px-4">{artist.showCount}</td>
                    <td className="text-right py-2 px-4">{artist.avgAttendance.toFixed(0)}</td>
                    <td className="text-right py-2 px-4">{artist.avgCapacity.toFixed(1)}%</td>
                    <td className="text-right py-2 px-4">{formatCurrency(artist.avgNetProfit)}</td>
                    <td className="text-right py-2 px-4 font-semibold">{formatCurrency(artist.totalNetProfit)}</td>
                    <td className="text-center py-2 px-4 text-lg">{artist.trend}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-brown-800 mb-4">Revenue Per Cap Breakdown</h3>
          <div className="p-2">
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={metrics.revenueBreakdown || []}
                  cx="50%"
                  cy="50%"
                  labelLine={renderCustomLabelLine}
                  label={renderCustomLabel}
                  outerRadius={75}
                  fill="#8884d8"
                  dataKey="value"
                  stroke="#fff"
                  strokeWidth={2}
                >
                  {(metrics.revenueBreakdown || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-1 text-sm">
            {(metrics.revenueBreakdown || []).map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between">
                <span className="text-gray-600">{item.name}:</span>
                <span className="font-medium">{formatCurrency(item.value)} ({item.percentage.toFixed(1)}%)</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-brown-800 mb-4">Expense Breakdown</h3>
          <div className="p-2">
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={metrics.expenseBreakdown || []}
                  cx="50%"
                  cy="50%"
                  labelLine={renderCustomLabelLine}
                  label={renderCustomLabel}
                  outerRadius={75}
                  fill="#8884d8"
                  dataKey="value"
                  stroke="#fff"
                  strokeWidth={2}
                >
                  {(metrics.expenseBreakdown || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-1 text-sm">
            {(metrics.expenseBreakdown || []).map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between">
                <span className="text-gray-600">{item.name}:</span>
                <span className="font-medium">{formatCurrency(item.value)} ({item.percentage.toFixed(1)}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Marketing Efficiency - Moved Below */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-brown-800 mb-4">Marketing Efficiency</h3>
        {metrics.totalMarketingSpend > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-600">Avg Cost per Attendee</p>
              <p className="text-2xl font-bold text-brown-800">
                {formatCurrency(metrics.avgCostPerAttendee || 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Return on Ad Spend</p>
              <p className="text-2xl font-bold text-brown-800">
                ${(metrics.avgReturnOnAdSpend || 0).toFixed(2)} per $1 spent
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Marketing Spend</p>
              <p className="text-xl font-semibold text-brown-800">
                {formatCurrency(metrics.totalMarketingSpend)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">New Customers Acquired</p>
              <p className="text-xl font-semibold text-brown-800">
                {metrics.totalNewCustomers || 0}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No marketing data available for this period</p>
        )}
      </div>
    </div>
  );
}
