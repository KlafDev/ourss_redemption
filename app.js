
// ------------------------------------------------------------------
//           _ _     _                             _                 
//     /\   | | |   (_)                           (_)                
//    /  \  | | |__  _  ___  _ __   ___  _ __ ___  _  ___ ___  _ __  
//   / /\ \ | | '_ \| |/ _ \| '_ \ / _ \| '_ ` _ \| |/ __/ _ \| '_ \ 
//  / ____ \| | |_) | | (_) | | | | (_) | | | | | | | (_| (_) | | | |
// /_/    \_\_|_.__/|_|\___/|_| |_|\___/|_| |_| |_|_|\___\___/|_| |_|
//
// ------------------------------------------------------------------


// by Klaf
// Développé pour le serveur Albion

// BUILD final pour la V1.0 : 07/09/2021

// INCLUDE et REQUIRE nécessaire au bot ------------------------------------------------------------------------------------------

'use strict';
const DEBUG = false;
const Discord = require('discord.js');
const logger = require('winston');
const auth = require('./auth.json');
const config = require('./config.json');
const fs = require('fs');

//const Card = require('./cards');
var Card = require('./cards');
const DB = require('./db');

const db = DB.getDbConnexion();

var commandIdentifierChar = '!';

// Configuration du système de log console
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});

logger.level = 'debug';

var client = new Discord.Client();

client.on('ready', () => {
    logger.info(config.DICTIONARY.CONNECT);

    // Au lancement du bot, vérification de la création d'un market ce jour
    checkBlackMarket(function (message) {
        console.log(message);
    })
});

client.login(auth.token);

client.on("message", async message => {
    // Récupération des info importantes du message
    var user = message.author.username;
    var userID = message.author.id;
    var channelID = message.channel.id;

    // Le message est une commande pour OURSS
    if (message.content.substring(0, 1) == commandIdentifierChar) {
        var args = message.content.substring(1).split(' ');
        var cmd = args[0];

        args = args.splice(1);
        switch (cmd) {
            //  Pour tester le bot
            case 'ping': //
                pong(channelID);
                break;
            case 'bite': //
                displayMessage(channelID, config.DICTIONARY.MESSAGE.BITE)
                break;
            // Permet à l'utilisateur de récupérer des cartes
            case 'd':
            case 'draw':
            case 'invocation':
            case 'pick':
                draw(user, userID, channelID);
                break;
            // Recycle la carte sélectionnée
            case 'ds':
            case 'recycle':
            case 'destroy':
                destroy(userID, channelID, args[0]);
                break;
            // Récompense quotidienne d'AlbionDollar
            case 'dl':
            case 'daily':
                daily(user, userID, channelID);
                break;
            // Affiche de solde d'AlbionDollar d'un utilisateur
            case 's':
            case 'solde':
            case 'money':
            case 'moula':
            case 'moulaga':
                displaySolde(userID, channelID);
                break;
            // Affiche la collection de cartes de l'utilisateur
            case 'c':
            case 'collection':
                displayCollection(userID, channelID);
                break;
            // Affiche la liste de toutes les cartes
            case 'g':
            case 'galerie':
            case 'gallery':
                displayGallery(channelID);
                break;
            // Système de pari d'AlbionDollar. Et comme d'habitude c'est le casino qui gagne...
            case 'r':
            case 'roulette':
                roulette(userID, channelID, args[0]);
                break;
            // Système de pari d'AlbionDollar. Et comme d'habitude c'est le casino qui gagne...
            case 'echange':
            case 'tr':
            case 'trade':
                trade(userID, channelID, args[0], args[1]);
                break;
            // // Commande admin pour donner des AlbionDollar à un utilisateur
            case 'give':
            case 'motherlode':
                give(userID, channelID, args[0], args[1]);
                break;
            // Encore une commande de test, ça commence à faire beaucoup...
            case 'test':
                test(user, userID, channelID, message);
                break;
            // Encore une commande de test, ça commence à faire beaucoup...
            case 'bm':
            case 'marchenoir':
            case 'blackmarket':
                blackmarket(channelID);
                break;
        }
    }
    // Le message n'est pas une commande pour OURSS
    else {
        checkRandomMessage(userID);
    }
})


