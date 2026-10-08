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

    // 7 valute x 9 banconote
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
// GIOCO
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

    pendingPlayers: [],

    currentPlayerId: null,

    finalRound: false,

    gameOver: false

};


// ==========================================
// CREAZIONE GIOCATORI
// ==========================================

function createPlayers() {

    const players = [];

    for (let i = 0; i < NUMBER_OF_PLAYERS; i++) {

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

    if (game.deck.length === 0) {

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

    game.finalRound = false;

    game.gameOver = false;

    game.pendingPlayers = [];

    game.currentPlayerId = null;


    // --------------------------------------
    // Creazione del mazzo completo
    // --------------------------------------

    let fullDeck =
        shuffle(
            createDeck()
        );


    // --------------------------------------
    // A 4 giocatori viene rimossa
    // una valuta completa.
    //
    // La rimozione è casuale.
    // --------------------------------------

    const currencyToRemove =
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
                currencyToRemove
        );


    game.deck =
        fullDeck;


    // --------------------------------------
    // Giocatori
    // --------------------------------------

    game.players =
        createPlayers();


    // --------------------------------------
    // Distribuzione
    // --------------------------------------

    for (const player of game.players) {

        for (let i = 0; i < 6; i++) {

            const card =
                drawCard();

            if (card) {

                player.hand.push(card);

            }

        }


        // Play Money
        player.hand.push({

            id: `play-${player.id}`,

            type: "play-money",

            currency: null,

            value: 0

        });

    }


    // --------------------------------------
    // Mercato iniziale
    // --------------------------------------

    game.market.left = [];

    game.market.right = [];


    for (let i = 0; i < 4; i++) {

        game.market.right.push(
            drawCard()
        );

    }


    for (let i = 0; i < 4; i++) {

        game.market.left.push(
            drawCard()
        );

    }

}


// ==========================================
// UTILITÀ
// ==========================================

function calculateBidValue(cards) {

    return cards.reduce(
        (total, card) =>
            total + card.value,
        0
    );

}


function getPlayerById(id) {

    return game.players.find(
        player =>
            player.id === id
    );

}


function getCardById(player, id) {

    return player.hand.find(
        card =>
            card.id === id
    );

}


function getLowestSerial(cards) {

    if (cards.length === 0) {

        return Infinity;

    }

    return Math.min(
        ...cards.map(
            card => card.id
        )
    );

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
            document.createElement("div");

        playerElement.className =
            "player";


        const nameElement =
            document.createElement("div");

        nameElement.className =
            "player-name";

        nameElement.textContent =
            player.name;


        const cardsElement =
            document.createElement("div");

        cardsElement.className =
            "cards";


        for (const card of player.hand) {

            const cardElement =
                document.createElement("div");

            cardElement.className =
                "card";


            // ----------------------------------
            // GIOCATORE UMANO
            // ----------------------------------

            if (player.id === 1) {

                cardElement.textContent =
                    card.value;


                if (
                    player.selectedCards.includes(
                        card.id
                    )
                ) {

                    cardElement.classList.add(
                        "selected"
                    );

                }


                if (
                    game.phase === "bidding" &&
                    !player.bidConfirmed
                ) {

                    cardElement.addEventListener(
                        "click",
                        function () {

                            toggleCardSelection(
                                player,
                                card,
                                cardElement
                            );

                        }
                    );

                }

            }


            // ----------------------------------
            // BOT
            // ----------------------------------

            else {

                const isInBid =
                    player.bid.some(
                        bidCard =>
                            bidCard.id ===
                            card.id
                    );


                if (
                    game.phase !== "bidding" &&
                    isInBid
                ) {

                    cardElement.textContent =
                        card.value;

                    cardElement.classList.add(
                        "selected"
                    );

                } else {

                    cardElement.textContent =
                        "?";

                }

            }


            cardsElement.appendChild(
                cardElement
            );

        }


        playerElement.appendChild(
            nameElement
        );

        playerElement.appendChild(
            cardsElement
        );

        container.appendChild(
            playerElement
        );

    }

}


// ==========================================
// SELEZIONE CARTE GIOCATORE
// ==========================================

function toggleCardSelection(
    player,
    card,
    cardElement
) {

    if (
        player.bidConfirmed ||
        game.phase !== "bidding"
    ) {

        return;

    }


    const index =
        player.selectedCards.indexOf(
            card.id
        );


    if (index === -1) {

        player.selectedCards.push(
            card.id
        );

        cardElement.classList.add(
            "selected"
        );

    } else {

        player.selectedCards.splice(
            index,
            1
        );

        cardElement.classList.remove(
            "selected"
        );

    }

}


