import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, X, Plus, Check, Trash2, Globe, Smartphone } from 'lucide-react';
import { APP_CATALOG } from '@/features/focus/shield';

export default function ShieldProfileModal({
  isOpen,
  onClose,
  onSave,
  profile = null,
  isSaving = false,
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('study');
  const [selectedApps, setSelectedApps] = useState([]);
  const [selectedDomains, setSelectedDomains] = useState([]);
  const [customDomain, setCustomDomain] = useState('');
  const [defaultDurationMinutes, setDefaultDurationMinutes] = useState(25);
  const [commitmentLevel, setCommitmentLevel] = useState(1);
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setDescription(profile.description || '');
      setCategory(profile.category || 'study');
      setSelectedApps(profile.restrictedApps || []);
      setSelectedDomains(profile.restrictedDomains || []);
      setDefaultDurationMinutes(Math.round((profile.defaultDurationSeconds || 1500) / 60));
      setCommitmentLevel(profile.commitmentLevel || 1);
      setIsDefault(Boolean(profile.isDefault));
    } else {
      setName('');
      setDescription('');
      setCategory('study');
      setSelectedApps([]);
      setSelectedDomains([]);
      setCustomDomain('');
      setDefaultDurationMinutes(25);
      setCommitmentLevel(1);
      setIsDefault(false);
    }
  }, [profile, isOpen]);

  if (!isOpen) return null;

  const toggleApp = (app) => {
    const exists = selectedApps.some((a) => a.id === app.id);
    if (exists) {
      setSelectedApps(selectedApps.filter((a) => a.id !== app.id));
      setSelectedDomains(selectedDomains.filter((d) => d.domain !== app.defaultDomain));
    } else {
      setSelectedApps([...selectedApps, { id: app.id, name: app.name, packageName: app.packageName }]);
      if (app.defaultDomain) {
        setSelectedDomains([...selectedDomains, { domain: app.defaultDomain, name: app.name }]);
      }
    }
  };

  const addCustomDomain = (e) => {
    e.preventDefault();
    const clean = customDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!clean) return;
    if (!selectedDomains.some((d) => d.domain === clean)) {
      setSelectedDomains([...selectedDomains, { domain: clean, name: clean }]);
    }
    setCustomDomain('');
  };

  const removeDomain = (domain) => {
    setSelectedDomains(selectedDomains.filter((d) => d.domain !== domain));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      description: description.trim() || null,
      category,
      restrictedApps: selectedApps,
      restrictedDomains: selectedDomains,
      defaultDurationSeconds: defaultDurationMinutes * 60,
      commitmentLevel,
      isDefault,
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 text-slate-900 dark:text-white shadow-2xl relative max-h-[90vh] overflow-y-auto"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full bg-slate-100 dark:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                {profile ? 'Edit Shield Profile' : 'New Distraction Shield Profile'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">Select applications and websites to restrict</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name & Category */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Profile Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. GATE Study, Coding Sprints, Deep Work"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="study">Study</option>
                  <option value="coding">Coding</option>
                  <option value="reading">Reading</option>
                  <option value="deep_work">Deep Work</option>
                  <option value="general">General</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Default Duration
                </label>
                <select
                  value={defaultDurationMinutes}
                  onChange={(e) => setDefaultDurationMinutes(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value={15}>15 Minutes</option>
                  <option value={25}>25 Minutes (Pomodoro)</option>
                  <option value={45}>45 Minutes (Study)</option>
                  <option value={60}>60 Minutes (Deep Work)</option>
                  <option value={90}>90 Minutes (Extended)</option>
                </select>
              </div>
            </div>

            {/* App Catalog Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                  <span>Select Apps to Restrict ({selectedApps.length})</span>
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {APP_CATALOG.map((app) => {
                  const isSelected = selectedApps.some((a) => a.id === app.id);
                  return (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => toggleApp(app)}
                      className={`p-2.5 rounded-xl border text-left transition-all text-xs flex items-center justify-between ${
                        isSelected
                          ? 'bg-indigo-600/15 border-indigo-500 text-indigo-600 dark:text-white'
                          : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10'
                      }`}
                    >
                      <span className="truncate text-[11px] font-medium">{app.name}</span>
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                      ) : (
                        <Plus className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Domain Blocking */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <Globe className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
                  <span>Web Domains ({selectedDomains.length})</span>
                </span>
              </div>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  placeholder="e.g. reddit.com, twitter.com"
                  className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addCustomDomain}
                  className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {selectedDomains.map((d) => (
                  <span
                    key={d.domain}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20 text-[10px] text-sky-600 dark:text-sky-300"
                  >
                    <span>{d.domain}</span>
                    <button
                      type="button"
                      onClick={() => removeDomain(d.domain)}
                      className="hover:text-rose-500 ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Commitment Level */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Target Commitment Level
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {[
                  { lvl: 1, title: 'Level 1: Flow', desc: '1.0x Rewards' },
                  { lvl: 2, title: 'Level 2: Lock', desc: '+15% Bonus' },
                  { lvl: 3, title: 'Level 3: Shield', desc: '+25% Bonus' },
                ].map((item) => (
                  <button
                    key={item.lvl}
                    type="button"
                    onClick={() => setCommitmentLevel(item.lvl)}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      commitmentLevel === item.lvl
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-700 dark:text-white'
                        : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="font-semibold text-[11px]">{item.title}</div>
                    <div className="text-[10px] text-indigo-600 dark:text-indigo-400">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="isDefault"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 bg-white dark:bg-slate-800 border-slate-300 dark:border-white/20 focus:ring-indigo-500"
              />
              <label htmlFor="isDefault" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                Set as default shield profile
              </label>
            </div>

            <div className="flex space-x-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || !name.trim()}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all shadow-lg shadow-indigo-600/30"
              >
                {isSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

ShieldProfileModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  profile: PropTypes.object,
  isSaving: PropTypes.bool,
};