// Vérification des ajout de réaction sur un message
client.on('messageReactionAdd', (reaction, user) => {
    if (user.id != 802197711439921204 && reaction.message.author.id == 802197711439921204) {

        var emoji = reaction._emoji.name;
        var messageString = reaction.message.content;

        switch (emoji) {
            // Si 👍 = trade (réponse favorable)
            case '👍':                
                var regex = /<@!/gi, result, premiereIteration = [];
                while ((result = regex.exec(messageString))) {
                    premiereIteration.push(result.index);
                }
                var regex = />/gi, result, secondeIteration = [];
                while ((result = regex.exec(messageString))) {
                    secondeIteration.push(result.index);
                }

                var userSource = messageString.substring(premiereIteration[0] + 3, secondeIteration[0])
                var userTarget = messageString.substring(premiereIteration[1] + 3, secondeIteration[1])

                // On vérifie que la personne qui répond au message est bien la personne ciblé par l'utilisateur voulant faire un echange
                if (user.id == userTarget) {
                    _endTrade(messageString, userSource, userTarget);
                }
                else {
                    displayMessage(reaction.message.channel.id, config.DICTIONARY.MESSAGE.ERROR.USER_NOT_TARGET)
                }
                break;
            // Si 👎 = trade (réponse défavorable)
            case '👎':
                displayMessage(reaction.message.channel.id, config.DICTIONARY.MESSAGE.ERROR.TRADE_CANCEL)
                setTimeout(() => reaction.message.delete()
                    .then(msg => console.log(config.DICTIONARY.CONSOLE.TRADE_DELETE))
                    .catch(console.error), 1000);
                break;
            // Si 1️⃣ = black market (choix de carte)
            case '1️⃣':
            case '2️⃣':
            case '3️⃣':
            case '4️⃣':
            case '5️⃣':
                // fonction de gestion du black market (récupération de la carte + attribution des points et de la carte au user)
                getChosenCardBlackMarket(user.id, reaction.message.channel.id, messageString, emoji);
                setTimeout(() => reaction.message.delete()
                    .then(msg => console.log(config.DICTIONARY.CONSOLE.BLACKMARKET_DELETE))
                    .catch(console.error), 1000);
                break;
            default:
                log(config.DICTIONARY.CONSOLE.EMOTE_INVALID + emoji);
        }
    }
});


//----------------------------------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------------------------------
// Fonctions Principale, appelé par le case ci dessus ------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------------------------------


// Pong > case 'ping' = affiche un message après le !ping du membre.
function pong(channelID) {
    displayMessage(channelID, 'понг!')
};

// Present > case 'supplex' = oURSS se présente (fonction à modifier : afficher un message USER1 supplex USER2)
//function present(user, userID, channelID, message, evt)
//{   
//    displayMessage(channelID, ':red_circle: non fonctionnel');
//};

// Test > case 'test' = Fonction de test
function test(user, userID, channelID, message) {
    checkBlackMarket();
};

// Pick Card  > case 'draw'/case 'invocation'/case 'pick' = Donne 5 cartes au joueur
function draw(user, userID, channelID) {
    try {
        var pickMessage = '';

        // On récupère les infos user et on vérifie qu'il existe.
        DB.checkIfUserExist(db, userID, function (res) {
            // L'utilisateur existe
            if (res == 1) {
                console.log(config.DICTIONARY.CONSOLE.USER_EXIST);
                proceedPickCard();
            }
            // L'utilisateur n'existe pas
            else {
                console.log(config.DICTIONARY.CONSOLE.USER_DO_NOT_EXIST);
                DB.insertNewUser(db, user, userID, 1500, function (res) {
                    proceedPickCard();
                });
            }
        });

        function proceedPickCard() {
            // On vérifie le solde de l'utilisateur
            DB.getUserMoney(db, userID, function (solde) {
                // SOLDE VIDE
                if (solde == 0) {
                    pickMessage = ":red_circle: <@!" + userID + "> " + config.DICTIONARY.MESSAGE.MONEY_EMPTY;
                    displayMessage(channelID, pickMessage);
                }
                // SOLDE INSUFFISANT
                else
                if (config.SOLDE.DRAW_AMOUNT * 5 > solde) {
                    pickMessage = ":red_circle: <@!" + userID + "> " + config.DICTIONARY.MESSAGE.MONEY_NOT_ENOUGH;
                    displayMessage(channelID, pickMessage);
                }
                // SOLDE OK
                else {
                    var m = config.DICTIONARY.MESSAGE.CARD_CHECK_ON + " <@!" + userID + ">\n\n";

                    // Génération des cartes et attribution à l'utilisateur
                    DB.giveMoneyToUser(db, -(config.SOLDE.DRAW_AMOUNT * 5), userID, function () {
                        getCardAsync(userID, m, 5, function endLoop(message) {
                            message = message + "\n" + config.DICTIONARY.MESSAGE.CARD_DRAW_FIVE_CARD + config.WEB.MES_CARTES;
                            displayMessage(channelID, message);
                        });
                    });
                }
            });
        }
    }
    catch (error) {
        console.log(error);
    }
};

