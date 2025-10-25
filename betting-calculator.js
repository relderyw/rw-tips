// Módulo de Calculadoras de Apostas NBA
class BettingCalculator {
    constructor() {
        this.historicalData = new Map();
        this.trends = new Map();
    }

    // Calcular valor esperado de uma aposta
    calculateExpectedValue(odds, probability) {
        const decimalOdds = this.convertToDecimal(odds);
        const impliedProbability = 1 / decimalOdds;
        const edge = probability - impliedProbability;
        
        if (edge > 0) {
            return {
                ev: edge * (decimalOdds - 1),
                isValueBet: true,
                edge: edge * 100,
                recommendation: 'APOSTAR'
            };
        }
        
        return {
            ev: edge * (decimalOdds - 1),
            isValueBet: false,
            edge: edge * 100,
            recommendation: 'EVITAR'
        };
    }

    // Converter odds americanas para decimais
    convertToDecimal(americanOdds) {
        if (americanOdds > 0) {
            return (americanOdds / 100) + 1;
        } else {
            return (100 / Math.abs(americanOdds)) + 1;
        }
    }

    // Calcular probabilidade implícita
    calculateImpliedProbability(odds) {
        const decimal = this.convertToDecimal(odds);
        return (1 / decimal) * 100;
    }

    // Análise de tendências Over/Under
    analyzeOverUnderTrends(team1Stats, team2Stats) {
        const team1Avg = (team1Stats.pointsFor + team1Stats.pointsAgainst) / 2;
        const team2Avg = (team2Stats.pointsFor + team2Stats.pointsAgainst) / 2;
        
        const projectedTotal = (team1Avg + team2Avg) / 2;
        
        // Fatores de ajuste
        const paceAdjustment = this.calculatePaceAdjustment(team1Stats.pace, team2Stats.pace);
        const defenseAdjustment = this.calculateDefenseAdjustment(team1Stats.defRating, team2Stats.defRating);
        
        const adjustedTotal = projectedTotal + paceAdjustment + defenseAdjustment;
        
        return {
            projectedTotal: Math.round(adjustedTotal),
            confidence: this.calculateConfidence(team1Stats, team2Stats),
            factors: {
                pace: paceAdjustment,
                defense: defenseAdjustment,
                homeAdvantage: 2.5
            }
        };
    }

    // Calcular ajuste de ritmo
    calculatePaceAdjustment(pace1, pace2) {
        const avgPace = (pace1 + pace2) / 2;
        const leaguePace = 100; // Média da liga
        return (avgPace - leaguePace) * 0.3;
    }

    // Calcular ajuste defensivo
    calculateDefenseAdjustment(def1, def2) {
        const avgDef = (def1 + def2) / 2;
        const leagueDef = 110; // Média da liga
        return (leagueDef - avgDef) * 0.2;
    }

    // Calcular nível de confiança
    calculateConfidence(stats1, stats2) {
        let confidence = 50;
        
        // Consistência dos times
        if (stats1.consistency > 0.8) confidence += 10;
        if (stats2.consistency > 0.8) confidence += 10;
        
        // Diferença de qualidade
        const qualityDiff = Math.abs(stats1.rating - stats2.rating);
        if (qualityDiff > 10) confidence += 15;
        
        // Forma recente
        if (stats1.recentForm > 0.7) confidence += 5;
        if (stats2.recentForm > 0.7) confidence += 5;
        
        return Math.min(confidence, 95);
    }

    // Análise de spread
    analyzeSpread(homeTeam, awayTeam, spread) {
        const homeAdvantage = 3.5; // Vantagem média de jogar em casa
        const qualityDiff = homeTeam.rating - awayTeam.rating;
        const projectedSpread = qualityDiff + homeAdvantage;
        
        const spreadDiff = Math.abs(spread - projectedSpread);
        
        let recommendation = 'NEUTRO';
        let confidence = 'BAIXA';
        
        if (spreadDiff > 3) {
            recommendation = spread > projectedSpread ? 'AWAY TEAM' : 'HOME TEAM';
            confidence = spreadDiff > 5 ? 'ALTA' : 'MÉDIA';
        }
        
        return {
            projectedSpread: Math.round(projectedSpread * 2) / 2,
            actualSpread: spread,
            difference: spreadDiff,
            recommendation,
            confidence
        };
    }

