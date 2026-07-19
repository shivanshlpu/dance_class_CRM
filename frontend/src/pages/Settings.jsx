import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, User, Shield, Bell, Key, Layout } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

const Settings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const handleSave = (e) => {
    e.preventDefault();
    toast.success('Settings saved successfully!');
  };

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="page-header">
        <h1 className="text-4xl font-bold text-white flex items-center gap-3">
          <SettingsIcon className="w-10 h-10 text-cyan-400" /> Settings
        </h1>
        <p className="text-gray-400 mt-2 text-lg">Manage your account and studio preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 space-y-2">
          {[
            { id: 'profile', icon: User, label: 'Profile' },
            { id: 'studio', icon: Layout, label: 'Studio Details' },
            { id: 'security', icon: Shield, label: 'Security' },
            { id: 'notifications', icon: Bell, label: 'Notifications' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white/10 text-cyan-400 border border-white/10'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-8"
          >
            {activeTab === 'profile' && (
              <form onSubmit={handleSave} className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-6">Profile Settings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="input-group">
                    <label>Full Name</label>
                    <input type="text" className="input" defaultValue={user?.name || 'Studio Owner'} />
                  </div>
                  <div className="input-group">
                    <label>Email Address</label>
                    <input type="email" className="input" defaultValue={user?.email || 'owner@danceflow.com'} disabled />
                    <span className="text-xs text-gray-500">Email cannot be changed directly.</span>
                  </div>
                </div>
                <div className="input-group">
                  <label>Role</label>
                  <input type="text" className="input" defaultValue={user?.role?.toUpperCase() || 'OWNER'} disabled />
                </div>
                <button type="submit" className="btn btn-primary mt-4">Save Changes</button>
              </form>
            )}

            {activeTab === 'studio' && (
              <form onSubmit={handleSave} className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-6">Studio Details</h2>
                <div className="input-group">
                  <label>Studio Name</label>
                  <input type="text" className="input" defaultValue="DanceFlow Studios" />
                </div>
                <div className="input-group">
                  <label>Address</label>
                  <textarea className="input" rows={3} defaultValue="123 Rhythm Street, Movement City" />
                </div>
                <div className="input-group">
                  <label>Currency</label>
                  <select className="input">
                    <option value="INR">₹ INR (Indian Rupee)</option>
                    <option value="USD">$ USD (US Dollar)</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary mt-4">Update Studio</button>
              </form>
            )}

            {activeTab === 'security' && (
              <form onSubmit={handleSave} className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-6">Security Settings</h2>
                <div className="input-group">
                  <label>Current Password</label>
                  <input type="password" className="input" placeholder="••••••••" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="input-group">
                    <label>New Password</label>
                    <input type="password" className="input" placeholder="••••••••" />
                  </div>
                  <div className="input-group">
                    <label>Confirm Password</label>
                    <input type="password" className="input" placeholder="••••••••" />
                  </div>
                </div>
                <button type="button" className="btn btn-secondary mt-2 flex items-center gap-2">
                  <Key className="w-4 h-4" /> Enable Two-Factor Auth
                </button>
                <button type="submit" className="btn btn-primary mt-4 w-full md:w-auto">Change Password</button>
              </form>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-6">Notification Preferences</h2>
                {[
                  { label: 'New Student Registrations', desc: 'Get notified when a new student joins.' },
                  { label: 'Attendance Alerts', desc: 'Daily summary of attendance.' },
                  { label: 'Payment Reminders', desc: 'When automated WhatsApp messages fail.' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                    <div>
                      <h4 className="text-white font-medium">{item.label}</h4>
                      <p className="text-sm text-gray-400">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                    </label>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
