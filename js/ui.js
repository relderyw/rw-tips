/**
 * ui.js
 * Module for handling UI components and rendering in the NBA application
 */

import CONFIG from './config.js';

/**
 * UI service for NBA data visualization
 */
class NbaUiService {
    constructor() {
        this.previousScores = {};
    }

    /**
     * Format date to Brazilian format
     * @param {string} dateStr - Date string in YYYY-MM-DD format
     * @returns {string} Formatted date string
     */
    formatDate(dateStr) {
        const data = new Date(dateStr + 'T12:00:00');
        return data.toLocaleDateString(CONFIG.FORMAT.LOCALE, CONFIG.FORMAT.DATE_OPTIONS)
            .replace('.', '').toUpperCase();
    }

    /**
     * Get current date in São Paulo timezone
     * @returns {string} Current date in YYYY-MM-DD format
     */
    getCurrentDateSP() {
        const now = new Date();
        const spTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
        return spTime.toISOString().split('T')[0];
    }

    /**
     * Split team name into city and nickname
     * @param {string} fullName - Full team name
     * @returns {Object} Object with city and nickname
     */
    splitTeamName(fullName) {
        for (const [nickname, city] of Object.entries(CONFIG.TEAMS.SPECIAL_CASES)) {
            if (fullName.includes(nickname)) return { city, nickname };
        }
        const parts = fullName.split(' ');
        if (parts.length === 1) return { city: fullName, nickname: '' };
        const nickname = parts.pop();
        const city = parts.join(' ');
        return { city, nickname };
    }

    /**
     * Format team record
     * @param {string} record - Team record in W-L format
     * @returns {string} HTML formatted record
     */
    formatRecord(record) {
        if (!record) return '';
        const [wins, losses] = record.split('-');
        return `<span class="wins">${wins}</span>-<span class="losses">${losses}</span>`;
    }

    /**
     * Get team logo URL
     * @param {string} seoIdentifier - Team SEO identifier
     * @returns {string} Team logo URL
     */
    getTeamLogoUrl(seoIdentifier) {
        return `${CONFIG.TEAMS.LOGO_URL_BASE}${seoIdentifier}&width=50&height=50`;
    }

    /**
     * Format time to Brazilian format
     * @param {string} dateET - Date string in ET timezone
     * @returns {string} Formatted time string
     */
    formatTime(dateET) {
        const date = new Date(dateET);
        return date.toLocaleTimeString(CONFIG.FORMAT.LOCALE, CONFIG.FORMAT.TIME_OPTIONS)
            .replace(':', 'h');
    }

    /**
     * Render date tabs
     * @param {string[]} dates - Array of date strings
     * @param {string} currentDate - Currently selected date
     * @param {Function} onTabClick - Callback for tab click
     * @returns {string} HTML for date tabs
     */
    renderDateTabs(dates, currentDate) {
        let html = '';
        const hoje = this.getCurrentDateSP();
        const dataAtiva = dates.includes(hoje) ? hoje : dates[0];
        
        dates.forEach(date => {
            const ativa = date === (currentDate || dataAtiva);
            const textoAba = this.formatDate(date);
            html += `<div class="tab${ativa ? ' ' + CONFIG.CLASSES.ACTIVE : ''}" data-date="${date}">${textoAba}</div>`;
        });
        
        return html;
    }

