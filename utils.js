// utils.js

class PageManager {
    constructor() {
        this.noSleep = new NoSleep();
        this.refreshInterval = 300000; // 5 minutos
        this.reconnectDelay = 30000;   // 30 segundos
        this.isConnected = true;
        this.initializeAll();
    }

    initializeAll() {
        this.keepAlive();
        this.autoRefresh();
        this.monitorConnection();
        this.setupErrorHandling();
    }

    keepAlive() {
        // Previne que a tela entre em modo de espera
        document.addEventListener('DOMContentLoaded', () => {
            this.noSleep.enable();
            console.log('NoSleep ativado');
        });
    }

    autoRefresh() {
        // Primeira atualização imediata
        this.fetchAndUpdateData();

        // Configurar atualizações periódicas
        setInterval(() => {
            if (this.isConnected) {
                this.fetchAndUpdateData();
            }
        }, this.refreshInterval);
    }

    fetchAndUpdateData() {
        fetch('https://api.green365.com.br/api/events/ended?sport_id=4&competition_id=&page=1')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro na resposta da API');
                }
                return response.json();
            })
            .then(data => {
                this.updateStats(data);
                this.updateLastRefresh();
            })
            .catch(error => this.handleError(error));
    }

    updateStats(data) {
        const statsContainer = document.getElementById('statsContainer');
        if (!statsContainer) return;

        statsContainer.innerHTML = '';
        const games = data.data;
        const leagues = {};

        games.forEach(game => {
            const leagueName = game.leagueName;
            if (!leagues[leagueName]) {
                leagues[leagueName] = [];
            }
            leagues[leagueName].push(game);
        });

        for (const league in leagues) {
            const leagueStats = this.calculateStats(leagues[league]);
            this.renderLeagueStats(league, leagueStats, statsContainer);
        }
    }

    calculateStats(games) {
        const totalGames = games.filter(game => game.score).length;
        const stats = {
            'Over 0.5': 0, 'Over 1.5': 0, 'Over 2.5': 0, 'Over 3.5': 0,
            'Over 4.5': 0, 'Over 5.5': 0, 'Over 6.5': 0,
            'Ambos Marcam': 0, '0x0': 0
        };

        games.forEach(game => {
            if (!game.score) return;
            const [homeScore, awayScore] = game.score.split('-').map(Number);
            const totalGoals = homeScore + awayScore;

            Object.keys(stats).forEach(key => {
                if (key.startsWith('Over') && totalGoals > parseFloat(key.split(' ')[1])) {
                    stats[key]++;
                }
            });

            if (homeScore > 0 && awayScore > 0) stats['Ambos Marcam']++;
            if (totalGoals === 0) stats['0x0']++;
        });

        for (const key in stats) {
            stats[key] = totalGames ? Math.round((stats[key] / totalGames) * 100) : 0;
        }

        return stats;
    }

    renderLeagueStats(league, stats, container) {
        const isStarred = stats['Over 1.5'] === 100 &&
                         stats['Over 2.5'] === 100 &&
                         stats['Over 3.5'] >= 85 &&
                         stats['Ambos Marcam'] >= 85 &&
                         stats['0x0'] === 0;

        const leagueDiv = document.createElement('div');
        leagueDiv.className = `league-stats ${isStarred ? 'highlight' : ''}`;
        leagueDiv.innerHTML = `
            ${isStarred ? '<div class="star">⭐</div>' : ''}
            <div class="league-name">${league}</div>
            ${this.generateBar('Over 0.5', stats['Over 0.5'])}
            ${this.generateBar('Over 1.5', stats['Over 1.5'])}
            ${this.generateBar('Over 2.5', stats['Over 2.5'])}
            ${this.generateBar('Over 3.5', stats['Over 3.5'])}
            ${this.generateBar('Over 4.5', stats['Over 4.5'])}
            ${this.generateBar('Over 5.5', stats['Over 5.5'])}
            ${this.generateBar('Over 6.5', stats['Over 6.5'])}
            ${this.generateBar('Ambos Marcam', stats['Ambos Marcam'])}
            ${this.generateBar('0x0', stats['0x0'], true)}
        `;
        container.appendChild(leagueDiv);
    }

    generateBar(label, percentage, isZero) {
        return `
            <div class="stat">
                <span>${label}</span>
                <span>${percentage}%</span>
            </div>
            <div class="bar-container">
                <div class="${isZero ? 'bar zero' : 'bar'}" style="width: ${percentage}%"></div>
            </div>
        `;
    }

    monitorConnection() {
        window.addEventListener('online', () => {
            console.log('Conexão restabelecida');
            this.isConnected = true;
            this.showConnectionStatus('online');
            this.fetchAndUpdateData();
        });

        window.addEventListener('offline', () => {
            console.log('Conexão perdida');
            this.isConnected = false;
            this.showConnectionStatus('offline');
        });
    }

    showConnectionStatus(status) {
        const statusDiv = document.getElementById('connectionStatus') || this.createStatusDiv();
        statusDiv.className = `connection-status ${status}`;
        statusDiv.textContent = status === 'online' ? 'Conectado' : 'Desconectado';
    }

    createStatusDiv() {
        const div = document.createElement('div');
        div.id = 'connectionStatus';
        document.body.appendChild(div);
        return div;
    }

    updateLastRefresh() {
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        const refreshDiv = document.getElementById('lastRefresh') || this.createRefreshDiv();
        refreshDiv.textContent = `Última atualização: ${timeString}`;
    }

    createRefreshDiv() {
        const div = document.createElement('div');
        div.id = 'lastRefresh';
        div.className = 'last-refresh';
        document.body.insertBefore(div, document.getElementById('statsContainer'));
        return div;
    }

    handleError(error) {
        console.error('Erro:', error);
        
        if (!this.isConnected) {
            setTimeout(() => {
                console.log('Tentando reconectar...');
                this.fetchAndUpdateData();
            }, this.reconnectDelay);
        }
    }

    setupErrorHandling() {
        window.onerror = (msg, url, lineNo, columnNo, error) => {
            console.error('Erro global:', msg, url, lineNo, columnNo, error);
            return false;
        };

        window.addEventListener('unhandledrejection', event => {
            console.error('Promessa não tratada:', event.reason);
        });
    }
}
