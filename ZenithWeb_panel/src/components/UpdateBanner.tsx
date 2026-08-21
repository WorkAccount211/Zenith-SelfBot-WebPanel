import React, { useState } from 'react';
import { Sparkles, ArrowRight, X, RefreshCw, CheckCircle2, Zap, ShieldCheck } from 'lucide-react';
import { FirmwareUpdateInfo } from '../types/bot';
import { soundFX } from '../utils/sound';

interface UpdateBannerProps {
  updateInfo: FirmwareUpdateInfo;
  onGoToSettings: () => void;
  onTriggerUpdate: () => void;
  isUpdating: boolean;
}

export const UpdateBanner: React.FC<UpdateBannerProps> = ({
  updateInfo,
  onGoToSettings,
  onTriggerUpdate,
  isUpdating
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed || !updateInfo.hasUpdate) {
    return null;
  }

  return (
    <div className="mb-6 relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-950/90 via-[#191136]/90 to-indigo-950/90 border border-purple-500/40 p-4 shadow-[0_0_25px_rgba(168,85,247,0.25)] backdrop-blur-xl animate-fade-in">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-purple-500/10 to-transparent pointer-events-none" />
      <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-purple-600/20 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Side: Icon & Info */}
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-purple-500/20 border border-purple-400/30 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)] shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-white text-sm tracking-tight">
                Доступно обновление прошивки бота и API
              </span>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                {updateInfo.pendingFirmwareVersion || 'v2.5.0-STABLE'}
              </span>
              <span className="text-[10px] font-mono text-purple-300/70 bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-500/20">
                Service Worker OTA
              </span>
            </div>
            <p className="text-xs text-purple-200/80 mt-1 line-clamp-1">
              Улучшен протокол WebSocket Gateway v10, повышенная стабильность, оптимизация ротатора никнеймов и кэширования.
            </p>
          </div>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {isUpdating ? (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-900/60 border border-purple-500/30 text-purple-200 text-xs font-semibold">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-300" />
              <span>Установка {updateInfo.progress || 0}%...</span>
            </div>
          ) : (
            <>
              <button
                onClick={() => {
                  soundFX.playClick();
                  onTriggerUpdate();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 shadow-[0_0_15px_rgba(168,85,247,0.4)] border border-purple-400/40 transition-all flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span>Обновить сейчас</span>
              </button>

              <button
                onClick={() => {
                  soundFX.playClick();
                  onGoToSettings();
                }}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-purple-200 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] border border-purple-500/30 transition-colors flex items-center gap-1"
              >
                <span>Подробнее в Настройках</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          <button
            onClick={() => {
              soundFX.playClick();
              setIsDismissed(true);
            }}
            className="p-2 text-purple-400 hover:text-white transition-colors"
            title="Закрыть уведомление"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress bar if updating */}
      {isUpdating && (
        <div className="mt-3 pt-2 border-t border-purple-500/20 space-y-1.5">
          <div className="flex justify-between text-[11px] text-purple-300">
            <span>{updateInfo.currentStepMessage || 'Обновление прошивки...'}</span>
            <span className="font-mono font-bold">{updateInfo.progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 via-violet-400 to-emerald-400 transition-all duration-300 rounded-full"
              style={{ width: `${updateInfo.progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
