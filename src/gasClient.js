// Client to communicate with Google Apps Script API or local storage

import {
  DEFAULT_TEACHERS,
  DEFAULT_ROOMS,
  DEFAULT_CLASSES,
  DEFAULT_TIMETABLE,
  DEFAULT_RESTRICTIONS,
  DEFAULT_RESERVATIONS,
  DEFAULT_SWAPS,
  DEFAULT_SUBSTITUTES,
  DEFAULT_EVENTS,
  DEFAULT_SETTINGS
} from "./mockData";

// Helper to get local storage data
const getLocal = (key, defaultVal) => {
  const val = localStorage.getItem(`stm_${key}`);
  return val ? JSON.parse(val) : defaultVal;
};

// Helper to save local storage data
const setLocal = (key, data) => {
  localStorage.setItem(`stm_${key}`, JSON.stringify(data));
};

// Initialize local storage if empty
export const initializeDatabase = (force = false) => {
  if (force || !localStorage.getItem("stm_initialized")) {
    setLocal("teachers", DEFAULT_TEACHERS);
    setLocal("rooms", DEFAULT_ROOMS);
    setLocal("classes", DEFAULT_CLASSES);
    setLocal("timetable", DEFAULT_TIMETABLE);
    setLocal("restrictions", DEFAULT_RESTRICTIONS);
    setLocal("reservations", DEFAULT_RESERVATIONS);
    setLocal("swaps", DEFAULT_SWAPS);
    setLocal("substitutes", DEFAULT_SUBSTITUTES);
    setLocal("events", DEFAULT_EVENTS);
    setLocal("settings", DEFAULT_SETTINGS);
    localStorage.setItem("stm_initialized", "true");
  }
};

// Always make sure local db is initialized
initializeDatabase();

// Main client object
export const gasClient = {
  // Get active configurations (GAS URL, etc.)
  getSettings() {
    return getLocal("settings", DEFAULT_SETTINGS);
  },

  // Save configurations
  saveSettings(settings) {
    setLocal("settings", settings);
    return Promise.resolve(settings);
  },

  async getAllData() {
    const settings = this.getSettings();
    if (settings.gasUrl) {
      try {
        const response = await fetch(`${settings.gasUrl}?action=getAllData`);
        if (!response.ok) throw new Error("GAS API network error");
        const json = await response.json();
        if (json.status === "success" && json.data) {
          // Sync to local storage as cache
          Object.keys(json.data).forEach(key => {
            setLocal(key, json.data[key]);
          });
          // Merge local settings so settings is never undefined
          json.data.settings = settings;
          return json.data;
        }
      } catch (err) {
        console.error("Failed to fetch from GAS. Falling back to local storage.", err);
      }
    }
    
    // Fallback to local storage
    return {
      teachers: getLocal("teachers", DEFAULT_TEACHERS),
      rooms: getLocal("rooms", DEFAULT_ROOMS),
      classes: getLocal("classes", DEFAULT_CLASSES),
      timetable: getLocal("timetable", DEFAULT_TIMETABLE),
      restrictions: getLocal("restrictions", DEFAULT_RESTRICTIONS),
      reservations: getLocal("reservations", DEFAULT_RESERVATIONS),
      swaps: getLocal("swaps", DEFAULT_SWAPS),
      substitutes: getLocal("substitutes", DEFAULT_SUBSTITUTES),
      events: getLocal("events", DEFAULT_EVENTS),
      settings: getLocal("settings", DEFAULT_SETTINGS)
    };
  },

  // Save a single table
  async saveTable(tableName, data) {
    const settings = this.getSettings();
    setLocal(tableName, data); // Always save locally first

    if (settings.gasUrl) {
      try {
        // GAS Web App POST requires cors mode
        const response = await fetch(settings.gasUrl, {
          method: "POST",
          mode: "no-cors", // Crucial for GAS web app redirect
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            action: "saveTable",
            table: tableName,
            data: data
          })
        });
        // With 'no-cors', the response type is 'opaque', meaning we can't inspect the status
        // but it executes successfully on GAS backend.
        return { status: "success", info: "GAS upload requested (no-cors mode)" };
      } catch (err) {
        console.error("Failed to post to GAS:", err);
        throw err;
      }
    }

    return Promise.resolve({ status: "success", data });
  },

  // Clear data and re-initialize from scratch
  resetDatabase() {
    initializeDatabase(true);
    return Promise.resolve(true);
  }
};
