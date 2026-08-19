import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { soundFX } from '../../utils/sound';
import { toast } from '../../utils/toastEmitter';

interface CopyButtonProps {
  textToCopy: string;
  itemName?: string;
  label?: string;
  showLabel?: boolean;
  prefix?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  iconOnly?: boolean;
  tooltip?: string;
  stopPropagation?: boolean;
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  textToCopy,
  itemName,
  label,
  showLabel = false,
  prefix = 'ID:',
  className = '',
  size = 'sm',
  iconOnly = false,
  tooltip,
  stopPropagation = true
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    if (stopPropagation) {
      e.stopPropagation();
    }
    
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textToCopy);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      setCopied(true);
      soundFX.playClick();
      
      const desc = itemName ? ` "${itemName}"` : '';
      toast.success(`${prefix} ${desc} скопирован в буфер обмена: ${textToCopy}`, 2600);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy', err);
      toast.error('Не удалось скопировать в буфер', 2500);
    }
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4'
  };

  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={handleCopy}
        title={tooltip || `Скопировать ${textToCopy}`}
        className={`p-1.5 rounded-lg transition-all duration-200 ${
          copied
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
            : 'bg-black/30 hover:bg-purple-600/20 text-purple-300 hover:text-white border border-purple-500/20 hover:border-purple-400'
        } ${className}`}
      >
        {copied ? (
          <Check className={`${iconSizes[size]} text-emerald-400 animate-scale-in`} />
        ) : (
          <Copy className={`${iconSizes[size]}`} />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={tooltip || `Скопировать ${textToCopy}`}
      className={`inline-flex items-center gap-1.5 rounded-lg font-mono transition-all duration-200 ${
        copied
          ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
          : 'bg-black/40 hover:bg-purple-950/60 text-purple-300/80 hover:text-white border border-purple-500/20 hover:border-purple-400'
      } ${sizeClasses[size]} ${className}`}
    >
      {copied ? (
        <Check className={`${iconSizes[size]} text-emerald-400 shrink-0`} />
      ) : (
        <Copy className={`${iconSizes[size]} text-purple-400 shrink-0`} />
      )}
      <span className="truncate">
        {copied
          ? 'Скопировано!'
          : showLabel
          ? `${label || prefix} ${textToCopy}`
          : `${prefix} ${textToCopy}`}
      </span>
    </button>
  );
};