// Destroy > case 'destroy' = Détruit/Recycle une carte
function destroy(userID, channelID, cards) {
    // On récupère les infos user et on vérifie qu'il existe.
    DB.checkIfUserExist(db, userID, function (res) {
        // L'utilisateur existe
        if (res == 1) {
            if (typeof cards === 'undefined') {
                // Si pas de carte donnée : pas de suppression (ça parait logique)
                var m = config.DICTIONARY.MESSAGE.NO_CARD;
                displayMessage(channelID, m);
            }
            else {
                var list = cards.split('+');
                var m = '';

                // Début de la boucle synchrone
                syncLoop(list.length, function (loop) {
                    // Récupération de l'itération
                    var i = loop.iteration();
                    console.log("itération:" + i);

                    var cardNumberWAlteration = list[i];
                    var cardNumber = list[i].replace(/\D/g, '');
                    var alteration = "";
                    var isGold = 0;
                    var isReversed = 0;
                    var isHolo = 0;

                    if (cardNumber.length < cardNumberWAlteration.length) {
                        // Identification de l'alteration DEPUIS LE MESSAGE (donc info à vérifier)
                        alteration = cardNumberWAlteration.replace(cardNumber, '');
                        if (alteration.toUpperCase().includes('G')) {
                            isGold = 1;
                        }
                        if (alteration.toUpperCase().includes('R')) {
                            isReversed = 1;
                        }
                        if (alteration.toUpperCase().includes('H')) {
                            isHolo = 1;
                        }
                    }
                    console.log("cardNumber:" + cardNumber + "|isGold:" + isGold + "|isReversed:" + isReversed + "|isHolo:" + isHolo);

                    getCard(db, userID, cardNumber, 1, isGold, isReversed, isHolo, function (rarity) {
                        // no result if rarity = 0
                        if (rarity != 0) {
                            // Identification de l'alteration DEPUIS LA BASE (différent de celui noté, l'utilisateur à pu mentir)
                            var isGold = 0;
                            var isReversed = 0;
                            var isHolo = 0;

                            if (alteration != null) {
                                if (alteration.toUpperCase() == "GOLD") {
                                    isGold = 1;
                                }
                                if (alteration.toUpperCase() == "REVERSED") {
                                    isReversed = 1;
                                }
                                if (alteration.toUpperCase() == "HOLO") {
                                    isHolo = 1;
                                }
                            }

                            // Calcul du nombre de fragment à donner
                            var card = new Card();
                            var fragments = card.calculateFragment(rarity, isGold, isReversed, isHolo, 1);

                            // Si la carte est MAUDITE : Le recyclage de carte maudite coute des roublions !
                            if (rarity == 6) {
                                // On vérifie le solde de l'utilisateur
                                DB.getUserMoney(db, userID, function (solde) {
                                    // SOLDE VIDE
                                    if (solde == 0) {
                                        //var errorM = ":red_circle: <@!" + userID + "> Solde vide";
                                        //log(errorM);
                                        //displayMessage(channelID, errorM);
                                        m = m + "Carte #" + cardNumber + " : Solde vide, la carte maudite n'a pas pu être détruite.";
                                    }
                                    // SOLDE INSUFFISANT
                                    else
                                        if (config.SOLDE.RECYCLE_CURSED > solde) {
                                            //var errorM = ":red_circle: <@!" + userID + "> Solde insuffisant, la carte maudite n'a pas pu être détruite.";
                                            //log(errorM);
                                            //displayMessage(channelID, errorM);
                                            m = m + "Carte #" + cardNumber + " : Solde insuffisant, la carte maudite n'a pas pu être détruite.";
                                        }
                                        // SOLDE OK
                                        else {
                                            DB.giveMoneyToUser(db, -config.SOLDE.RECYCLE_CURSED, userID, function () {
                                                proceedDestroy();
                                            });
                                        }
                                });
                            }
                            else { // Sinon :                    
                                proceedDestroy();
                            }

                            function proceedDestroy() {
                                // Attribution de fragment à l'utilisateur
                                DB.giveFragmentToUser(db, userID, fragments, function () {
                                    // On retire les points de la carte à l'utilisateur
                                    DB.givePointsToUser(db, userID, -fragments);

                                    // On retire la carte à l'utilisateur
                                    DB.removeCardFromUser(db, userID, cardNumber, 1, function () {
                                        m = m + "Carte #" + cardNumber + " a été supprimé de votre compte. Vous avez récupéré " + fragments + " fragments !\n";
                                        loop.next();
                                    });
                                });
                            }
                        }
                        else {
                            console.log("card NOK: next loop");
                            loop.next();
                        }
                    });
                }, function () {
                    console.log("end syncLoop");
                    displayMessage(channelID, m);
                });
            }
        }
        // L'utilisateur n'existe pas
        else {
            displayMessage(channelID, "Ton compte n'existe pas encore dans le jeu, fait un !draw pour récupérer des cartes et créer ton compte !");
        }
    });

}

// Daily > case 'daily' = Donne une récompense journalière au joueur
function daily(user, userID, channelID) {
    // On récupère les infos user et on vérifie qu'il existe.
    DB.checkIfUserExist(db, userID, function (res) {
        // L'utilisateur existe
        if (res == 1) {
            console.log(config.DICTIONARY.CONSOLE.USER_EXIST);
            proceedDaily();
        }
        // L'utilisateur n'existe pas
        else {
            console.log(config.DICTIONARY.CONSOLE.USER_DO_NOT_EXIST);
            console.log("user:" + user + "/userID:" + userID);
            DB.insertNewUser(db, user, userID, 1500, function (res) {
                proceedDaily();
            });
        }
    });

    function proceedDaily() {
        DB.getLastDaily(db, userID, function (lastDaily) {
            var message = "";
            var date = getDate();
            //var date = d.getFullYear() + ("0" + (d.getMonth() + 1)).slice(-2) + ("0" + d.getDate()).slice(-2);

            // Si la date DB est différente de la date du jour >>> Pas de !daily réalisé aujourd'hui
            if (lastDaily != date) {
                log(config.DICTIONARY.CONSOLE.DAILY_TODAY_NOT_USED);
                message = config.DICTIONARY.DAILY_OK;

                // Ajout de la somme journalière sur le compte de l'utilisateur
                DB.giveMoneyToUser(db, config.SOLDE.DAILY_MONEY, userID);

                // Mise à jour de la date de dernier daily
                DB.updateLastDaily(db, date, userID);
            }
            // Si la date DB est la même que celle de la date du jour >>> !daily déjà réalisé aujourd'hui
            else {
                log(config.DICTIONARY.CONSOLE.DAILY_TODAY_USED);
                message = config.DICTIONARY.DAILY_KO;
            }

            displayMessage(channelID, message);
        });
    }
};

