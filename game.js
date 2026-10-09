// ==========================================
// DATI DEL GIOCO
// ==========================================

const CURRENCIES = [
    "EURO",
    "DOLLAR",
    "FRANC",
    "POUND",
    "YEN",
    "RUBLE",
    "PESO"
];

const VALUES = [
    20,
    20,
    20,
    30,
    30,
    30,
    40,
    50,
    60
];

const NUMBER_OF_PLAYERS = 4;


// ==========================================
// STATO DELLA PARTITA
// ==========================================

const game = {

    round: 1,

    deck: [],

    players: [],

    market: {

        left: [],
        right: []

    },

    phase: "bidding",

    currentPlayerId: null,

    removedCurrency: null,

    gameOver: false,

    finalRound: false,

    resolutionQueue: [],

    logs: []

};


// ==========================================
// PROFILI BOT
// ==========================================
//
// Ogni partita assegna casualmente questi
// profili ai tre bot.
//
// TRIS:
// privilegia fortemente i tris di 20/30.
//
// SET:
// privilegia soprattutto il raggiungimento
// di 200+ in una valuta.
//
// HYBRID:
// comportamento intermedio, ma leggermente
// più aggressivo e opportunista.
//
// I valori vengono leggermente variati
// quando il profilo viene assegnato, così
// anche due partite con lo stesso profilo
// non producono necessariamente lo stesso
// comportamento.
//

const BOT_PROFILES = {

    TRIS: {

        label: "cacciatore di tris",

        aggression: 1.12,

        triple20Weight: 1.30,

        triple30Weight: 1.38,

        set200Weight: 0.82,

        near200Weight: 0.88,

        lotWeight: 1.08,

        sacrificeWeight: 0.82,

        multiCardWeight: 1.12,

        bluffWeight: 1.05

    },

    SET: {

        label: "cacciatore di set",

        aggression: 1.10,

        triple20Weight: 0.82,

        triple30Weight: 0.86,

        set200Weight: 1.35,

        near200Weight: 1.28,

        lotWeight: 1.10,

        sacrificeWeight: 0.80,

        multiCardWeight: 1.10,

        bluffWeight: 1.00

    },

    HYBRID: {

        label: "opportunista",

        aggression: 1.18,

        triple20Weight: 1.00,

        triple30Weight: 1.08,

        set200Weight: 1.08,

        near200Weight: 1.04,

        lotWeight: 1.18,

        sacrificeWeight: 0.74,

        multiCardWeight: 1.18,

        bluffWeight: 1.12

    },

    AGGRESSIVE: {

        label: "opportunista aggressivo",

        aggression: 1.38,

        triple20Weight: 1.10,

        triple30Weight: 1.18,

        set200Weight: 1.18,

        near200Weight: 1.14,

        lotWeight: 1.30,

        sacrificeWeight: 0.58,

        multiCardWeight: 1.28,

        bluffWeight: 1.18

    }

};

// ==========================================
// CREAZIONE PROFILO BOT
// ==========================================

function createRandomBotProfile(
    profileType
) {

    const base =
        BOT_PROFILES[
            profileType
        ];


    /*
     * Variazioni leggere.
     *
     * Il profilo resta riconoscibile,
     * ma non identico da partita a partita.
     */

    const variation =
        () =>
            0.90 +
            Math.random() * 0.20;


    return {

        type:
            profileType,

        label:
            base.label,

        aggression:
            base.aggression *
            variation(),

        triple20Weight:
            base.triple20Weight *
            variation(),

        triple30Weight:
            base.triple30Weight *
            variation(),

        set200Weight:
            base.set200Weight *
            variation(),

        near200Weight:
            base.near200Weight *
            variation(),

        lotWeight:
            base.lotWeight *
            variation(),

        sacrificeWeight:
            base.sacrificeWeight *
            variation(),

        multiCardWeight:
            base.multiCardWeight *
            variation(),

        bluffWeight:
            base.bluffWeight *
            variation(),

        /*
         * Piccola inclinazione personale verso
         * le offerte più lunghe.
         */

        bidVariance:
            Math.random() * 0.25

    };

}


// ==========================================
// ASSEGNAZIONE CASUALE PROFILI BOT
// ==========================================

function assignBotProfiles(players) {

    const profileTypes =
        Object.keys(BOT_PROFILES);

    /*
     * Ogni bot estrae un profilo
     * indipendentemente dagli altri.
     *
     * Il profilo AGGRESSIVE può quindi
     * non essere assegnato oppure comparire
     * in più bot nella stessa partita.
     */
    for (
        let i = 1;
        i < players.length;
        i++
    ) {

        const randomIndex =
            Math.floor(
                Math.random() *
                profileTypes.length
            );

        const profileType =
            profileTypes[randomIndex];

        players[i].botProfile =
            createRandomBotProfile(
                profileType
            );

    }

}

    /*
     * Il giocatore 1 è umano.
     * I bot 2, 3 e 4 ricevono i tre
     * profili in ordine casuale.
     */

    for (
        let i = 1;
        i < players.length;
        i++
    ) {

        players[i].botProfile =
            createRandomBotProfile(
                types[i - 1]
            );

    }

}


// ==========================================
// CREAZIONE DEL MAZZO
// ==========================================

function createDeck() {

    const deck = [];

    let cardId = 1;


    // 7 valute x 9 carte
    for (const currency of CURRENCIES) {

        for (const value of VALUES) {

            deck.push({

                id: cardId++,

                type: "money",

                currency: currency,

                value: value

            });

        }

    }


    // 6 monete da 10
    for (let i = 0; i < 6; i++) {

        deck.push({

            id: cardId++,

            type: "coin",

            currency: null,

            value: 10

        });

    }


    return deck;

}


// ==========================================
// MESCOLAMENTO
// ==========================================

function shuffle(deck) {

    const shuffled = [...deck];


    for (
        let i = shuffled.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() * (i + 1)
            );


        [
            shuffled[i],
            shuffled[j]
        ] = [
            shuffled[j],
            shuffled[i]
        ];

    }


    return shuffled;

}


// ==========================================
// GIOCATORI
// ==========================================

function createPlayers() {

    const players = [];


    for (
        let i = 0;
        i < NUMBER_OF_PLAYERS;
        i++
    ) {

        players.push({

            id: i + 1,

            name:
                i === 0
                    ? "Tu"
                    : `Bot ${i}`,

            hand: [],

            bid: [],

            bidValue: 0,

            selectedCards: [],

            bidConfirmed: false,

            resolved: false,

            score: 0,

            botProfile: null

        });

    }


    /*
     * Assegna i tre profili casualmente
     * a Bot 1, Bot 2 e Bot 3.
     */

    assignBotProfiles(
        players
    );


    return players;

}


// ==========================================
// PESCA
// ==========================================

function drawCard() {

    if (
        game.deck.length === 0
    ) {

        return null;

    }


    return game.deck.pop();

}


// ==========================================
// LOG
// ==========================================

function addLog(
    text
) {

    game.logs.push({

        round:
            game.round,

        text:
            text

    });


    renderLogs();

}


// ==========================================
// TESTO CARTA
// ==========================================

function cardDescription(
    card
) {

    if (!card) {

        return "";

    }


    if (
        card.type === "coin"
    ) {

        return "moneta da 10";

    }


    if (
        card.type === "play-money"
    ) {

        return "BLUFF";

    }


    return `${card.currency} ${card.value} (#${card.id})`;

}


function cardsDescription(
    cards
) {

    if (
        !cards ||
        cards.length === 0
    ) {

        return "nessuna carta";

    }


    return cards
        .map(
            card =>
                cardDescription(card)
        )
        .join(", ");

}


// ==========================================
// SETUP
// ==========================================

