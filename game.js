// ==========================================
// DATI DEL GIOCO
// ==========================================

const CURRENCIES = [
    "EURO",
    "DOLLAR",
    "FRANC",
    "POUND",
    "YEN",
    "RUBLE"
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
for (let i = 0; i < 6; i++) {

    deck.push({
        id: cardId++,
        type: "coin",
        currency: null,
        value: 10
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

    bid: [],

    selectedCards: []
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

    // 6 carte dal mazzo
    for (let i = 0; i < 6; i++) {

        player.hand.push(
            drawCard()
        );

    }

}


// Play Money
// Ogni giocatore riceve una carta
// che vale 0 e può essere usata
// per nascondere la composizione dell'offerta.

for (const player of game.players) {

    const bluffIndex =
        game.deck.findIndex(
            card => card.type === "play-money"
        );

    if (bluffIndex !== -1) {

        const bluffCard =
            game.deck.splice(
                bluffIndex,
                1
            )[0];

        player.hand.push(
            bluffCard
        );

    }

}

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
// ==========================================
// VISUALIZZAZIONE DEI GIOCATORI
// ==========================================

function renderPlayers() {

    const playersContainer =
        document.getElementById("players");

    playersContainer.innerHTML = "";


    for (const player of game.players) {

        const playerElement =
            document.createElement("div");

        playerElement.className = "player";


        const nameElement =
            document.createElement("div");

        nameElement.className = "player-name";

        nameElement.textContent =
            player.name;


        const cardsElement =
            document.createElement("div");

        cardsElement.className = "cards";


        for (const card of player.hand) {

            const cardElement =
                document.createElement("div");

            cardElement.className = "card";

if (player.id === 1) {

    cardElement.textContent =
        card.value;

  cardElement.addEventListener(
    "click",
    function () {

        cardElement.classList.toggle(
            "selected"
        );


        const selected =
            player.selectedCards;

        const index =
            selected.indexOf(card.id);


        if (index === -1) {

            selected.push(card.id);

        } else {

            selected.splice(index, 1);

        }


        console.log(
            "Carte selezionate:",
            player.selectedCards
        );

    }
);
} else {

    cardElement.textContent =
        "?";

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

        playersContainer.appendChild(
            playerElement
        );
    }
}


// Disegna la partita appena creata
renderPlayers();

// ==========================================
// VISUALIZZAZIONE DELLE OFFERTE
// ==========================================

function renderMarket() {

    const leftMarket =
        document.getElementById("market-left");

    const rightMarket =
        document.getElementById("market-right");


    leftMarket.innerHTML = "";
    rightMarket.innerHTML = "";


    for (const card of game.market.left) {

        const cardElement =
            document.createElement("div");

        cardElement.className = "card";

        cardElement.textContent =
            card.value;

        leftMarket.appendChild(
            cardElement
        );
    }


    for (const card of game.market.right) {

        const cardElement =
            document.createElement("div");

        cardElement.className = "card";

        cardElement.textContent =
            card.value;

        rightMarket.appendChild(
            cardElement
        );
    }
}


// Disegna le offerte
renderMarket();
// ==========================================
// CONFERMA OFFERTA DEL GIOCATORE
// ==========================================

function confirmBid() {

    const player = game.players[0];

    if (player.selectedCards.length === 0) {

        alert("Seleziona almeno una carta.");

        return;
    }


    player.bid = player.hand.filter(
        card =>
            player.selectedCards.includes(card.id)
    );


    console.log(
        "Offerta del giocatore:",
        player.bid
    );
    const bidContainer =
    document.getElementById("player-bid");

bidContainer.innerHTML = "";


for (const card of player.bid) {

    const cardElement =
        document.createElement("div");

    cardElement.className = "card";

    cardElement.textContent =
        card.value;

    bidContainer.appendChild(
        cardElement
    );
}
}


// ==========================================
// PULSANTE CONFERMA OFFERTA
// ==========================================

document
    .getElementById("confirm-bid")
    .addEventListener(
        "click",
        confirmBid
    );