// ==========================================
// RENDER MERCATO
// ==========================================

function renderMarket() {

    const leftMarket =
        document.getElementById(
            "market-left"
        );

    const rightMarket =
        document.getElementById(
            "market-right"
        );


    leftMarket.innerHTML = "";

    rightMarket.innerHTML = "";


    // --------------------------------------
    // SINISTRA
    // --------------------------------------

    for (const card of game.market.left) {

        const cardElement =
            document.createElement("div");

        cardElement.className =
            "card";

        cardElement.textContent =
            card.value;

        leftMarket.appendChild(
            cardElement
        );

    }


    // --------------------------------------
    // DESTRA
    // --------------------------------------

    for (const card of game.market.right) {

        const cardElement =
            document.createElement("div");

        cardElement.className =
            "card";

        cardElement.textContent =
            card.value;

        rightMarket.appendChild(
            cardElement
        );

    }

}


// ==========================================
// MESSAGGIO
// ==========================================

function setMessage(text) {

    const message =
        document.querySelector(
            ".message"
        );

    if (!message) {

        return;

    }


    const bidContainer =
        document.getElementById(
            "player-bid"
        );


    message.innerHTML = "";

    const textElement =
        document.createElement("div");

    textElement.textContent =
        text;

    message.appendChild(
        textElement
    );


    if (bidContainer) {

        message.appendChild(
            bidContainer
        );

    }

}


// ==========================================
// BOT: VALORE STRATEGICO DI UNA CARTA
// ==========================================

function cardStrategicValue(
    player,
    card
) {

    if (card.type === "play-money") {

        return 0;

    }


    if (card.type === "coin") {

        return 10;

    }


    const sameCurrency =
        player.hand.filter(
            c =>
                c.type === "money" &&
                c.currency === card.currency
        );


    let value =
        card.value;


    // Più carte della stessa valuta
    // rendono la carta più interessante.
    value +=
        sameCurrency.length * 12;


    // Cerca di completare le triplette.
    const twenties =
        sameCurrency.filter(
            c =>
                c.value === 20
        ).length;

    const thirties =
        sameCurrency.filter(
            c =>
                c.value === 30
        ).length;


    if (
        card.value === 20 &&
        twenties >= 2
    ) {

        value += 70;

    }


    if (
        card.value === 30 &&
        thirties >= 2
    ) {

        value += 70;

    }


    return value;

}


// ==========================================
// BOT: VALORE DI UN LOTTO
// ==========================================

function evaluateLot(
    player,
    lot
) {

    if (!lot || lot.length === 0) {

        return -Infinity;

    }


    let score = 0;


    for (const card of lot) {

        score +=
            cardStrategicValue(
                player,
                card
            );

    }


    return score;

}


// ==========================================
// BOT: VALORE DI UNA OFFERTA AVVERSARIA
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


    let score = 0;


    for (const card of opponent.bid) {

        score +=
            cardStrategicValue(
                player,
                card
            );

    }


    return score;

}


// ==========================================
// BOT: GENERAZIONE SOTTOINSIEMI
// ==========================================

function generateBidCandidates(
    player
) {

    const cards =
        player.hand.filter(
            card =>
                card.type !== "play-money"
        );


    const candidates = [];


    // Offerta vuota non consentita:
    // un bot che non vuole partecipare
    // userà la Play Money.


    const total =
        cards.length;


    // La mano è piccola: al massimo 6 carte
    // normali, quindi possiamo esaminare
    // tutti i sottoinsiemi.

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


    return candidates;

}


// ==========================================
// BOT: SCELTA DELL'OFFERTA
// ==========================================