function setupGame() {

    game.round = 1;

    game.phase = "bidding";

    game.currentPlayerId = null;

    game.gameOver = false;

    game.finalRound = false;

    game.resolutionQueue = [];

    game.logs = [];


    // --------------------------------------
    // MAZZO
    // --------------------------------------

    let fullDeck =
        shuffle(
            createDeck()
        );


    // --------------------------------------
    // RIMOZIONE DI UNA VALUTA
    // --------------------------------------

    game.removedCurrency =
        CURRENCIES[
            Math.floor(
                Math.random() *
                CURRENCIES.length
            )
        ];


    fullDeck =
        fullDeck.filter(
            card =>
                card.currency !==
                game.removedCurrency
        );


    game.deck =
        fullDeck;


    // --------------------------------------
    // GIOCATORI
    // --------------------------------------

    game.players =
        createPlayers();


    // --------------------------------------
    // LOG PROFILI BOT
    // --------------------------------------

    for (
        let i = 1;
        i < game.players.length;
        i++
    ) {

        const bot =
            game.players[i];


        addLog(
            `${bot.name}: profilo ${bot.botProfile.label}.`
        );

    }


    // --------------------------------------
    // 6 CARTE + BLUFF
    // --------------------------------------

    for (const player of game.players) {

        for (let i = 0; i < 6; i++) {

            const card =
                drawCard();


            if (card) {

                player.hand.push(
                    card
                );

            }

        }


        player.hand.push({

            id:
                `play-${player.id}`,

            type:
                "play-money",

            currency:
                null,

            value:
                0,

            ownerId:
                player.id

        });

    }


    // --------------------------------------
    // MERCATO
    // Prima B, poi A.
    // --------------------------------------

    game.market.right = [];

    game.market.left = [];


    for (let i = 0; i < 4; i++) {

        const card =
            drawCard();


        if (card) {

            game.market.right.push(
                card
            );

        }

    }


    for (let i = 0; i < 4; i++) {

        const card =
            drawCard();


        if (card) {

            game.market.left.push(
                card
            );

        }

    }


    addLog(
        `Nuova partita. È stata rimossa la valuta ${game.removedCurrency}.`
    );


    addLog(
        `Mazzo iniziale: ${game.deck.length} carte disponibili.`
    );


    updateTable();

}


// ==========================================
// UTILITÀ
// ==========================================

function getPlayerById(
    id
) {

    return game.players.find(
        player =>
            player.id === id
    );

}


function calculateBidValue(
    cards
) {

    return cards.reduce(
        (total, card) =>
            total + card.value,
        0
    );

}


function getLowestSerial(
    cards
) {

    const serials =
        cards
            .filter(
                card =>
                    typeof card.id === "number"
            )
            .map(
                card =>
                    card.id
            );


    if (
        serials.length === 0
    ) {

        return Infinity;

    }


    return Math.min(
        ...serials
    );

}


// ==========================================
// CARTE DI UNA VALUTA
// ==========================================

function getCurrencyCards(
    player,
    currency
) {

    return player.hand.filter(
        card =>
            card.type === "money" &&
            card.currency === currency
    );

}


function getCurrencyValue(
    player,
    currency
) {

    return getCurrencyCards(
        player,
        currency
    ).reduce(
        (total, card) =>
            total + card.value,
        0
    );

}


function countValueCards(
    player,
    currency,
    value
) {

    return getCurrencyCards(
        player,
        currency
    ).filter(
        card =>
            card.value === value
    ).length;

}


// ==========================================
// COPIA MANO
// ==========================================

function simulateHandAfterTaking(
    player,
    cardsToTake,
    cardsToLose = []
) {

    let hand =
        [...player.hand];


    const lostIds =
        cardsToLose.map(
            card =>
                card.id
        );


    hand =
        hand.filter(
            card =>
                !lostIds.includes(
                    card.id
                )
        );


    hand.push(
        ...cardsToTake
    );


    return hand;

}


// ==========================================
// VALUTAZIONE OBIETTIVI DEL BOT
// ==========================================

function evaluateObjectiveScore(
    cards
) {

    let score = 0;


    // --------------------------------------
    // RAGGRUPPA LE CARTE PER VALUTA
    // --------------------------------------

    for (const currency of CURRENCIES) {

        const currencyCards =
            cards.filter(
                card =>
                    card.type === "money" &&
                    card.currency === currency
            );


        if (
            currencyCards.length === 0
        ) {

            continue;

        }


        const value =
            currencyCards.reduce(
                (total, card) =>
                    total + card.value,
                0
            );


        const twenties =
            currencyCards.filter(
                card =>
                    card.value === 20
            ).length;


        const thirties =
            currencyCards.filter(
                card =>
                    card.value === 30
            ).length;


        // ----------------------------------
        // TRIS DI 20
        // ----------------------------------

        if (
            twenties >= 3
        ) {

            score += 500;

        } else if (
            twenties === 2
        ) {

            score += 190;

        } else if (
            twenties === 1
        ) {

            score += 35;

        }


        // ----------------------------------
        // TRIS DI 30
        // ----------------------------------

        if (
            thirties >= 3
        ) {

            score += 500;

        } else if (
            thirties === 2
        ) {

            score += 220;

        } else if (
            thirties === 1
        ) {

            score += 45;

        }


        // ----------------------------------
        // OBIETTIVO 200
        // ----------------------------------

        if (
            value >= 200
        ) {

            score += 650;

        } else {

            if (
                value >= 180
            ) {

                score += 420;

            } else if (
                value >= 160
            ) {

                score += 300;

            } else if (
                value >= 140
            ) {

                score += 190;

            } else if (
                value >= 120
            ) {

                score += 110;

            } else if (
                value >= 100
            ) {

                score += 55;

            } else {

                score +=
                    value * 0.20;

            }

        }


        // ----------------------------------
        // SOGLIA 200: BONUS MARGINALE
        // ----------------------------------

        if (
            value < 200
        ) {

            const missing =
                200 - value;


            if (
                missing <= 20
            ) {

                score += 280;

            } else if (
                missing <= 30
            ) {

                score += 180;

            } else if (
                missing <= 40
            ) {

                score += 110;

            } else if (
                missing <= 60
            ) {

                score += 60;

            }

        }


        // ----------------------------------
        // RACCOLTA DELLA VALUTA
        // ----------------------------------

        score +=
            currencyCards.length * 12;

    }


    // --------------------------------------
    // MONETE
    // --------------------------------------

    const coins =
        cards.filter(
            card =>
                card.type === "coin"
        ).length;


    score +=
        coins * 12;


    return score;

}


// ==========================================
// VALORE STRATEGICO DELLA CARTA
// ==========================================

function cardStrategicValue(
    player,
    card
) {

    if (
        card.type === "play-money"
    ) {

        return 0;

    }


    if (
        card.type === "coin"
    ) {

        return 12;

    }


    const before =
        evaluateObjectiveScore(
            player.hand
        );


    const after =
        evaluateObjectiveScore(
            [
                ...player.hand,
                card
            ]
        );


    const marginal =
        after - before;


    return (
        card.value * 0.15 +
        marginal
    );

}


// ==========================================
// VALORE DI UN LOTTO
// ==========================================

function evaluateLot(
    player,
    lot
) {

    if (
        !lot ||
        lot.length === 0
    ) {

        return -Infinity;

    }


    const before =
        evaluateObjectiveScore(
            player.hand
        );


    const after =
        evaluateObjectiveScore(
            [
                ...player.hand,
                ...lot
            ]
        );


    return (
        after -
        before
    );

}


// ==========================================
// VALORE DI UN'OFFERTA AVVERSARIA
// ==========================================

function evaluateOpponentBid(
    player,
    opponent
) {

    if (
        !opponent ||
        opponent.bid.length === 0
    ) {

        return -Infinity;

    }


    return evaluateLot(
        player,
        opponent.bid
    );

}


// ==========================================
// COSTO DI UNA PROPRIA OFFERTA
// ==========================================

function evaluateBidCost(
    player,
    bid
) {

    if (
        bid.length === 0
    ) {

        return 0;

    }


    const before =
        evaluateObjectiveScore(
            player.hand
        );


    const remaining =
        player.hand.filter(
            card =>
                !bid.some(
                    offered =>
                        offered.id === card.id
                )
        );


    const after =
        evaluateObjectiveScore(
            remaining
        );


    return Math.max(
        0,
        before - after
    );

}


// ==========================================
// VALORE DI UNA CARTA SACRIFICATA
// ==========================================

function evaluateSacrifice(
    player,
    card
) {

    return cardStrategicValue(
        player,
        card
    );

}


// ==========================================
// VALUTAZIONE DI UN'ACQUISIZIONE
// ==========================================

function evaluateAcquisition(
    player,
    lot,
    bid
) {

    if (
        !lot ||
        lot.length === 0
    ) {

        return -Infinity;

    }


    const remainingHand =
        player.hand.filter(
            card =>
                !bid.some(
                    offered =>
                        offered.id === card.id
                )
        );


    const before =
        evaluateObjectiveScore(
            player.hand
        );


    const after =
        evaluateObjectiveScore(
            [
                ...remainingHand,
                ...lot
            ]
        );


    let value =
        after - before;


    // --------------------------------------
    // PREMIO ESPLICITO PER OBIETTIVI
    // --------------------------------------

    const simulated =
        [
            ...remainingHand,
            ...lot
        ];


    for (const currency of CURRENCIES) {

        const cards =
            simulated.filter(
                card =>
                    card.type === "money" &&
                    card.currency === currency
            );


        const current =
            cards.reduce(
                (total, card) =>
                    total + card.value,
                0
            );


        const twenties =
            cards.filter(
                card =>
                    card.value === 20
            ).length;


        const thirties =
            cards.filter(
                card =>
                    card.value === 30
            ).length;


        if (
            current >= 200
        ) {

            const previous =
                player.hand
                    .filter(
                        card =>
                            card.type === "money" &&
                            card.currency === currency
                    )
                    .reduce(
                        (total, card) =>
                            total + card.value,
                        0
                    );


            if (
                previous < 200
            ) {

                value += 350;

            }

        }


        if (
            twenties >= 3
        ) {

            const previous =
                player.hand.filter(
                    card =>
                        card.type === "money" &&
                        card.currency === currency &&
                        card.value === 20
                ).length;


            if (
                previous < 3
            ) {

                value += 350;

            }

        }


        if (
            thirties >= 3
        ) {

            const previous =
                player.hand.filter(
                    card =>
                        card.type === "money" &&
                        card.currency === currency &&
                        card.value === 30
                ).length;


            if (
                previous < 3
            ) {

                value += 400;

            }

        }

    }


    // --------------------------------------
    // PENALITÀ PER OFFERTE MOLTO COSTOSE
    // --------------------------------------

    const sacrificeCost =
        evaluateBidCost(
            player,
            bid
        );


    value -=
        sacrificeCost * 0.55;


    return value;

}


