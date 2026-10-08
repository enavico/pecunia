// ==========================================
// BOT: SCELTA OFFERTA
// ==========================================

function chooseBotBid(player) {

    const candidates =
        generateBidCandidates(player);

    if (
        !candidates ||
        candidates.length === 0
    ) {
        return [];
    }


    const targets =
        getBotTargets(player);


    let bestBid =
        candidates[0];

    let bestScore =
        -Infinity;


    for (const bid of candidates) {

        if (
            !Array.isArray(bid) ||
            bid.length === 0
        ) {
            continue;
        }


        // ==================================
        // BLUFF DA SOLO
        // ==================================

        if (
            bid.length === 1 &&
            bid[0].type === "play-money"
        ) {

            /*
             * Il Bluff da solo è valido,
             * ma non permette di prendere
             * alcun lotto.
             *
             * Deve quindi essere molto raro.
             */

            let score =
                -100;

            score +=
                Math.random() * 5;


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


        // ==================================
        // VALORE DELL'OFFERTA
        // ==================================

        const bidValue =
            calculateBidValue(
                bid
            );


        // ==================================
        // COSTO DELLE CARTE SACRIFICATE
        // ==================================

        const sacrificeCost =
            evaluateBidCost(
                player,
                bid
            );


        // ==================================
        // VALORE DEL LOTTO A SINISTRA
        // ==================================

        const leftGain =
            evaluateAcquisition(
                player,
                game.market.left,
                bid
            );


        // ==================================
        // VALORE DEL LOTTO A DESTRA
        // ==================================

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


        // ==================================
        // OBIETTIVI PRIORITARI
        // ==================================

        if (
            targets.length > 0
        ) {

            const target =
                targets[0];


            // ----------------------------------
            // TRIS DI 20
            // ----------------------------------

            if (
                target.type === "triple20"
            ) {

                for (
                    const card of bid
                ) {

                    if (
                        card.type === "money" &&
                        card.currency ===
                            target.currency &&
                        card.value === 20
                    ) {

                        /*
                         * Il bot possiede già due
                         * carte da 20 di questa valuta.
                         *
                         * Sacrificarne una significa
                         * rinunciare al tris.
                         */

                        score -=
                            190;

                    }

                }

            }


            // ----------------------------------
            // TRIS DI 30
            // ----------------------------------

            if (
                target.type === "triple30"
            ) {

                for (
                    const card of bid
                ) {

                    if (
                        card.type === "money" &&
                        card.currency ===
                            target.currency &&
                        card.value === 30
                    ) {

                        score -=
                            210;

                    }

                }

            }


            // ----------------------------------
            // RAGGIUNGERE 200
            // ----------------------------------

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
                        (
                            total,
                            card
                        ) =>
                            total +
                            card.value,
                        0
                    );


                /*
                 * Più il bot è vicino a 200,
                 * più deve proteggere quella valuta.
                 */

                if (
                    targetValue >= 180
                ) {

                    for (
                        const card of bid
                    ) {

                        if (
                            card.type === "money" &&
                            card.currency ===
                                target.currency
                        ) {

                            score -=
                                220;

                        }

                    }

                } else if (
                    targetValue >= 160
                ) {

                    for (
                        const card of bid
                    ) {

                        if (
                            card.type === "money" &&
                            card.currency ===
                                target.currency
                        ) {

                            score -=
                                150;

                        }

                    }

                }

            }

        }


        // ==================================
        // AGGRESSIVITÀ
        // ==================================

        /*
         * Qui spingiamo deliberatamente il bot
         * verso offerte composte da più carte.
         *
         * 1 carta  = nessun bonus
         * 2 carte  = buon bonus
         * 3 carte  = bonus forte
         * 4 carte  = bonus ancora forte
         * 5+       = possibile, ma meno frequente
         */

        if (
            bid.length === 2
        ) {

            score +=
                30;

        } else if (
            bid.length === 3
        ) {

            score +=
                55;

        } else if (
            bid.length === 4
        ) {

            score +=
                65;

        } else if (
            bid.length >= 5
        ) {

            score +=
                45;

        }


        // ==================================
        // VALORE MONETARIO DELL'OFFERTA
        // ==================================

        if (
            bidValue >= 100
        ) {

            score +=
                20;

        }


        if (
            bidValue >= 140
        ) {

            score +=
                30;

        }


        if (
            bidValue >= 180
        ) {

            score +=
                35;

        }


        // ==================================
        // AGGRESSIVITÀ IN BASE AL LOTTO
        // ==================================

        if (
            bestMarketGain >= 300
        ) {

            /*
             * Lotto eccezionalmente importante:
             * il bot è disposto a spendere parecchio.
             */

            score +=
                bid.length * 25;

        } else if (
            bestMarketGain >= 200
        ) {

            score +=
                bid.length * 18;

        } else if (
            bestMarketGain >= 100
        ) {

            score +=
                bid.length * 10;

        }


        // ==================================
        // COSTO DELLE CARTE
        // ==================================

        /*
         * Il costo delle carte rimane importante,
         * ma non deve impedire al bot di fare
         * offerte aggressive.
         */

        score -=
            sacrificeCost * 0.25;


        // ==================================
        // BLUFF
        // ==================================

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
             * Il Bluff permette di aumentare
             * il numero di carte dell'offerta
             * senza aumentarne il valore.
             */

            score +=
                25;

        }


        // ==================================
        // VARIABILITÀ
        // ==================================

        score +=
            Math.random() * 15;


        // ==================================
        // SCELTA DELLA MIGLIORE OFFERTA
        // ==================================

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