// Display Solde > case 'solde'/case 'money'/case 'moula'/case 'moulaga' = Affiche le solde d'AlbionDollar de l'utilisateur.
function displaySolde(userID, channelID) {
    DB.getUserMoney(db, userID, function (roublions, fragments) {
        displayMessage(channelID, "Tu as " + roublions + " Roublions et " + fragments + " fragments !");
    })
};

// Display collection > case 'collection' = Affiche la collection de cartes de l'utilisateur.
function displayCollection(userID, channelID) {
    var message = "<@!" + userID + "> " + config.DICTIONARY.MESSAGE.CARD_DRAW_FIVE_CARD + config.WEB.MES_CARTES;
    displayMessage(channelID, message);
};

// Display Gellery > case 'gallery' = Affiche la liste de toutes les cartes
function displayGallery(channelID) {
    var message = config.DICTIONARY.MESSAGE.CARD_GALLERY + config.WEB.TOUTES_LES_CARTES;
    displayMessage(channelID, message);
}

// Roulette > case 'roulette' = Permet à l'utilisateur de parier et de perdre son argent.
function roulette(userID, channelID, amount) {
    try {
        var message = "<@!" + userID + "> ";

        DB.getUserMoney(db, userID, function (solde) {
            // Vérification des données (somme misée, solde de Roublions)
            if (amount == null || amount == 0 || isNaN(amount) == true) {
                message = message + ":red_circle: Aucune somme misée.";
                var displaySyncMessage = true;
            }
            else
            if (amount <= 0) {
                message = message + ":red_circle: Somme nulle ou négative interdite.";
                var displaySyncMessage = true;
            }
            else
            if (amount > config.SOLDE.ROULETTE_MAX) {
                message = message + ":red_circle: La somme maximale à miser est de " + config.SOLDE.ROULETTE_MAX;
                var displaySyncMessage = true;
            }
            else
            if (solde < 0) {
                message = message + ":red_circle: Ton solde de Roublions est vide.";
                var displaySyncMessage = true;
            }
            else
            if (solde < amount) {
                message = message + ":red_circle: Ton solde de Roublions ne permet pas miser la somme de " + amount;
                var displaySyncMessage = true;
            }
            else {
                // Action roulette autorisé

                var percent = getRandomInt(100);

                // Pour le débug
                //var percent = 80;

                var gain = 0;
                var gainFragments = 0;
                var displaySyncMessage = true;

                // 1% = 5x la mise
                if (percent >= 0 && percent <= 1) {
                    message = message + ":game_die: **BRAVO** Tu gagnes 5 FOIS ta mise !";
                    gain = Math.round(amount * 5);
                }
                // 5% = 2x la mise
                else if (percent > 1 && percent <= 6) {
                    message = message + ":game_die: **BRAVO** Tu gagnes 2 fois ta mise !";
                    gain = Math.round(amount * 2);
                }
                // 10% = 1.5x la mise
                else if (percent > 6 && percent <= 16) {
                    message = message + ":game_die: Tu gagnes 1.5 fois ta mise !";
                    gain = Math.round(amount * 1.5);
                }
                // 10% = Mise gardé
                else if (percent > 16 && percent <= 26) {
                    message = message + ":game_die: Tu gardes ta mise !";
                    gain = amount;
                }
                // 20% = Mise transformé en fragment
                else if (percent > 26 && percent <= 46) {
                    message = message + ":game_die: **BRAVO** Tu gagnes ta mise en fragments !";
                    gainFragments = amount;
                }
                // 20% = Mise*2 transformé en fragment
                else if (percent > 46 && percent <= 66) {
                    message = message + ":game_die: **BRAVO** Tu gagnes 2 FOIS ta mise en fragments !";
                    gainFragments = Math.round(amount * 2);
                }
                // 1% = Drop de 3 cartes
                else if ((percent > 66 && percent <= 67) && amount >= 100) {
                    displaySyncMessage = false;
                    message = "TIRAGE DE **3 CARTES** pour <@!" + userID + ">\n\n";

                    getCardAsync(userID, message, 3, function endLoop(message) {
                        message = message + "\nToutes tes cartes sont visibles sur : " + config.WEB.MES_CARTES;
                        displayMessage(channelID, message);
                    });
                }
                // 2% = Drop d'une carte
                else if ((percent > 67 && percent <= 69) && amount >= 100) {
                    displaySyncMessage = false;
                    message = "TIRAGE DE **1 CARTE** pour <@!" + userID + ">\n\n";

                    getCardAsync(userID, message, 1, function endLoop(message) {
                        message = message + "\nToutes tes cartes sont visibles sur : " + config.WEB.MES_CARTES;
                        displayMessage(channelID, message);
                    });
                }
                // 31% = Perdu
                else //if (percent > 69)
                {
                    message = message + ":game_die: Perdu !";
                    gain = 0;
                }

                // On ajuste le compte de l'utilisateur avec l'argent qui a gagné/perdu
                var sommeTotal = gain - amount;
                if (sommeTotal != 0) {
                    log("roulette:giveMoneyToUser:" + sommeTotal, null);
                    DB.giveMoneyToUser(db, sommeTotal, userID);
                }
                if (gainFragments > 0) {
                    log("roulette:giveFragmentToUser:" + gainFragments, null);
                    DB.giveFragmentToUser(db, userID, gainFragments)
                }
            }

            if (displaySyncMessage == true) {
                displayMessage(channelID, message);
            }
        });

    }
    catch (error) {
        console.log(error);
    }
};