// ==========================================
// GENERAZIONE OFFERTE BOT
// ==========================================

function generateBidCandidates(
    player
) {

    /*
     * Il Bluff può essere aggiunto a qualunque
     * combinazione di carte reali.
     */

    const realCards =
        player.hand.filter(
            card =>
                card.type !==
                "play-money"
        );


    const playMoney =
        player.hand.find(
            card =>
                card.type ===
                "play-money"
        );


    const candidates = [];

    const total =
        realCards.length;


    // --------------------------------------
    // TUTTE LE COMBINAZIONI DELLE CARTE REALI
    // --------------------------------------

    for (
        let mask = 1;
        mask < (1 << total);
        mask++
    ) {

        const bid = [];


        for (
            let i = 0;
            i < total;
            i++
        ) {

            if (
                mask &
                (1 << i)
            ) {

                bid.push(
                    realCards[i]
                );

            }

        }


        candidates.push(
            bid
        );


        // La stessa offerta con Bluff.

        if (playMoney) {

            candidates.push([
                ...bid,
                playMoney
            ]);

        }

    }


    // --------------------------------------
    // BLUFF DA SOLO
    // --------------------------------------

    if (playMoney) {

        candidates.push([
            playMoney
        ]);

    }


    return candidates;

}


// ==========================================
// BOT: OBIETTIVI PRIORITARI
// ==========================================

function getBotTargets(
    player
) {

    const targets = [];

    const profile =
        player.botProfile;


    for (const currency of CURRENCIES) {

        const cards =
            getCurrencyCards(
                player,
                currency
            );


        const value =
            cards.reduce(
                (total, card) =>
                    total + card.value,
                0
            );


        const twenties =
            cards.filter(
                card =>
                    card.value === 20
            ).length;


        const thirties =
            cards.filter(
                card =>
                    card.value === 30
            ).length;


        // ----------------------------------
        // TRIS DI 20
        // ----------------------------------

        if (
            twenties === 2
        ) {

            targets.push({

                type: "triple20",

                currency:
                    currency,

                priority:
                    1000 *
                    profile.triple20Weight

            });

        }


        // ----------------------------------
        // TRIS DI 30
        // ----------------------------------

        if (
            thirties === 2
        ) {

            targets.push({

                type: "triple30",

                currency:
                    currency,

                priority:
                    1050 *
                    profile.triple30Weight

            });

        }


        // ----------------------------------
        // OBIETTIVO 200
        // ----------------------------------

        if (
            value >= 160 &&
            value < 200
        ) {

            targets.push({

                type: "reach200",

                currency:
                    currency,

                priority:
                    (
                        900 +
                        (value - 160) * 3
                    ) *
                    profile.near200Weight

            });

        }


        // ----------------------------------
        // SET GIÀ COMPLETO
        // ----------------------------------

        if (
            value >= 200
        ) {

            /*
             * Una valuta già arrivata a 200
             * non viene ignorata: può ancora
             * essere utile per migliorare il
             * punteggio, ma perde priorità
             * rispetto a un obiettivo ancora
             * incompleto.
             */

            targets.push({

                type: "maintain200",

                currency:
                    currency,

                priority:
                    620 *
                    profile.set200Weight

            });

        }

    }


    return targets.sort(
        (a, b) =>
            b.priority -
            a.priority
    );

}


// ==========================================
// BOT: SCELTA OFFERTA
// ==========================================

