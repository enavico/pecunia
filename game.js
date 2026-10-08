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

    resolutionQueue: []

};


// ==========================================
// CREAZIONE GIOCATORI
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

            // Carte effettivamente possedute
            // dal giocatore.
            hand: [],

            // Carte attualmente offerte.
            bid: [],

            bidValue: 0,

            selectedCards: [],

            bidConfirmed: false,

            resolved: false,

            score: 0

        });

    }

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
// SETUP
// ==========================================

function setupGame() {

    game.round = 1;

    game.phase = "bidding";

    game.currentPlayerId = null;

    game.gameOver = false;

    game.finalRound = false;

    game.resolutionQueue = [];


    // --------------------------------------
    // CREAZIONE E MESCOLAMENTO DEL MAZZO
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
    // 6 CARTE + PLAY MONEY
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


        // Play Money:
        // non fa parte del mazzo.
        player.hand.push({

            id:
                `play-${player.id}`,

            type:
                "play-money",

            currency:
                null,

            value:
                0

        });

    }


    // --------------------------------------
    // MERCATO INIZIALE
    // Prima destra, poi sinistra.
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

}


// ==========================================
// UTILITÀ
// ==========================================

function getPlayerById(id) {

    return game.players.find(
        player =>
            player.id === id
    );

}


function calculateBidValue(cards) {

    return cards.reduce(
        (total, card) =>
            total + card.value,
        0
    );

}


function getLowestSerial(cards) {

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


    if (serials.length === 0) {

        return Infinity;

    }


    return Math.min(
        ...serials
    );

}


// ==========================================
// INFORMAZIONI SUL PATRIMONIO
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


function hasCompleteCurrency(
    player,
    currency
) {

    return getCurrencyCards(
        player,
        currency
    ).length === 9;

}


// ==========================================
// VALORE STRATEGICO DI UNA CARTA
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

        return 10;

    }


    const cards =
        getCurrencyCards(
            player,
            card.currency
        );


    const currentValue =
        cards.reduce(
            (total, c) =>
                total + c.value,
            0
        );


    const currentCount =
        cards.length;


    let value =
        card.value;


    // Più carte della stessa valuta
    // possiede già il giocatore,
    // più questa carta è interessante.

    value +=
        currentCount * 10;


    // Superamento della soglia di 200.

    if (
        currentValue < 200 &&
        currentValue + card.value >= 200
    ) {

        value += 80;

    }


    // --------------------------------------
    // TRIS DI 20
    // --------------------------------------

    const twenties =
        countValueCards(
            player,
            card.currency,
            20
        );


    if (
        card.value === 20 &&
        twenties === 2
    ) {

        value += 90;

    }


    // --------------------------------------
    // TRIS DI 30
    // --------------------------------------

    const thirties =
        countValueCards(
            player,
            card.currency,
            30
        );


    if (
        card.value === 30 &&
        thirties === 2
    ) {

        value += 90;

    }


    // Nessun bonus aggiuntivo per la
    // nona carta della valuta.

    return value;

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


    let value = 0;


    for (const card of lot) {

        value +=
            cardStrategicValue(
                player,
                card
            );

    }


    return value;

}


// ==========================================
// VALORE DELL'OFFERTA AVVERSARIA
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


    let value = 0;


    for (const card of opponent.bid) {

        value +=
            cardStrategicValue(
                player,
                card
            );

    }


    return value;

}


// ==========================================
// COSTO STRATEGICO DELL'OFFERTA
// ==========================================

function evaluateBidCost(
    player,
    bid
) {

    let cost = 0;


    for (const card of bid) {

        cost +=
            cardStrategicValue(
                player,
                card
            );

    }


    return cost;

}


// ==========================================
// GENERAZIONE OFFERTE BOT
// ==========================================

