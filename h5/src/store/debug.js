import { defineStore } from 'pinia';

import { KEYS } from '@/constants/keys';

let vconsoleInstance = null;
let loaderPromise = null;

function readPersistedState() {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(KEYS.DEBUG_VCONSOLE_ENABLED) === 'true';
  } catch (error) {
    console.warn('[debug] Failed to read vconsole flag from storage', error);
    return false;
  }
}

function persistState(enabled) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      KEYS.DEBUG_VCONSOLE_ENABLED,
      enabled ? 'true' : 'false',
    );
  } catch (error) {
    console.warn('[debug] Failed to persist vconsole flag', error);
  }
}

function loadVConsoleConstructor() {
  if (typeof window === 'undefined') return Promise.reject(new Error('window unavailable'));

  if (!loaderPromise) {
    loaderPromise = import('vconsole')
      .then((module) => module?.default ?? module)
      .catch((error) => {
        loaderPromise = null;
        throw error;
      });
  }

  return loaderPromise;
}

async function ensureVConsole() {
  if (vconsoleInstance) return vconsoleInstance;

  const VConsoleConstructor = await loadVConsoleConstructor();
  vconsoleInstance = new VConsoleConstructor();
  return vconsoleInstance;
}

function destroyVConsole() {
  if (vconsoleInstance && typeof vconsoleInstance.destroy === 'function') {
    vconsoleInstance.destroy();
  }
  vconsoleInstance = null;
}

export const useDebugStore = defineStore('debug', {
  state: () => ({
    vconsoleEnabled: readPersistedState(),
    initialized: false,
  }),
  actions: {
    async init() {
      if (this.initialized) return;
      this.initialized = true;

      if (this.vconsoleEnabled) {
        try {
          await ensureVConsole();
        } catch (error) {
          console.warn('[debug] Failed to initialize VConsole', error);
          this.vconsoleEnabled = false;
          persistState(false);
        }
      }
    },
    async setVConsoleEnabled(enabled) {
      if (enabled === this.vconsoleEnabled && this.initialized) {
        return;
      }

      if (!this.initialized) {
        this.initialized = true;
      }

      if (enabled) {
        try {
          await ensureVConsole();
          this.vconsoleEnabled = true;
          persistState(true);
        } catch (error) {
          console.warn('[debug] Failed to enable VConsole', error);
          this.vconsoleEnabled = false;
          persistState(false);
          throw error;
        }
      } else {
        destroyVConsole();
        this.vconsoleEnabled = false;
        persistState(false);
      }
    },
  },
});