    // Análise de props de jogadores
    analyzePlayerProps(player, propType, line) {
        const seasonAvg = player.stats[propType];
        const recentAvg = player.recentStats[propType];
        const vsOpponentAvg = player.vsOpponent[propType] || seasonAvg;
        
        // Peso para diferentes métricas
        const projectedValue = (seasonAvg * 0.4) + (recentAvg * 0.4) + (vsOpponentAvg * 0.2);
        
        const factors = this.getPlayerPropFactors(player, propType);
        const adjustedValue = projectedValue + factors.total;
        
        return {
            projected: Math.round(adjustedValue * 10) / 10,
            line: line,
            recommendation: adjustedValue > line ? 'OVER' : 'UNDER',
            confidence: this.calculatePlayerPropConfidence(adjustedValue, line, factors),
            factors: factors.breakdown
        };
    }

    // Fatores que afetam props de jogadores
    getPlayerPropFactors(player, propType) {
        let total = 0;
        const breakdown = [];
        
        // Matchup favorável/desfavorável
        if (player.matchupRating > 0.7) {
            total += 1.5;
            breakdown.push({ factor: 'Matchup Favorável', impact: +1.5 });
        } else if (player.matchupRating < 0.3) {
            total -= 1.5;
            breakdown.push({ factor: 'Matchup Difícil', impact: -1.5 });
        }
        
        // Minutos projetados
        if (player.projectedMinutes > player.avgMinutes + 3) {
            total += 1;
            breakdown.push({ factor: 'Mais Minutos Esperados', impact: +1 });
        }
        
        // Forma recente
        if (player.recentForm > 1.1) {
            total += 0.8;
            breakdown.push({ factor: 'Boa Forma Recente', impact: +0.8 });
        } else if (player.recentForm < 0.9) {
            total -= 0.8;
            breakdown.push({ factor: 'Forma Ruim', impact: -0.8 });
        }
        
        // Status de lesão
        if (player.injuryStatus === 'questionable') {
            total -= 1;
            breakdown.push({ factor: 'Questionável por Lesão', impact: -1 });
        }
        
        return { total, breakdown };
    }

    // Confiança para props de jogadores
    calculatePlayerPropConfidence(projected, line, factors) {
        const difference = Math.abs(projected - line);
        let confidence = 'BAIXA';
        
        if (difference > 2) confidence = 'ALTA';
        else if (difference > 1) confidence = 'MÉDIA';
        
        // Ajustar baseado nos fatores
        if (factors.breakdown.length > 2) {
            if (confidence === 'BAIXA') confidence = 'MÉDIA';
            else if (confidence === 'MÉDIA') confidence = 'ALTA';
        }
        
        return confidence;
    }

    // Análise de correlação entre apostas
    analyzeCorrelations(bets) {
        const correlations = [];
        
        for (let i = 0; i < bets.length; i++) {
            for (let j = i + 1; j < bets.length; j++) {
                const correlation = this.calculateCorrelation(bets[i], bets[j]);
                if (Math.abs(correlation) > 0.3) {
                    correlations.push({
                        bet1: bets[i],
                        bet2: bets[j],
                        correlation: correlation,
                        type: correlation > 0 ? 'POSITIVA' : 'NEGATIVA'
                    });
                }
            }
        }
        
        return correlations;
    }

    // Calcular correlação entre duas apostas
    calculateCorrelation(bet1, bet2) {
        // Correlações conhecidas
        const correlationMatrix = {
            'total-spread': 0.15,
            'player_points-total': 0.4,
            'player_assists-total': 0.3,
            'player_rebounds-total': 0.2,
            'home_spread-away_total': -0.2
        };
        
        const key = `${bet1.type}-${bet2.type}`;
        return correlationMatrix[key] || 0;
    }