// Give > case 'give'/case 'motherlode' = Commande admin pour donner des albionDollar à un utilisateur.
function give(userID, channelID, targetUser, amount) {
    try {
        var message = "";
        if (userID == 153590685440671744) // Klaf
        {
            DB.giveMoneyToUserFromUserName(db, amount, targetUser, function () {
                displayMessage(channelID, "oui monsieur");
            }); // Erreur pas bloquante, à corriger avant de le mettre sur le serv
        }
        else {
            message = ":red_circle: Je ne répond qu'à mon maitre <@!153590685440671744>, usurpateur !";
            displayMessage(channelID, message);
        }
    }
    catch (error) {
        console.log(error);
    }
};

// Vérifie chaque message et à un pourcentage de chance de donner des roublions/fragments à l'utilisateur
function checkRandomMessage(userID) {
    if (userID != 802197711439921204) {
        //console.log("message dans un channel");
        var random = getRandomInt(300);

        // 0.33% = Donne 500 Roublions à l'utilisateur.
        if (random == 1) {
            DB.giveMoneyToUser(db, 500, userID);

            var message = "<@!" + userID + "> Vous avez trouvé 500 Roublions qui trainaient là par-terre";
            displayMessage(config.CHANNEL.BOT, message);
        }
        // 1.66% = Donne 50 Roublion et 10 Fragments à l'utilisateur.
        else if (random >= 2 && random <= 6) {
            DB.giveMoneyToUser(db, 50, userID);
            DB.giveFragmentToUser(db, userID, 10);

            var message = "<@!" + userID + "> Vous avez trouvé 50 Roublions et 10 Fragments qui trainaient là par-terre";
            displayMessage(config.CHANNEL.BOT, message);
        }
        // Sinon rien
    }
}

// Fonction d'échange de carte entre joueurs
async function trade(userID, channelID, listeCartes, cibleName) {
    // Vérification des valeurs
    if (listeCartes == null) {
        var message = ":red_circle: Aucune cartes donnée.";
        displayMessage(channelID, message);
    }
    if (cibleName == null)
    {
        var message = ":red_circle: Aucune utilisateur donné.";
        displayMessage(channelID, message);
    }
    else
    {
        var cartes = listeCartes.split('+');
        //var m = "echange de carte : " + listeCartes;
        var sqlString = "SELECT DISCORD_ID FROM OURSS.USER WHERE NAME = '" + cibleName + "';"
        // TODO : Ajout d'une vérification si l'utilisateur a bien les cartes dans sa collection
        DB.query(db, sqlString, function (err, userCibleId) {
            var cartes = listeCartes.split('+');
            //var m = "echange de carte : " + listeCartes;
            var sqlString = "SELECT DISCORD_ID FROM OURSS.USER WHERE NAME = '" + cibleName + "';"
            // TODO : Ajout d'une vérification si l'utilisateur a bien les cartes dans sa collection
            DB.query(db, sqlString, function (err, userCibleId) {
                var userTargetID = userCibleId[0]["DISCORD_ID"];
                var m = ":arrows_clockwise: Echange : <@!" + userID + "> veut échangé avec <@!" + userTargetID + "> : \n:black_joker:" + cartes.join(' + ') + ":black_joker:\nConfirmer l'échange ?";

                client.channels.cache.get(channelID).send(m)
                    .then(function (message) {
                        message.react("👍")
                        message.react("👎")
                    }).catch(function () {
                        //Something
                    });
            })
        })
    }
}

