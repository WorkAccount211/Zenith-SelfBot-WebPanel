import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface TooltipProps {
  content: string;
  title?: string;
  children: React.ReactNode;
  align?: 'left' | 'right' | 'center';
}

export const ZenithTooltip: React.FC<TooltipProps> = ({ content, title, children, align = 'center' }) => {
  const [isVisible, setIsVisible] = useState(false);

  const alignClass =
    align === 'right'
      ? 'right-0'
      : align === 'left'
      ? 'left-0'
      : 'left-1/2 -translate-x-1/2';

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            className={`absolute bottom-full mb-2.5 z-50 pointer-events-none w-52 sm:w-56 p-2.5 rounded-xl bg-[#09090b]/95 border border-white/10 text-left shadow-2xl backdrop-blur-xl ring-1 ring-white/5 ${alignClass}`}
          >
            {title && (
              <div className="text-[11px] font-bold text-white mb-1 flex items-center space-x-1.5 border-b border-white/10 pb-1">
                <span>{title}</span>
              </div>
            )}
            <p className="text-[10px] text-gray-300 leading-relaxed font-sans">{content}</p>
            {/* Arrow */}
            <div
              className={`absolute top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-[#09090b] ${
                align === 'right' ? 'right-3' : align === 'left' ? 'left-3' : 'left-1/2 -translate-x-1/2'
              }`}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// 1. Custom Golden Crown Badge (VIP / Master Profile)
export const CustomCrownBadge: React.FC<{ size?: number }> = ({ size = 18 }) => {
  return (
    <ZenithTooltip
      title="👑 VIP Master Profile"
      content="Главный приоритетный профиль в ZenithRAM. Защищен от ротации и запускается с наивысшим системным приоритетом."
    >
      <div
        style={{ width: size, height: size }}
        className="flex items-center justify-center rounded-md bg-gradient-to-b from-amber-500/30 via-yellow-600/20 to-amber-950/40 border border-amber-400/60 shadow-sm shadow-amber-500/30 hover:scale-110 transition-transform cursor-help p-0.5"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_1px_3px_rgba(245,158,11,0.8)]"
        >
          <path
            d="M3 17L4.5 7L9 12L12 4L15 12L19.5 7L21 17H3Z"
            fill="url(#crown-grad)"
            stroke="#FDE68A"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          <circle cx="4.5" cy="6.5" r="1.5" fill="#FEF08A" />
          <circle cx="12" cy="3.5" r="1.75" fill="#FEF08A" />
          <circle cx="19.5" cy="6.5" r="1.5" fill="#FEF08A" />
          <path d="M4 17.5H20V19.5H4V17.5Z" fill="#D97706" rx="0.5" />
          <circle cx="8" cy="18.5" r="0.75" fill="#FFFFFF" />
          <circle cx="12" cy="18.5" r="0.75" fill="#FFFFFF" />
          <circle cx="16" cy="18.5" r="0.75" fill="#FFFFFF" />
          <defs>
            <linearGradient id="crown-grad" x1="12" y1="4" x2="12" y2="20" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FBBF24" />
              <stop offset="0.5" stopColor="#F59E0B" />
              <stop offset="1" stopColor="#D97706" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </ZenithTooltip>
  );
};

// 2. Custom Cyber Shield Badge (Protected Account / Zenith Guard)
export const CustomShieldBadge: React.FC<{ size?: number; macAddress?: string }> = ({
  size = 18,
  macAddress
}) => {
  return (
    <ZenithTooltip
      title="🛡️ Protected Account"
      content={`Аппаратная изоляция HWID/MAC активна (${macAddress || 'Спуфинг MAC'}). Исключает бан-чейн между профилями.`}
    >
      <div
        style={{ width: size, height: size }}
        className="flex items-center justify-center rounded-md bg-gradient-to-b from-indigo-500/30 via-blue-600/20 to-indigo-950/40 border border-indigo-400/60 shadow-sm shadow-indigo-500/30 hover:scale-110 transition-transform cursor-help p-0.5"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_1px_3px_rgba(99,102,241,0.8)]"
        >
          <path
            d="M12 2L4 5V11.5C4 16.5 7.5 20.8 12 22C16.5 20.8 20 16.5 20 11.5V5L12 2Z"
            fill="url(#shield-grad)"
            stroke="#818CF8"
            strokeWidth="1.2"
          />
          <path
            d="M12 6L7 9V12C7 15.2 9.2 18.1 12 19C14.8 18.1 17 15.2 17 12V9L12 6Z"
            fill="#1E1B4B"
            fillOpacity="0.8"
          />
          <path d="M12 9V16M9 12.5H15" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="12" cy="12.5" r="1.5" fill="#38BDF8" />
          <defs>
            <linearGradient id="shield-grad" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
              <stop stopColor="#6366F1" />
              <stop offset="0.6" stopColor="#4F46E5" />
              <stop offset="1" stopColor="#1E1B4B" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </ZenithTooltip>
  );
};