    // Gestão de banca - Kelly Criterion
    calculateKellyCriterion(probability, odds) {
        const decimalOdds = this.convertToDecimal(odds);
        const q = 1 - probability;
        const b = decimalOdds - 1;
        
        const kelly = (probability * b - q) / b;
        
        return {
            kellyPercentage: Math.max(0, kelly * 100),
            recommendedStake: Math.min(kelly * 100, 5), // Máximo 5% da banca
            isPositive: kelly > 0
        };
    }

    // Simulação Monte Carlo para resultados
    monteCarloSimulation(bets, iterations = 10000) {
        const results = [];
        
        for (let i = 0; i < iterations; i++) {
            let totalReturn = 0;
            
            bets.forEach(bet => {
                const random = Math.random();
                if (random < bet.probability) {
                    totalReturn += bet.stake * (this.convertToDecimal(bet.odds) - 1);
                } else {
                    totalReturn -= bet.stake;
                }
            });
            
            results.push(totalReturn);
        }
        
        results.sort((a, b) => a - b);
        
        return {
            expectedReturn: results.reduce((a, b) => a + b, 0) / iterations,
            percentile5: results[Math.floor(iterations * 0.05)],
            percentile95: results[Math.floor(iterations * 0.95)],
            profitProbability: results.filter(r => r > 0).length / iterations * 100,
            maxLoss: Math.min(...results),
            maxWin: Math.max(...results)
        };
    }

    // Análise de linha de movimento
    analyzeLineMovement(openingLine, currentLine, volume) {
        const movement = currentLine - openingLine;
        const movementPercentage = (movement / Math.abs(openingLine)) * 100;
        
        let significance = 'BAIXA';
        if (Math.abs(movementPercentage) > 10) significance = 'ALTA';
        else if (Math.abs(movementPercentage) > 5) significance = 'MÉDIA';
        
        let direction = 'ESTÁVEL';
        if (movement > 0.5) direction = 'SUBINDO';
        else if (movement < -0.5) direction = 'DESCENDO';
        
        return {
            movement: movement,
            percentage: movementPercentage,
            direction: direction,
            significance: significance,
            sharpMoney: volume > 1000 && Math.abs(movement) > 1,
            recommendation: this.getLineMovementRecommendation(movement, volume)
        };
    }

    // Recomendação baseada no movimento da linha
    getLineMovementRecommendation(movement, volume) {
        if (volume > 1000 && Math.abs(movement) > 1) {
            return movement > 0 ? 'CONSIDERAR UNDER/AWAY' : 'CONSIDERAR OVER/HOME';
        }
        
        if (Math.abs(movement) > 2) {
            return 'AGUARDAR ESTABILIZAÇÃO';
        }
        
        return 'NEUTRO';
    }
}

// Classe para análise de tendências históricas
class TrendAnalyzer {
    constructor() {
        this.patterns = new Map();
    }

    // Analisar tendências de Over/Under
    analyzeOverUnderTrends(team1, team2, conditions = {}) {
        const trends = {
            team1: this.getTeamOverUnderTrend(team1, conditions),
            team2: this.getTeamOverUnderTrend(team2, conditions),
            headToHead: this.getHeadToHeadTrend(team1, team2),
            situational: this.getSituationalTrends(conditions)
        };
        
        return this.consolidateTrends(trends);
    }

