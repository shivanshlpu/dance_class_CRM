import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { motion } from 'framer-motion';
import { Download, Users, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

const Reports = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const res = await api.get('/reports/summary');
      setSummary(res.data);
    } catch (error) {
      console.error('Failed to fetch report summary', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (type) => {
    // We can just trigger a download by navigating to the export URL
    // assuming we use an auth token via headers:
    // A better way is to fetch the blob and trigger download.
    api.get(`/reports/export/${type}`, { responseType: 'blob' })
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        const date = new Date().toISOString().split('T')[0];
        link.setAttribute('download', `${type}_export_${date}.csv`);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
      })
      .catch((error) => console.error(`Error exporting ${type}`, error));
  };

  if (loading) {
    return <div className="text-white text-center py-10">Loading Reports...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-gold-400" /> Reports & Analytics
          </h1>
          <p className="text-gray-400">View studio performance and export data to CSV.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-gray-400 font-medium">Total Active Students</h3>
          </div>
          <p className="text-3xl font-bold text-white pl-13">{summary?.totalStudents || 0}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-green-500/20 rounded-xl">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-gray-400 font-medium">New Admissions (This Month)</h3>
          </div>
          <p className="text-3xl font-bold text-white pl-13">{summary?.newAdmissions || 0}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-gold-500/20 rounded-xl">
              <DollarSign className="w-6 h-6 text-gold-400" />
            </div>
            <h3 className="text-gray-400 font-medium">Monthly Revenue</h3>
          </div>
          <p className="text-3xl font-bold text-white pl-13">₹{summary?.monthlyIncome?.toLocaleString() || 0}</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h2 className="text-xl font-semibold text-white mb-6">Attendance Trend (Last 7 Days)</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={summary?.attendanceTrend || []}>
                <defs>
                  <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c084fc" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#c084fc" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#9ca3af" 
                  tickFormatter={(val) => val.split('-').slice(1).join('/')}
                />
                <YAxis stroke="#9ca3af" allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#c084fc' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="present" 
                  stroke="#c084fc" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorPresent)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Export Section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gradient-to-b from-white/5 to-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col justify-between"
        >
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Export Data</h2>
            <p className="text-sm text-gray-400 mb-6">Download your studio's data securely as CSV files for backup or external analysis.</p>
            
            <div className="space-y-4">
              <button 
                onClick={() => handleExport('students')}
                className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                    <Users className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-white font-medium">Students Database</h4>
                    <p className="text-xs text-gray-400">All registered students</p>
                  </div>
                </div>
                <Download className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
              </button>

              <button 
                onClick={() => handleExport('attendance')}
                className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                    <Calendar className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-white font-medium">Attendance Records</h4>
                    <p className="text-xs text-gray-400">Current month logs</p>
                  </div>
                </div>
                <Download className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
              </button>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <p className="text-xs text-yellow-500/80 leading-relaxed">
              <strong>Note:</strong> Data exports contain personally identifiable information (PII). Please ensure you handle these downloaded CSV files securely in accordance with your privacy policy.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Reports;