function generateBidCandidates(
    player
) {

    const cards =
        player.hand.filter(
            card =>
                card.type !==
                "play-money"
        );


    const candidates = [];


    const total =
        cards.length;


    // Con 6 carte al massimo:
    // 2^6 - 1 = 63 combinazioni.

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
                    cards[i]
                );

            }

        }


        candidates.push(
            bid
        );

    }


    // Play Money = nessuna offerta reale.

    const playMoney =
        player.hand.find(
            card =>
                card.type ===
                "play-money"
        );


    if (playMoney) {

        candidates.push([
            playMoney
        ]);

    }


    return candidates;

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


    const leftValue =
        evaluateLot(
            player,
            game.market.left
        );


    const rightValue =
        evaluateLot(
            player,
            game.market.right
        );


    const marketValue =
        Math.max(
            leftValue,
            rightValue
        );


    let bestBid =
        null;

    let bestScore =
        -Infinity;


    let strongestOpponentBid = 0;


    for (const opponent of game.players) {

        if (
            opponent.id === player.id
        ) {

            continue;

        }


        if (
            opponent.bidValue >
            strongestOpponentBid
        ) {

            strongestOpponentBid =
                opponent.bidValue;

        }

    }


    for (const bid of candidates) {

        const bidValue =
            calculateBidValue(
                bid
            );


        // ----------------------------------
        // PLAY MONEY
        // ----------------------------------

        if (
            bid.length === 1 &&
            bid[0].type === "play-money"
        ) {

            let passScore = 0;


            passScore +=
                marketValue * 0.18;


            if (
                marketValue < 55
            ) {

                passScore += 15;

            }


            passScore +=
                Math.random() * 3;


            if (
                passScore >
                bestScore
            ) {

                bestScore =
                    passScore;

                bestBid =
                    bid;

            }


            continue;

        }


        let score = 0;


        // Valore del mercato.

        score +=
            marketValue * 0.75;


        // Costo delle carte sacrificate.

        const bidCost =
            evaluateBidCost(
                player,
                bid
            );


        score -=
            bidCost * 0.38;


        // Offerte brevi preferite.

        if (
            bid.length === 1
        ) {

            score += 14;

        }


        if (
            bid.length === 2
        ) {

            score += 10;

        }


        // Offerte molto grandi
        // diventano progressivamente costose.

        if (
            bid.length >= 4
        ) {

            score -=
                (bid.length - 3) * 22;

        }


        // Essere sufficientemente forti
        // per ottenere il primo turno.

        if (
            bidValue >= marketValue
        ) {

            score += 15;

        }


        if (
            bidValue >= strongestOpponentBid
        ) {

            score += 12;

        }


        // Fascia di offerta efficiente.

        if (
            bidValue >= 50 &&
            bidValue <= 100
        ) {

            score += 8;

        }


        // Offerte eccessive.

        if (
            bidValue >= 160
        ) {

            score -= 20;

        }


        // Piccola variabilità per evitare
        // comportamenti sempre identici.

        score +=
            Math.random() * 3;


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
// ORDINE DELLE OFFERTE
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
// RIVELAZIONE OFFERTE
// ==========================================

function revealBids() {

    for (const player of game.players) {

        const selectedIds =
            player.selectedCards;


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


        // Le carte dell'offerta vengono
        // tolte dalla mano e messe nell'area
        // bid del giocatore.

        player.bid =
            realBid;


        player.bidValue =
            calculateBidValue(
                realBid
            );


        player.hand =
            player.hand.filter(
                card =>
                    !selectedIds.includes(
                        card.id
                    )
            );


        player.bidConfirmed =
            true;


        player.resolved =
            realBid.length === 0;

    }

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
// BOT: RISOLUZIONE TURNO
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
// BOT: SCELTA AZIONE
// ==========================================

function chooseBotAction(
    player
) {

    const actions = [];


    // --------------------------------------
    // PRENDI OFFERTA A
    // --------------------------------------

    if (
        game.market.left.length > 0
    ) {

        actions.push({

            type: "left",

            targetValue:
                evaluateLot(
                    player,
                    game.market.left
                )

        });

    }


    // --------------------------------------
    // PRENDI OFFERTA B
    // --------------------------------------

    if (
        game.market.right.length > 0
    ) {

        actions.push({

            type: "right",

            targetValue:
                evaluateLot(
                    player,
                    game.market.right
                )

        });

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


        let disruption = 0;


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
                opponentCards.length >= 5
            ) {

                disruption += 25;

            }

        }


        targetValue +=
            disruption;


        actions.push({

            type: "steal",

            targetId:
                opponent.id,

            targetValue:
                targetValue

        });

    }


    // --------------------------------------
    // NESSUNO SCAMBIO
    // --------------------------------------

    actions.push({

        type: "pass",

        targetValue: 0

    });


    actions.sort(
        (a, b) =>
            b.targetValue -
            a.targetValue
    );


    const best =
        actions[0];


    const bidCost =
        evaluateBidCost(
            player,
            player.bid
        );


    if (
        best.type !== "pass" &&
        best.targetValue <
        bidCost * 0.45
    ) {

        return {

            type: "pass"

        };

    }


    return best;

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
    // NESSUNO SCAMBIO
    // --------------------------------------

    if (
        action.type === "pass"
    ) {

        // L'offerta torna nella mano.

        player.hand.push(
            ...player.bid
        );


        player.bid = [];

        player.bidValue = 0;

        player.resolved = true;


        updateTable();

        continueResolution();

        return;

    }


    // --------------------------------------
    // PRENDI OFFERTA A
    // --------------------------------------

    if (
        action.type === "left"
    ) {

        const lot =
            [...game.market.left];


        // La propria offerta sostituisce
        // il lotto sul tavolo.

        game.market.left =
            [...player.bid];


        // Il giocatore prende il lotto.

        player.hand.push(
            ...lot
        );


        player.bid = [];

        player.bidValue = 0;

        player.resolved = true;


        updateTable();

        continueResolution();

        return;

    }


    // --------------------------------------
    // PRENDI OFFERTA B
    // --------------------------------------

    if (
        action.type === "right"
    ) {

        const lot =
            [...game.market.right];


        game.market.right =
            [...player.bid];


        player.hand.push(
            ...lot
        );


        player.bid = [];

        player.bidValue = 0;

        player.resolved = true;


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


        // ----------------------------------
        // Il giocatore prende l'offerta
        // dell'avversario.
        // ----------------------------------

        const targetBid =
            [...target.bid];


        player.hand.push(
            ...targetBid
        );


        // ----------------------------------
        // La propria offerta passa al
        // giocatore bersaglio.
        // ----------------------------------

        target.bid =
            [...player.bid];


        target.bidValue =
            calculateBidValue(
                target.bid
            );


        target.resolved =
            false;


        // ----------------------------------
        // L'attaccante ha terminato.
        // ----------------------------------

        player.bid = [];

        player.bidValue = 0;

        player.resolved = true;


        // ----------------------------------
        // Il bersaglio diventa attivo.
        // ----------------------------------

        game.currentPlayerId =
            target.id;


        updateTable();


        setMessage(
            `${target.name} deve ora scegliere cosa fare con la nuova offerta.`
        );


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
                550
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
            600
        );

    }

}


