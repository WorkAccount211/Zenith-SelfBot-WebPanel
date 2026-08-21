import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  FileCode2,
  FileText,
  Terminal,
  Copy,
  Check,
  Download,
  FolderTree,
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';
import { DESKTOP_PROJECT_FILES, DesktopFile } from '../../desktopSourceCode';

export const ProjectFilesTab: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<DesktopFile>(DESKTOP_PROJECT_FILES[0]);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([selectedFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = selectedFile.name;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left File Tree column */}
      <div className="w-64 sm:w-72 bg-[#18181B] border-r border-white/5 p-4 flex flex-col shrink-0 overflow-y-auto">
        <div className="flex items-center space-x-2 pb-3 mb-3 border-b border-white/5">
          <FolderTree className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-300">Файлы проекта ZenithRAM</span>
        </div>

        <div className="space-y-1">
          {DESKTOP_PROJECT_FILES.map((file) => {
            const isSelected = selectedFile.name === file.name;
            const isPy = file.name.endsWith('.py');
            const isMd = file.name.endsWith('.md');
            const isBat = file.name.endsWith('.bat');

            return (
              <button
                key={file.name}
                onClick={() => setSelectedFile(file)}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium text-left transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {isPy ? (
                  <FileCode2 className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-indigo-400'}`} />
                ) : isMd ? (
                  <FileText className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-blue-400'}`} />
                ) : (
                  <Terminal className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-amber-400'}`} />
                )}
                <div className="truncate flex-1">
                  <div className="truncate font-mono">{file.name}</div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-auto pt-4 border-t border-white/5 text-[11px] text-gray-500 space-y-1">
          <p className="font-semibold text-gray-400">Автономная сборка EXE:</p>
          <p>Запустите <code className="text-emerald-400 font-mono">build_exe.bat</code> на Windows для создания <code className="text-emerald-400 font-mono">ZenithRAM.exe</code>.</p>
        </div>
      </div>

      {/* Right Source Code preview */}
      <div className="flex-1 flex flex-col bg-[#09090B] overflow-hidden">
        {/* Editor Toolbar */}
        <div className="px-6 py-3 border-b border-white/5 bg-[#18181B] flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold text-white font-mono">{selectedFile.path}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-gray-300 border border-white/10 uppercase font-mono">
                {selectedFile.language}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{selectedFile.description}</p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-xs font-medium transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Скопировано!' : 'Копировать'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Скачать файл</span>
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="flex-1 p-6 overflow-y-auto font-mono text-xs text-gray-300 leading-relaxed bg-[#09090B]">
          <pre className="whitespace-pre-wrap select-text selection:bg-indigo-600 selection:text-white">
            {selectedFile.content}
          </pre>
        </div>
      </div>
    </div>
  );
};