function chooseBotBid(player) {

    const candidates =
        generateBidCandidates(
            player
        );


    const lots = [
        game.market.left,
        game.market.right
    ];


    let bestBid = null;

    let bestScore = -Infinity;


    for (const bid of candidates) {

        const bidValue =
            calculateBidValue(
                bid
            );


        // ----------------------------------
        // Valore dell'offerta
        // ----------------------------------

        let score = 0;


        // Penalità per spendere carte
        // strategicamente importanti.
        for (const card of bid) {

            score -=
                cardStrategicValue(
                    player,
                    card
                ) * 0.45;

        }


        // ----------------------------------
        // Valore del mercato
        // ----------------------------------

        const bestLot =
            Math.max(
                ...lots.map(
                    lot =>
                        evaluateLot(
                            player,
                            lot
                        )
                )
            );


        score +=
            bestLot * 0.8;


        // ----------------------------------
        // Probabilità di essere competitivo
        // ----------------------------------

        if (bidValue >= 50) {

            score += 10;

        }

        if (bidValue >= 80) {

            score += 15;

        }

        if (bidValue >= 120) {

            score += 10;

        }


        // Offerte enormi vengono penalizzate:
        // non vogliamo più il comportamento
        // "gioco tutta la mano".

        if (bid.length >= 4) {

            score -=
                (bid.length - 3) *
                25;

        }


        // ----------------------------------
        // Bonus per offerte compatte
        // ----------------------------------

        if (bid.length === 1) {

            score += 8;

        }

        if (bid.length === 2) {

            score += 12;

        }


        // ----------------------------------
        // Una carta 0 da sola significa
        // non partecipare.
        // ----------------------------------

        if (bidValue === 0) {

            score -= 10;

        }


        if (score > bestScore) {

            bestScore =
                score;

            bestBid =
                bid;

        }

    }


    // --------------------------------------
    // Possibilità di passare
    // --------------------------------------

    // Se il mercato non è particolarmente
    // interessante, il bot può passare.

    const bestLotValue =
        Math.max(
            evaluateLot(
                player,
                game.market.left
            ),
            evaluateLot(
                player,
                game.market.right
            )
        );


    if (
        bestLotValue < 45 &&
        Math.random() < 0.25
    ) {

        const playMoney =
            player.hand.find(
                card =>
                    card.type ===
                    "play-money"
            );


        if (playMoney) {

            return [playMoney];

        }

    }


    return bestBid || [];

}


// ==========================================
// BOT: VALUTA AZIONE
// ==========================================

function chooseBotAction(
    player
) {

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


    let bestAction = {
        type: "pass",
        score: 0
    };


    // --------------------------------------
    // Mercato sinistro
    // --------------------------------------

    if (
        leftValue >
        bestAction.score
    ) {

        bestAction = {

            type: "left",

            score:
                leftValue

        };

    }


    // --------------------------------------
    // Mercato destro
    // --------------------------------------

    if (
        rightValue >
        bestAction.score
    ) {

        bestAction = {

            type: "right",

            score:
                rightValue

        };

    }


    // --------------------------------------
    // Rubare una offerta
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


        const value =
            evaluateOpponentBid(
                player,
                opponent
            );


        if (
            value >
            bestAction.score + 15
        ) {

            bestAction = {

                type: "steal",

                targetId:
                    opponent.id,

                score:
                    value

            };

        }

    }


    return bestAction;

}


// ==========================================
// RIVELA OFFERTE
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
        // Play Money torna in mano
        // ----------------------------------

        const bluffCards =
            selectedCards.filter(
                card =>
                    card.type ===
                    "play-money"
            );


        const realBid =
            selectedCards.filter(
                card =>
                    card.type !==
                    "play-money"
            );


        // La Play Money rimane sempre
        // nella mano del giocatore.
        for (const bluff of bluffCards) {

            if (
                !player.hand.some(
                    card =>
                        card.id ===
                        bluff.id
                )
            ) {

                player.hand.push(
                    bluff
                );

            }

        }


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
// ORDINE DELLE OFFERTE
// ==========================================

function determineBidOrder() {

    const activePlayers =
        game.players.filter(
            player =>
                player.bid.length > 0
        );


    activePlayers.sort(
        (a, b) => {

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
                getLowestSerial(
                    a.bid
                ) -
                getLowestSerial(
                    b.bid
                )
            );

        }
    );


    game.pendingPlayers =
        activePlayers.map(
            player =>
                player.id
        );

}


// ==========================================
// SCEGLI IL PROSSIMO GIOCATORE
// ==========================================

function getNextPendingPlayer() {

    const candidates =
        game.players.filter(
            player =>
                !player.resolved &&
                player.bid.length > 0
        );


    if (candidates.length === 0) {

        return null;

    }


    candidates.sort(
        (a, b) => {

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
                getLowestSerial(
                    a.bid
                ) -
                getLowestSerial(
                    b.bid
                )
            );

        }
    );


    return candidates[0];

}


// ==========================================
// BOT: ESEGUE IL TURNO
// ==========================================