// 3. Custom Crossed Swords Badge (In-Game Combat Session)
export const CustomSwordsBadge: React.FC<{ size?: number; gameName?: string }> = ({
  size = 18,
  gameName
}) => {
  return (
    <ZenithTooltip
      title="⚔️ Combat Active"
      content={`Активная игровая сессия в ${gameName || 'Roblox'}. Клиент подключен к серверу, Anti-AFK и инжекторы памяти активны.`}
    >
      <div
        style={{ width: size, height: size }}
        className="flex items-center justify-center rounded-md bg-gradient-to-b from-emerald-500/30 via-teal-600/20 to-emerald-950/40 border border-emerald-400/60 shadow-sm shadow-emerald-500/30 hover:scale-110 transition-transform cursor-help p-0.5"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_1px_3px_rgba(16,185,129,0.8)]"
        >
          <path d="M19 5L14 10M14 10L10 14M14 10L17 7M10 14L8 12M10 14L6 18M6 18L4 20M6 18L7 21" stroke="#34D399" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M5 5L10 10M10 10L14 14M10 10L7 7M14 14L16 12M14 14L18 18M18 18L20 20M18 18L17 21" stroke="#34D399" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="12" cy="12" r="1.5" fill="#A7F3D0" />
        </svg>
      </div>
    </ZenithTooltip>
  );
};

// 4. Custom Ban Badge (Banned Account)
export const CustomBanBadge: React.FC<{ size?: number; reason?: string }> = ({
  size = 18,
  reason
}) => {
  return (
    <ZenithTooltip
      title="⛔ Banned Account"
      content={`Аккаунт заблокирован модерацией Roblox (${reason || 'Зафиксирован бан'}). Авто-запуск остановлен для безопасности.`}
    >
      <div
        style={{ width: size, height: size }}
        className="flex items-center justify-center rounded-md bg-gradient-to-b from-rose-500/30 via-red-600/20 to-rose-950/40 border border-rose-400/60 shadow-sm shadow-rose-500/30 hover:scale-110 transition-transform cursor-help p-0.5"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_1px_3px_rgba(244,63,94,0.8)]"
        >
          <circle cx="12" cy="12" r="9" stroke="#F43F5E" strokeWidth="2" />
          <path d="M6 6L18 18" stroke="#F43F5E" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    </ZenithTooltip>
  );
};

// 5. Custom 3D Roblox Client Logo Icon
export const CustomRobloxIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 20,
  className = ''
}) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`shrink-0 inline-flex items-center justify-center ${className}`}
    >
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_2px_8px_rgba(99,102,241,0.5)]"
      >
        {/* Tilted Roblox Cube with Cyber Gradient */}
        <path
          d="M8.2 2L28.2 6.8L23.8 28.8L3.8 24L8.2 2Z"
          fill="url(#roblox-grad)"
          stroke="#818CF8"
          strokeWidth="1.5"
        />
        {/* Inner Hole */}
        <path
          d="M13.8 12.8L19.2 14.1L18 20.1L12.6 18.8L13.8 12.8Z"
          fill="#09090B"
        />
        <defs>
          <linearGradient id="roblox-grad" x1="8.2" y1="2" x2="23.8" y2="28.8" gradientUnits="userSpaceOnUse">
            <stop stopColor="#A5B4FC" />
            <stop offset="0.5" stopColor="#6366F1" />
            <stop offset="1" stopColor="#4338CA" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

// 6. Custom Golden Robux Coin Icon
export const CustomRobuxIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 14,
  className = ''
}) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`shrink-0 inline-flex items-center justify-center ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_1px_4px_rgba(245,158,11,0.6)]"
      >
        {/* Hexagonal Gold Robux Coin */}
        <polygon
          points="12,2 21,7.2 21,17.8 12,23 3,17.8 3,7.2"
          fill="url(#robux-grad)"
          stroke="#FDE68A"
          strokeWidth="1.2"
        />
        {/* Inner square hole */}
        <rect
          x="8.5"
          y="8.5"
          width="7"
          height="7"
          rx="1"
          fill="#78350F"
          stroke="#FEF08A"
          strokeWidth="0.8"
        />
        <defs>
          <linearGradient id="robux-grad" x1="12" y1="2" x2="12" y2="23" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FCD34D" />
            <stop offset="0.6" stopColor="#F59E0B" />
            <stop offset="1" stopColor="#B45309" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

// 7. Custom Cyber Gamepad Icon
export const CustomGamepadIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 18,
  className = ''
}) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`shrink-0 inline-flex items-center justify-center ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <path
          d="M6 11H10M8 9V13M15 10H15.01M17 12H17.01M6.5 6H17.5C19.43 6 21 7.57 21 9.5V14.5C21 16.43 19.43 18 17.5 18L15.5 16H8.5L6.5 18C4.57 18 3 16.43 3 14.5V9.5C3 7.57 4.57 6 6.5 6Z"
          stroke="url(#gamepad-grad)"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <defs>
          <linearGradient id="gamepad-grad" x1="3" y1="6" x2="21" y2="18" gradientUnits="userSpaceOnUse">
            <stop stopColor="#34D399" />
            <stop offset="1" stopColor="#10B981" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

