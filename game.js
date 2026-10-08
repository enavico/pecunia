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
    10,
    20,
    30,
    40,
    50,
    60,
    70,
    80,
    90
];


// ==========================================
// CREAZIONE DELLE CARTE
// ==========================================

function createDeck() {

    const deck = [];

    let cardId = 1;

    // Banconote
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

    // Monete
    for (let value = 1; value <= 6; value++) {

        deck.push({
            id: cardId++,
            type: "coin",
            currency: null,
            value: value
        });

    }

    // Play Money
    for (let i = 0; i < 5; i++) {

        deck.push({
            id: cardId++,
            type: "play-money",
            currency: null,
            value: 0
        });

    }

    return deck;
}


// ==========================================
// MESCOLAMENTO
// ==========================================

function shuffle(deck) {

    const shuffled = [...deck];

    for (let i = shuffled.length - 1; i > 0; i--) {

        const j = Math.floor(Math.random() * (i + 1));

        [shuffled[i], shuffled[j]] =
            [shuffled[j], shuffled[i]];
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
    }

};


// ==========================================
// CREAZIONE DEI GIOCATORI
// ==========================================

function createPlayers(numberOfPlayers) {

    const players = [];

    for (let i = 0; i < numberOfPlayers; i++) {

        players.push({
            id: i + 1,

            name:
                i === 0
                    ? "Tu"
                    : `Bot ${i}`,

            hand: [],

            bid: []
        });

    }

    return players;
}


// ==========================================
// PESCA
// ==========================================

function drawCard() {

    return game.deck.pop();

}


// ==========================================
// SETUP DELLA PARTITA
// ==========================================

function setupGame(numberOfPlayers = 4) {

    game.round = 1;

    game.deck = shuffle(createDeck());

    game.players =
        createPlayers(numberOfPlayers);

    game.market.left = [];
    game.market.right = [];


    // Distribuzione iniziale
    for (const player of game.players) {

        for (let i = 0; i < 6; i++) {

            player.hand.push(
                drawCard()
            );

        }

    }


    // Play Money aggiuntive
    // Per ora lasciamo che il setup
    // venga completato dal motore
    // nei prossimi passaggi.


    // Offerte iniziali

    for (let i = 0; i < 4; i++) {

        game.market.left.push(
            drawCard()
        );

        game.market.right.push(
            drawCard()
        );

    }


    return game;
}


// ==========================================
// AVVIO
// ==========================================

setupGame(4);

console.log("Partita creata:");
console.log(game);
