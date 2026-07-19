import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Megaphone, Zap, MessageSquare, Image as ImageIcon, Send, Clock, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { Trash2, Upload } from 'lucide-react';
import api from '../lib/api';

const PosterEngine = () => {
  const [posters, setPosters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState('welcome');

  React.useEffect(() => {
    fetchPosters();
  }, []);

  const fetchPosters = async () => {
    try {
      const res = await api.get('/posters');
      setPosters(res.data.posters || []);
    } catch (err) {
      toast.error('Failed to load posters');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please select an image');

    setLoading(true);
    const formData = new FormData();
    formData.append('poster', file);
    formData.append('category', category);

    try {
      await api.post('/posters', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Poster uploaded!');
      setFile(null);
      fetchPosters();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this poster?')) return;
    try {
      await api.delete(`/posters/${id}`);
      toast.success('Poster deleted');
      fetchPosters();
    } catch (err) {
      toast.error('Failed to delete poster');
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5 text-purple-400" /> Upload New Poster
        </h3>
        <form onSubmit={handleUpload} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input w-full"
            >
              <option value="welcome">Welcome</option>
              <option value="miss_you">Miss You</option>
              <option value="expiry">Membership Expiry</option>
              <option value="renewal">Renewal</option>
              <option value="birthday">Birthday</option>
              <option value="festival">Festival</option>
              <option value="offer">Special Offer</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-2">Image File</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files[0])}
              className="input w-full p-2"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !file}
            className="btn btn-primary whitespace-nowrap"
          >
            {loading ? 'Uploading...' : 'Upload Poster'}
          </button>
        </form>
      </div>

      <div className="space-y-8">
        {Object.entries(posters.reduce((acc, poster) => {
          if (!acc[poster.category]) acc[poster.category] = [];
          acc[poster.category].push(poster);
          return acc;
        }, {})).map(([category, categoryPosters]) => (
          <div key={category} className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4 capitalize flex items-center gap-2">
              {category === 'welcome' && '🏠 '}
              {category === 'miss_you' && '🥺 '}
              {category === 'expiry' && '⏳ '}
              {category === 'renewal' && '💳 '}
              {category === 'birthday' && '🎂 '}
              {category === 'festival' && '🎉 '}
              {category === 'offer' && '🎁 '}
              {category.replace('_', ' ')} Posters
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categoryPosters.map((poster) => (
                <div key={poster._id} className="relative group rounded-xl overflow-hidden border border-white/10 bg-black/50">
                  <img 
                    src={poster.imageUrl.startsWith('http') ? poster.imageUrl : `http://localhost:5000${poster.imageUrl}`} 
                    alt={poster.category} 
                    className="w-full h-48 object-cover opacity-80 group-hover:opacity-100 transition"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition flex flex-col justify-end p-3">
                    <div className="flex justify-end items-center">
                      <button 
                        onClick={() => handleDelete(poster._id)}
                        className="p-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        
        {posters.length === 0 && (
          <div className="py-12 text-center text-gray-500 bg-white/5 border border-white/10 rounded-2xl">
            No posters uploaded yet.
          </div>
        )}
      </div>
    </div>
  );
};

const Marketing = () => {
  const [activeTab, setActiveTab] = useState('automations');

  const handleTestBroadcast = () => {
    toast('Broadcast queued. (Phase 2 feature active soon)', { icon: '🚀' });
  };

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="page-header">
        <h1 className="text-4xl font-bold text-white flex items-center gap-3">
          <Megaphone className="w-10 h-10 text-purple-400" /> Marketing & Automations
        </h1>
        <p className="text-gray-400 mt-2 text-lg">Automate your reminders, create posters, and send bulk broadcasts.</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-white/10 pb-4">
        {[
          { id: 'automations', label: 'Automated Rules', icon: Zap },
          { id: 'broadcast', label: 'Bulk Broadcast', icon: MessageSquare },
          { id: 'posters', label: 'Poster Engine', icon: ImageIcon },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'automations' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Rule 1 */}
            <div className="glass-card p-6 relative overflow-hidden">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-500/20 rounded-xl">
                    <Clock className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Membership Expiry Warning</h3>
                    <p className="text-sm text-gray-400">Trigger: 5 Days Before Expiry</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                </label>
              </div>
              <div className="bg-black/30 p-4 rounded-lg border border-white/5 text-sm text-gray-300">
                "Hi {'{{name}}'}, your DanceFlow membership expires in 5 days on {'{{date}}'}. Please renew soon to avoid interruption."
              </div>
              <div className="mt-4 flex gap-2">
                <button className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded transition">Edit Template</button>
              </div>
            </div>


          </div>
        )}

        {activeTab === 'broadcast' && (
          <div className="glass-card p-8 max-w-3xl">
            <h2 className="text-2xl font-bold text-white mb-6">Send Bulk Message</h2>
            <div className="space-y-6">
              <div className="input-group">
                <label>Select Target Audience</label>
                <select className="input">
                  <option>All Active Students</option>
                  <option>Batch: Evening Hip Hop</option>
                  <option>Batch: Morning Zumba</option>
                  <option>Inactive Students (Last 30 Days)</option>
                </select>
              </div>
              
              <div className="input-group">
                <label>Message Body</label>
                <textarea rows="5" className="input" placeholder="Type your broadcast message here... Supports {{name}}"></textarea>
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={handleTestBroadcast} className="btn btn-primary flex-1">
                  <Send className="w-5 h-5" /> Queue Broadcast
                </button>
              </div>
              <p className="text-xs text-gray-500 text-center">Messages are queued via BullMQ and sent incrementally to avoid WhatsApp spam detection.</p>
            </div>
          </div>
        )}

        {activeTab === 'posters' && (
          <PosterEngine />
        )}
      </motion.div>
    </div>
  );
};

export default Marketing;
