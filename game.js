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

            /*
             * Il Bluff da solo è praticamente
             * un pass: non consente di prendere
             * alcun lotto.
             *
             * Lo teniamo possibile, ma molto raro.
             */

            let score = -80;

            score +=
                Math.random() * 10;


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
        // COSTO DELL'OFFERTA
        // ----------------------------------

        const sacrificeCost =
            evaluateBidCost(
                player,
                bid
            );


        // ----------------------------------
        // VALORE DEI DUE LOTTI
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
            bestMarketGain;


        // ----------------------------------
        // OBIETTIVI PRIORITARI
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
                         * Non vogliamo sacrificare
                         * una delle due carte che ci
                         * permetterebbero il tris.
                         */

                        score -= 190;

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

                        score -= 210;

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


                /*
                 * Se siamo vicini a 200,
                 * le carte della valuta
                 * diventano preziosissime.
                 */

                if (
                    targetValue >= 180
                ) {

                    for (const card of bid) {

                        if (
                            card.type === "money" &&
                            card.currency ===
                                target.currency
                        ) {

                            score -= 220;

                        }

                    }

                } else if (
                    targetValue >= 160
                ) {

                    for (const card of bid) {

                        if (
                            card.type === "money" &&
                            card.currency ===
                                target.currency
                        ) {

                            score -= 150;

                        }

                    }

                }

            }

        }


        // ----------------------------------
        // PREMIO PER OFFERTE AGGRESSIVE
        // ----------------------------------

        /*
         * Il bot deve avere una vera propensione
         * a mettere più carte sul tavolo.
         *
         * Non vogliamo però premiare
         * indiscriminatamente le offerte enormi.
         */

        if (
            bid.length === 2
        ) {

            score += 25;

        }


        if (
            bid.length === 3
        ) {

            score += 35;

        }


        if (
            bid.length === 4
        ) {

            score += 18;

        }


        if (
            bid.length >= 5
        ) {

            score -=
                (bid.length - 4) * 35;

        }


        // ----------------------------------
        // PREMIO PER VALORE DELL'OFFERTA
        // ----------------------------------

        if (
            bidValue >= 100 &&
            bidValue < 140
        ) {

            score += 20;

        }


        if (
            bidValue >= 140 &&
            bidValue < 180
        ) {

            score += 35;

        }


        if (
            bidValue >= 180
        ) {

            score += 45;

        }


        // ----------------------------------
        // AGGRESSIVITÀ BASATA SUL VALORE
        // DEL LOTTO
        // ----------------------------------

        if (
            bestMarketGain >= 300
        ) {

            /*
             * Lotto molto importante:
             * il bot è disposto a spendere.
             */

            score +=
                bid.length * 22;

        } else if (
            bestMarketGain >= 200
        ) {

            score +=
                bid.length * 15;

        } else if (
            bestMarketGain >= 100
        ) {

            score +=
                bid.length * 8;

        }


        // ----------------------------------
        // COSTO DELLE CARTE
        // ----------------------------------

        /*
         * Il costo rimane importante, ma molto
         * meno di prima.
         *
         * Prima: 0.45
         * Ora: 0.25
         */

        score -=
            sacrificeCost * 0.25;


        // ----------------------------------
        // PREMIO SPECIFICO AL BLUFF
        // ----------------------------------

        const hasBluff =
            bid.some(
                card =>
                    card.type === "play-money"
            );


        if (
            hasBluff &&
            bid.length >= 2
        ) {

            /*
             * Il Bluff è particolarmente utile
             * per rendere l'offerta più corposa
             * senza aumentarne il valore.
             */

            score += 18;

        }


        // ----------------------------------
        // VARIABILITÀ
        // ----------------------------------

        score +=
            Math.random() * 12;


        // ----------------------------------
        // SCELTA FINALE
        // ----------------------------------

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