function chooseBotBid(
    player
) {

    const candidates =
        generateBidCandidates(
            player
        );


    const targets =
        getBotTargets(
            player
        );


    const profile =
        player.botProfile;


    let bestBid =
        null;

    let bestScore =
        -Infinity;


    for (const bid of candidates) {

        // ----------------------------------
        // BLUFF DA SOLO
        // ----------------------------------

        if (
            bid.length === 1 &&
            bid[0].type === "play-money"
        ) {

            let score = -80;


            if (
                targets.length === 0
            ) {

                score += 20;

            }


            /*
             * Il bluff solitario rimane raro,
             * ma un bot molto aggressivo può
             * occasionalmente sceglierlo.
             */

            score +=
                (
                    Math.random() * 8
                ) *
                profile.bluffWeight;


            if (
                score >
                bestScore
            ) {

                bestScore =
                    score;

                bestBid =
                    bid;

            }


            continue;

        }


        const bidValue =
            calculateBidValue(
                bid
            );


        // ----------------------------------
        // COSTO DELLA PROPRIA OFFERTA
        // ----------------------------------

        const sacrificeCost =
            evaluateBidCost(
                player,
                bid
            );


        // ----------------------------------
        // VALORE DEI DUE MERCATI
        // ----------------------------------

        const leftGain =
            evaluateAcquisition(
                player,
                game.market.left,
                bid
            );


        const rightGain =
            evaluateAcquisition(
                player,
                game.market.right,
                bid
            );


        const bestMarketGain =
            Math.max(
                leftGain,
                rightGain
            );


        let score =
            bestMarketGain *
            profile.lotWeight;


        // ----------------------------------
        // OBIETTIVO PRIORITARIO
        // ----------------------------------

        if (
            targets.length > 0
        ) {

            const target =
                targets[0];


            // ------------------------------
            // TRIS DI 20
            // ------------------------------

            if (
                target.type === "triple20"
            ) {

                for (const card of bid) {

                    if (
                        card.type === "money" &&
                        card.currency ===
                            target.currency &&
                        card.value === 20
                    ) {

                        /*
                         * Il bot TRIS sacrifica
                         * queste carte con molta
                         * più difficoltà.
                         *
                         * Il bot SET, invece,
                         * può farlo più facilmente.
                         */

                        score -=
                            190 *
                            profile.triple20Weight;

                    }

                }

            }


            // ------------------------------
            // TRIS DI 30
            // ------------------------------

            if (
                target.type === "triple30"
            ) {

                for (const card of bid) {

                    if (
                        card.type === "money" &&
                        card.currency ===
                            target.currency &&
                        card.value === 30
                    ) {

                        score -=
                            210 *
                            profile.triple30Weight;

                    }

                }

            }


            // ------------------------------
            // RAGGIUNGERE 200
            // ------------------------------

            if (
                target.type === "reach200"
            ) {

                const targetCards =
                    getCurrencyCards(
                        player,
                        target.currency
                    );


                const targetValue =
                    targetCards.reduce(
                        (total, card) =>
                            total + card.value,
                        0
                    );


                if (
                    targetValue >= 160
                ) {

                    for (const card of bid) {

                        if (
                            card.type === "money" &&
                            card.currency ===
                                target.currency
                        ) {

                            score -=
                                150 *
                                profile.near200Weight;

                        }

                    }

                }

            }


            // ------------------------------
            // SET GIÀ COMPLETO
            // ------------------------------

            if (
                target.type === "maintain200"
            ) {

                for (const card of bid) {

                    if (
                        card.type === "money" &&
                        card.currency ===
                            target.currency
                    ) {

                        score -=
                            75 *
                            profile.set200Weight;

                    }

                }

            }

        }


        // ----------------------------------
        // COSTO GENERALE
        // ----------------------------------

        /*
         * Prima 0.25.
         *
         * Ora il costo viene modulato dal
         * profilo.
         *
         * Un valore più basso significa:
         * "sono disposto a pagare di più".
         */

        score -=
            sacrificeCost *
            0.25 *
            profile.sacrificeWeight /
            profile.aggression;


        // ----------------------------------
        // DIMENSIONE DELL'OFFERTA
        // ----------------------------------

        if (
            bid.length === 1
        ) {

            score -=
                5;

        }


        if (
            bid.length === 2
        ) {

            score +=
                25 *
                profile.multiCardWeight;

        }


        if (
            bid.length === 3
        ) {

            score +=
                35 *
                profile.multiCardWeight;

        }


        if (
            bid.length === 4
        ) {

            score +=
                18 *
                profile.multiCardWeight;

        }


        if (
            bid.length >= 5
        ) {

            score -=
                (
                    bid.length - 4
                ) *
                35 /
                profile.aggression;

        }


        // ----------------------------------
        // VALORE DELL'OFFERTA
        // ----------------------------------

        if (
            bidValue >= 100 &&
            bidValue < 140
        ) {

            score +=
                20 *
                profile.aggression;

        }


        if (
            bidValue >= 140 &&
            bidValue < 180
        ) {

            score +=
                35 *
                profile.aggression;

        }


        if (
            bidValue >= 180
        ) {

            score +=
                45 *
                profile.aggression;

        }


        // ----------------------------------
        // PREMIO PER L'AGGRESSIVITÀ
        // ----------------------------------

        if (
            bestMarketGain >= 300
        ) {

            score +=
                bid.length *
                22 *
                profile.aggression;

        } else if (
            bestMarketGain >= 200
        ) {

            score +=
                bid.length *
                15 *
                profile.aggression;

        } else if (
            bestMarketGain >= 100
        ) {

            score +=
                bid.length *
                8 *
                profile.aggression;

        }


        // ----------------------------------
        // PREMIO SPECIFICO PER TRIS
        // ----------------------------------

        if (
            targets.length > 0
        ) {

            const target =
                targets[0];


            if (
                target.type === "triple20"
            ) {

                for (const card of game.market.left) {

                    if (
                        card.type === "money" &&
                        card.currency === target.currency &&
                        card.value === 20
                    ) {

                        score +=
                            35 *
                            profile.triple20Weight;

                    }

                }


                for (const card of game.market.right) {

                    if (
                        card.type === "money" &&
                        card.currency === target.currency &&
                        card.value === 20
                    ) {

                        score +=
                            35 *
                            profile.triple20Weight;

                    }

                }

            }


            if (
                target.type === "triple30"
            ) {

                for (const card of game.market.left) {

                    if (
                        card.type === "money" &&
                        card.currency === target.currency &&
                        card.value === 30
                    ) {

                        score +=
                            40 *
                            profile.triple30Weight;

                    }

                }


                for (const card of game.market.right) {

                    if (
                        card.type === "money" &&
                        card.currency === target.currency &&
                        card.value === 30
                    ) {

                        score +=
                            40 *
                            profile.triple30Weight;

                    }

                }

            }

        }


        // ----------------------------------
        // PREMIO SPECIFICO PER 200
        // ----------------------------------

        if (
            targets.length > 0
        ) {

            const target =
                targets[0];


            if (
                target.type === "reach200"
            ) {

                const targetValue =
                    getCurrencyValue(
                        player,
                        target.currency
                    );


                const missing =
                    200 -
                    targetValue;


                /*
                 * Se il mercato contiene una carta
                 * che chiude il 200, il bot SET la
                 * considera particolarmente
                 * appetibile.
                 */

                const markets = [
                    game.market.left,
                    game.market.right
                ];


                for (const market of markets) {

                    for (const card of market) {

                        if (
                            card.type === "money" &&
                            card.currency === target.currency &&
                            card.value >= missing
                        ) {

                            score +=
                                45 *
                                profile.set200Weight;

                        }

                    }

                }

            }

        }


        // ----------------------------------
        // BLUFF
        // ----------------------------------

        if (
            bid.some(
                card =>
                    card.type === "play-money"
            )
        ) {

            score +=
                18 *
                profile.bluffWeight;

        }


        // ----------------------------------
        // VARIABILITÀ
        // ----------------------------------

        /*
         * Non abbastanza alta da distruggere
         * la strategia, ma sufficiente a evitare
         * partite completamente deterministiche.
         */

        score +=
            Math.random() *
            (
                12 +
                profile.bidVariance * 10
            );


        // ----------------------------------
        // PICCOLA TENDENZA ALL'AGGRESSIVITÀ
        // ----------------------------------

        /*
         * A parità quasi perfetta, l'offerta
         * più grande ha un piccolo vantaggio
         * per i bot aggressivi.
         */

        score +=
            bid.length *
            (
                profile.aggression - 1
            ) *
            8;


        if (
            score >
            bestScore
        ) {

            bestScore =
                score;

            bestBid =
                bid;

        }

    }


    return bestBid || [];

}


// ==========================================
// CONFRONTO OFFERTE
// ==========================================

function compareBids(
    a,
    b
) {

    if (
        b.bidValue !==
        a.bidValue
    ) {

        return (
            b.bidValue -
            a.bidValue
        );

    }


    return (
        getLowestSerial(a.bid) -
        getLowestSerial(b.bid)
    );

}


// ==========================================
// ORDINE OFFERTE
// ==========================================

function determineBidOrder() {

    return [...game.players]
        .filter(
            player =>
                player.bid.length > 0
        )
        .sort(
            compareBids
        );

}


// ==========================================
// PREPARAZIONE RISOLUZIONE
// ==========================================

function prepareResolution() {

    const ordered =
        determineBidOrder();


    game.resolutionQueue =
        ordered.map(
            player =>
                player.id
        );

}


// ==========================================
// PROSSIMO GIOCATORE
// ==========================================

function getNextPlayer() {

    const candidates =
        game.players.filter(
            player =>
                !player.resolved &&
                player.bid.length > 0
        );


    if (
        candidates.length === 0
    ) {

        return null;

    }


    candidates.sort(
        compareBids
    );


    return candidates[0];

}


// ==========================================
// BOT: SCELTA AZIONE
// ==========================================

function chooseBotAction(
    player
) {

    const profile =
        player.botProfile;


    // --------------------------------------
    // BLUFF DA SOLO
    // --------------------------------------

    if (
        player.bid.length === 1 &&
        player.bid[0].type === "play-money"
    ) {

        return {

            type: "pass"

        };

    }


    const actions = [];


    // --------------------------------------
    // OFFERTA A
    // --------------------------------------

    if (
        game.market.left.length > 0
    ) {

        actions.push({

            type: "left",

            targetValue:
                evaluateAcquisition(
                    player,
                    game.market.left,
                    player.bid
                ) *
                profile.lotWeight

        });

    }


    // --------------------------------------
    // OFFERTA B
    // --------------------------------------

    if (
        game.market.right.length > 0
    ) {

        actions.push({

            type: "right",

            targetValue:
                evaluateAcquisition(
                    player,
                    game.market.right,
                    player.bid
                ) *
                profile.lotWeight

        });

    }


    // --------------------------------------
    // OFFERTE AVVERSARIE
    // --------------------------------------

    for (const opponent of game.players) {

        if (
            opponent.id === player.id
        ) {

            continue;

        }


        if (
            opponent.resolved
        ) {

            continue;

        }


        if (
            opponent.bid.length === 0
        ) {

            continue;

        }


        let targetValue =
            evaluateOpponentBid(
                player,
                opponent
            );


        // ----------------------------------
        // DISTURBO
        // ----------------------------------

        for (const card of opponent.bid) {

            if (
                card.type !== "money"
            ) {

                continue;

            }


            const opponentCards =
                getCurrencyCards(
                    opponent,
                    card.currency
                );


            if (
                opponentCards.length >= 4
            ) {

                targetValue +=
                    50 *
                    profile.aggression;

            }


            if (
                opponentCards.length >= 6
            ) {

                targetValue +=
                    80 *
                    profile.aggression;

            }

        }


        actions.push({

            type: "steal",

            targetId:
                opponent.id,

            targetValue:
                targetValue *
                profile.lotWeight

        });

    }


    // --------------------------------------
    // PASS
    // --------------------------------------

    actions.push({

        type: "pass",

        targetValue: 0

    });


    actions.sort(
        (a, b) =>
            b.targetValue - a.targetValue
    );


    const best =
        actions[0];


    const bidCost =
        evaluateBidCost(
            player,
            player.bid
        );


    // --------------------------------------
    // SOGLIA DI CONVENIENZA
    // --------------------------------------

    /*
     * Prima:
     *
     * best < bidCost * 0.40
     *
     * Ora la soglia dipende dal carattere.
     *
     * Bot aggressivi:
     * accettano più facilmente scambi costosi.
     */

    const acceptanceThreshold =
        0.40 *
        profile.sacrificeWeight /
        profile.aggression;


    if (
        best.type !== "pass" &&
        best.targetValue <
            bidCost *
            acceptanceThreshold
    ) {

        return {

            type: "pass"

        };

    }


    return best;

}


// ==========================================
// RISOLUZIONE TURNO BOT
// ==========================================

