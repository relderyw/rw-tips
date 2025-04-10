/**
 * app.js
 * Main application module for the NBA application
 */

import apiService from './api.js';
import uiService from './ui.js';
import CONFIG from './config.js';

/**
 * NBA Application Controller
 * Manages the application state and coordinates between services
 */
class NbaApp {
    constructor() {
        this.currentDate = null;
        this.autoUpdateInterval = null;
        this.previousScores = {};
        this.isConnected = true;
        
        // DOM Elements
        this.tabsElement = document.getElementById('tabs');
        this.scheduleElement = document.getElementById('schedule');
        this.modal = document.getElementById('gameStatsModal');
        this.modalTitle = document.getElementById('modalTitle');
        this.homeTeamName = document.getElementById('homeTeamName');
        this.awayTeamName = document.getElementById('awayTeamName');
        this.statsContent = document.getElementById('statsContent');
        this.closeModalBtn = document.getElementById('closeModal');
        
        this.init();
    }
    
    /**
     * Initialize the application
     */
    init() {
        this.setupEventListeners();
        this.renderTabs();
        this.setupConnectionMonitoring();
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Close modal when clicking the close button
        this.closeModalBtn.addEventListener('click', () => this.hideModal());
        
        // Close modal when clicking outside the modal content
        window.addEventListener('click', (event) => {
            if (event.target === this.modal) this.hideModal();
        });
        
        // Make the showGameStats function available globally
        window.showGameStats = this.showGameStats.bind(this);
    }
    
    /**
     * Set up connection monitoring
     */
    setupConnectionMonitoring() {
        window.addEventListener('online', () => {
            console.log('Conexão restabelecida');
            this.isConnected = true;
            this.startAutoUpdate();
        });

        window.addEventListener('offline', () => {
            console.log('Conexão perdida');
            this.isConnected = false;
        });
    }
    
    /**
     * Render date tabs
     */
    async renderTabs() {
        try {
            const dates = await apiService.fetchDates();
            this.tabsElement.innerHTML = uiService.renderDateTabs(dates, this.currentDate);
            
            // Add event listeners to tabs
            document.querySelectorAll('.tab').forEach(tab => {
                tab.addEventListener('click', () => {
                    document.querySelectorAll('.tab').forEach(t => t.classList.remove(CONFIG.CLASSES.ACTIVE));
                    tab.classList.add(CONFIG.CLASSES.ACTIVE);
                    this.currentDate = tab.dataset.date;
                    this.previousScores = {};
                    this.startAutoUpdate();
                });
            });
            
            // Set current date if not already set
            if (!this.currentDate) {
                const hoje = uiService.getCurrentDateSP();
                this.currentDate = dates.includes(hoje) ? hoje : dates[0];
            }
            
            this.startAutoUpdate();
            
        } catch (error) {
            console.error('Erro ao renderizar abas:', error);
            this.tabsElement.innerHTML = `<div class="error">${CONFIG.ERRORS.FETCH_DATES}</div>`;
        }
    }
    
    /**
     * Start auto-update for schedule
     */
    startAutoUpdate() {
        // Clear existing interval
        if (this.autoUpdateInterval) clearInterval(this.autoUpdateInterval);
        
        // Render schedule immediately
        this.renderSchedule();
        
        // Set up interval for auto-update
        this.autoUpdateInterval = setInterval(() => {
            if (this.isConnected && this.currentDate) {
                this.renderSchedule();
            }
        }, CONFIG.INTERVALS.AUTO_UPDATE);
    }
    
    /**
     * Render schedule for current date
     */
    async renderSchedule() {
        if (!this.currentDate) return;
        
        try {
            const data = await apiService.fetchSchedule(this.currentDate);
            this.scheduleElement.innerHTML = uiService.renderSchedule(data, this.currentDate);
        } catch (error) {
            console.error('Erro ao renderizar calendário:', error);
            this.scheduleElement.innerHTML = `<div class="day-header">${uiService.formatDate(this.currentDate)}</div><div class="error">${CONFIG.ERRORS.FETCH_SCHEDULE}: ${error.message}</div>`;
        }
    }
    
    /**
     * Show game statistics
     * @param {string} eventId - Event ID
     * @param {string} homeName - Home team name
     * @param {string} awayName - Away team name
     */
    async showGameStats(eventId, homeName, awayName) {
        try {
            const scheduleData = await apiService.fetchSchedule(this.currentDate);
            const game = scheduleData?.events.find(e => e.eventId === eventId)?.event;
            const gameStatus = game?.status || 'Pre-Game';
            const hasScores = game?.top.score != null && game?.bottom.score != null;
            const isLiveOrFinished = hasScores || gameStatus === 'In Progress' || gameStatus === 'Final';

            let data;
            if (isLiveOrFinished) {
                data = await apiService.fetchGameStats(eventId);
            } else {
                data = await apiService.fetchSeasonStats(eventId);
            }

            this.modalTitle.textContent = `${homeName} vs ${awayName}`;
            this.homeTeamName.textContent = homeName;
            this.awayTeamName.textContent = awayName;
            this.statsContent.innerHTML = uiService.renderGameStats(data, game, isLiveOrFinished);
            this.showModal();
            
        } catch (error) {
            console.error('Failed to load game stats:', error);
            this.modalTitle.textContent = `${homeName} vs ${awayName}`;
            this.homeTeamName.textContent = homeName;
            this.awayTeamName.textContent = awayName;
            this.statsContent.innerHTML = `
                <div class="error">${CONFIG.ERRORS.FETCH_STATS}</div>
                <div class="error-details">${error.message}</div>
                <button class="retry-btn" onclick="showGameStats('${eventId}', '${homeName}', '${awayName}')">Tentar Novamente</button>
            `;
            this.showModal();
        }
    }
    
    /**
     * Show the modal
     */
    showModal() {
        this.modal.style.display = 'flex';
    }
    
    /**
     * Hide the modal
     */
    hideModal() {
        this.modal.style.display = 'none';
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new NbaApp();
});