// Fin de la gestion de l'échange
function _endTrade(tradeMessage, userSource, userTarget) {
    // On récupère la carte

    var regex = /:black_joker:/gi, result, cardBoundary = [];
    while ((result = regex.exec(tradeMessage))) {
        cardBoundary.push(result.index);
    }

    var cards = tradeMessage.substring(cardBoundary[0] + ":black_joker:".length, cardBoundary[1])
    var cardList = cards.split('+');
    var m = '';

    // Début de la boucle synchrone
    syncLoop(cardList.length, function (loop) {
        // Récupération de l'itération
        var i = loop.iteration();
        console.log("itération:" + i);

        var cardNumberWAlteration = cardList[i];
        var cardNumber = cardList[i].replace(/\D/g, '');
        var alteration = "";
        var isGold = 0;
        var isReversed = 0;
        var isHolo = 0;

        if (cardNumber.length < cardNumberWAlteration.length) {
            // Identification de l'alteration DEPUIS LE MESSAGE (donc info à vérifier = getCard)
            alteration = cardNumberWAlteration.replace(cardNumber, '');
            if (alteration.toUpperCase().includes('G')) {
                isGold = 1;
            }
            if (alteration.toUpperCase().includes('R')) {
                isReversed = 1;
            }
            if (alteration.toUpperCase().includes('H')) {
                isHolo = 1;
            }
        }
        console.log("cardNumber:" + cardNumber + "|isGold:" + isGold + "|isReversed:" + isReversed + "|isHolo:" + isHolo);

        getCard(db, userSource, cardNumber, 1, isGold, isReversed, isHolo, function (rarity) {
            // no result if rarity = 0
            if (rarity != 0) {

                // Calcul du nombre de fragment à donner
                var card = new Card();
                var fragments = card.calculateFragment(rarity, isGold, isReversed, isHolo, 1);

                // Attribution des points à l'utilisateur target
                DB.givePointsToUser(db, userTarget, fragments, function () {
                    // On retire les points de la carte à l'utilisateur source
                    DB.givePointsToUser(db, userSource, -fragments);

                    // On retire la carte à l'utilisateur
                    DB.tradeCardFromSourceToTarget(db, userSource, userTarget, cardNumber, isGold, isReversed, isHolo, function () {
                        m = m + ":black_joker: Carte #" + cardNumber + " échangée\n";
                        loop.next();
                    });
                });
            }
            else {
                console.log("card NOK: next loop");
                loop.next();
            }
        });
    }, function () {
        console.log("end syncLoop");
        displayMessage(tradeMessage.channel.id, m);

        // Suppression du message après le trade
        setTimeout(() => tradeMessage.delete()
            .then(msg => console.log('trade : Deleted message from ${username}'))
            .catch(console.error), 1000);
    });
}

// Affiche le black market du jour
function blackmarket(channelID) {
    // On récupère les cartes du black market dans la base
    var date = getDate();
    var message = ":detective: **BLACK MARKET** :coin:\n";
    DB.getDailyBlackMarket(db, date, function (blackMarketCards) {
        console.log(blackMarketCards);
        // Si on a plus de cartes, on change le message !
        if (blackMarketCards.length == 0) {
            message = message + "\nToutes les cartes ont été vendues. Reviens demain pour un nouveau black market !"
            displayMessage(channelID, message);
        }
        else {
            message = message + "Cartes disponible à la vente aujourd'hui :\n\n";
            for (var i = 0; i < blackMarketCards.length; i++) {
                // Set card
                var card = new Card(blackMarketCards[i]["ASSET_CARD"], blackMarketCards[i]["IS_GOLD"], blackMarketCards[i]["IS_REVERSED"], blackMarketCards[i]["IS_HOLO"], null);
                card.name = blackMarketCards[i]["NAME"];
                card.rarityValue = blackMarketCards[i]["RARITY_VALUE"];

                // Rareté de la carte + prix
                var stars = '';
                var prix = 0;
                if (card.rarityValue == 1) {
                    stars = ':star: :star: :star: :star: :star:'
                    prix = 8500;
                }
                else if (card.rarityValue == 2) {
                    stars = ':star: :star: :star: :star:'
                    prix = 3000;
                }
                else if (card.rarityValue == 3) {
                    stars = ':star: :star: :star:'
                    prix = 1800;
                }
                else if (card.rarityValue == 4) {
                    stars = ':star: :star:'
                    prix = 950;
                }
                else if (card.rarityValue == 5) {
                    stars = ':star:'
                    prix = 300;
                }

                // Emote numéro
                var emote = "";
                if (i == 0) {
                    emote = ":one:";
                }
                else if (i == 1) {
                    emote = ":two:";
                }
                else if (i == 2) {
                    emote = ":three:";
                }
                else if (i == 3) {
                    emote = ":four:";
                }
                else if (i == 4) {
                    emote = ":five:";
                }

                // Altération + prix
                var altArray = [];
                var alteration = "";
                if (card.isGold == 1) {
                    altArray.push("**DOREE**");
                    prix = prix + 500;
                }
                if (card.isReversed == 1) {
                    altArray.push("**REVERSED**");
                    prix = prix + 1000;
                }
                if (card.isHolo == 1) {
                    altArray.push("**HOLOGRAPHIQUE**");
                    prix = (prix + 1000) * 2;
                }

                if (altArray.length > 0) {
                    alteration = altArray.join(' ');
                }

                // Création du message
                message = message + emote + ' ' + stars + " : #" + ('0000' + card.ID).slice(-4) + " - " + card.name + " " + alteration + " :coin: " + prix + " Rbl " + ' :black_joker:\n';
            }
            var emojiArray = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣"]

            client.channels.cache.get(channelID).send(message)
                .then(function (message) {
                    for (var i = 0; i < blackMarketCards.length; i++) {
                        message.react(emojiArray[i])
                    }
                    //message.react("1️⃣")
                    //message.react("2️⃣")
                    //message.react("3️⃣")
                    //message.react("4️⃣")
                    //message.react("5️⃣")
                }).catch(function () {
                    //Something
                });
        }
    })
}


//----------------------------------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------------------------------
// Fonctions Secondaire ------------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------------------------------

