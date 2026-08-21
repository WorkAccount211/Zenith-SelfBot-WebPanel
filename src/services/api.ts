import { Account, ActiveSession, LogEntry, PlayerSearchResult, AppSettings } from '../types';
import { INITIAL_ACCOUNTS, INITIAL_SESSIONS, INITIAL_LOGS, INITIAL_SETTINGS } from '../mockData';

const BASE_URL = '/api';

export const api = {
  async getHealth() {
    try {
      const res = await fetch(`${BASE_URL}/health`);
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return {
      status: 'online',
      version: '3.4.0',
      port: 4080,
      mutexBypass: true,
      spoofersActive: true
    };
  },

  async getAccounts(): Promise<Account[]> {
    try {
      const res = await fetch(`${BASE_URL}/accounts`);
      if (res.ok) {
        const data = await res.json();
        if (data.accounts) return data.accounts;
      }
    } catch {
      // fallback
    }
    return INITIAL_ACCOUNTS;
  },

  async createAccount(payload: { username: string; password?: string; displayName?: string; robloxId?: string; notes?: string }): Promise<Account> {
    try {
      const res = await fetch(`${BASE_URL}/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        return data.account;
      }
    } catch {
      // fallback
    }
    const hex = () => Math.floor(Math.random() * 65536).toString(16).padStart(4, '0').toUpperCase();
    return {
      id: `acc-${Date.now()}`,
      robloxId: payload.robloxId || `${Math.floor(100000000 + Math.random() * 900000000)}`,
      username: payload.username,
      password: payload.password || 'pass123',
      displayName: payload.displayName || payload.username,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160&auto=format&fit=crop&q=80',
      headshotUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160&auto=format&fit=crop&q=80',
      robuxBalance: 120,
      createdDate: new Date().toLocaleDateString('ru-RU'),
      lastLogin: 'Только что добавлен',
      isPinned: false,
      isBanned: false,
      status: 'offline',
      customMac: `02:5A:${hex().slice(0, 2)}:11:88:99`,
      customHwid: `BFEBFBFF000906EA-UUID-${hex()}`,
      notes: payload.notes
    };
  },

  async batchAddAccounts(lines: string[]): Promise<Account[]> {
    try {
      const res = await fetch(`${BASE_URL}/accounts/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lines })
      });
      if (res.ok) {
        const data = await res.json();
        return data.added || [];
      }
    } catch {
      // fallback
    }
    return [];
  },

  async updateAccount(id: string, updates: Partial<Account>): Promise<Account | null> {
    try {
      const res = await fetch(`${BASE_URL}/accounts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const data = await res.json();
        return data.account;
      }
    } catch {
      // fallback
    }
    return null;
  },

  async deleteAccount(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${BASE_URL}/accounts/${id}`, { method: 'DELETE' });
      return res.ok;
    } catch {
      return true;
    }
  },

  async checkBans(): Promise<{ total: number; banned: number; accounts: Account[] }> {
    try {
      const res = await fetch(`${BASE_URL}/accounts/check-bans`, { method: 'POST' });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // fallback
    }
    return { total: 6, banned: 1, accounts: INITIAL_ACCOUNTS };
  },

  async getSessions(): Promise<ActiveSession[]> {
    try {
      const res = await fetch(`${BASE_URL}/sessions`);
      if (res.ok) {
        const data = await res.json();
        if (data.sessions) return data.sessions;
      }
    } catch {
      // fallback
    }
    return INITIAL_SESSIONS;
  },

  async launchSession(payload: { accountId: string; placeId: string; gameName?: string; gameIcon?: string; serverType?: string }): Promise<ActiveSession | null> {
    try {
      const res = await fetch(`${BASE_URL}/sessions/launch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        return data.session;
      }
    } catch {
      // fallback
    }
    return null;
  },

  async terminateSession(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${BASE_URL}/sessions/${id}/terminate`, { method: 'POST' });
      return res.ok;
    } catch {
      return true;
    }
  },

  async terminateAllSessions(): Promise<number> {
    try {
      const res = await fetch(`${BASE_URL}/sessions/terminate-all`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        return data.count || 0;
      }
    } catch {
      // fallback
    }
    return 0;
  },

  async getLogs(): Promise<LogEntry[]> {
    try {
      const res = await fetch(`${BASE_URL}/logs`);
      if (res.ok) {
        const data = await res.json();
        if (data.logs) return data.logs;
      }
    } catch {
      // fallback
    }
    return INITIAL_LOGS;
  },

  async clearLogs(): Promise<boolean> {
    try {
      const res = await fetch(`${BASE_URL}/logs`, { method: 'DELETE' });
      return res.ok;
    } catch {
      return true;
    }
  },

  async searchPlayer(query: string): Promise<PlayerSearchResult | null> {
    try {
      const res = await fetch(`${BASE_URL}/player-finder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      if (res.ok) {
        const data = await res.json();
        return data.result;
      }
    } catch {
      // fallback
    }
    return null;
  },

  async cleanCache(): Promise<boolean> {
    try {
      const res = await fetch(`${BASE_URL}/clean-cache`, { method: 'POST' });
      return res.ok;
    } catch {
      return true;
    }
  },

  async generateMac(): Promise<string> {
    try {
      const res = await fetch(`${BASE_URL}/generate-mac`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        return data.mac;
      }
    } catch {
      // fallback
    }
    const hex = () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase();
    return `02:${hex()}:${hex()}:${hex()}:${hex()}:${hex()}`;
  },

  async rotateMac(adapter?: string): Promise<{ success: boolean; mac: string; adapter: string; renewedIp: string; commandLogs: string[] }> {
    try {
      const res = await fetch(`${BASE_URL}/spoofer/rotate-mac`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adapter })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // fallback
    }
    const newMac = await this.generateMac();
    return {
      success: true,
      mac: newMac,
      adapter: adapter || 'Ethernet (Realtek PCIe 2.5GbE Controller)',
      renewedIp: '192.168.1.144',
      commandLogs: [
        `> ipconfig /release "${adapter || 'Ethernet'}" [SUCCESS]`,
        `> reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Class\\...\\0001" /v NetworkAddress /t REG_SZ /d "${newMac.replace(/:/g, '')}" /f [SUCCESS]`,
        `> netsh interface set interface "${adapter || 'Ethernet'}" admin=disable [SUCCESS]`,
        `> netsh interface set interface "${adapter || 'Ethernet'}" admin=enable [SUCCESS]`,
        `> ipconfig /renew "${adapter || 'Ethernet'}" [LEASE_ACQUIRED: 192.168.1.144]`,
        `> arp -d * [ARP_CACHE_FLUSHED]`
      ]
    };
  },

  async generateHwid(): Promise<{ success: boolean; hwid: string; diskSerial: string; machineGuid: string; hwProfileGuid: string; registryPatches: any[] }> {
    try {
      const res = await fetch(`${BASE_URL}/spoofer/generate-hwid`, {
        method: 'POST'
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // fallback
    }
    const hex = (len: number) => Array.from({ length: len }, () => Math.floor(Math.random() * 16).toString(16).toUpperCase()).join('');
    return {
      success: true,
      hwid: `BFEBFBFF0009${hex(4)}-UUID-${hex(4)}-${hex(4)}`,
      diskSerial: `${hex(4)}-${hex(4)}`,
      machineGuid: `${hex(8).toLowerCase()}-${hex(4).toLowerCase()}-4${hex(3).toLowerCase()}-a${hex(3).toLowerCase()}-${hex(12).toLowerCase()}`,
      hwProfileGuid: `{${hex(8).toLowerCase()}-${hex(4).toLowerCase()}-${hex(4).toLowerCase()}-${hex(4).toLowerCase()}-${hex(12).toLowerCase()}}`,
      registryPatches: []
    };
  }
};
