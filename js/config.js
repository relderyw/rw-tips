/**
 * config.js
 * Central configuration file for the NBA application
 */

const CONFIG = {
    // API endpoints
    API: {
        SCHEDULE: 'https://stats.sports.bellmedia.ca/sports/basketball/leagues/nba/scheduleV2/subset/dates',
        GAME_STATS: 'https://stats.sports.bellmedia.ca/sports/basketball/leagues/nba/event/',
        PROXY_URL: 'https://api.allorigins.win/raw?url='
    },
    
    // Refresh intervals (in milliseconds)
    INTERVALS: {
        AUTO_UPDATE: 30000, // 30 seconds
        CONNECTION_CHECK: 60000 // 1 minute
    },
    
    // Date and time formatting
    FORMAT: {
        DATE_OPTIONS: { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/Sao_Paulo' },
        TIME_OPTIONS: { timeZone: 'America/Sao_Paulo', hour: 'numeric', minute: 'numeric', hour12: true },
        LOCALE: 'pt-BR'
    },
    
    // Team data mapping
    TEAMS: {
        SPECIAL_CASES: {
            'Trail Blazers': 'Portland', 
            'Timberwolves': 'Minnesota', 
            'Thunder': 'Oklahoma City', 
            'Jazz': 'Utah',
            'Heat': 'Miami', 
            'Magic': 'Orlando', 
            'Wizards': 'Washington', 
            'Pacers': 'Indiana', 
            'Knicks': 'New York',
            'Nets': 'Brooklyn', 
            'Celtics': 'Boston', 
            '76ers': 'Philadelphia', 
            'Raptors': 'Toronto', 
            'Bulls': 'Chicago',
            'Cavaliers': 'Cleveland', 
            'Pistons': 'Detroit', 
            'Bucks': 'Milwaukee', 
            'Hawks': 'Atlanta', 
            'Hornets': 'Charlotte',
            'Mavericks': 'Dallas', 
            'Rockets': 'Houston', 
            'Grizzlies': 'Memphis', 
            'Pelicans': 'New Orleans', 
            'Spurs': 'San Antonio',
            'Nuggets': 'Denver', 
            'Warriors': 'Golden State', 
            'Clippers': 'LA Clippers', 
            'Lakers': 'Los Angeles', 
            'Suns': 'Phoenix',
            'Kings': 'Sacramento'
        },
        LOGO_URL_BASE: 'https://tsnimages.tsn.ca/ImageProvider/TeamLogo?seoId='
    },
    
    // CSS classes
    CLASSES: {
        ACTIVE: 'active',
        LIVE_GAME: 'live-game',
        FINAL_GAME: 'final-game',
        SCORE_UPDATED: 'score-updated',
        IN_PROGRESS: 'in-progress',
        FINAL: 'final'
    },
    
    // Error messages
    ERRORS: {
        FETCH_DATES: 'Erro ao carregar datas',
        FETCH_SCHEDULE: 'Erro ao carregar o calendário',
        FETCH_STATS: 'Erro ao carregar estatísticas'
    }
};

// Export the configuration
export default CONFIG;