function resolveBotTurn(
    player
) {

    if (
        player.resolved ||
        player.bid.length === 0
    ) {

        continueResolution();

        return;

    }


    // --------------------------------------
    // BLUFF DA SOLO
    // --------------------------------------

    if (
        player.bid.length === 1 &&
        player.bid[0].type === "play-money"
    ) {

        executeAction(
            player,
            {
                type: "pass"
            }
        );

        return;

    }


    const action =
        chooseBotAction(
            player
        );


    executeAction(
        player,
        action
    );

}


// ==========================================
// ESECUZIONE AZIONE
// ==========================================

function executeAction(
    player,
    action
) {

    if (
        !player ||
        player.resolved
    ) {

        return;

    }


    // --------------------------------------
    // PASS
    // --------------------------------------

    if (
        action.type === "pass"
    ) {

        const offeredCards =
            [...player.bid];


        player.hand.push(
            ...offeredCards
        );


        player.bid = [];

        player.bidValue = 0;

        player.resolved = true;


        if (
            offeredCards.length === 1 &&
            offeredCards[0].type === "play-money"
        ) {

            addLog(
                `${player.name} ha giocato solo il BLUFF e non effettua alcuno scambio. Il BLUFF torna al proprietario.`
            );

        } else {

            addLog(
                `${player.name} non effettua scambi e riprende la propria offerta (${cardsDescription(offeredCards)}).`
            );

        }


        updateTable();

        continueResolution();

        return;

    }


    // --------------------------------------
    // PRENDI A
    // --------------------------------------

    if (
        action.type === "left"
    ) {

        const lot =
            [...game.market.left];


        const offeredCards =
            [...player.bid];


        game.market.left =
            offeredCards;


        player.hand.push(
            ...lot
        );


        player.bid = [];

        player.bidValue = 0;

        player.resolved = true;


        addLog(
            `${player.name} prende l'offerta A (${cardsDescription(lot)}) e vi sostituisce la propria offerta (${cardsDescription(offeredCards)}).`
        );


        updateTable();

        continueResolution();

        return;

    }


    // --------------------------------------
    // PRENDI B
    // --------------------------------------

    if (
        action.type === "right"
    ) {

        const lot =
            [...game.market.right];


        const offeredCards =
            [...player.bid];


        game.market.right =
            offeredCards;


        player.hand.push(
            ...lot
        );


        player.bid = [];

        player.bidValue = 0;

        player.resolved = true;


        addLog(
            `${player.name} prende l'offerta B (${cardsDescription(lot)}) e vi sostituisce la propria offerta (${cardsDescription(offeredCards)}).`
        );


        updateTable();

        continueResolution();

        return;

    }


    // --------------------------------------
    // PRENDI OFFERTA AVVERSARIA
    // --------------------------------------

    if (
        action.type === "steal"
    ) {

        const target =
            getPlayerById(
                action.targetId
            );


        if (
            !target ||
            target.resolved ||
            target.bid.length === 0
        ) {

            executeAction(
                player,
                {
                    type: "pass"
                }
            );

            return;

        }


        const targetBid =
            [...target.bid];


        const playerBid =
            [...player.bid];


        // Il giocatore prende l'offerta
        // dell'avversario.

        player.hand.push(
            ...targetBid
        );


        // La propria offerta passa
        // all'avversario.

        target.bid =
            playerBid;


        target.bidValue =
            calculateBidValue(
                target.bid
            );


        target.resolved =
            false;


        player.bid = [];

        player.bidValue = 0;

        player.resolved = true;


        game.currentPlayerId =
            target.id;


        addLog(
            `${player.name} prende l'offerta di ${target.name} (${cardsDescription(targetBid)}). ${target.name} riceve la nuova offerta (${cardsDescription(playerBid)}) e deve giocarla.`
        );


        updateTable();


        setMessage(
            `${target.name} deve ora scegliere cosa fare con la nuova offerta.`
        );


        // Se l'offerta passata contiene solo
        // il Bluff, il giocatore non può
        // effettuare alcuna presa.

        if (
            target.bid.length === 1 &&
            target.bid[0].type === "play-money"
        ) {

            setTimeout(
                () => {

                    executeAction(
                        target,
                        {
                            type: "pass"
                        }
                    );

                },
                target.id === 1
                    ? 300
                    : 500
            );

            return;

        }


        if (
            target.id === 1
        ) {

            showPlayerActions(
                target
            );

        } else {

            setTimeout(
                () => {

                    resolveBotTurn(
                        target
                    );

                },
                700
            );

        }


        return;

    }

}


// ==========================================
// CONTINUA RISOLUZIONE
// ==========================================

function continueResolution() {

    const next =
        getNextPlayer();


    if (!next) {

        finishRound();

        return;

    }


    game.currentPlayerId =
        next.id;


    updateTable();


    // --------------------------------------
    // BLUFF DA SOLO
    // --------------------------------------

    if (
        next.bid.length === 1 &&
        next.bid[0].type === "play-money"
    ) {

        if (
            next.id === 1
        ) {

            setMessage(
                "Hai giocato solo il BLUFF: non puoi prendere alcuna mano di carte."
            );

        }


        setTimeout(
            () => {

                executeAction(
                    next,
                    {
                        type: "pass"
                    }
                );

            },
            next.id === 1
                ? 700
                : 500
        );

        return;

    }


    if (
        next.id === 1
    ) {

        showPlayerActions(
            next
        );

    } else {

        setMessage(
            `${next.name} sta scegliendo...`
        );


        setTimeout(
            () => {

                resolveBotTurn(
                    next
                );

            },
            650
        );

    }

}


// ==========================================
// AZIONI DEL GIOCATORE UMANO
// ==========================================

function showPlayerActions(
    player
) {

    const actions =
        document.getElementById(
            "actions"
        );


    actions.innerHTML = "";


    // --------------------------------------
    // BLUFF DA SOLO
    // --------------------------------------

    if (
        player.bid.length === 1 &&
        player.bid[0].type === "play-money"
    ) {

        setMessage(
            "Hai giocato solo il BLUFF: non puoi prendere alcuna mano di carte."
        );


        const info =
            document.createElement(
                "div"
            );


        info.textContent =
            "Il BLUFF tornerà al suo proprietario.";


        info.style.padding =
            "10px";


        actions.appendChild(
            info
        );


        setTimeout(
            () => {

                executeAction(
                    player,
                    {
                        type: "pass"
                    }
                );

            },
            900
        );


        return;

    }


    setMessage(
        "È il tuo turno: scegli cosa fare con la tua offerta."
    );


    // --------------------------------------
    // PRENDI A
    // --------------------------------------

    if (
        game.market.left.length > 0
    ) {

        const button =
            createActionButton(
                "Prendi offerta A",
                () => {

                    executeAction(
                        player,
                        {
                            type: "left"
                        }
                    );

                }
            );


        actions.appendChild(
            button
        );

    }


    // --------------------------------------
    // PRENDI B
    // --------------------------------------

    if (
        game.market.right.length > 0
    ) {

        const button =
            createActionButton(
                "Prendi offerta B",
                () => {

                    executeAction(
                        player,
                        {
                            type: "right"
                        }
                    );

                }
            );


        actions.appendChild(
            button
        );

    }


    // --------------------------------------
    // PRENDI OFFERTA AVVERSARIA
    // --------------------------------------

    for (const opponent of game.players) {

        if (
            opponent.id === player.id
        ) {

            continue;

        }


        if (
            opponent.resolved ||
            opponent.bid.length === 0
        ) {

            continue;

        }


        const button =
            createActionButton(
                `Prendi offerta di ${opponent.name}`,
                () => {

                    executeAction(
                        player,
                        {

                            type:
                                "steal",

                            targetId:
                                opponent.id

                        }
                    );

                }
            );


        actions.appendChild(
            button
        );

    }


    // --------------------------------------
    // NESSUNO SCAMBIO
    // --------------------------------------

    const passButton =
        createActionButton(
            "Nessuno scambio",
            () => {

                executeAction(
                    player,
                    {
                        type: "pass"
                    }
                );

            }
        );


    actions.appendChild(
        passButton
    );

}


// ==========================================
// CREAZIONE PULSANTE
// ==========================================

function createActionButton(
    text,
    callback
) {

    const button =
        document.createElement(
            "button"
        );


    button.type =
        "button";


    button.textContent =
        text;


    button.addEventListener(
        "click",
        callback
    );


    return button;

}


// ==========================================
// CONFERMA OFFERTA
// ==========================================