// ==========================================
// AZIONI DEL GIOCATORE
// ==========================================

function showPlayerActions(
    player
) {

    const actions =
        document.getElementById(
            "actions"
        );


    actions.innerHTML = "";


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
// FINE MANO
// ==========================================

function finishRound() {

    game.phase =
        "round-end";


    game.currentPlayerId =
        null;


    // --------------------------------------
    // RESET DELLE OFFERTE
    // --------------------------------------

    for (const player of game.players) {

        player.bid = [];

        player.bidValue = 0;

        player.selectedCards = [];

        player.bidConfirmed = false;

        player.resolved = false;

    }


    // --------------------------------------
    // RIFORNIMENTO
    // PRIMA B, POI A
    // --------------------------------------

    replenishMarket(
        "right"
    );

    replenishMarket(
        "left"
    );


    // --------------------------------------
    // FINE MAZZO
    // --------------------------------------

    if (
        game.deck.length === 0
    ) {

        game.finalRound = true;

        finishGame();

        return;

    }


    // --------------------------------------
    // NUOVA MANO
    // --------------------------------------

    game.round++;

    game.phase =
        "bidding";


    updateTable();


    setMessage(
        `Manche ${game.round}: scegli le carte da offrire.`
    );


    showBidButton();

}


// ==========================================
// RIFORNIMENTO MERCATO
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


    // --------------------------------------
    // DEVE ESSERE SELEZIONATA ALMENO
    // UNA CARTA
    // --------------------------------------

    if (
        player.selectedCards.length === 0
    ) {

        setMessage(
            "Devi selezionare almeno una carta."
        );

        return;

    }


    // --------------------------------------
    // PRENDI LE CARTE SELEZIONATE
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


    // --------------------------------------
    // PLAY MONEY NON È UNA VERA OFFERTA
    // --------------------------------------

    const realBid =
        selectedCards.filter(
            card =>
                card.type !==
                "play-money"
        );


    // --------------------------------------
    // LE CARTE OFFERTE ESCONO DALLA MANO
    // --------------------------------------

    player.hand =
        player.hand.filter(
            card =>
                !selectedIds.includes(
                    card.id
                )
        );


    // --------------------------------------
    // SALVA L'OFFERTA
    // --------------------------------------

    player.bid =
        realBid;


    player.bidValue =
        calculateBidValue(
            player.bid
        );


    player.bidConfirmed =
        true;


    player.resolved =
        player.bid.length === 0;


    // --------------------------------------
    // BOT
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


        // ----------------------------------
        // PLAY MONEY = PASS
        // ----------------------------------

        const realBotBid =
            chosenBid.filter(
                card =>
                    card.type !==
                    "play-money"
            );


        const bidIds =
            realBotBid.map(
                card =>
                    card.id
            );


        // ----------------------------------
        // LE CARTE OFFERTE ESCONO
        // DALLA MANO DEL BOT
        // ----------------------------------

        bot.hand =
            bot.hand.filter(
                card =>
                    !bidIds.includes(
                        card.id
                    )
            );


        bot.bid =
            realBotBid;


        bot.bidValue =
            calculateBidValue(
                bot.bid
            );


        bot.bidConfirmed =
            true;


        bot.resolved =
            bot.bid.length === 0;

    }


    // --------------------------------------
    // PREPARAZIONE RISOLUZIONE
    // --------------------------------------

    prepareResolution();


    game.phase =
        "resolution";


    game.currentPlayerId =
        null;


    updateTable();


    // --------------------------------------
    // PRIMO GIOCATORE
    // --------------------------------------

    const first =
        getNextPlayer();


    if (!first) {

        finishRound();

        return;

    }


    game.currentPlayerId =
        first.id;


    updateTable();


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
            600
        );

    }

}


