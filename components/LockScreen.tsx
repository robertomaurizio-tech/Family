import React, { useState, useEffect } from 'react';
import { getDbConfig } from '../config';

interface LockScreenProps {
  onUnlock: () => void;
}

const ICONS = ['🍎', '🚗', '🏠', '🐶', '⚽', '✈️', '🍕', '💻', '🎸'];

const LockScreen: React.FC<LockScreenProps> = ({ onUnlock }) => {
  const [sequence, setSequence] = useState<number[]>([]);
  const [error, setError] = useState(false);
  const [targetSequence, setTargetSequence] = useState<number[] | null>(null);

  useEffect(() => {
    const config = getDbConfig();
    // Se il PIN è impostato, lo usiamo come sequenza di indici (es. "0123" -> [0, 1, 2, 3])
    // Se non è impostato, sblocchiamo subito.
    if (config.pin && config.pin.length === 4) {
      const seq = config.pin.split('').map(Number);
      // Verifichiamo che siano indici validi (0-8)
      if (seq.every(n => n >= 0 && n < 9)) {
        setTargetSequence(seq);
      } else {
        onUnlock(); // PIN non valido per icone, sblocca
      }
    } else {
      onUnlock();
    }
  }, []);

  const handlePress = (index: number) => {
    if (sequence.length < 4) {
      const newSeq = [...sequence, index];
      setSequence(newSeq);
      setError(false);
      
      if (newSeq.length === 4) {
        if (JSON.stringify(newSeq) === JSON.stringify(targetSequence)) {
          setTimeout(onUnlock, 200);
        } else {
          setError(true);
          setTimeout(() => setSequence([]), 500);
        }
      }
    }
  };

  if (!targetSequence) return null;

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col items-center justify-center p-4 animate-in fade-in duration-500">
      <div className="mb-12 text-center">
        <div className="w-20 h-20 bg-indigo-600 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
          <span className="text-4xl">🔒</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">FinanceHub</h1>
        <p className="text-slate-400 text-sm">Tocca le 4 icone segrete in ordine</p>
      </div>

      <div className="flex gap-4 mb-12">
        {[0, 1, 2, 3].map(i => (
          <div 
            key={i} 
            className={`w-4 h-4 rounded-full transition-all duration-300 ${
              sequence.length > i 
                ? (error ? 'bg-red-500 scale-110' : 'bg-indigo-500 scale-110') 
                : 'bg-slate-700'
            }`}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6 max-w-xs w-full">
        {ICONS.map((icon, index) => (
          <button
            key={index}
            onClick={() => handlePress(index)}
            className="w-20 h-20 rounded-2xl bg-slate-800 text-4xl hover:bg-slate-700 active:bg-indigo-600 active:scale-95 transition-all shadow-lg border border-slate-700 flex items-center justify-center mx-auto"
          >
            {icon}
          </button>
        ))}
      </div>
      
      <p className="mt-12 text-slate-500 text-xs">v1.0.0 • Secure Access</p>
    </div>
  );
};

export default LockScreen;