function confirmBid() {

    if (
        game.phase !== "bidding"
    ) {

        return;

    }


    const player =
        game.players[0];


    if (
        player.selectedCards.length === 0
    ) {

        setMessage(
            "Devi selezionare almeno una carta."
        );

        return;

    }


    // --------------------------------------
    // OFFERTA UMANA
    // --------------------------------------

    const selectedIds =
        [...player.selectedCards];


    const selectedCards =
        player.hand.filter(
            card =>
                selectedIds.includes(
                    card.id
                )
        );


    const realBid =
        selectedCards.filter(
            card =>
                card.type !==
                "play-money"
        );


    const bluffCards =
        selectedCards.filter(
            card =>
                card.type ===
                "play-money"
        );


    player.hand =
        player.hand.filter(
            card =>
                !selectedIds.includes(
                    card.id
                )
        );


    player.bid =
        [
            ...realBid,
            ...bluffCards
        ];


    player.bidValue =
        calculateBidValue(
            player.bid
        );


    player.bidConfirmed =
        true;


    player.resolved =
        player.bid.length === 0;


    addLog(
        `Tu giochi un'offerta di ${player.bidValue} composta da ${player.bid.length} carta${player.bid.length === 1 ? "" : "e"}: ${cardsDescription(player.bid)}.`
    );


    // --------------------------------------
    // OFFERTE BOT
    // --------------------------------------

    for (
        let i = 1;
        i < game.players.length;
        i++
    ) {

        const bot =
            game.players[i];


        bot.selectedCards = [];


        const chosenBid =
            chooseBotBid(
                bot
            );


        const bidIds =
            chosenBid.map(
                card =>
                    card.id
            );


        bot.hand =
            bot.hand.filter(
                card =>
                    !bidIds.includes(
                        card.id
                    )
            );


        bot.bid =
            [...chosenBid];


        bot.bidValue =
            calculateBidValue(
                bot.bid
            );


        bot.bidConfirmed =
            true;


        bot.resolved =
            bot.bid.length === 0;


        if (
            bot.bid.length > 0
        ) {

            addLog(
                `${bot.name} gioca un'offerta di ${bot.bidValue} composta da ${bot.bid.length} carta${bot.bid.length === 1 ? "" : "e"}.`
            );

        } else {

            addLog(
                `${bot.name} passa.`
            );

        }

    }


    // --------------------------------------
    // RISOLUZIONE
    // --------------------------------------

    prepareResolution();


    game.phase =
        "resolution";


    game.currentPlayerId =
        null;


    updateTable();


    const first =
        getNextPlayer();


    if (!first) {

        finishRound();

        return;

    }


    game.currentPlayerId =
        first.id;


    updateTable();


    // --------------------------------------
    // PRIMO GIOCATORE: BLUFF DA SOLO
    // --------------------------------------

    if (
        first.bid.length === 1 &&
        first.bid[0].type === "play-money"
    ) {

        if (
            first.id === 1
        ) {

            setMessage(
                "Hai giocato solo il BLUFF: non puoi prendere alcuna mano di carte."
            );

        } else {

            setMessage(
                `${first.name} ha giocato solo il BLUFF.`
            );

        }


        setTimeout(
            () => {

                executeAction(
                    first,
                    {
                        type: "pass"
                    }
                );

            },
            first.id === 1
                ? 900
                : 700
        );


        return;

    }


    if (
        first.id === 1
    ) {

        showPlayerActions(
            first
        );

    } else {

        setMessage(
            `${first.name} sta scegliendo...`
        );


        setTimeout(
            () => {

                resolveBotTurn(
                    first
                );

            },
            700
        );

    }

}


// ==========================================
// PULSANTE OFFERTA
// ==========================================

function showBidButton() {

    const actions =
        document.getElementById(
            "actions"
        );


    actions.innerHTML = "";


    const button =
        document.createElement(
            "button"
        );


    button.type =
        "button";


    button.className =
        "primary";


    button.textContent =
        "Conferma offerta";


    button.addEventListener(
        "click",
        confirmBid
    );


    actions.appendChild(
        button
    );

}


// ==========================================
// SELEZIONE CARTE
// ==========================================

function toggleCardSelection(
    player,
    card
) {

    if (
        game.phase !== "bidding"
    ) {

        return;

    }


    if (
        player.bidConfirmed
    ) {

        return;

    }


    const index =
        player.selectedCards.indexOf(
            card.id
        );


    if (
        index === -1
    ) {

        player.selectedCards.push(
            card.id
        );

    } else {

        player.selectedCards.splice(
            index,
            1
        );

    }


    updateTable();

}


// ==========================================
// ELEMENTO CARTA
// ==========================================

function createCardElement(
    card,
    options = {}
) {

    const element =
        document.createElement(
            "div"
        );


    element.classList.add(
        "card"
    );


    if (
        options.clickable
    ) {

        element.classList.add(
            "clickable"
        );

    }


    if (
        options.selected
    ) {

        element.classList.add(
            "selected"
        );

    }


    // --------------------------------------
    // CARTA COPERTA
    // --------------------------------------

    if (
        options.hidden
    ) {

        element.classList.add(
            "card-back"
        );

        element.textContent =
            "?";

        return element;

    }


    // --------------------------------------
    // PLAY MONEY / BLUFF
    // --------------------------------------

    if (
        card.type === "play-money"
    ) {

        element.classList.add(
            "card-play-money"
        );


        const label =
            document.createElement(
                "div"
            );


        label.className =
            "card-currency";


        label.textContent =
            "BLUFF";


        const value =
            document.createElement(
                "div"
            );


        value.className =
            "card-value";


        value.textContent =
            "PLAY";


        element.appendChild(
            label
        );


        element.appendChild(
            value
        );


        return element;

    }


    // --------------------------------------
    // MONETA
    // --------------------------------------

    if (
        card.type === "coin"
    ) {

        element.classList.add(
            "card-coin"
        );


        const label =
            document.createElement(
                "div"
            );


        label.className =
            "card-currency";


        label.textContent =
            "MONETA";


        const value =
            document.createElement(
                "div"
            );


        value.className =
            "card-value";


        value.textContent =
            "10";


        const serial =
            document.createElement(
                "div"
            );


        serial.className =
            "card-serial";


        serial.textContent =
            `#${card.id}`;


        element.appendChild(
            label
        );


        element.appendChild(
            value
        );


        element.appendChild(
            serial
        );


        return element;

    }


    // --------------------------------------
    // BANCONOTA
    // --------------------------------------

    element.classList.add(
        `currency-${card.currency.toLowerCase()}`
    );


    const currency =
        document.createElement(
            "div"
        );


    currency.className =
        "card-currency";


    currency.textContent =
        card.currency;


    const value =
        document.createElement(
            "div"
        );


    value.className =
        "card-value";


    value.textContent =
        card.value;


    const serial =
        document.createElement(
            "div"
        );


    serial.className =
        "card-serial";


    serial.textContent =
        `#${card.id}`;


    element.appendChild(
        currency
    );


    element.appendChild(
        value
    );


    element.appendChild(
        serial
    );


    return element;

}


// ==========================================
// RENDER GIOCATORI
// ==========================================

function renderPlayers() {

    const container =
        document.getElementById(
            "players"
        );

    container.innerHTML = "";

for (const player of game.players) {

    /*
     * Il giocatore umano viene mostrato
     * soltanto nella sezione #player-hand.
     * Non creare quindi il riquadro "Tu".
     */
    if (player.id === 1) {
        continue;
    }

    const playerElement =
        document.createElement(
            "div"
        );

        playerElement.className =
            "player";

        if (
            game.currentPlayerId ===
            player.id
        ) {

            playerElement.classList.add(
                "active"
            );

        }

        // ----------------------------------
        // NOME
        // ----------------------------------

        const name =
            document.createElement(
                "div"
            );

        name.className =
            "player-name";

        name.textContent =
            player.name;

        // ----------------------------------
        // STATUS
        // ----------------------------------

        const status =
            document.createElement(
                "div"
            );

        status.className =
            "player-status";

        if (
            game.phase === "bidding"
        ) {

            if (
                player.id === 1
            ) {

                status.textContent =
                    "Scegli la tua offerta";

            } else {

                status.textContent =
                    "Offerta nascosta";

            }

        } else {

            if (
                player.bid.length > 0
            ) {

                status.textContent =
                    `Offerta: ${player.bidValue}`;

            } else {

                status.textContent =
                    "Nessuna offerta";

            }

        }

        playerElement.appendChild(
            name
        );

        playerElement.appendChild(
            status
        );

// ----------------------------------
// MANO
// ----------------------------------

/*
 * La mano del giocatore umano viene
 * visualizzata esclusivamente da renderHand(),
 * nel contenitore #player-hand.
 *
 * Qui vengono mostrate soltanto le mani dei bot.
 */

if (player.id !== 1) {

    const cards =
        document.createElement(
            "div"
        );

    cards.className =
        "cards";

    for (const card of player.hand) {

        const cardElement =
            createCardElement(
                card,
                {
                    hidden:
                        !game.gameOver
                }
            );

        cards.appendChild(
            cardElement
        );

    }

    playerElement.appendChild(
        cards
    );

}
        // ----------------------------------
        // OFFERTA BOT / GIOCATORE
        // ----------------------------------

        if (
            game.phase !== "bidding" &&
            player.bid.length > 0
        ) {

            const bidLabel =
                document.createElement(
                    "div"
                );

            bidLabel.className =
                "player-status";

            bidLabel.style.marginTop =
                "10px";

            bidLabel.textContent =
                `Offerta giocata (${player.bidValue})`;

            playerElement.appendChild(
                bidLabel
            );

            const bidCards =
                document.createElement(
                    "div"
                );

            bidCards.className =
                "cards";

            for (const card of player.bid) {

                bidCards.appendChild(
                    createCardElement(
                        card
                    )
                );

            }

            playerElement.appendChild(
                bidCards
            );

        }

        // ----------------------------------
        // INFO
        // ----------------------------------

        const score =
            document.createElement(
                "div"
            );

        score.className =
            "player-score";

        if (
            game.gameOver
        ) {

            score.textContent =
                `${player.score} punti`;

        } else {

            score.textContent =
                `${player.hand.length} carte in mano`;

        }

        playerElement.appendChild(
            score
        );

        container.appendChild(
            playerElement
        );

    }

}

