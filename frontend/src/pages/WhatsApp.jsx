import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { motion } from 'framer-motion';
import { Settings, RefreshCw, Send, CheckCircle, XCircle } from 'lucide-react';

const WhatsApp = () => {
  const [status, setStatus] = useState('disconnected');
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [welcomeBody, setWelcomeBody] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Poll status every 3 seconds if not connected
  useEffect(() => {
    fetchStatus();
    fetchTemplates();
    
    let intervalId;
    if (status !== 'connected') {
      intervalId = setInterval(fetchStatus, 3000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [status]);

  const fetchStatus = async () => {
    try {
      const res = await api.get('/whatsapp/status');
      setStatus(res.data.status);
      setQrCode(res.data.qrCode);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch WhatsApp status');
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/whatsapp/templates');
      setTemplates(res.data.templates);
      const welcome = res.data.templates.find((t) => t.type === 'welcome');
      if (welcome) {
        setWelcomeBody(welcome.body);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDisconnect = async () => {
    try {
      setLoading(true);
      await api.post('/whatsapp/disconnect');
      setStatus('disconnected');
      setQrCode(null);
    } catch (err) {
      setError('Failed to disconnect');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    setSavingTemplate(true);
    setSuccess(null);
    setError(null);
    try {
      await api.post('/whatsapp/templates', {
        type: 'welcome',
        body: welcomeBody,
        variables: ['name', 'batch'],
        isActive: true,
      });
      setSuccess('Template saved successfully!');
    } catch (err) {
      setError('Failed to save template');
    } finally {
      setSavingTemplate(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Settings className="w-8 h-8 text-purple-400" /> WhatsApp Integration
          </h1>
          <p className="text-gray-400">Manage device pairing and automated messages.</p>
        </div>
      </div>

      {(error || success) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl border ${
            error ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-green-500/10 border-green-500/30 text-green-400'
          }`}
        >
          {error || success}
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Connection Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Device Status</h2>
          
          <div className="flex flex-col items-center justify-center p-6 bg-black/20 rounded-xl min-h-[300px]">
            {loading ? (
              <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
            ) : status === 'connected' ? (
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-green-400 mb-2">Connected</h3>
                <p className="text-gray-400 mb-6">Your WhatsApp account is active and ready to send messages.</p>
                <button
                  onClick={handleDisconnect}
                  className="px-6 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors"
                >
                  Disconnect Device
                </button>
              </div>
            ) : status === 'authenticating' && qrCode ? (
              <div className="text-center">
                <h3 className="text-xl font-medium text-white mb-2">Scan QR Code</h3>
                <p className="text-sm text-gray-400 mb-6">
                  Open WhatsApp on your phone &gt; Linked Devices &gt; Link a Device
                </p>
                <div className="bg-white p-4 rounded-xl inline-block">
                  <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64" />
                </div>
              </div>
            ) : (
              <div className="text-center">
                <XCircle className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-400 mb-2">Disconnected</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Initializing WhatsApp service. Please wait...
                </p>
                <RefreshCw className="w-6 h-6 text-gray-500 animate-spin mx-auto" />
              </div>
            )}
          </div>
        </motion.div>

        {/* Templates Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Welcome Template</h2>
          <p className="text-sm text-gray-400 mb-6">
            This message is automatically sent to new students upon registration.
          </p>

          <form onSubmit={handleSaveTemplate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Message Body
              </label>
              <textarea
                value={welcomeBody}
                onChange={(e) => setWelcomeBody(e.target.value)}
                rows={6}
                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                placeholder="Hi {{name}}! Welcome to DanceFlow. You have been assigned to {{batch}}."
                required
              />
              <div className="mt-2 text-xs text-gray-500">
                Available variables: <code className="text-purple-400 bg-purple-400/10 px-1 py-0.5 rounded">{'{{name}}'}</code>, <code className="text-purple-400 bg-purple-400/10 px-1 py-0.5 rounded">{'{{batch}}'}</code>
              </div>
            </div>

            <button
              type="submit"
              disabled={savingTemplate || status !== 'connected'}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 px-4 rounded-xl font-medium transition-all disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
              {savingTemplate ? 'Saving...' : 'Save Template'}
            </button>
            {status !== 'connected' && (
              <p className="text-xs text-center text-red-400 mt-2">
                Connect WhatsApp before saving templates.
              </p>
            )}
          </form>
        </motion.div>

        {/* Test Message Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 lg:col-span-2"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Test Message Sender</h2>
          <p className="text-sm text-gray-400 mb-6">
            Send a test message to your own number to verify the connection and see the Welcome Poster.
          </p>

          <form onSubmit={async (e) => {
            e.preventDefault();
            setSavingTemplate(true);
            setError(null);
            setSuccess(null);
            const formData = new FormData(e.target);
            try {
              await api.post('/whatsapp/test', {
                mobile: formData.get('mobile'),
                message: formData.get('message'),
                includePoster: true
              });
              setSuccess('Test message sent successfully with the welcome poster!');
              e.target.reset();
            } catch (err) {
              setError(err.response?.data?.message || 'Failed to send test message');
            } finally {
              setSavingTemplate(false);
            }
          }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Test Phone Number
                </label>
                <input
                  name="mobile"
                  type="text"
                  placeholder="e.g. 9876543210"
                  className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Test Message Body
                </label>
                <textarea
                  name="message"
                  rows={3}
                  className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  placeholder="Hello! This is a test message from DanceFlow."
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingTemplate || status !== 'connected'}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white py-3 px-4 rounded-xl font-medium transition-all disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
              {savingTemplate ? 'Sending...' : 'Send Test Message with Poster'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default WhatsApp;