    // Tendência de Over/Under por time
    getTeamOverUnderTrend(team, conditions) {
        // Simulação de dados históricos
        const baseOverRate = 0.52 + (Math.random() - 0.5) * 0.2;
        
        let adjustedRate = baseOverRate;
        
        // Ajustes baseados em condições
        if (conditions.isHome && team.homeOverRate) {
            adjustedRate = team.homeOverRate;
        } else if (!conditions.isHome && team.awayOverRate) {
            adjustedRate = team.awayOverRate;
        }
        
        if (conditions.isBackToBack) {
            adjustedRate -= 0.08; // Times cansados tendem a fazer menos pontos
        }
        
        if (conditions.restDays > 2) {
            adjustedRate += 0.05; // Times descansados
        }
        
        return {
            overRate: adjustedRate,
            games: Math.floor(Math.random() * 20) + 60,
            confidence: this.calculateTrendConfidence(adjustedRate, 82)
        };
    }

    // Tendência head-to-head
    getHeadToHeadTrend(team1, team2) {
        // Simulação de histórico entre os times
        const games = Math.floor(Math.random() * 8) + 4;
        const overCount = Math.floor(Math.random() * games);
        
        return {
            overRate: overCount / games,
            games: games,
            avgTotal: Math.floor(Math.random() * 40) + 200,
            lastMeeting: {
                total: Math.floor(Math.random() * 50) + 190,
                wasOver: Math.random() > 0.5
            }
        };
    }

    // Tendências situacionais
    getSituationalTrends(conditions) {
        const trends = [];
        
        if (conditions.dayOfWeek === 'friday') {
            trends.push({
                factor: 'Sexta-feira',
                impact: 'Jogos de sexta tendem a ter mais pontos (+3.2 média)',
                overRate: 0.58
            });
        }
        
        if (conditions.isNationalTV) {
            trends.push({
                factor: 'TV Nacional',
                impact: 'Jogos na TV nacional são mais competitivos',
                overRate: 0.54
            });
        }
        
        if (conditions.temperature && conditions.temperature < 0) {
            trends.push({
                factor: 'Clima Frio',
                impact: 'Clima muito frio pode afetar o jogo (indoor sport, mas afeta deslocamento)',
                overRate: 0.48
            });
        }
        
        return trends;
    }

    // Consolidar todas as tendências
    consolidateTrends(trends) {
        const weights = {
            team1: 0.3,
            team2: 0.3,
            headToHead: 0.25,
            situational: 0.15
        };
        
        let weightedOverRate = 0;
        weightedOverRate += trends.team1.overRate * weights.team1;
        weightedOverRate += trends.team2.overRate * weights.team2;
        weightedOverRate += trends.headToHead.overRate * weights.headToHead;
        
        if (trends.situational.length > 0) {
            const avgSituational = trends.situational.reduce((sum, t) => sum + t.overRate, 0) / trends.situational.length;
            weightedOverRate += avgSituational * weights.situational;
        }
        
        return {
            consolidatedOverRate: weightedOverRate,
            recommendation: weightedOverRate > 0.55 ? 'OVER' : weightedOverRate < 0.45 ? 'UNDER' : 'NEUTRO',
            confidence: this.calculateOverallConfidence(trends),
            breakdown: trends
        };
    }

    // Calcular confiança da tendência
    calculateTrendConfidence(rate, sampleSize) {
        const deviation = Math.abs(rate - 0.5);
        const sizeBonus = Math.min(sampleSize / 100, 1);
        
        if (deviation > 0.15 && sizeBonus > 0.8) return 'ALTA';
        if (deviation > 0.08 && sizeBonus > 0.5) return 'MÉDIA';
        return 'BAIXA';
    }

    // Confiança geral da análise
    calculateOverallConfidence(trends) {
        const confidences = [
            trends.team1.confidence,
            trends.team2.confidence,
            trends.headToHead.games > 6 ? 'ALTA' : 'MÉDIA'
        ];
        
        const highCount = confidences.filter(c => c === 'ALTA').length;
        const mediumCount = confidences.filter(c => c === 'MÉDIA').length;
        
        if (highCount >= 2) return 'ALTA';
        if (highCount >= 1 && mediumCount >= 1) return 'MÉDIA';
        return 'BAIXA';
    }
}

// Exportar classes para uso global
window.BettingCalculator = BettingCalculator;
window.TrendAnalyzer = TrendAnalyzer;