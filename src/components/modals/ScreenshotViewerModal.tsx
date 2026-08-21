import React from 'react';
import { motion } from 'motion/react';
import { X, Download, Camera, ExternalLink } from 'lucide-react';
import { ActiveSession } from '../../types';

interface ScreenshotViewerModalProps {
  session: ActiveSession | null;
  onClose: () => void;
}

export const ScreenshotViewerModal: React.FC<ScreenshotViewerModalProps> = ({ session, onClose }) => {
  if (!session) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-3xl rounded-2xl border border-white/10 bg-[#18181B] p-6 shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              <Camera className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Скриншот игрового окна (PID {session.pid})</h3>
              <p className="text-xs text-gray-400">{session.accountUsername} — {session.gameName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden rounded-xl border border-white/10 bg-[#09090B] flex items-center justify-center relative min-h-[300px]">
          <img
            src={session.screenshotUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80'}
            alt="Game screenshot"
            className="max-h-full max-w-full object-contain rounded-lg shadow-lg"
          />
          <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-[11px] text-gray-300 font-mono flex items-center space-x-2">
            <span>PID: {session.pid}</span>
            <span>•</span>
            <span>MAC: {session.macAddress}</span>
            <span>•</span>
            <span>HWID: {session.hwid}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/5 shrink-0">
          <span className="text-xs text-gray-400">Сохранено в папку: <code className="font-mono text-gray-300">Screenshots/{session.accountUsername}_{session.pid}.png</code></span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all"
          >
            Закрыть
          </button>
        </div>
      </motion.div>
    </div>
  );
};