// ==========================================
// RENDER MANO UMANA
// ==========================================

function renderHand() {

    const container =
        document.getElementById(
            "player-hand"
        );


    if (!container) {

        return;

    }


    container.innerHTML = "";


    const player =
        game.players[0];


    for (const card of player.hand) {

        const selected =
            player.selectedCards.includes(
                card.id
            );


        const element =
            createCardElement(
                card,
                {

                    clickable:
                        game.phase === "bidding" &&
                        !player.bidConfirmed,

                    selected:
                        selected

                }
            );


        if (
            game.phase === "bidding" &&
            !player.bidConfirmed
        ) {

            element.addEventListener(
                "click",
                () => {

                    toggleCardSelection(
                        player,
                        card
                    );

                }
            );

        }


        container.appendChild(
            element
        );

    }

}


// ==========================================
// RENDER MERCATO
// ==========================================

function renderMarket() {

    renderMarketSide(
        "market-left",
        game.market.left
    );


    renderMarketSide(
        "market-right",
        game.market.right
    );

}


function renderMarketSide(
    elementId,
    cards
) {

    const container =
        document.getElementById(
            elementId
        );


    container.innerHTML = "";


    for (const card of cards) {

        container.appendChild(
            createCardElement(
                card
            )
        );

    }

}


// ==========================================
// RENDER OFFERTA UMANA
// ==========================================

function renderPlayerBid() {

    const container =
        document.getElementById(
            "player-bid"
        );


    container.innerHTML = "";


    const player =
        game.players[0];


    if (
        player.bid.length === 0
    ) {

        return;

    }


    for (const card of player.bid) {

        container.appendChild(
            createCardElement(
                card
            )
        );

    }

}


// ==========================================
// RENDER MAZZO
// ==========================================

function renderDeck() {

    let deckArea =
        document.getElementById(
            "deck-area"
        );


    if (!deckArea) {

        const table =
            document.getElementById(
                "table"
            );


        deckArea =
            document.createElement(
                "div"
            );


        deckArea.id =
            "deck-area";


        deckArea.style.display =
            "flex";


        deckArea.style.flexDirection =
            "column";


        deckArea.style.alignItems =
            "center";


        deckArea.style.justifyContent =
            "center";


        deckArea.style.margin =
            "5px auto";


        deckArea.style.gap =
            "7px";


        const deckCard =
            document.createElement(
                "div"
            );


        deckCard.id =
            "deck-card";


        deckCard.style.width =
            "70px";


        deckCard.style.height =
            "96px";


        deckCard.style.borderRadius =
            "8px";


        deckCard.style.background =
            "#777";


        deckCard.style.border =
            "2px solid #444";


        deckCard.style.boxShadow =
            "0 3px 5px rgba(0,0,0,0.35)";


        deckCard.style.display =
            "flex";


        deckCard.style.flexDirection =
            "column";


        deckCard.style.alignItems =
            "center";


        deckCard.style.justifyContent =
            "center";


        deckCard.style.color =
            "#eee";


        deckCard.style.fontWeight =
            "bold";


        deckCard.style.userSelect =
            "none";


        const deckIcon =
            document.createElement(
                "div"
            );


        deckIcon.textContent =
            "CARTE";


        deckIcon.style.fontSize =
            "13px";


        const deckCount =
            document.createElement(
                "div"
            );


        deckCount.id =
            "deck-count";


        deckCount.style.fontSize =
            "24px";


        deckCount.style.marginTop =
            "5px";


        deckCard.appendChild(
            deckIcon
        );


        deckCard.appendChild(
            deckCount
        );


        const deckLabel =
            document.createElement(
                "div"
            );


        deckLabel.id =
            "deck-label";


        deckLabel.style.fontSize =
            "13px";


        deckLabel.style.color =
            "#ddd";


        deckLabel.textContent =
            "carte da pescare";


        deckArea.appendChild(
            deckCard
        );


        deckArea.appendChild(
            deckLabel
        );


        const center =
            document.querySelector(
                ".center"
            );


        if (center) {

            center.appendChild(
                deckArea
            );

        } else {

            table.appendChild(
                deckArea
            );

        }

    }


    const count =
        document.getElementById(
            "deck-count"
        );


    if (count) {

        count.textContent =
            game.deck.length;

    }

}


// ==========================================
// RENDER LOG
// ==========================================

function renderLogs() {

    let logArea =
        document.getElementById(
            "game-log"
        );


    if (!logArea) {

        const table =
            document.getElementById(
                "table"
            );


        logArea =
            document.createElement(
                "section"
            );


        logArea.id =
            "game-log";


        logArea.style.marginTop =
            "15px";


        logArea.style.background =
            "rgba(0,0,0,0.35)";


        logArea.style.borderRadius =
            "12px";


        logArea.style.padding =
            "15px";


        logArea.style.maxHeight =
            "260px";


        logArea.style.overflowY =
            "auto";


        logArea.style.textAlign =
            "left";


        const title =
            document.createElement(
                "h2"
            );


        title.textContent =
            "Log della partita";


        title.style.fontSize =
            "18px";


        title.style.margin =
            "0 0 10px 0";


        title.style.textAlign =
            "center";


        logArea.appendChild(
            title
        );


        const entries =
            document.createElement(
                "div"
            );


        entries.id =
            "game-log-entries";


        logArea.appendChild(
            entries
        );


        table.appendChild(
            logArea
        );

    }


    const entries =
        document.getElementById(
            "game-log-entries"
        );


    if (!entries) {

        return;

    }


    entries.innerHTML = "";


    if (
        game.logs.length === 0
    ) {

        const empty =
            document.createElement(
                "div"
            );


        empty.textContent =
            "Nessuna azione registrata.";


        empty.style.color =
            "#bbb";


        entries.appendChild(
            empty
        );


        return;

    }


    for (
        let i = game.logs.length - 1;
        i >= 0;
        i--
    ) {

        const log =
            game.logs[i];


        const line =
            document.createElement(
                "div"
            );


        line.style.padding =
            "5px 0";


        line.style.borderBottom =
            "1px solid rgba(255,255,255,0.08)";


        line.style.fontSize =
            "13px";


        const round =
            document.createElement(
                "span"
            );


        round.textContent =
            `[M${log.round}] `;


        round.style.color =
            "#ffd54a";


        round.style.fontWeight =
            "bold";


        line.appendChild(
            round
        );


        line.appendChild(
            document.createTextNode(
                log.text
            )
        );


        entries.appendChild(
            line
        );

    }

}


// ==========================================
// MESSAGGIO
// ==========================================

function setMessage(
    text
) {

    const element =
        document.getElementById(
            "message-text"
        );


    if (
        element
    ) {

        element.textContent =
            text;

    }

}


// ==========================================
// INFO PARTITA
// ==========================================

function renderGameInfo() {

    const element =
        document.getElementById(
            "game-info"
        );


    if (!element) {

        return;

    }


    if (
        game.gameOver
    ) {

        element.textContent =
            "Partita terminata";

        return;

    }


    element.textContent =
        `Manche ${game.round} · Mazzo: ${game.deck.length} carte · Valuta rimossa: ${game.removedCurrency}`;

}


// ==========================================
// AGGIORNAMENTO TAVOLO
// ==========================================

function updateTable() {

    renderPlayers();

    renderHand();

    renderMarket();

    renderPlayerBid();

    renderGameInfo();

    renderDeck();

    renderLogs();

}


// ==========================================
// RESTITUZIONE BLUFF AI PROPRIETARI
// ==========================================