function checkBlackMarket(callback) 
{
    // on vérifie si on a déjà un black market de créé aujourd'hui
    var today = getDate();
    DB.getLastBlackMarket(db, today, function (baseDate) {
        // Si date base != date aujourd'hui, il n'y a pas de blackmarket de créé aujourd'hui > création
        if (today != baseDate) {
            DB.insertNewBlackMarket(db, today, function (blackMarketId) {
                // Tirage de carte rare
                getCardAsyncForBlackMarket(blackMarketId, '', 5, function () {
                    var consoleMessage = "Pas de market aujourd'hui : création ok";
                    if (callback) callback(consoleMessage);
                })
            })            
        }
        else {
            var consoleMessage = "Un market existe déjà"
            if (callback) callback(consoleMessage);
        }
    })
}

// Génération des cartes (async bidouillé pour marcher) pour un utilisateur
function getCardAsync(userID, message, iteration, callbackEnd) {
    console.log("getCardAsync");
    var card = new Card();
    card.generateRarityAndAlteration();

    DB.getRandomCards(db, card.rarityValue, function (cardObj) {
        card.setID(cardObj["ASSET_ID"]);
        card.setName(cardObj["NAME"]);
        console.log(card.ID);
        console.log(card.name);
        console.log('isGold:' + card.isGold + '|isReversed:' + card.isReversed + '|isHolo:' + card.isHolo);

        // Calcul du nombre de point pour la nouvelle carte
        var nombrePoint = card.calculateFragment(card.rarityValue, card.isGold, card.isReversed, card.isHolo, 1);

        // Attribution de la carte à l'utilisateur
        DB.giveCardToUser(db, userID, card.ID, card.isGold, card.isReversed, card.isHolo);

        // Ajout des points à l'utilisateur
        DB.givePointsToUser(db, userID, nombrePoint);

        var alterMessage = "";
        // ajout message pour les altérations
        if (card.isGold == 1) {
            alterMessage += " **DORÉE !**";
        }
        if (card.isReversed == 1) {
            alterMessage += " **REVERSED !**";
        }
        if (card.isHolo == 1) {
            alterMessage += " **HOLOGRAPHIQUE !**";
        }

        var m = message + "**" + card.tierMessage + "** : #" + ('0000' + card.ID).slice(-4) + " - " + card.name + alterMessage + "\n";

        if (iteration - 1 > 0) {
            --iteration;
            getCardAsync(userID, m, iteration, callbackEnd)
        }
        else {
            callbackEnd(m);
        }
    });
}

function getCardAsyncForBlackMarket(blackMarketId, message, iteration, callbackEnd) {
    console.log("getCardAsyncForBlackMarket");
    var card = new Card();
    card.generateRarityAndAlterationBlackMarket();

    DB.getRandomCards(db, card.rarityValue, function (cardObj) {
        card.setID(cardObj["ASSET_ID"]);
        card.setName(cardObj["NAME"]);
        console.log(card.ID);
        console.log(card.name);
        console.log('isGold:' + card.isGold + '|isReversed:' + card.isReversed + '|isHolo:' + card.isHolo);

        // Attribution de la carte à l'utilisateur
        DB.setCardToBlackMarket(db, blackMarketId, card.ID, card.isGold, card.isReversed, card.isHolo);

        if (iteration - 1 > 0) {
            --iteration;
            getCardAsyncForBlackMarket(blackMarketId, message, iteration, callbackEnd)
        }
        else {
            callbackEnd(message);
        }
    });
}


// Destruction des cartes (async bidouillé pour marcher)
function destroyCardsAsync(card, alteration, iteration, callbackEnd) {


    if (iteration - 1 > 0) {
        --iteration;
        getCardAsync(userID, m, iteration, callbackEnd)
    }
    else {
        callbackEnd(m);
    }
}

// Affiche un message sur un channel
function displayMessage(c, m) {
    client.channels.cache.get(c).send(m);
};

// Retourne un entier aléatoire 
function getRandomInt(number) {
    return Math.floor(Math.random() * Math.floor(number));
};

// Récupère une carte
function getCard(db, userID, cardID, number, is_gold, is_reversed, is_holo, callback) {
    // requete SQL
    var sqlString = "SELECT RARITY_VALUE FROM OURSS.USER_CARD_RELATION JOIN OURSS.CARD ON USER_CARD_RELATION.ASSET_CARD = CARD.ASSET_ID WHERE ASSET_CARD = " + cardID + " AND ASSET_USER = (SELECT ASSET_ID FROM OURSS.USER WHERE DISCORD_ID = '" + userID + "') AND IS_GOLD = " + is_gold + " AND IS_REVERSED = " + is_reversed + " AND IS_HOLO = " + is_holo + " LIMIT " + number + ";"
    //console.log(sqlString);
    DB.query(db, sqlString, function (err, result) {
        log("getCard:" + JSON.stringify(result), null);
        if (result.length > 0) {
            // Rareté de la carte
            var rarity = result[0]["RARITY_VALUE"];

            if (callback) {
                callback(rarity);
            }
        }
        else {
            callback(0);
        }
    });
};