function resolveBotTurn(
    player
) {

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
// ESEGUI AZIONE
// ==========================================

function executeAction(
    player,
    action
) {

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
    // PRENDI LOTTO SINISTRO
    // --------------------------------------

    if (
        action.type === "left"
    ) {

        const lot =
            game.market.left;


        player.hand.push(
            ...lot
        );


        game.market.left =
            player.bid;


        player.bid = [];

        player.bidValue = 0;

        player.resolved = true;


        updateTable();

        continueResolution();

        return;

    }


    // --------------------------------------
    // PRENDI LOTTO DESTRO
    // --------------------------------------

    if (
        action.type === "right"
    ) {

        const lot =
            game.market.right;


        player.hand.push(
            ...lot
        );


        game.market.right =
            player.bid;


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

            // Se il bersaglio non è più
            // disponibile, passa.
            executeAction(
                player,
                {
                    type: "pass"
                }
            );

            return;

        }


        // Il giocatore prende l'offerta
        // dell'avversario.
        player.hand.push(
            ...target.bid
        );


        // La sua offerta sostituisce
        // quella del bersaglio.
        target.bid =
            player.bid;


        target.bidValue =
            calculateBidValue(
                target.bid
            );


        target.resolved =
            false;


        // Il giocatore che ha effettuato
        // lo scambio ha terminato il suo turno.
        player.bid = [];

        player.bidValue = 0;

        player.resolved = true;


        // Il bersaglio diventa il prossimo
        // giocatore da risolvere.
        game.currentPlayerId =
            target.id;


        updateTable();


        setMessage(
            `${target.name} è ora il giocatore attivo.`
        );


        // Se è un bot, continua automaticamente.
        if (
            target.id !== 1
        ) {

            setTimeout(
                () => {

                    resolveBotTurn(
                        target
                    );

                },
                500
            );

        } else {

            showPlayerActions(
                target
            );

        }

        return;

    }

}


// ==========================================
// CONTINUA LA RISOLUZIONE
// ==========================================

