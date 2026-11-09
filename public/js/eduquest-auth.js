// EduQuest Fantasy RPG Authentication Client
(function (window) {
  const TOKEN_KEY = 'eduquest_auth_token_v1';
  const USER_KEY = 'eduquest_auth_user_v1';

  const listeners = [];

  const EduQuestAuth = {
    getToken() {
      return localStorage.getItem(TOKEN_KEY);
    },

    getUser() {
      try {
        const raw = localStorage.getItem(USER_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    },

    isLoggedIn() {
      return !!this.getToken() && !!this.getUser();
    },

    hasRole(role) {
      const user = this.getUser();
      if (!user) return false;
      if (Array.isArray(role)) return role.includes(user.role);
      return user.role === role;
    },

    setSession(token, user) {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      this.notifyAuthChange(user);
    },

    clearSession() {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      this.notifyAuthChange(null);
    },

    onAuthChange(cb) {
      listeners.push(cb);
    },

    notifyAuthChange(user) {
      listeners.forEach(cb => {
        try { cb(user); } catch (e) { console.error(e); }
      });
      window.dispatchEvent(new CustomEvent('eduquest:auth-changed', { detail: user }));
    },

    async fetchWithAuth(url, options = {}) {
      const token = this.getToken();
      const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(url, { ...options, headers });
      if (res.status === 401) {
        // Token expired or invalid
        this.clearSession();
      }
      return res;
    },

    async login(identifier, password) {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });
      const data = await res.json();
      if (data.success && data.token) {
        this.setSession(data.token, data.user);
      }
      return data;
    },

    async register(payload) {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && data.token) {
        this.setSession(data.token, data.user);
      }
      return data;
    },

    async logout() {
      try {
        await this.fetchWithAuth('/api/auth/logout', { method: 'POST' });
      } catch (e) {}
      this.clearSession();
      return { success: true };
    },

    async changePassword(currentPassword, newPassword) {
      const res = await this.fetchWithAuth('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword })
      });
      return await res.json();
    },

    async getPlayerData() {
      if (!this.isLoggedIn()) return null;
      const res = await this.fetchWithAuth('/api/player/data');
      if (!res.ok) return null;
      return await res.json();
    },

    async claimMilestoneReward(runId, milestone, gold = 0, exp = 0, skillId = null, itemName = null) {
      if (!this.isLoggedIn()) return null;
      const res = await this.fetchWithAuth('/api/player/claim-milestone-reward', {
        method: 'POST',
        body: JSON.stringify({ runId, milestone, gold, exp, skillId, itemName })
      });
      return await res.json();
    },

    async submitLearningSession(sessionData) {
      if (!this.isLoggedIn()) return null;
      const res = await this.fetchWithAuth('/api/player/submit-session', {
        method: 'POST',
        body: JSON.stringify(sessionData)
      });
      return await res.json();
    },

    async equipItem(inventoryId, action = 'equip') {
      if (!this.isLoggedIn()) return null;
      const res = await this.fetchWithAuth('/api/player/equip', {
        method: 'POST',
        body: JSON.stringify({ inventoryId, action })
      });
      return await res.json();
    },

    async selectPet(petId) {
      if (!this.isLoggedIn()) return null;
      const res = await this.fetchWithAuth('/api/player/select-pet', {
        method: 'POST',
        body: JSON.stringify({ petId })
      });
      return await res.json();
    },

    async buyShopItem(itemId) {
      if (!this.isLoggedIn()) return null;
      const res = await this.fetchWithAuth('/api/shop/buy', {
        method: 'POST',
        body: JSON.stringify({ itemId })
      });
      return await res.json();
    },

    async usePotion(itemId) {
      if (!this.isLoggedIn()) return null;
      const res = await this.fetchWithAuth('/api/shop/use-potion', {
        method: 'POST',
        body: JSON.stringify({ itemId })
      });
      return await res.json();
    }
  };

  window.EduQuestAuth = EduQuestAuth;
})(window);
