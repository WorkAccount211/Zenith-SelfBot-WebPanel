import React, { useState } from 'react';
import { Search, Server, Users, Hash, Shield, ExternalLink, X } from 'lucide-react';
import { DiscordServer } from '../../types/bot';
import { soundFX } from '../../utils/sound';
import { useToast } from '../ToastContainer';
import { CopyButton } from '../common/CopyButton';
import { ServersSkeleton } from '../common/Skeleton';

interface ServersTabProps {
  servers: DiscordServer[];
  onSelectChannel?: (channelId: string) => void;
  isLoading?: boolean;
}

export const ServersTab: React.FC<ServersTabProps> = ({
  servers,
  onSelectChannel,
  isLoading = false
}) => {
  const [search, setSearch] = useState('');
  const [selectedServer, setSelectedServer] = useState<DiscordServer | null>(null);
  const { showToast } = useToast();

  if (isLoading) {
    return <ServersSkeleton />;
  }

  const safeServers = Array.isArray(servers) ? servers : [];

  const filteredServers = safeServers.filter(
    (s) =>
      s &&
      ((s.name && s.name.toLowerCase().includes(search.toLowerCase())) ||
      (s.id && s.id.includes(search)))
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Подключенные серверы</h2>
          <p className="text-xs text-purple-300/60 mt-0.5">
            Всего гильдий в профиле: {servers.length}
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-purple-400/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по названию или ID..."
            className="w-full bg-[#120f24]/80 border border-purple-500/20 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-purple-300/40 outline-none transition-all"
          />
        </div>
      </div>

      {/* Grid of Servers */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredServers.map((server) => (
          <div
            key={server.id}
            className="rounded-2xl bg-[#131024]/70 border border-purple-500/20 backdrop-blur-xl overflow-hidden hover:border-purple-500/40 transition-all shadow-xl hover:shadow-[0_10px_30px_rgba(139,92,246,0.15)] flex flex-col justify-between group"
          >
            {/* Banner top */}
            <div
              className="h-24 w-full bg-cover bg-center relative bg-gradient-to-r from-purple-900 to-indigo-900"
              style={server.banner ? { backgroundImage: `url(${server.banner})` } : {}}
            >
              <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
            </div>

            {/* Server Body */}
            <div className="p-5 pt-0 relative flex-1 flex flex-col justify-between">
              {/* Icon offset */}
              <div className="flex items-end justify-between -mt-10 mb-3">
                <img
                  src={server.icon}
                  alt={server.name}
                  className="w-16 h-16 rounded-2xl object-cover ring-4 ring-[#131024] shadow-lg group-hover:scale-105 transition-transform"
                />
                <button
                  onClick={() => {
                    soundFX.playClick();
                    setSelectedServer(server);
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 transition-colors flex items-center gap-1"
                >
                  <span>Каналы ({server.channels.length})</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              <div>
                <h3 className="text-base font-bold text-white truncate" title={server.name}>
                  {server.name}
                </h3>

                {/* Copy ID Button */}
                <div className="mt-1.5 mb-4">
                  <CopyButton
                    textToCopy={server.id}
                    itemName={server.name}
                    prefix="ID:"
                    size="sm"
                    tooltip="Скопировать ID сервера"
                  />
                </div>

                {/* Metadata Pills */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-purple-500/10 text-xs text-purple-200/70">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-semibold text-white">{server.memberCount}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-blue-400" />
                    <span className="font-semibold text-white">{server.channelsCount}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-purple-400" />
                    <span className="font-semibold text-white">{server.rolesCount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredServers.length === 0 && (
        <div className="text-center py-12 rounded-2xl bg-[#131024]/40 border border-purple-500/10">
          <Server className="w-12 h-12 mx-auto text-purple-400/40 mb-3" />
          <p className="text-sm text-purple-200/60">Серверы по запросу "{search}" не найдены</p>
        </div>
      )}

      {/* Channel Inspection Modal */}
      {selectedServer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg bg-[#141028] border border-purple-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-purple-500/20">
              <div className="flex items-center gap-3">
                <img src={selectedServer.icon} alt="" className="w-10 h-10 rounded-xl" />
                <div>
                  <h3 className="font-bold text-white">{selectedServer.name}</h3>
                  <span className="text-xs text-purple-300/60">Каналы сервера ({selectedServer.channels.length})</span>
                </div>
              </div>
              <button
                onClick={() => {
                  soundFX.playClick();
                  setSelectedServer(null);
                }}
                className="text-purple-300/60 hover:text-white p-1 rounded-lg hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
              {selectedServer.channels.map((chan) => (
                <div
                  key={chan.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] hover:bg-purple-600/15 border border-purple-500/10 transition-colors"
                >
                  <div className="flex items-center gap-2 text-sm text-purple-200 min-w-0">
                    <Hash className="w-4 h-4 text-purple-400 shrink-0" />
                    <span className="font-medium font-mono truncate">{chan.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <CopyButton
                      textToCopy={chan.id}
                      itemName={chan.name}
                      prefix="Channel ID:"
                      size="sm"
                      tooltip="Скопировать ID канала"
                    />

                    {onSelectChannel && (
                      <button
                        onClick={() => {
                          soundFX.playSuccess();
                          onSelectChannel(chan.id);
                          setSelectedServer(null);
                          showToast(`Канал ${chan.name} выбран для вывода`, 'success');
                        }}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-all shadow"
                      >
                        Выбрать
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
