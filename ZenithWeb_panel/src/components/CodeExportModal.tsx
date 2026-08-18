import React, { useState } from 'react';
import { X, Copy, Check, Download, FileCode, FileText, Terminal, CheckCircle2 } from 'lucide-react';
import { STANDALONE_HTML, STANDALONE_CSS, STANDALONE_JS, PYTHON_BOT_SAMPLE } from '../services/standaloneCode';
import { soundFX } from '../utils/sound';
import { useToast } from './ToastContainer';

interface CodeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CodeExportModal: React.FC<CodeExportModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js' | 'python'>('html');
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  if (!isOpen) return null;

  const files = {
    html: { name: 'index.html', code: STANDALONE_HTML, icon: FileCode },
    css: { name: 'style.css', code: STANDALONE_CSS, icon: FileText },
    js: { name: 'script.js', code: STANDALONE_JS, icon: Terminal },
    python: { name: 'bot.py', code: PYTHON_BOT_SAMPLE, icon: Terminal }
  };

  const currentFile = files[activeTab];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.code);
    setCopied(true);
    soundFX.playClick();
    showToast(`Код ${currentFile.name} скопирован в буфер!`, 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([currentFile.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile.name;
    a.click();
    URL.revokeObjectURL(url);
    soundFX.playSuccess();
    showToast(`Файл ${currentFile.name} скачан`, 'success');
  };

  const handleDownloadAll = () => {
    // Download all 4 files in sequence
    Object.values(files).forEach((f, idx) => {
      setTimeout(() => {
        const blob = new Blob([f.code], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = f.name;
        a.click();
        URL.revokeObjectURL(url);
      }, idx * 250);
    });
    soundFX.playSuccess();
    showToast('Скачивание всех 4 файлов запущено!', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
      <div className="w-full max-w-5xl h-[85vh] bg-[#0e0c1b] border border-purple-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-[#141028] border-b border-purple-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Экспорт автономных файлов</h3>
              <p className="text-xs text-purple-300/60">
                Готовые файлы для запуска без сторонних серверов (index.html, style.css, script.js)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadAll}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 transition-all flex items-center gap-1.5 shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Скачать все файлы</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-purple-300/60 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* File Tabs Bar */}
        <div className="px-6 py-2.5 bg-[#0a0814] border-b border-purple-500/15 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {(Object.keys(files) as Array<keyof typeof files>).map((key) => {
              const f = files[key];
              const Icon = f.icon;
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  onClick={() => {
                    soundFX.playClick();
                    setActiveTab(key);
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                    isActive
                      ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40 shadow-sm'
                      : 'text-purple-300/50 hover:text-purple-200 hover:bg-white/[0.03]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 text-purple-400" />
                  <span>{f.name}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/40 hover:bg-purple-600/20 border border-purple-500/20 text-xs font-mono text-purple-300 hover:text-white transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Скопировано!' : 'Копировать'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-xs font-mono text-purple-200 hover:text-white transition-all"
            >
              <Download className="w-3.5 h-3.5 text-purple-400" />
              <span>Скачать {currentFile.name}</span>
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="flex-1 p-6 overflow-auto bg-[#06050c] font-mono text-xs text-purple-100/90 leading-relaxed select-text">
          <pre className="whitespace-pre">
            <code>{currentFile.code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