function returnBluffCardsToOwners() {

    const bluffCards = [];


    // --------------------------------------
    // RACCOGLIE I BLUFF DA TUTTE LE ZONE
    // --------------------------------------

    for (const card of game.deck) {

        if (
            card.type === "play-money"
        ) {

            bluffCards.push(
                card
            );

        }

    }


    for (const card of game.market.left) {

        if (
            card.type === "play-money"
        ) {

            bluffCards.push(
                card
            );

        }

    }


    for (const card of game.market.right) {

        if (
            card.type === "play-money"
        ) {

            bluffCards.push(
                card
            );

        }

    }


    for (const player of game.players) {

        for (const card of player.hand) {

            if (
                card.type === "play-money"
            ) {

                bluffCards.push(
                    card
                );

            }

        }


        for (const card of player.bid) {

            if (
                card.type === "play-money"
            ) {

                bluffCards.push(
                    card
                );

            }

        }

    }


    // --------------------------------------
    // RIMUOVE TUTTI I BLUFF DALLE ZONE
    // --------------------------------------

    game.deck =
        game.deck.filter(
            card =>
                card.type !== "play-money"
        );


    game.market.left =
        game.market.left.filter(
            card =>
                card.type !== "play-money"
        );


    game.market.right =
        game.market.right.filter(
            card =>
                card.type !== "play-money"
        );


    for (const player of game.players) {

        player.hand =
            player.hand.filter(
                card =>
                    card.type !== "play-money"
            );


        player.bid =
            player.bid.filter(
                card =>
                    card.type !== "play-money"
            );

    }


    // --------------------------------------
    // RESTITUISCE UN BLUFF A OGNI PROPRIETARIO
    // --------------------------------------

    for (const player of game.players) {

        const bluff =
            bluffCards.find(
                card =>
                    card.ownerId === player.id ||
                    (
                        !card.ownerId &&
                        card.id === `play-${player.id}`
                    )
            );


        if (bluff) {

            bluff.ownerId =
                player.id;


            player.hand.push(
                bluff
            );

        } else {

            player.hand.push({

                id:
                    `play-${player.id}`,

                type:
                    "play-money",

                currency:
                    null,

                value:
                    0,

                ownerId:
                    player.id

            });

        }

    }

}


// ==========================================
// FINE MANO
// ==========================================

function finishRound() {

    game.phase = "round-end";

    game.currentPlayerId = null;

    addLog(
        `Terminata la manche ${game.round}.`
    );

    // --------------------------------------
    // IL BLUFF TORNA SEMPRE AL PROPRIETARIO
    // --------------------------------------

    returnBluffCardsToOwners();

    // --------------------------------------
    // RESET OFFERTE
    // --------------------------------------

    for (const player of game.players) {

        player.bid = [];

        player.bidValue = 0;

        player.selectedCards = [];

        player.bidConfirmed = false;

        player.resolved = false;

    }

    // --------------------------------------
    // SE ERA LA MANCHE FINALE, FINE PARTITA
    // --------------------------------------

    if (game.finalRound) {

        addLog(
            "Terminata la manche finale. Si procede al conteggio finale."
        );

        finishGame();

        return;

    }

    // --------------------------------------
    // RIFORNIMENTO
    // PRIMA B, POI A
    // --------------------------------------

    replenishMarket("right");

    replenishMarket("left");

    // --------------------------------------
    // MAZZO ESAURITO: PROSSIMA MANCHE FINALE
    // --------------------------------------

    if (game.deck.length === 0) {

        game.finalRound = true;

        addLog(
            "Il mazzo è esaurito. La prossima manche sarà l'ultima."
        );

    } else {

        addLog(
            `Il mercato viene rifornito. Rimangono ${game.deck.length} carte nel mazzo.`
        );

    }

    // --------------------------------------
    // NUOVA MANCHE
    // --------------------------------------

    game.round++;

    game.phase = "bidding";

    updateTable();

    if (game.finalRound) {

        setMessage(
            `Manche finale ${game.round}: scegli le carte da offrire.`
        );

        addLog(
            `Inizia la manche finale ${game.round}.`
        );

    } else {

        setMessage(
            `Manche ${game.round}: scegli le carte da offrire.`
        );

        addLog(
            `Inizia la manche ${game.round}.`
        );

    }

    showBidButton();

}


// ==========================================
// RIFORNIMENTO
// ==========================================

function replenishMarket(
    side
) {

    const market =
        game.market[side];


    while (
        market.length < 4 &&
        game.deck.length > 0
    ) {

        const card =
            drawCard();


        if (!card) {

            break;

        }


        market.push(
            card
        );

    }

}


// ==========================================
// CALCOLO PUNTEGGIO
// ==========================================

function calculateScore(
    player
) {

    let score = 0;


    // --------------------------------------
    // MONETE
    // --------------------------------------

    const coins =
        player.hand.filter(
            card =>
                card.type === "coin"
        );


    score +=
        coins.length * 10;


    // --------------------------------------
    // VALUTE
    // --------------------------------------

    for (const currency of CURRENCIES) {

        const cards =
            getCurrencyCards(
                player,
                currency
            );


        if (
            cards.length === 0
        ) {

            continue;

        }


        const value =
            cards.reduce(
                (total, card) =>
                    total + card.value,
                0
            );


        // ----------------------------------
        // SOGLIA 200
        // ----------------------------------

        if (
            value >= 200
        ) {

            score +=
                value;

        } else {

            score +=
                Math.max(
                    0,
                    value - 100
                );

        }


        // ----------------------------------
        // TRIS DI 20
        // ----------------------------------

        const twenties =
            cards.filter(
                card =>
                    card.value === 20
            ).length;


        if (
            twenties === 3
        ) {

            score += 100;

        }


        // ----------------------------------
        // TRIS DI 30
        // ----------------------------------

        const thirties =
            cards.filter(
                card =>
                    card.value === 30
            ).length;


        if (
            thirties === 3
        ) {

            score += 100;

        }

    }


    return score;

}


// ==========================================
// FINE PARTITA
// ==========================================

function finishGame() {

    game.gameOver =
        true;


    game.phase =
        "game-over";


    game.currentPlayerId =
        null;


    // --------------------------------------
    // CALCOLO PUNTEGGI
    // --------------------------------------

    for (const player of game.players) {

        player.score =
            calculateScore(
                player
            );

    }


    const ranking =
        [...game.players].sort(
            (a, b) =>
                b.score - a.score
        );


    const winner =
        ranking[0];


    addLog(
        "Partita terminata."
    );


    for (const player of ranking) {

        addLog(
            `${player.name}: ${player.score} punti.`
        );

    }


    updateTable();


    if (
        winner.id === 1
    ) {

        setMessage(
            `Hai vinto con ${winner.score} punti!`
        );

    } else {

        setMessage(
            `Partita terminata. Vince ${winner.name} con ${winner.score} punti.`
        );

    }


    const actions =
        document.getElementById(
            "actions"
        );


    actions.innerHTML = "";


    // --------------------------------------
    // CLASSIFICA
    // --------------------------------------

    const scoreboard =
        document.createElement(
            "div"
        );


    scoreboard.className =
        "scoreboard";


    for (
        let i = 0;
        i < ranking.length;
        i++
    ) {

        const player =
            ranking[i];


        const line =
            document.createElement(
                "div"
            );


        line.className =
            "score-line";


        const name =
            document.createElement(
                "span"
            );


        name.textContent =
            `${i + 1}. ${player.name}`;


        const score =
            document.createElement(
                "strong"
            );


        score.textContent =
            player.score;


        line.appendChild(
            name
        );


        line.appendChild(
            score
        );


        scoreboard.appendChild(
            line
        );

    }


    actions.appendChild(
        scoreboard
    );


    // --------------------------------------
    // NUOVA PARTITA
    // --------------------------------------

    const restart =
        createActionButton(
            "Nuova partita",
            () => {

                setupGame();

                updateTable();

                setMessage(
                    "Scegli le carte da utilizzare per la tua offerta."
                );

                showBidButton();

            }
        );


    restart.classList.add(
        "primary"
    );


    actions.appendChild(
        restart
    );

}


// ==========================================
// AVVIO
// ==========================================

setupGame();

updateTable();

setMessage(
    "Scegli le carte da utilizzare per la tua offerta."
);

showBidButton();


// ==========================================
// DEBUG
// ==========================================

console.log(
    "Partita inizializzata:"
);

console.log(
    "Valuta rimossa:",
    game.removedCurrency
);

console.log(
    "Carte nel mazzo:",
    game.deck.length
);

console.log(
    "Carte in mano:",
    game.players.map(
        player =>
            player.hand.length
    )
);

console.log(
    "Profili bot:",
    game.players
        .filter(
            player =>
                player.id !== 1
        )
        .map(
            player => ({
                bot:
                    player.name,
                profile:
                    player.botProfile
            })
        )
);