    /**
     * Render schedule for a specific date
     * @param {Object} data - Schedule data
     * @param {string} date - Date string
     * @returns {string} HTML for schedule
     */
    renderSchedule(data, date) {
        if (!data || !data.events) {
            return `<div class="day-header">${this.formatDate(date)}</div><div class="match">Nenhum jogo agendado</div>`;
        }

        let html = `<div class="day-header">${this.formatDate(date)}</div>`;
        
        data.events.forEach(event => {
            const eventData = event.event;
            const { top, bottom, status, dateET } = eventData;
            const eventId = event.eventId;

            const isLiveGame = status.includes('Progress') || status.includes('Em Andamento');
            const isFinalGame = status.includes('Final') || status.includes('Terminado');

            const topTeam = this.splitTeamName(top.name);
            const bottomTeam = this.splitTeamName(bottom.name);

            const scoreDisplay = (top.score != null && bottom.score != null) ? `${bottom.score} - ${top.score}` : '';
            const timeDisplay = this.formatTime(dateET);
            const topLogo = this.getTeamLogoUrl(top.seoIdentifier);
            const bottomLogo = this.getTeamLogoUrl(bottom.seoIdentifier);

            const hasScore = top.score != null && bottom.score != null;
            const scoreKey = `${eventId}`;
            const previousScore = this.previousScores[scoreKey] || '';
            const currentScore = hasScore ? scoreDisplay : '';
            const scoreChanged = previousScore && currentScore && previousScore !== currentScore;
            this.previousScores[scoreKey] = currentScore;

            if (status === 'Final' || hasScore) {
                html += this.renderGameWithScore({
                    isLiveGame, isFinalGame, eventId, 
                    bottom, top, bottomTeam, topTeam,
                    bottomLogo, topLogo, scoreDisplay, status,
                    scoreChanged
                });
            } else {
                html += this.renderUpcomingGame({
                    eventId, bottom, top, bottomTeam, topTeam,
                    bottomLogo, topLogo, timeDisplay
                });
            }
        });
        
        return html;
    }

    /**
     * Render a game with score
     * @param {Object} params - Game parameters
     * @returns {string} HTML for game with score
     */
    renderGameWithScore(params) {
        const {
            isLiveGame, isFinalGame, eventId, 
            bottom, top, bottomTeam, topTeam,
            bottomLogo, topLogo, scoreDisplay, status,
            scoreChanged
        } = params;

        return `
            <div class="match ${isLiveGame ? CONFIG.CLASSES.LIVE_GAME : ''} ${isFinalGame ? CONFIG.CLASSES.FINAL_GAME : ''}">
                ${isLiveGame ? '<div class="live-badge">AO VIVO</div>' : ''}
                <div class="match-header">${bottom.name} vs ${top.name}</div>
                <div class="teams">
                    <div class="team">
                        <img src="${bottomLogo}" alt="${bottom.name}" onerror="this.src='https://via.placeholder.com/50?text=${bottom.shortName}'">
                        <span class="team-name">
                            <span class="team-city">${bottomTeam.city}</span>
                            <span class="team-nickname">${bottomTeam.nickname}</span>
                        </span>
                        <span class="team-record">${this.formatRecord(bottom.record)}</span>
                        ${bottom.hasWon ? '<span class="winner">(V)</span>' : ''}
                    </div>
                    <div class="versus">
                        <div class="score${scoreChanged ? ' ' + CONFIG.CLASSES.SCORE_UPDATED : ''}">${scoreDisplay}</div>
                        <div class="status ${isLiveGame ? CONFIG.CLASSES.IN_PROGRESS : CONFIG.CLASSES.FINAL}">${status}</div>
                    </div>
                    <div class="team">
                        <img src="${topLogo}" alt="${top.name}" onerror="this.src='https://via.placeholder.com/50?text=${top.shortName}'">
                        <span class="team-name">
                            <span class="team-city">${topTeam.city}</span>
                            <span class="team-nickname">${topTeam.nickname}</span>
                        </span>
                        <span class="team-record">${this.formatRecord(top.record)}</span>
                        ${top.hasWon ? '<span class="winner">(V)</span>' : ''}
                    </div>
                </div>
                <div class="details">
                    <button onclick="showGameStats('${eventId}', '${bottom.name}', '${top.name}')">Estatísticas</button>
                </div>
            </div>
        `;
    }