// Gstion des cartes du bm
function getChosenCardBlackMarket(userID, channelID, bmMessage, emoji) 
{
    var card = new Card();
    var emojiNumberInMessage = '';

    // Récupèration de l'emoji de borne
    if (emoji == '1️⃣') {
        emojiNumberInMessage = ':one:';
    }
    else if (emoji == '2️⃣') {
        emojiNumberInMessage = ':two:';
    }
    else if (emoji == '3️⃣') {
        emojiNumberInMessage = ':three:';
    }
    else if (emoji == '4️⃣') {
        emojiNumberInMessage = ':four:';
    }
    else if (emoji == '5️⃣') {
        emojiNumberInMessage = ':five:';
    }

    // On cherche la première itaration de l'emoji chiffre correspondant à la carte (c'est un peu de la merde mais ça devrait faire le taf...)
    var bmMessageFromNumberEmoji = bmMessage.substr(bmMessage.search(emojiNumberInMessage), bmMessage.length);
    var coinEmojiIndex = bmMessageFromNumberEmoji.indexOf(':coin:');
    var hashtagIndex = bmMessageFromNumberEmoji.indexOf('#');
    var RblIndex = bmMessageFromNumberEmoji.indexOf('Rbl');

    var cardLine = bmMessageFromNumberEmoji.substr(hashtagIndex + 1, coinEmojiIndex - hashtagIndex - 2);
    var cardNumber = cardLine.substr(0, 4);
    var rarityInMessage = bmMessageFromNumberEmoji.substr(emojiNumberInMessage.length + 1, hashtagIndex - (emojiNumberInMessage.length + 4));
    var starCount = (rarityInMessage.match(/star/g) || []).length;
    var amount = Number.parseInt(bmMessageFromNumberEmoji.substr(coinEmojiIndex + 7, RblIndex - (coinEmojiIndex + 7)));

    if (starCount == 5) {
        card.rarityValue = 1;
    }
    else if (starCount == 4) {
        card.rarityValue = 2;
    }
    else if (starCount == 3) {
        card.rarityValue = 3;
    }
    else if (starCount == 2) {
        card.rarityValue = 4;
    }
    else if (starCount == 1) {
        card.rarityValue = 5;
    }

    card.isGold = 0
    card.isReversed = 0
    card.isHolo = 0
    // Attribution des propriétés à la carte
    card.ID = Number.parseInt(cardNumber);
    if (cardLine.indexOf("**DOREE**") != -1) {
        card.isGold = 1;
    }
    if (cardLine.indexOf("**REVERSED**") != -1) {
        card.isReversed = 1;
    }
    if (cardLine.indexOf("**HOLOGRAPHIQUE**") != -1) {
        card.isHolo = 1;
    }

    // Retirer la somme à l'utilisateur
    DB.getUserMoney(db, userID, function (solde) {
        // SOLDE VIDE
        if (solde == 0) {
            endBM(channelID, ":red_circle: <@!" + userID + "> Solde vide");
        }
        // SOLDE INSUFFISANT
        else
        if (amount > solde) {
            endBM(channelID, ":red_circle: <@!" + userID + "> Solde insuffisant");
        }
        else {
            DB.giveMoneyToUser(db, -amount, userID, function () {
                // Calcul du nombre de point pour la nouvelle carte
                var nombrePoint = card.calculateFragment(card.rarityValue, card.isGold, card.isReversed, card.isHolo, 1);

                // Ajout des points à l'utilisateur
                DB.givePointsToUser(db, userID, nombrePoint);

                // Attribution de la carte à l'utilisateur
                DB.giveCardToUser(db, userID, card.ID, card.isGold, card.isReversed, card.isHolo, function () {
                    // Delete card in black market
                    DB.deleteCardInBlackMarket(db, card.ID, function () {
                        endBM(channelID, ":partying_face: **BRAVO** Vous avez achetez la carte #" + cardLine + " !");
                        //displayMessage(channelID, ":partying_face: **BRAVO** Vous avez achetez la carte #" + cardLine + " !")
                    });
                });
            });
        }
    });

    function endBM(c, m) {
        displayMessage(c, m)
    }
}

function log(message, severity = null) {
    if (severity == null) {
        severity = "INFO";
    }
    var d = new Date(Date.now());
    var m = d + " bot.js - S:" + severity + " : " + message;
    fs.appendFile('communist_manifesto.log', m + "\n", function (err) {
        if (err) return console.log(err);
        if (DEBUG) console.log(m);
    });
};

function getDate() 
{
    var d = new Date(Date.now());
    return d.getFullYear() + ("0" + (d.getMonth() + 1)).slice(-2) + ("0" + d.getDate()).slice(-2);
}

function syncLoop(iterations, process, exit) {
    var index = 0,
        done = false,
        shouldExit = false;
    var loop = {
        next: function () {
            if (done) {
                if (shouldExit && exit) {
                    return exit(); // Exit if we're done
                }
            }
            // If we're not finished
            if (index < iterations) {
                index++; // Increment our index
                process(loop); // Run our process, pass in the loop
                // Otherwise we're done
            } else {
                done = true; // Make sure we say we're done
                if (exit) exit(); // Call the callback on exit
            }
        },
        iteration: function () {
            return index - 1; // Return the loop number we're on
        },
        break: function (end) {
            done = true; // End the loop
            shouldExit = end; // Passing end as true means we still call the exit callback
        }
    };
    loop.next();
    return loop;
}