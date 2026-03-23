/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Copy, 
  Check, 
  ChevronRight, 
  Terminal, 
  LayoutDashboard, 
  Settings, 
  ShieldCheck, 
  Activity, 
  Database, 
  Globe, 
  Cpu, 
  Wifi, 
  AlertCircle,
  Menu,
  X,
  Languages,
  Target,
  AlertTriangle,
  GitBranch,
  GitCommit,
  Wrench,
  FolderTree,
  AppWindow,
  Bot,
  TerminalSquare,
  Search,
  Command,
  Variable,
  Plus,
  Trash2,
  Save,
  Moon,
  Sun
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { phases, Phase, Step } from './data';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CodeBlock = ({ code, language }: { code: string; language: 'uk' | 'en' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-2 mb-4 bg-zinc-950 rounded-lg border border-zinc-800 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/80 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-zinc-500" />
          <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Terminal</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors border border-zinc-700/50 text-xs font-medium"
        >
          {copied ? (
            <>
              <Check size={14} className="text-emerald-400" />
              <span className="text-emerald-400">{language === 'uk' ? 'Скопійовано!' : 'Copied!'}</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>{language === 'uk' ? 'Копіювати' : 'Copy'}</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm font-mono text-zinc-300 leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
};

export default function App() {
  const [currentPhaseId, setCurrentPhaseId] = useState(1);
  const [completedPhases, setCompletedPhases] = useState<number[]>([]);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [lang, setLang] = useState<'uk' | 'en'>('uk');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('k8s-homelab-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isVarsOpen, setIsVarsOpen] = useState(false);
  const [variables, setVariables] = useState<Record<string, string>>(() => {
    const defaults = {
      'mini1': '192.168.1.10',
      'mini2': '192.168.1.11',
      'ubuntus': 'ubuntus',
      'admin123': 'admin123',
      'YOUR_SSID': 'MyWiFi',
      'YOUR_PASSWORD': 'MyPassword',
      'gateway': '192.168.1.1',
      'network': '192.168.1.0/24',
      'metallb_range': '192.168.1.240-192.168.1.250',
      'dns1': '8.8.8.8',
      'dns2': '1.1.1.1',
      'pod_cidr': '10.244.0.0/16',
      'broadcast': '192.168.1.255'
    };
    const saved = localStorage.getItem('k8s-homelab-vars');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...defaults, ...parsed };
    }
    return defaults;
  });

  // Persist variables to localStorage
  useEffect(() => {
    localStorage.setItem('k8s-homelab-vars', JSON.stringify(variables));
  }, [variables]);

  const applyVars = (text: string) => {
    if (!text) return '';
    let processed = text;
    // Sort keys by length descending to avoid partial replacements (e.g., 'mini1' vs 'mini11')
    const sortedKeys = Object.keys(variables).sort((a, b) => b.length - a.length);
    sortedKeys.forEach(key => {
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedKey, 'g');
      processed = processed.replace(regex, variables[key]);
    });
    return processed;
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return phases.map(phase => {
      const matchPhase = phase.title.uk.toLowerCase().includes(query) || 
                         phase.title.en.toLowerCase().includes(query) || 
                         phase.description.uk.toLowerCase().includes(query) || 
                         phase.description.en.toLowerCase().includes(query);
      const matchingSteps = phase.steps.filter(step =>
        step.title.uk.toLowerCase().includes(query) || 
        step.title.en.toLowerCase().includes(query) ||
        (step.description?.uk.toLowerCase().includes(query)) || 
        (step.description?.en.toLowerCase().includes(query)) ||
        (step.command?.toLowerCase().includes(query)) ||
        (step.note?.uk.toLowerCase().includes(query)) ||
        (step.note?.en.toLowerCase().includes(query))
      );
      if (matchPhase || matchingSteps.length > 0) {
        return { ...phase, matchingSteps };
      }
      return null;
    }).filter(Boolean);
  }, [searchQuery]);

  // Load progress from localStorage
  useEffect(() => {
    const savedPhases = localStorage.getItem('k8s-homelab-phases');
    const savedSteps = localStorage.getItem('k8s-homelab-steps');
    if (savedPhases) setCompletedPhases(JSON.parse(savedPhases));
    if (savedSteps) setCompletedSteps(JSON.parse(savedSteps));
  }, []);

  // Save progress to localStorage
  useEffect(() => {
    localStorage.setItem('k8s-homelab-phases', JSON.stringify(completedPhases));
    localStorage.setItem('k8s-homelab-steps', JSON.stringify(completedSteps));
    localStorage.setItem('k8s-homelab-vars', JSON.stringify(variables));
  }, [completedPhases, completedSteps, variables]);

  useEffect(() => {
    localStorage.setItem('k8s-homelab-theme', theme);
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  const toggleStepCompletion = (phaseId: number, stepIdx: number) => {
    const key = `${phaseId}-${stepIdx}`;
    setCompletedSteps(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const togglePhaseCompletion = (id: number) => {
    setCompletedPhases(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const currentPhase = phases.find(p => p.id === currentPhaseId) || phases[0];
  const progress = (completedPhases.length / phases.length) * 100;
  const isDark = theme === 'dark';

  const copyAllCommands = () => {
    const allCommands = currentPhase.steps
      .filter(s => s.command)
      .map(s => applyVars(s.command!))
      .join('\n\n');
    navigator.clipboard.writeText(allCommands);
    alert(lang === 'uk' ? 'Всі команди скопійовано з урахуванням ваших змінних!' : 'All commands copied with your variables applied!');
  };

  const getPhaseIcon = (id: number) => {
    switch (id) {
      case 1: return <Settings size={18} />;
      case 2: return <Wifi size={18} />;
      case 3: return <ShieldCheck size={18} />;
      case 4: return <Cpu size={18} />;
      case 5: return <Activity size={18} />;
      case 6: return <Globe size={18} />;
      case 7: return <ChevronRight size={18} />;
      case 8: return <Globe size={18} />;
      case 9: return <Database size={18} />;
      case 10: return <LayoutDashboard size={18} />;
      case 11: return <GitBranch size={18} />;
      case 12: return <Terminal size={18} />;
      case 13: return <Activity size={18} />;
      case 14: return <Database size={18} />;
      case 15: return <ShieldCheck size={18} />;
      case 16: return <AlertTriangle size={18} />;
      case 17: return <CheckCircle2 size={18} />;
      case 18: return <Wrench size={18} />;
      case 19: return <FolderTree size={18} />;
      case 20: return <AppWindow size={18} />;
      case 21: return <Bot size={18} />;
      case 22: return <TerminalSquare size={18} />;
      default: return <ChevronRight size={18} />;
    }
  };

  return (
    <div className={cn(
      "flex h-screen font-sans overflow-hidden transition-colors",
      isDark ? "theme-dark bg-zinc-950 text-zinc-100" : "theme-light bg-zinc-50 text-zinc-900"
    )}>
      {/* Variables Modal */}
      <AnimatePresence>
        {isVarsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-zinc-900/60 backdrop-blur-md"
              onClick={() => setIsVarsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={cn("relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] border", isDark ? "bg-zinc-900 border-zinc-700" : "bg-white border-zinc-200")}
            >
              <div className={cn("flex items-center justify-between px-6 py-4 border-b", isDark ? "border-zinc-700" : "border-zinc-100")}>
                <div className="flex items-center gap-2">
                  <Variable size={20} className="text-indigo-500" />
                  <h2 className="font-bold text-lg">{lang === 'uk' ? 'Ваші змінні' : 'Your Variables'}</h2>
                </div>
                <button 
                  onClick={() => setIsVarsOpen(false)} 
                  className={cn("p-2 rounded-full transition-colors", isDark ? "text-zinc-400 hover:bg-zinc-800" : "text-zinc-500 hover:bg-zinc-100")}
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto custom-scrollbar space-y-4">
                <p className="text-sm text-zinc-500 leading-relaxed">
                  {lang === 'uk' 
                    ? 'Змінюйте значення нижче, і вони автоматично оновляться у всіх командах посібника.' 
                    : 'Change the values below, and they will automatically update in all commands throughout the guide.'}
                </p>
                
                <div className="space-y-3">
                  {Object.entries(variables).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2 group">
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <div className={cn("px-3 py-2 border rounded-lg text-xs font-mono flex items-center", isDark ? "bg-zinc-800 border-zinc-700 text-zinc-400" : "bg-zinc-50 border-zinc-200 text-zinc-500")}>
                          {key}
                        </div>
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => setVariables(prev => ({ ...prev, [key]: e.target.value }))}
                          className={cn("px-3 py-2 border rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all", isDark ? "bg-zinc-800 border-zinc-700 text-zinc-100" : "bg-white border-zinc-200 text-zinc-900")}
                        />
                      </div>
                      <button
                        onClick={() => {
                          const newVars = { ...variables };
                          delete newVars[key];
                          setVariables(newVars);
                        }}
                        className={cn("p-2 hover:text-red-500 rounded-lg transition-all opacity-0 group-hover:opacity-100", isDark ? "text-zinc-600 hover:bg-red-950" : "text-zinc-300 hover:bg-red-50")}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    const key = prompt(lang === 'uk' ? 'Введіть назву змінної (наприклад, my-server):' : 'Enter variable name (e.g., my-server):');
                    if (key && !variables[key]) {
                      setVariables(prev => ({ ...prev, [key]: '' }));
                    }
                  }}
                  className={cn("w-full py-3 border-2 border-dashed rounded-xl text-zinc-400 hover:text-indigo-500 transition-all flex items-center justify-center gap-2 text-sm font-bold", isDark ? "border-zinc-700 hover:border-indigo-800 hover:bg-indigo-950/30" : "border-zinc-200 hover:border-indigo-200 hover:bg-indigo-50/30")}
                >
                  <Plus size={18} />
                  {lang === 'uk' ? 'Додати нову змінну' : 'Add New Variable'}
                </button>
              </div>

              <div className={cn("px-6 py-4 border-t flex justify-end", isDark ? "bg-zinc-800 border-zinc-700" : "bg-zinc-50 border-zinc-100")}>
                <button
                  onClick={() => setIsVarsOpen(false)}
                  className={cn("px-6 py-2 text-white rounded-xl font-bold text-sm transition-all shadow-lg", isDark ? "bg-indigo-600 hover:bg-indigo-500 shadow-black/20" : "bg-zinc-900 hover:bg-zinc-800 shadow-zinc-200")}
                >
                  {lang === 'uk' ? 'Готово' : 'Done'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Search Modal */}
      <AnimatePresence>
        {isSearchOpen && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center pt-4 sm:pt-[10vh] md:pt-[20vh] px-2 sm:px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-zinc-900/60 backdrop-blur-md"
              onClick={() => setIsSearchOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className={cn("relative w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[80vh] border", isDark ? "bg-zinc-900 border-zinc-700" : "bg-white border-zinc-200")}
            >
              <div className={cn("flex items-center px-4 py-4 border-b", isDark ? "border-zinc-700" : "border-zinc-100")}>
                <Search size={20} className="text-zinc-400 mr-3 shrink-0" />
                <input
                  autoFocus
                  type="text"
                  placeholder={lang === 'uk' ? 'Пошук по посібнику...' : 'Search the guide...'}
                  className={cn("flex-1 bg-transparent border-none outline-none placeholder-zinc-400 text-base sm:text-lg min-w-0", isDark ? "text-zinc-100" : "text-zinc-900")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <div className={cn("hidden sm:flex items-center gap-1 px-1.5 py-1 rounded border text-[10px] font-mono text-zinc-400 uppercase", isDark ? "border-zinc-700 bg-zinc-800" : "border-zinc-200 bg-zinc-50")}>
                    Esc
                  </div>
                  <button 
                    onClick={() => setIsSearchOpen(false)} 
                    className={cn("p-2 rounded-full transition-colors", isDark ? "text-zinc-400 hover:bg-zinc-800" : "text-zinc-500 hover:bg-zinc-100")}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div className={cn("overflow-y-auto flex-1 p-2 custom-scrollbar", isDark ? "bg-zinc-800/30" : "bg-zinc-50/50")}>
                {searchQuery.trim() === '' ? (
                  <div className="p-12 text-center">
                    <div className={cn("w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-400", isDark ? "bg-zinc-800" : "bg-zinc-100")}>
                      <Search size={24} />
                    </div>
                    <p className="text-zinc-500 font-medium">
                      {lang === 'uk' ? 'Введіть текст для пошуку' : 'Type to start searching'}
                    </p>
                    <p className="text-zinc-400 text-sm mt-1">
                      {lang === 'uk' ? 'Шукайте по фазах, кроках або командах' : 'Search by phases, steps, or commands'}
                    </p>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className={cn("w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-400", isDark ? "bg-zinc-800" : "bg-zinc-100")}>
                      <AlertCircle size={24} />
                    </div>
                    <p className="text-zinc-500 font-medium">
                      {lang === 'uk' ? 'Нічого не знайдено' : 'No results found'}
                    </p>
                    <p className="text-zinc-400 text-sm mt-1">
                      {lang === 'uk' ? 'Спробуйте змінити запит' : 'Try a different search term'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 p-1 sm:p-2">
                    {searchResults.map((result: any) => (
                      <div key={result.id} className={cn("rounded-xl border overflow-hidden", isDark ? "bg-zinc-900 border-zinc-700" : "bg-white border-zinc-200 shadow-sm")}>
                        <div className={cn("px-4 py-2.5 border-b text-[10px] font-bold uppercase tracking-widest flex items-center gap-2", isDark ? "bg-zinc-800/80 border-zinc-700 text-zinc-400" : "bg-zinc-50/80 border-zinc-100 text-zinc-500")}>
                          <span className={cn("p-1 rounded border", isDark ? "bg-zinc-800 border-zinc-700 text-zinc-500" : "bg-white border-zinc-200 text-zinc-400")}>
                            {getPhaseIcon(result.id)}
                          </span>
                          {applyVars(result.title[lang])}
                        </div>
                        <div className="divide-y divide-zinc-100">
                          {result.matchingSteps.length > 0 ? (
                            result.matchingSteps.map((step: any, idx: number) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  setCurrentPhaseId(result.id);
                                  setIsSearchOpen(false);
                                  setSearchQuery('');
                                  if (window.innerWidth < 1024) setIsSidebarOpen(false);
                                }}
                                className={cn("w-full text-left px-4 py-3.5 flex items-start gap-3 transition-colors group", isDark ? "hover:bg-indigo-950/30" : "hover:bg-indigo-50/30")}
                              >
                                <div className={cn("mt-1 group-hover:text-indigo-500 transition-colors shrink-0", isDark ? "text-zinc-600" : "text-zinc-300")}>
                                  <CheckCircle2 size={16} />
                                </div>
                                <div className="min-w-0">
                                  <div className={cn("font-semibold text-sm sm:text-base truncate", isDark ? "text-zinc-100" : "text-zinc-900")}>{applyVars(step.title[lang])}</div>
                                  {step.description && (
                                    <div className={cn("text-xs sm:text-sm line-clamp-1 mt-0.5", isDark ? "text-zinc-400" : "text-zinc-500")}>{applyVars(step.description[lang])}</div>
                                  )}
                                </div>
                              </button>
                            ))
                          ) : (
                            <button
                              onClick={() => {
                                setCurrentPhaseId(result.id);
                                setIsSearchOpen(false);
                                setSearchQuery('');
                                if (window.innerWidth < 1024) setIsSidebarOpen(false);
                              }}
                              className={cn("w-full text-left px-4 py-3.5 flex items-start gap-3 transition-colors group", isDark ? "hover:bg-indigo-950/30" : "hover:bg-indigo-50/30")}
                            >
                              <div className={cn("mt-1 group-hover:text-indigo-500 transition-colors shrink-0", isDark ? "text-zinc-600" : "text-zinc-300")}>
                                <FolderTree size={16} />
                              </div>
                              <div className="min-w-0">
                                <div className={cn("font-semibold text-sm sm:text-base truncate", isDark ? "text-zinc-100" : "text-zinc-900")}>{applyVars(result.title[lang])}</div>
                                <div className={cn("text-xs sm:text-sm line-clamp-1 mt-0.5", isDark ? "text-zinc-400" : "text-zinc-500")}>{applyVars(result.description[lang])}</div>
                              </div>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className={cn("px-4 py-3 border-t flex items-center justify-between text-[10px] text-zinc-400 font-medium uppercase tracking-wider", isDark ? "bg-zinc-800 border-zinc-700" : "bg-zinc-50 border-zinc-100")}>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className={cn("px-1 py-0.5 rounded border", isDark ? "border-zinc-700 bg-zinc-800" : "border-zinc-200 bg-white")}>↑↓</span>
                    <span>{lang === 'uk' ? 'Навігація' : 'Navigate'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={cn("px-1 py-0.5 rounded border", isDark ? "border-zinc-700 bg-zinc-800" : "border-zinc-200 bg-white")}>Enter</span>
                    <span>{lang === 'uk' ? 'Вибрати' : 'Select'}</span>
                  </div>
                </div>
                <div>
                  {searchResults.length} {lang === 'uk' ? 'результатів' : 'results'}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-[60] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-[70] w-[280px] sm:w-80 flex flex-col transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:z-0 border-r",
        isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200",
        !isSidebarOpen && "-translate-x-full"
      )}>
        <div className={cn("p-5 sm:p-6 border-b flex items-center justify-between", isDark ? "border-zinc-800" : "border-zinc-100")}>
          <div className="flex items-center gap-3">
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-lg", isDark ? "bg-indigo-600 shadow-black/20" : "bg-zinc-900 shadow-zinc-200")}>
              <Cpu size={20} />
            </div>
            <div>
              <h1 className={cn("font-bold text-base sm:text-lg tracking-tight leading-none", isDark ? "text-zinc-100" : "text-zinc-900")}>K8s Homelab</h1>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">Documentation</p>
            </div>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)} 
            className={cn("lg:hidden p-2 rounded-full transition-all", isDark ? "text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800" : "text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100")}
          >
            <X size={20} />
          </button>
        </div>

        <div className={cn("p-4 border-b space-y-2", isDark ? "border-zinc-800" : "border-zinc-100")}>
          <button
            onClick={() => setIsSearchOpen(true)}
            className={cn("w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-sm border border-transparent", isDark ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600" : "bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-700 hover:border-zinc-300")}
          >
            <div className="flex items-center gap-2.5">
              <Search size={16} className="shrink-0" />
              <span className="font-medium">{lang === 'uk' ? 'Пошук...' : 'Search...'}</span>
            </div>
            <div className={cn("hidden sm:flex items-center gap-1 text-[10px] font-mono opacity-50 px-1.5 py-0.5 rounded border", isDark ? "bg-zinc-700 border-zinc-600" : "bg-white border-zinc-200")}>
              <Command size={10} />
              <span>K</span>
            </div>
          </button>

          <button
            onClick={() => setIsVarsOpen(true)}
            className={cn("w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-sm font-bold border", isDark ? "bg-indigo-950/50 text-indigo-400 hover:bg-indigo-950/80 border-indigo-900" : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-indigo-100")}
          >
            <Variable size={16} className="shrink-0" />
            <span>{lang === 'uk' ? 'Налаштувати змінні' : 'Configure Variables'}</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1 custom-scrollbar">
          {phases.map((phase) => (
            <button
              key={phase.id}
              onClick={() => {
                setCurrentPhaseId(phase.id);
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all group relative",
                currentPhaseId === phase.id 
                  ? isDark ? "bg-indigo-600 text-white shadow-xl shadow-black/20" : "bg-zinc-900 text-white shadow-xl shadow-zinc-200"
                  : isDark ? "text-zinc-400 hover:bg-zinc-800" : "text-zinc-600 hover:bg-zinc-100"
              )}
            >
              <div className={cn(
                "flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg transition-colors",
                currentPhaseId === phase.id ? "bg-white/10 text-white" : isDark ? "bg-zinc-800 text-zinc-500 group-hover:text-zinc-300 group-hover:bg-zinc-700" : "bg-zinc-50 text-zinc-400 group-hover:text-zinc-600 group-hover:bg-zinc-200"
              )}>
                {getPhaseIcon(phase.id)}
              </div>
              <span className="flex-1 text-left truncate pr-2">
                {phase.id}. {applyVars(phase.title[lang])}
              </span>
              {completedPhases.includes(phase.id) && (
                <div className={cn(
                  "shrink-0 w-5 h-5 rounded-full flex items-center justify-center",
                  currentPhaseId === phase.id ? "bg-emerald-500" : isDark ? "bg-emerald-900" : "bg-emerald-100"
                )}>
                  <Check size={12} className={currentPhaseId === phase.id ? "text-white" : "text-emerald-600"} />
                </div>
              )}
            </button>
          ))}
        </div>

        <div className={cn("p-5 sm:p-6 border-t space-y-4", isDark ? "border-zinc-800 bg-zinc-800/50" : "border-zinc-100 bg-zinc-50/50")}>
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                {lang === 'uk' ? 'Прогрес' : 'Progress'}
              </span>
              <span className={cn("text-xs font-black", isDark ? "text-zinc-100" : "text-zinc-900")}>{Math.round(progress)}%</span>
            </div>
            <div className={cn("h-2 rounded-full overflow-hidden p-0.5", isDark ? "bg-zinc-700" : "bg-zinc-200")}>
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className={cn("h-full rounded-full", isDark ? "bg-indigo-500" : "bg-zinc-900")}
              />
            </div>
          </div>
          
          <button
            onClick={() => {
              if (confirm(lang === 'uk' ? 'Скинути весь прогрес?' : 'Reset all progress?')) {
                setCompletedPhases([]);
                setCompletedSteps({});
              }
            }}
            className={cn("w-full py-2.5 text-[10px] font-bold text-zinc-400 hover:text-red-500 rounded-lg transition-all flex items-center justify-center gap-2 uppercase tracking-widest", isDark ? "hover:bg-red-950" : "hover:bg-red-50")}
          >
            <Activity size={12} />
            {lang === 'uk' ? 'Скинути прогрес' : 'Reset Progress'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 flex flex-col min-w-0",
        isDark ? "bg-zinc-950" : "bg-white lg:bg-zinc-50/30"
      )}>
        {/* Header */}
        <header className={cn(
          "h-16 border-b backdrop-blur-md flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30",
          isDark ? "border-zinc-800 bg-zinc-950/85" : "border-zinc-200 bg-white/80"
        )}>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className={cn("lg:hidden p-2 -ml-2 rounded-xl transition-colors", isDark ? "text-zinc-400 hover:bg-zinc-800" : "text-zinc-600 hover:bg-zinc-100")}
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-2 sm:gap-4 ml-auto">
            <div className={cn("flex items-center p-1 rounded-xl border", isDark ? "bg-zinc-800 border-zinc-700" : "bg-zinc-100 border-zinc-200")}>
              <button
                onClick={() => setLang('uk')}
                className={cn(
                  "px-2 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all",
                  lang === 'uk' ? (isDark ? "bg-zinc-700 text-zinc-100 shadow-sm" : "bg-white text-zinc-900 shadow-sm") : (isDark ? "text-zinc-400 hover:text-zinc-200" : "text-zinc-500 hover:text-zinc-700")
                )}
              >
                UK
              </button>
              <button
                onClick={() => setLang('en')}
                className={cn(
                  "px-2 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all",
                  lang === 'en' ? (isDark ? "bg-zinc-700 text-zinc-100 shadow-sm" : "bg-white text-zinc-900 shadow-sm") : (isDark ? "text-zinc-400 hover:text-zinc-200" : "text-zinc-500 hover:text-zinc-700")
                )}
              >
                EN
              </button>
            </div>
            <button
              onClick={() => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))}
              className={cn(
                "flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all border",
                isDark
                  ? "bg-zinc-900 text-zinc-100 border-zinc-700 hover:bg-zinc-800"
                  : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100"
              )}
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
              <span className="hidden sm:inline">{isDark ? (lang === 'uk' ? 'Світла' : 'Light') : (lang === 'uk' ? 'Темна' : 'Dark')}</span>
            </button>
            <div className={cn("h-8 w-px hidden sm:block", isDark ? "bg-zinc-700" : "bg-zinc-200")} />
            <button 
              onClick={() => togglePhaseCompletion(currentPhaseId)}
              className={cn(
                "flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all",
                completedPhases.includes(currentPhaseId)
                  ? isDark ? "bg-emerald-900/50 text-emerald-400 border border-emerald-800" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : isDark ? "bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-black/20" : "bg-zinc-900 text-white hover:bg-zinc-800 shadow-lg shadow-zinc-200"
              )}
            >
              {completedPhases.includes(currentPhaseId) ? (
                <>
                  <Check size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="hidden xs:inline">{lang === 'uk' ? 'Виконано' : 'Completed'}</span>
                  <span className="xs:hidden">{lang === 'uk' ? 'ОК' : 'Done'}</span>
                </>
              ) : (
                <>
                  <Circle size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="hidden xs:inline">{lang === 'uk' ? 'Позначити як виконане' : 'Mark as Complete'}</span>
                  <span className="xs:hidden">{lang === 'uk' ? 'Готово' : 'Done'}</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPhaseId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6 sm:space-y-8"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-3 sm:space-y-4">
                    <div className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest border", isDark ? "bg-zinc-800 text-zinc-400 border-zinc-700" : "bg-zinc-100 text-zinc-600 border-zinc-200")}>
                      {lang === 'uk' ? 'Фаза' : 'Phase'} {currentPhase.id}
                    </div>
                    <h2 className={cn("text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight", isDark ? "text-zinc-100" : "text-zinc-900")}>
                      {applyVars(currentPhase.title[lang])}
                    </h2>
                    <p className="text-base sm:text-lg text-zinc-500 leading-relaxed max-w-2xl">
                      {applyVars(currentPhase.description[lang])}
                    </p>
                  </div>
                  <button
                    onClick={copyAllCommands}
                    className={cn("flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border sm:self-start", isDark ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border-zinc-700" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 border-zinc-200")}
                  >
                    <Copy size={16} />
                    {lang === 'uk' ? 'Копіювати все' : 'Copy All'}
                  </button>
                </div>

                <div className={cn("h-px", isDark ? "bg-zinc-800" : "bg-zinc-200")} />

                <div className="space-y-8 sm:space-y-12">
                  {currentPhase.steps.map((step, idx) => (
                    <div key={idx} className="space-y-4 group">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <button
                          onClick={() => toggleStepCompletion(currentPhase.id, idx)}
                          className={cn(
                            "flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all mt-0.5 sm:mt-1",
                            completedSteps[`${currentPhase.id}-${idx}`]
                              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-100"
                              : isDark ? "bg-zinc-800 text-zinc-500 hover:bg-zinc-700" : "bg-zinc-100 text-zinc-400 hover:bg-zinc-200"
                          )}
                        >
                          {completedSteps[`${currentPhase.id}-${idx}`] ? (
                            <Check size={16} className="sm:w-[18px] sm:h-[18px]" />
                          ) : (
                            <span className="text-[10px] sm:text-xs font-bold">{idx + 1}</span>
                          )}
                        </button>
                        <div className="flex-1 space-y-3 min-w-0">
                          <h3 className={cn(
                            "text-lg sm:text-xl font-bold transition-colors break-words",
                            completedSteps[`${currentPhase.id}-${idx}`] ? "text-zinc-400 line-through" : isDark ? "text-zinc-100" : "text-zinc-900"
                          )}>
                            {applyVars(step.title[lang])}
                          </h3>
                          {step.description && (
                            <p className={cn(
                              "text-sm sm:text-base leading-relaxed transition-colors",
                              completedSteps[`${currentPhase.id}-${idx}`] ? (isDark ? "text-zinc-600" : "text-zinc-300") : (isDark ? "text-zinc-400" : "text-zinc-600")
                            )}>
                              {applyVars(step.description[lang])}
                            </p>
                          )}
                          {step.command && (
                            <div className={cn(
                              "transition-opacity duration-300",
                              completedSteps[`${currentPhase.id}-${idx}`] ? "opacity-30 pointer-events-none" : "opacity-100"
                            )}>
                              <CodeBlock code={applyVars(step.command)} language={lang} />
                            </div>
                          )}
                          {step.expectedResult && (
                            <div className={cn(
                              "mt-3 p-3 rounded-xl flex items-start gap-3 transition-opacity duration-300 border",
                              isDark ? "bg-blue-950/30 border-blue-900/50" : "bg-blue-50/50 border-blue-100/50",
                              completedSteps[`${currentPhase.id}-${idx}`] ? "opacity-30" : "opacity-100"
                            )}>
                              <Target size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                              <div className={cn("text-xs sm:text-sm", isDark ? "text-blue-300/80" : "text-blue-900/80")}>
                                <span className="font-bold">{lang === 'uk' ? 'Очікуваний результат:' : 'Expected result:'}</span>{' '}
                                {applyVars(step.expectedResult[lang])}
                              </div>
                            </div>
                          )}
                          {step.expectedOutput && (
                            <div className={cn(
                              "mt-3 p-3 rounded-xl flex items-start gap-3 transition-opacity duration-300 border",
                              isDark ? "bg-green-950/30 border-green-900/50" : "bg-green-50/50 border-green-200/50",
                              completedSteps[`${currentPhase.id}-${idx}`] ? "opacity-30" : "opacity-100"
                            )}>
                              <Terminal size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                              <div className={cn("text-xs sm:text-sm font-mono whitespace-pre-wrap overflow-x-auto w-full", isDark ? "text-green-300/80" : "text-green-900/80")}>
                                <span className={cn("font-bold font-sans", isDark ? "text-green-400" : "text-green-700")}>{lang === 'uk' ? 'Очікуваний вивід:' : 'Expected output:'}</span>
                                <div className={cn("mt-1", isDark ? "text-green-300" : "text-green-800")}>{applyVars(step.expectedOutput)}</div>
                              </div>
                            </div>
                          )}
                          {step.possibleErrors && (
                            <div className={cn(
                              "mt-3 p-3 rounded-xl flex items-start gap-3 transition-opacity duration-300 border",
                              isDark ? "bg-red-950/30 border-red-900/50" : "bg-red-50/50 border-red-200/50",
                              completedSteps[`${currentPhase.id}-${idx}`] ? "opacity-30" : "opacity-100"
                            )}>
                              <AlertTriangle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                              <div className={cn("text-xs sm:text-sm", isDark ? "text-red-300/80" : "text-red-900/80")}>
                                <span className={cn("font-bold", isDark ? "text-red-400" : "text-red-700")}>{lang === 'uk' ? 'Можливі помилки:' : 'Possible errors:'}</span>{' '}
                                {applyVars(step.possibleErrors[lang])}
                              </div>
                            </div>
                          )}
                          {step.note && (
                            <div className={cn(
                              "mt-3 p-3 rounded-xl flex items-start gap-3 transition-opacity duration-300 border",
                              isDark ? "bg-amber-950/30 border-amber-900/50" : "bg-amber-50/50 border-amber-200/50",
                              completedSteps[`${currentPhase.id}-${idx}`] ? "opacity-30" : "opacity-100"
                            )}>
                              <AlertCircle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                              <div className={cn("text-xs sm:text-sm", isDark ? "text-amber-300/80" : "text-amber-900/80")}>
                                <span className={cn("font-bold", isDark ? "text-amber-400" : "text-amber-700")}>{lang === 'uk' ? 'Примітка:' : 'Note:'}</span>{' '}
                                {applyVars(step.note[lang])}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Navigation Buttons */}
                <div className={cn("flex items-center justify-between pt-8 sm:pt-12 border-t", isDark ? "border-zinc-800" : "border-zinc-200")}>
                  <button
                    disabled={currentPhaseId === 1}
                    onClick={() => setCurrentPhaseId(prev => prev - 1)}
                    className={cn("flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold disabled:opacity-30 disabled:hover:bg-transparent transition-all text-sm sm:text-base", isDark ? "text-zinc-400 hover:bg-zinc-800" : "text-zinc-600 hover:bg-zinc-100")}
                  >
                    <ChevronRight size={20} className="rotate-180" />
                    <span className="hidden xs:inline">{lang === 'uk' ? 'Назад' : 'Previous'}</span>
                  </button>
                  <button
                    disabled={currentPhaseId === phases.length}
                    onClick={() => setCurrentPhaseId(prev => prev + 1)}
                    className={cn("flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-white disabled:opacity-30 transition-all text-sm sm:text-base shadow-lg", isDark ? "bg-indigo-600 hover:bg-indigo-500 shadow-black/20" : "bg-zinc-900 hover:bg-zinc-800 shadow-zinc-200")}
                  >
                    <span className="hidden xs:inline">{lang === 'uk' ? 'Далі' : 'Next'}</span>
                    <ChevronRight size={20} />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Footer with Git Info */}
        <footer className={cn("mt-auto py-6 border-t text-center text-xs text-zinc-500 flex items-center justify-center gap-6", isDark ? "border-zinc-800 bg-zinc-900/50" : "border-zinc-200 bg-zinc-50/50")}>
          <div className="flex items-center gap-1.5" title="Current Branch">
            <GitBranch size={14} className="text-zinc-400" />
            <span className="font-mono">main</span>
          </div>
          <div className="flex items-center gap-1.5" title="Commit Hash">
            <GitCommit size={14} className="text-zinc-400" />
            <span className="font-mono">dev</span>
          </div>
        </footer>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e4e4e7;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d4d4d8;
        }

        .theme-dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #3f3f46;
        }
        .theme-dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #52525b;
        }
      `}</style>
    </div>
  );
}
