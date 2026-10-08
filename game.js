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

            hand: [],

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
    // 6 CARTE + PLAY MONEY
    // --------------------------------------

    for (const player of game.players) {

        for (let i = 0; i < 6; i++) {

            const card =
                drawCard();

            if (card) {

                player.hand.push(card);

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
                0

        });

    }


    // --------------------------------------
    // MERCATO
    // Prima destra, poi sinistra
    // --------------------------------------

    game.market.right = [];

    game.market.left = [];


    for (let i = 0; i < 4; i++) {

        const card =
            drawCard();

        if (card) {

            game.market.right.push(card);

        }

    }


    for (let i = 0; i < 4; i++) {

        const card =
            drawCard();

        if (card) {

            game.market.left.push(card);

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
// VALORE STRATEGICO CARTA
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


    // --------------------------------------
    // Interesse alla raccolta
    // --------------------------------------

    value +=
        currentCount * 10;


    // --------------------------------------
    // Superamento soglia 200
    // --------------------------------------

    if (
        currentValue < 200 &&
        currentValue + card.value >= 200
    ) {

        value += 80;

    }


    // --------------------------------------
    // Tripletta 20
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
    // Tripletta 30
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


    // --------------------------------------
    // Nona carta della valuta
    // --------------------------------------

    if (
        currentCount === 8
    ) {

        value += 100;

    }


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
// PERDITA STRATEGICA DELL'OFFERTA
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
// GENERAZIONE SOTTOINSIEMI
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


    // massimo 6 carte:
    // 2^6 - 1 = 63 combinazioni
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


        candidates.push(bid);

    }


    // Passar usando Play Money
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
// STIMA DELLA FORZA DELL'OFFERTA
// ==========================================

function estimateBidStrength(
    bid
) {

    return calculateBidValue(
        bid
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


    // --------------------------------------
    // Analisi degli avversari
    // --------------------------------------

    let strongestOpponentBid = 0;


    for (const opponent of game.players) {

        if (
            opponent.id === player.id
        ) {

            continue;

        }


        const opponentBid =
            opponent.bidValue;


        if (
            opponentBid >
            strongestOpponentBid
        ) {

            strongestOpponentBid =
                opponentBid;

        }

    }


    // --------------------------------------
    // Ogni possibile offerta
    // --------------------------------------

    for (const bid of candidates) {

        const bidValue =
            calculateBidValue(
                bid
            );


        // Play Money = passare
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


            if (
                bidValue === 0
            ) {

                passScore += 2;

            }


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


        // ----------------------------------
        // VALORE DEL MERCATO
        // ----------------------------------

        score +=
            marketValue * 0.75;


        // ----------------------------------
        // COSTO DELLE CARTE SPESSE
        // ----------------------------------

        const bidCost =
            evaluateBidCost(
                player,
                bid
            );


        score -=
            bidCost * 0.38;


        // ----------------------------------
        // PREMIO PER OFFERTA COMPATTA
        // ----------------------------------

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

        if (
            bid.length >= 4
        ) {

            score -=
                (bid.length - 3) * 22;

        }


        // ----------------------------------
        // POSIZIONE NELL'ORDINE
        // ----------------------------------

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


        // ----------------------------------
        // BONUS PER OFFERTE SUFFICIENTEMENTE
        // FORTI SENZA SPRECO
        // ----------------------------------

        if (
            bidValue >= 50 &&
            bidValue <= 100
        ) {

            score += 8;

        }


        // ----------------------------------
        // PREMIO PER CONSERVARE CARTE
        // ----------------------------------

        if (
            bid.length <= 2
        ) {

            score += 7;

        }


        // ----------------------------------
        // EVITA OFFERTE ENORMI
        // ----------------------------------

        if (
            bidValue >= 160
        ) {

            score -= 20;

        }


        // ----------------------------------
        // Piccolo elemento di variabilità
        // ----------------------------------

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
// ORDINE OFFERTE
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


        // ----------------------------------
        // Play Money
        // ----------------------------------

        const realBid =
            selectedCards.filter(
                card =>
                    card.type !==
                    "play-money"
            );


        player.bid =
            realBid;


        player.bidValue =
            calculateBidValue(
                realBid
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
// ESECUZIONE TURNO BOT
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
    // PRENDERE MERCATO A
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
    // PRENDERE MERCATO B
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
    // PRENDERE OFFERTA AVVERSARIA
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


        const targetValue =
            evaluateOpponentBid(
                player,
                opponent
            );


        // Valore extra se sottraiamo
        // una raccolta importante
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


        actions.push({

            type: "steal",

            targetId:
                opponent.id,

            targetValue:
                targetValue +
                disruption

        });

    }


    // --------------------------------------
    // NESSUNO SCAMBIO
    // --------------------------------------

    actions.push({

        type: "pass",

        targetValue: 0

    });


    // --------------------------------------
    // Ordina le azioni
    // --------------------------------------

    actions.sort(
        (a, b) =>
            b.targetValue -
            a.targetValue
    );


    const best =
        actions[0];


    // --------------------------------------
    // Non prendere un lotto se vale meno
    // delle carte che stiamo sacrificando
    // --------------------------------------

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
// ESEGUI AZIONE
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
    // PRENDI A
    // --------------------------------------

    if (
        action.type === "left"
    ) {

        const lot =
            [...game.market.left];


        game.market.left =
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
    // PRENDI B
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


        // L'attaccante prende le carte
        // dell'offerta avversaria.
        player.hand.push(
            ...target.bid
        );


        // L'offerta dell'attaccante
        // passa al bersaglio.
        target.bid =
            [...player.bid];


        target.bidValue =
            calculateBidValue(
                target.bid
            );


        target.resolved = false;


        // L'attaccante ha terminato.
        player.bid = [];

        player.bidValue = 0;

        player.resolved = true;


        // Il bersaglio è il nuovo giocatore
        // attivo.
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
    // A
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
    // B
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
    // OFFERTE AVVERSARIE
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
    // PASSA
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
    // Pulizia offerte
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
    // --------------------------------------

    replenishMarket("right");

    replenishMarket("left");


    // --------------------------------------
    // MAZZO ESAURITO
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

    player.bid =
        player.hand.filter(
            card =>
                player.selectedCards.includes(
                    card.id
                )
        );


    player.bidValue =
        calculateBidValue(
            player.bid.filter(
                card =>
                    card.type !==
                    "play-money"
            )
        );


    player.bidConfirmed =
        true;


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


        const bid =
            chooseBotBid(
                bot
            );


        bot.bid =
            bid.filter(
                card =>
                    card.type !==
                    "play-money"
            );


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
    // OFFERTA UMANA CON PLAY MONEY
    // --------------------------------------

    player.bid =
        player.bid.filter(
            card =>
                card.type !==
                "play-money"
        );


    player.bidValue =
        calculateBidValue(
            player.bid
        );


    player.resolved =
        player.bid.length === 0;


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


    renderPlayers();

    renderHand();

}


// ==========================================
// CREAZIONE CARTA DOM
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
    // RETRO
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
        // STATO
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
        // CARTE
        // ----------------------------------

        const cards =
            document.createElement(
                "div"
            );


        cards.className =
            "cards";


        for (const card of player.hand) {

            const isHuman =
                player.id === 1;


            const selected =
                isHuman &&
                player.selectedCards.includes(
                    card.id
                );


            const hidden =
                !isHuman &&
                game.phase === "bidding";


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
        // PUNTEGGIO
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
                `${player.hand.length} carte`;

        }


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
// UPDATE GENERALE
// ==========================================

function updateTable() {

    renderPlayers();

    renderHand();

    renderMarket();

    renderPlayerBid();

    renderGameInfo();

}


// ==========================================
// PUNTEGGIO
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

            score += value;

        } else {

            score +=
                Math.max(
                    0,
                    value - 100
                );

        }


        // ----------------------------------
        // TRIPLETTA 20
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
        // TRIPLETTA 30
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


        // ----------------------------------
        // TUTTA LA VALUTA
        // ----------------------------------

        if (
            cards.length === 9
        ) {

            score += 500;

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


    for (const player of game.players) {

        player.score =
            calculateScore(
                player
            );

    }


    updateTable();


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