    /**
     * Render an upcoming game
     * @param {Object} params - Game parameters
     * @returns {string} HTML for upcoming game
     */
    renderUpcomingGame(params) {
        const {
            eventId, bottom, top, bottomTeam, topTeam,
            bottomLogo, topLogo, timeDisplay
        } = params;

        return `
            <div class="match">
                <div class="match-header">${bottom.name} vs ${top.name}</div>
                <div class="teams">
                    <div class="team">
                        <img src="${bottomLogo}" alt="${bottom.name}" onerror="this.src='https://via.placeholder.com/50?text=${bottom.shortName}'">
                        <span class="team-name">
                            <span class="team-city">${bottomTeam.city}</span>
                            <span class="team-nickname">${bottomTeam.nickname}</span>
                        </span>
                        <span class="team-record">${this.formatRecord(bottom.record)}</span>
                    </div>
                    <div class="versus">
                        <div class="time">${timeDisplay}</div>
                    </div>
                    <div class="team">
                        <img src="${topLogo}" alt="${top.name}" onerror="this.src='https://via.placeholder.com/50?text=${top.shortName}'">
                        <span class="team-name">
                            <span class="team-city">${topTeam.city}</span>
                            <span class="team-nickname">${topTeam.nickname}</span>
                        </span>
                        <span class="team-record">${this.formatRecord(top.record)}</span>
                    </div>
                </div>
                <div class="details">
                    <button onclick="showGameStats('${eventId}', '${bottom.name}', '${top.name}')">Estatísticas</button>
                </div>
            </div>
        `;
    }