// ==========================================
// PULSANTE CONFERMA OFFERTA
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
// CREAZIONE ELEMENTO CARTA
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
    // PLAY MONEY
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
// RENDER DI UN'OFFERTA
// ==========================================

function renderBid(
    container,
    player,
    hidden = false
) {

    container.innerHTML = "";


    if (
        !player ||
        player.bid.length === 0
    ) {

        return;

    }


    for (const card of player.bid) {

        container.appendChild(
            createCardElement(
                card,
                {
                    hidden: hidden
                }
            )
        );

    }

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


        // ----------------------------------
        // CARTE IN MANO
        // ----------------------------------

        const cards =
            document.createElement(
                "div"
            );


        cards.className =
            "cards";


        const isHuman =
            player.id === 1;


        for (const card of player.hand) {

            const selected =
                isHuman &&
                player.selectedCards.includes(
                    card.id
                );


            // Le carte dei bot sono sempre
            // nascoste, non solo durante
            // la fase di offerta.

            const hidden =
                !isHuman;


            const cardElement =
                createCardElement(
                    card,
                    {

                        clickable:
                            isHuman &&
                            game.phase === "bidding" &&
                            !player.bidConfirmed,

                        selected:
                            selected,

                        hidden:
                            hidden

                    }
                );


            if (
                isHuman &&
                game.phase === "bidding" &&
                !player.bidConfirmed
            ) {

                cardElement.addEventListener(
                    "click",
                    () => {

                        toggleCardSelection(
                            player,
                            card
                        );

                    }
                );

            }


            cards.appendChild(
                cardElement
            );

        }


        // ----------------------------------
        // ETICHETTA OFFERTA
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


            bidLabel.textContent =
                `Offerta giocata (${player.bidValue})`;


            playerElement.appendChild(
                name
            );

            playerElement.appendChild(
                status
            );

            playerElement.appendChild(
                cards
            );

            playerElement.appendChild(
                bidLabel
            );


            // ----------------------------------
            // OFFERTA DEL BOT
            // ----------------------------------
            //
            // Mostriamo le carte scoperte.
            // ----------------------------------

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

        } else {

            playerElement.appendChild(
                name
            );

            playerElement.appendChild(
                status
            );

            playerElement.appendChild(
                cards
            );

        }


        // ----------------------------------
        // NUMERO DI CARTE / PUNTEGGIO
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


    // Le carte dell'offerta non sono più
    // nella hand, quindi qui vediamo
    // esclusivamente le carte realmente
    // ancora possedute.

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
// RENDER OFFERTA DEL GIOCATORE
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
// AGGIORNAMENTO GENERALE
// ==========================================

function updateTable() {

    renderPlayers();

    renderHand();

    renderMarket();

    renderPlayerBid();

    renderGameInfo();

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


        // 200 o più:
        // valore pieno.

        if (
            value >= 200
        ) {

            score +=
                value;

        } else {

            // Meno di 200:
            // valore -100, minimo 0.

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


        // Nessun bonus aggiuntivo per
        // il completamento delle 9 carte.

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


    updateTable();


    // --------------------------------------
    // CLASSIFICA
    // --------------------------------------

    const ranking =
        [...game.players].sort(
            (a, b) =>
                b.score -
                a.score
        );


    const winner =
        ranking[0];


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