function continueResolution() {

    const next =
        getNextPendingPlayer();


    if (!next) {

        finishRound();

        return;

    }


    game.currentPlayerId =
        next.id;


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
            500
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
        document.querySelector(
            ".actions"
        );


    actions.innerHTML = "";


    setMessage(
        "È il tuo turno: scegli cosa fare con la tua offerta."
    );


    // --------------------------------------
    // PRENDI LOTTO SINISTRO
    // --------------------------------------

    if (
        game.market.left.length > 0
    ) {

        const leftButton =
            document.createElement(
                "button"
            );

        leftButton.textContent =
            "Prendi offerta A";

        leftButton.addEventListener(
            "click",
            function () {

                executeAction(
                    player,
                    {
                        type: "left"
                    }
                );

            }
        );

        actions.appendChild(
            leftButton
        );

    }


    // --------------------------------------
    // PRENDI LOTTO DESTRO
    // --------------------------------------

    if (
        game.market.right.length > 0
    ) {

        const rightButton =
            document.createElement(
                "button"
            );

        rightButton.textContent =
            "Prendi offerta B";

        rightButton.addEventListener(
            "click",
            function () {

                executeAction(
                    player,
                    {
                        type: "right"
                    }
                );

            }
        );

        actions.appendChild(
            rightButton
        );

    }


    // --------------------------------------
    // RUBA OFFERTA
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
            document.createElement(
                "button"
            );

        button.textContent =
            `Prendi offerta di ${opponent.name}`;


        button.addEventListener(
            "click",
            function () {

                executeAction(
                    player,
                    {
                        type: "steal",

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
        document.createElement(
            "button"
        );

    passButton.textContent =
        "Nessuno scambio";


    passButton.addEventListener(
        "click",
        function () {

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
// FINE DELLA MANCHÉ
// ==========================================

function finishRound() {

    game.phase =
        "round-end";


    // --------------------------------------
    // Elimina le offerte residue
    // --------------------------------------

    for (const player of game.players) {

        player.bid = [];

        player.bidValue = 0;

        player.selectedCards = [];

        player.bidConfirmed = false;

        player.resolved = false;

    }


    game.currentPlayerId =
        null;


    // --------------------------------------
    // Rifornimento
    //
    // Prima destra, poi sinistra.
    // --------------------------------------

    replenishMarket(
        "right"
    );

    replenishMarket(
        "left"
    );


    // --------------------------------------
    // Se il mazzo è esaurito, la manche
    // appena conclusa era quella finale.
    // --------------------------------------

    if (
        game.deck.length === 0
    ) {

        game.finalRound =
            true;

        game.phase =
            "game-over";

        finishGame();

        return;

    }


    // --------------------------------------
    // Nuova manche
    // --------------------------------------

    game.round++;

    game.phase =
        "bidding";


    for (const player of game.players) {

        player.selectedCards = [];

        player.bidConfirmed = false;

    }


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
// FINE PARTITA
// ==========================================

function finishGame() {

    game.gameOver =
        true;


    game.phase =
        "game-over";


    for (const player of game.players) {

        player.score =
            calculateScore(
                player
            );

    }


    renderPlayers();

    renderMarket();


    const ranking =
        [...game.players].sort(
            (a, b) =>
                b.score -
                a.score
        );


    const winner =
        ranking[0];


    let result =
        `Partita terminata. Vince ${winner.name} con ${winner.score} punti.`;


    if (
        winner.id === 1
    ) {

        result =
            `Hai vinto! Il tuo punteggio è ${winner.score}.`;

    }


    setMessage(
        result
    );


    const actions =
        document.querySelector(
            ".actions"
        );


    actions.innerHTML = "";


    // --------------------------------------
    // Classifica
    // --------------------------------------

    const scoreboard =
        document.createElement(
            "div"
        );

    scoreboard.style.marginTop =
        "15px";


    for (const player of ranking) {

        const line =
            document.createElement(
                "div"
            );

        line.textContent =
            `${player.name}: ${player.score} punti`;

        scoreboard.appendChild(
            line
        );

    }


    actions.appendChild(
        scoreboard
    );

}


// ==========================================
// CALCOLO PUNTEGGIO
// ==========================================

function calculateScore(
    player
) {

    let score = 0;


    // --------------------------------------
    // Monete
    // --------------------------------------

    const coins =
        player.hand.filter(
            card =>
                card.type === "coin"
        );


    score +=
        coins.length * 10;


    // --------------------------------------
    // Valute
    // --------------------------------------

    for (const currency of CURRENCIES) {

        const cards =
            player.hand.filter(
                card =>
                    card.type === "money" &&
                    card.currency === currency
            );


        if (cards.length === 0) {

            continue;

        }


        const value =
            cards.reduce(
                (total, card) =>
                    total + card.value,
                0
            );


        // ----------------------------------
        // Valore della valuta
        // ----------------------------------

        if (value >= 200) {

            score += value;

        } else {

            score +=
                Math.max(
                    0,
                    value - 100
                );

        }


        // ----------------------------------
        // Triplette
        // ----------------------------------

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


        if (twenties === 3) {

            score += 100;

        }


        if (thirties === 3) {

            score += 100;

        }

    }


    return score;

}


// ==========================================
// VISUALIZZAZIONE STATO
// ==========================================

function updateTable() {

    renderPlayers();

    renderMarket();


    const bidContainer =
        document.getElementById(
            "player-bid"
        );


    if (
        bidContainer &&
        game.players[0].bid.length > 0
    ) {

        bidContainer.innerHTML = "";


        for (
            const card of
            game.players[0].bid
        ) {

            const cardElement =
                document.createElement(
                    "div"
                );

            cardElement.className =
                "card";

            cardElement.textContent =
                card.value;

            bidContainer.appendChild(
                cardElement
            );

        }

    }

}


// ==========================================
// PULSANTE CONFERMA OFFERTA
// ==========================================

function showBidButton() {

    const actions =
        document.querySelector(
            ".actions"
        );


    actions.innerHTML = "";


    const button =
        document.createElement(
            "button"
        );


    button.id =
        "confirm-bid";


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


    // Deve essere selezionata almeno
    // una carta. Anche la Play Money
    // da sola è una scelta valida.
    if (
        player.selectedCards.length === 0
    ) {

        alert(
            "Seleziona almeno una carta."
        );

        return;

    }


    player.bid =
        player.hand.filter(
            card =>
                player.selectedCards.includes(
                    card.id
                )
        );


    player.bidConfirmed =
        true;


    setMessage(
        "Offerta confermata. I bot stanno scegliendo..."
    );


    // --------------------------------------
    // I BOT SCELGONO
    // --------------------------------------

    for (
        let i = 1;
        i < game.players.length;
        i++
    ) {

        const bot =
            game.players[i];


        const botBid =
            chooseBotBid(
                bot
            );


        bot.selectedCards =
            botBid.map(
                card =>
                    card.id
            );

    }


    // --------------------------------------
    // RIVELAZIONE SIMULTANEA
    // --------------------------------------

    revealBids();


    // --------------------------------------
    // ORDINE
    // --------------------------------------

    determineBidOrder();


    game.phase =
        "resolution";


    // --------------------------------------
    // Mostra le offerte
    // --------------------------------------

    updateTable();


    // --------------------------------------
    // Inizia la risoluzione
    // --------------------------------------

    const first =
        getNextPendingPlayer();


    if (!first) {

        finishRound();

        return;

    }


    game.currentPlayerId =
        first.id;


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
            500
        );

    }

}


// ==========================================
// AVVIO PARTITA
// ==========================================

setupGame();

renderPlayers();

renderMarket();

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
    game
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
