/**
 * api.js
 * Module for handling all API interactions in the NBA application
 */

import CONFIG from './config.js';

/**
 * API service for NBA data
 */
class NbaApiService {
    /**
     * Fetch available dates from the NBA schedule API
     * @returns {Promise<string[]>} Array of date strings
     */
    async fetchDates() {
        try {
            const apiUrl = `${CONFIG.API.SCHEDULE}?brand=tsn&type=json`;
            const proxyUrl = `${CONFIG.API.PROXY_URL}${encodeURIComponent(apiUrl)}`;
            
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            
            const data = await response.json();
            return Object.keys(data).sort();
        } catch (error) {
            console.error('Error fetching dates:', error);
            throw new Error(CONFIG.ERRORS.FETCH_DATES);
        }
    }

    /**
     * Fetch schedule data for a specific date
     * @param {string} date - Date in YYYY-MM-DD format
     * @returns {Promise<Object>} Schedule data for the specified date
     */
    async fetchSchedule(date) {
        try {
            const apiUrl = `${CONFIG.API.SCHEDULE}?brand=tsn&type=json&dateOrId=${date}`;
            const proxyUrl = `${CONFIG.API.PROXY_URL}${encodeURIComponent(apiUrl)}`;
            
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            
            const data = await response.json();
            return data[date];
        } catch (error) {
            console.error('Error fetching schedule:', error);
            throw new Error(CONFIG.ERRORS.FETCH_SCHEDULE);
        }
    }

    /**
     * Fetch game statistics for a specific event
     * @param {string} eventId - The ID of the event
     * @returns {Promise<Object>} Game statistics data
     */
    async fetchGameStats(eventId) {
        try {
            const gameStatsUrl = `${CONFIG.API.GAME_STATS}${eventId}/stats?brand=tsn&type=json`;
            const proxyUrl = `${CONFIG.API.PROXY_URL}${encodeURIComponent(gameStatsUrl)}`;
            
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching game stats:', error);
            throw new Error(CONFIG.ERRORS.FETCH_STATS);
        }
    }

    /**
     * Fetch season statistics for a specific event
     * @param {string} eventId - The ID of the event
     * @returns {Promise<Object>} Season statistics data
     */
    async fetchSeasonStats(eventId) {
        try {
            const seasonStatsUrl = `${CONFIG.API.GAME_STATS}${eventId}/competitorSeasonStats?brand=tsn&type=json`;
            const proxyUrl = `${CONFIG.API.PROXY_URL}${encodeURIComponent(seasonStatsUrl)}`;
            
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching season stats:', error);
            throw new Error(CONFIG.ERRORS.FETCH_STATS);
        }
    }
}

// Export a singleton instance
export default new NbaApiService();