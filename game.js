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

    return deck;
}


// ==========================================
// MESCOLAMENTO
// ==========================================

function shuffle(deck) {

    const shuffled = [...deck];

    for (let i = shuffled.length - 1; i > 0; i--) {

        const j =
            Math.floor(Math.random() * (i + 1));

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

            selectedCards: [],

            bidConfirmed: false

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

    game.deck =
        shuffle(createDeck());

    game.players =
        createPlayers(numberOfPlayers);

    game.market.left = [];

    game.market.right = [];


    // ======================================
    // DISTRIBUZIONE INIZIALE
    // ======================================

    for (const player of game.players) {

        for (let i = 0; i < 6; i++) {

            player.hand.push(
                drawCard()
            );

        }

    }


    // ======================================
    // PLAY MONEY
    // ======================================

    for (const player of game.players) {

        player.hand.push({

            id: `play-${player.id}`,

            type: "play-money",

            currency: null,

            value: 0

        });

    }


    // ======================================
    // OFFERTE INIZIALI
    // ======================================

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


            // ==================================
            // MANO DEL GIOCATORE
            // ==================================

            if (player.id === 1) {

                cardElement.textContent =
                    card.value;


                if (
                    player.bidConfirmed &&
                    player.selectedCards.includes(card.id)
                ) {

                    cardElement.classList.add(
                        "selected"
                    );

                }


                cardElement.addEventListener(
                    "click",
                    function () {

                        if (player.bidConfirmed) {

                            return;

                        }


                        cardElement.classList.toggle(
                            "selected"
                        );


                        const selected =
                            player.selectedCards;


                        const index =
                            selected.indexOf(
                                card.id
                            );


                        if (index === -1) {

                            selected.push(
                                card.id
                            );

                        } else {

                            selected.splice(
                                index,
                                1
                            );

                        }


                        console.log(
                            "Carte selezionate:",
                            player.selectedCards
                        );

                    }
                );


            } else {

                // ==================================
                // MANO DEI BOT
                // ==================================

                // Prima della conferma:
                // carte nascoste.

                // Dopo la conferma:
                // carte dell'offerta visibili.

                if (
                    player.bidConfirmed &&
                    player.bid.some(
                        bidCard =>
                            bidCard.id === card.id
                    )
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

        playersContainer.appendChild(
            playerElement
        );

    }

}


// Disegna la partita
renderPlayers();


// ==========================================
// VISUALIZZAZIONE DELLE OFFERTE
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


    // ======================================
    // OFFERTA A
    // ======================================

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


    // ======================================
    // OFFERTA B
    // ======================================

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


// Disegna le offerte
renderMarket();


// ==========================================
// CALCOLO DEL VALORE DI UN'OFFERTA
// ==========================================

function calculateBidValue(cards) {

    return cards.reduce(
        (total, card) =>
            total + card.value,
        0
    );

}


// ==========================================
// SCELTA DELL'OFFERTA DEI BOT
// ==========================================

function chooseBotBid(player) {

    const cards =
        [...player.hand];


    const leftValue =
        calculateBidValue(
            game.market.left
        );

    const rightValue =
        calculateBidValue(
            game.market.right
        );

    const bestMarketValue =
        Math.max(
            leftValue,
            rightValue
        );


    const moneyCards =
        cards
            .filter(
                card =>
                    card.type === "money" ||
                    card.type === "coin"
            )
            .sort(
                (a, b) =>
                    b.value - a.value
            );


    let bid = [];

    let bidValue = 0;


    for (const card of moneyCards) {

        if (
            bidValue >= bestMarketValue
        ) {

            break;

        }

        bid.push(card);

        bidValue += card.value;

    }


    while (
        bid.length > 1 &&
        bidValue -
            bid[bid.length - 1].value
            >= bestMarketValue
    ) {

        const removed =
            bid.pop();

        bidValue -=
            removed.value;

    }


    if (bid.length === 0) {

        const playMoney =
            cards.find(
                card =>
                    card.type === "play-money"
            );

        if (playMoney) {

            bid.push(
                playMoney
            );

        }

    }


    return bid;
}


// ==========================================
// I BOT FORMULANO LE OFFERTE
// ==========================================

function makeBotBids() {

    for (
        let i = 1;
        i < game.players.length;
        i++
    ) {

        const bot =
            game.players[i];


        bot.bid =
            chooseBotBid(bot);


        bot.bidConfirmed =
            true;


        console.log(
            `${bot.name} ha offerto:`,
            bot.bid
        );

    }


    // Aggiorna la visualizzazione
    // per mostrare le carte offerte dai bot
    renderPlayers();


    console.log(
        "Offerte di tutti i giocatori:",
        game.players.map(
            player => ({
                name: player.name,

                bid: player.bid,

                value:
                    calculateBidValue(
                        player.bid
                    )

            })
        )
    );

}


// ==========================================
// CONFERMA OFFERTA DEL GIOCATORE
// ==========================================

function confirmBid() {

    const player =
        game.players[0];


    // Nessuna carta selezionata
    if (
        player.selectedCards.length === 0
    ) {

        alert(
            "Seleziona almeno una carta."
        );

        return;

    }


    // Recupera le carte selezionate
    player.bid =
        player.hand.filter(
            card =>
                player.selectedCards.includes(
                    card.id
                )
        );


    // Blocca l'offerta
    player.bidConfirmed =
        true;


    console.log(
        "Offerta del giocatore:",
        player.bid
    );


    // ======================================
    // VISUALIZZA L'OFFERTA DEL GIOCATORE
    // ======================================

    const bidContainer =
        document.getElementById(
            "player-bid"
        );


    bidContainer.innerHTML = "";


    for (const card of player.bid) {

        const cardElement =
            document.createElement("div");

        cardElement.className =
            "card";

        cardElement.textContent =
            card.value;

        bidContainer.appendChild(
            cardElement
        );

    }


    // ======================================
    // CAMBIO DI STATO
    // ======================================

    const message =
        document.querySelector(
            ".message"
        );


    message.firstChild.textContent =
        "Offerta confermata. I bot stanno giocando...";


    console.log(
        "Il giocatore ha confermato l'offerta."
    );


    // ======================================
    // I BOT FORMULANO LE LORO OFFERTE
    // ======================================

    makeBotBids();

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