    /**
     * Render game statistics
     * @param {Object} data - Game statistics data
     * @param {Object} game - Game data
     * @param {boolean} isLiveOrFinished - Whether the game is live or finished
     * @returns {string} HTML for game statistics
     */
    renderGameStats(data, game, isLiveOrFinished) {
        if (!data || (!data.away && !data.home)) {
            return `<div class="stat-row"><div class="stat-label" style="width: 100%; text-align: center;">Estatísticas não disponíveis</div></div>`;
        }

        const stats = isLiveOrFinished ? [
            { label: 'PONTOS', home: game?.bottom.score || '0', away: game?.top.score || '0' },
            { label: 'PONTOS SOFRIDOS', home: game?.top.score || '0', away: game?.bottom.score || '0' },
            { label: '% DE ARREMESSOS CERTOS', home: data.home.stats?.fieldGoalsPercentage ? `${(parseFloat(data.home.stats.fieldGoalsPercentage) * 100).toFixed(1)}%` : 'N/A', away: data.away.stats?.fieldGoalsPercentage ? `${(parseFloat(data.away.stats.fieldGoalsPercentage) * 100).toFixed(1)}%` : 'N/A' },
            { label: '% DE LANCES LIVRES', home: data.home.stats?.freeThrowsPercentage ? `${(parseFloat(data.home.stats.freeThrowsPercentage) * 100).toFixed(1)}%` : 'N/A', away: data.away.stats?.freeThrowsPercentage ? `${(parseFloat(data.away.stats.freeThrowsPercentage) * 100).toFixed(1)}%` : 'N/A' },
            { label: '% DE ARREMESSOS DE 3 PONTOS', home: data.home.stats?.threePointPercentage ? `${(parseFloat(data.home.stats.threePointPercentage) * 100).toFixed(1)}%` : 'N/A', away: data.away.stats?.threePointPercentage ? `${(parseFloat(data.away.stats.threePointPercentage) * 100).toFixed(1)}%` : 'N/A' },
            { label: 'REBOTES', home: data.home.stats?.reboundsTotal || '0', away: data.away.stats?.reboundsTotal || '0' },
            { label: 'REBOTES OFENSIVOS / DEFENSIVOS', home: 'N/A', away: 'N/A' },
            { label: 'ASSISTÊNCIAS', home: data.home.stats?.assists || '0', away: data.away.stats?.assists || '0' },
            { label: 'TOCOS', home: data.home.stats?.blockedShots || '0', away: data.away.stats?.blockedShots || '0' },
            { label: 'ROUBOS DE BOLA', home: data.home.stats?.steals || '0', away: data.away.stats?.steals || '0' },
            { label: 'ERROS DE POSSE', home: data.home.stats?.turnovers || '0', away: data.away.stats?.turnovers || '0' }
        ] : [
            { label: 'PONTOS POR JOGO', home: data.home?.stats?.pointsForPerGame || 'N/A', away: data.away?.stats?.pointsForPerGame || 'N/A' },
            { label: 'PONTOS SOFRIDOS POR JOGO', home: data.home?.stats?.pointsAgainstPerGame || 'N/A', away: data.away?.stats?.pointsAgainstPerGame || 'N/A' },
            { label: '% DE ARREMESSOS CERTOS', home: data.home?.stats?.fieldGoalsPercentage ? `${(parseFloat(data.home.stats.fieldGoalsPercentage) * 100).toFixed(1)}%` : 'N/A', away: data.away.stats?.fieldGoalsPercentage ? `${(parseFloat(data.away.stats.fieldGoalsPercentage) * 100).toFixed(1)}%` : 'N/A' },
            { label: '% DE LANCES LIVRES', home: data.home?.stats?.freeThrowsPercentage ? `${(parseFloat(data.home.stats.freeThrowsPercentage) * 100).toFixed(1)}%` : 'N/A', away: data.away?.stats?.freeThrowsPercentage ? `${(parseFloat(data.away.stats.freeThrowsPercentage) * 100).toFixed(1)}%` : 'N/A' },
            { label: '% DE ARREMESSOS DE 3 PONTOS', home: data.home?.stats?.threePointPercentage ? `${(parseFloat(data.home.stats.threePointPercentage) * 100).toFixed(1)}%` : 'N/A', away: data.away?.stats?.threePointPercentage ? `${(parseFloat(data.away.stats.threePointPercentage) * 100).toFixed(1)}%` : 'N/A' },
            { label: 'REBOTES POR JOGO', home: data.home?.stats?.reboundsPerGame || 'N/A', away: data.away?.stats?.reboundsPerGame || 'N/A' },
            { label: 'REBOTES OFENSIVOS / DEFENSIVOS POR JOGO', home: `${data.home?.stats?.offensiveReboundsPerGame || 'N/A'} / ${data.home?.stats?.defensiveReboundsPerGame || 'N/A'}`, away: `${data.away?.stats?.offensiveReboundsPerGame || 'N/A'} / ${data.away?.stats?.defensiveReboundsPerGame || 'N/A'}` },
            { label: 'ASSISTÊNCIAS POR JOGO', home: data.home?.stats?.assistsPerGame || 'N/A', away: data.away?.stats?.assistsPerGame || 'N/A' },
            { label: 'TOCOS POR JOGO', home: data.home?.stats?.blocksPerGame || 'N/A', away: data.away?.stats?.blocksPerGame || 'N/A' },
            { label: 'ROUBOS DE BOLA POR JOGO', home: data.home?.stats?.stealsPerGame || 'N/A', away: data.away?.stats?.stealsPerGame || 'N/A' },
            { label: 'ERROS DE POSSE POR JOGO', home: data.home?.stats?.turnoverPerGame || 'N/A', away: data.away?.stats?.turnoverPerGame || 'N/A' }
        ];

        let html = '';
        stats.forEach(stat => {
            const homeValue = parseFloat(stat.home) || 0;
            const awayValue = parseFloat(stat.away) || 0;
            const max = Math.max(homeValue, awayValue, 1);
            const homeWidth = (homeValue / max) * 100;
            const awayWidth = (awayValue / max) * 100;

            html += `
            <div class="stat-row">
                <div class="stat-value home">${stat.home}</div>
                <div class="stat-label">${stat.label}</div>
                <div class="stat-value away">${stat.away}</div>
            </div>
            <div class="stat-bar-container">
                <div class="stat-bar home" style="width: ${homeWidth}%"></div>
                <div class="stat-bar away" style="width: ${awayWidth}%"></div>
            </div>
            `;
        });
        
        return html;
    }
}

// Export a singleton instance
export default new NbaUiService();