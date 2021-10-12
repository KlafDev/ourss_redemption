//----------------------------------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------------------------------
// Fonctions Base de donnÃ©es -------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------------------------------

// Include et require

const DEBUG = false;
const mysql = require('mysql');
const fs = require('fs');

//----------------------------------------------------------------------------------------------------------------------------------------------

// CrÃ©ation de la connexion en base
function getDbConnexion() {
    var db = mysql.createConnection({
        host: "0.0.0.0",
        user: "user",
        password: "password"
    });

    db.on('error', function (err) {
        console.log("[mysql error]", err);
    });

    return db;
}

// MÃ©thode de query gÃ©nÃ©rique
function query(db, queryString, callback) {
    //console.log(queryString);
    db.query(queryString, function (err, result) {
        var r = null;
        if (err) {
            _log("query:" + JSON.stringify(err), "ERROR");         
        }
        else
        {           
            _log("query:" + JSON.stringify(result), null);
            r = JSON.parse(JSON.stringify(result));
        }
        if (callback) callback(null, r);
    });
}

// Donne des points Ã  un user
function givePointsToUser(db, userID, nbPoint, callback) {
    db.query("UPDATE OURSS.USER SET POINT = POINT + " + nbPoint + " WHERE DISCORD_ID = '" + userID + "';", function (err, result) {
        _log("givePointsToUser:" + JSON.stringify(result), null);
        if (callback) {
            callback();
        }
    });
}

// Donne des fragments Ã  un user
function giveFragmentToUser(db, userID, nbFragment, callback) {
    db.query("UPDATE OURSS.USER SET FRAGMENT = FRAGMENT + " + nbFragment + " WHERE DISCORD_ID = '" + userID + "';", function (err, result) {
        _log("giveFragmentToUser:" + JSON.stringify(result), null);
        if (callback) {
            callback();
        }
    });
}

// Retire une carte à un user
function removeCardFromUser(db, userID, cardID, nbCard, callback) {
    var sql = "SELECT ASSET_ID FROM OURSS.USER_CARD_RELATION WHERE ASSET_CARD = " + cardID + " AND ASSET_USER = (SELECT ASSET_ID FROM OURSS.USER WHERE DISCORD_ID = '" + userID + "') LIMIT " + nbCard + ";";
    db.query(sql, function (err, result) {
        _log("removeCardFromUser:" + JSON.stringify(result), null);
        if (result.length > 0) {
            var ids = [];
            for (var i = 0; i < result.length; ++i) {
                ids.push(result[i]["ASSET_ID"]);
            }
            _log("removeCardFromUser:" + ids.join(', '), null);
            db.query("DELETE FROM OURSS.USER_CARD_RELATION WHERE ASSET_ID IN (" + ids.join(', ') + ");", function (err, result) {
                _log("removeCardFromUser:" + JSON.stringify(result), null);
            });

            if (callback) {
                callback();
            }
        }
    });
};

// Echange une carte d'un userSource à un userTarget
function tradeCardFromSourceToTarget(db, userSource, userTarget, cardID, isGold, isReversed, isHolo, callback) {
    var sql = "UPDATE OURSS.USER_CARD_RELATION SET ASSET_USER = (SELECT ASSET_ID FROM OURSS.USER WHERE DISCORD_ID = '" + userTarget + "') WHERE ASSET_USER = (SELECT ASSET_ID FROM OURSS.USER WHERE DISCORD_ID = '" + userSource + "') AND ASSET_CARD = " + cardID + " AND IS_GOLD = " + isGold + " AND IS_REVERSED = " + isReversed + " AND IS_HOLO = " + isHolo + " LIMIT 1;";
    db.query(sql, function (err, result) {
        if (err) {
            _log("tradeCardFromSourceToTarget:" + JSON.stringify(err), "ERROR");
        }
        _log("tradeCardFromSourceToTarget:" + JSON.stringify(result), null);
        if (callback) {
            callback();
        }
    });
};

// Donne une carte à un user
function giveCardToUser(db, userID, cardID, isGold, isReversed, isHolo, callback) {
    db.query("INSERT INTO OURSS.USER_CARD_RELATION (ASSET_CARD, ASSET_USER, IS_GOLD, IS_REVERSED, IS_HOLO) VALUES (" + cardID + ", (SELECT ASSET_ID FROM OURSS.USER WHERE DISCORD_ID = '" + userID + "'), " + isGold + ", " + isReversed + ", " + isHolo + ");", function (err, result) {
        if (err) {
            _log("giveCardToUser:" + JSON.stringify(err), "ERROR");
        }
        _log("giveCardToUser:" + JSON.stringify(result), null);
                if (callback) {
            callback();
        }
    });
};

// Assigne un nombre de carte au black market
function setCardToBlackMarket(db, blackMarketId, cardID, isGold, isReversed, isHolo, callback) {
    db.query("INSERT INTO OURSS.CARD_BLACK_MARKET_RELATION (ASSET_CARD, ASSET_BLACK_MARKET, IS_GOLD, IS_REVERSED, IS_HOLO) VALUES (" + cardID + ", " + blackMarketId + ", " + isGold + ", " + isReversed + ", " + isHolo + ");", function (err, result) {
        _log("setCardToBlackMarket:" + JSON.stringify(result), null);
        if (callback) {
            callback();
        }
    });
};

// RÃ©cupÃ¨re une carte au hasard pour une raretÃ© donnÃ©e
function getRandomCards(db, rarity_value, callback) {
    db.query("SELECT * FROM OURSS.CARD WHERE RARITY_VALUE = " + rarity_value + " ORDER BY RAND() LIMIT 1;", function (err, result) {
        _log("getRandomCards:" + JSON.stringify(result), null);
        if (callback) {
            callback(JSON.parse(JSON.stringify(result[0])));
        }
    });
};

// Retour le solde d'un utilisateur
function getUserMoney(db, userID, callback) {
    db.query("SELECT BANK, FRAGMENT FROM OURSS.USER WHERE DISCORD_ID = '" + userID + "';", function (err, result) {
        if (err) {
            _log("getUserMoney:" + JSON.stringify(err), "ERROR");
        }
        _log("getUserMoney:" + JSON.stringify(result), null);
        if (callback) {
            var roublions = JSON.parse(JSON.stringify(result))[0]["BANK"];
            var fragments = JSON.parse(JSON.stringify(result))[0]["FRAGMENT"];
            callback(roublions, fragments);
        }
    });
};

// Retourne la derniÃ¨re date de daily du user
function getLastDaily(db, userID, callback) {
    db.query("SELECT DATE_LAST_DAILY FROM OURSS.USER WHERE DISCORD_ID = '" + userID + "';", function (err, result) {
        _log("getLastDaily:" + JSON.stringify(result), null);
        if (callback) {
            callback(JSON.parse(JSON.stringify(result))[0]["DATE_LAST_DAILY"]);
            return;
        }
    });
}

function getLastBlackMarket(db, date, callback) {
    db.query("SELECT DATE FROM OURSS.BLACK_MARKET WHERE DATE = " + date + ";", function (err, result) {
        if (err) {
            _log("getLastBlackMarket:" + JSON.stringify(err), "ERROR");
        }

        if (result.length == 0) {
            callback(0);
            return;
        }
        else {
            _log("getLastBlackMarket:" + JSON.stringify(result), null);
            if (callback) {
                callback(JSON.parse(JSON.stringify(result))[0]["DATE"]);
                return;
            }
        }
    });
}

// Mise Ã  jour de la date du dernier daily Ã  celle d'aujourd'hui
function updateLastDaily(db, date, userID, callback) {
    db.query("UPDATE OURSS.USER SET DATE_LAST_DAILY = '" + date + "' WHERE DISCORD_ID = '" + userID + "';", function (err, result) {
        _log("updateLastDaily:" + JSON.stringify(result), null);
        if (callback) {
            //callback(JSON.parse(JSON.stringify(result))[0]["COUNT(ASSET_ID)"]);
        }
    });
}

// Ajout d'argent Ã  un user depuis sont discord ID
function giveMoneyToUser(db, amount, userID, callback) {
    db.query("UPDATE OURSS.USER SET BANK = BANK + " + amount + " WHERE DISCORD_ID = '" + userID + "';", function (err, result) {
        _log("giveMoneyToUser:" + JSON.stringify(result), null);
        if (callback) {
            callback();
        }
    });
}

// Ajout d'argent Ã  un user depuis sur nom (et pas son discordID)
function giveMoneyToUserFromUserName(db, amount, userName, callback) {
    db.query("UPDATE OURSS.USER SET BANK = BANK + " + amount + " WHERE NAME = '" + userName + "';", function (err, result) {
        _log("giveMoneyToUserFromUserName:" + JSON.stringify(result), null);
        if (callback) {
            callback();
        }
    });
}

// VÃ©rification de l'existance de l'utilisateur en base
function checkIfUserExist(db, userID, callback) {
    db.query("SELECT COUNT(ASSET_ID) FROM OURSS.USER WHERE DISCORD_ID = '" + userID + "';", function (err, result) {
        _log("checkIfUserExist:" + JSON.stringify(result), null);
        if (callback) {
            callback(JSON.parse(JSON.stringify(result))[0]["COUNT(ASSET_ID)"]);
            return;
        }
    });
}

// Insertion d'un nouvelle utilisateur en base
function insertNewUser(db, user, userID, startingSolde, callback) {
    _log("insertNewUser: user = " + user + "/userID:" + userID, null);
    db.query("INSERT INTO OURSS.USER (NAME, DISCORD_ID, BANK, FRAGMENT) VALUES ('" + user + "', '" + userID + "', " + startingSolde + ", 0);", function (err, result) {
        _log("insertNewUser:" + JSON.stringify(result), null);
    });
}

// Insertion d'un nouvel black market en base
function insertNewBlackMarket(db, date, callback) {
    db.query("INSERT INTO OURSS.BLACK_MARKET (DATE) VALUES ('" + date + "');", function (err, result) {
        _log("insertNewBlackMarket:" + JSON.stringify(result.insertId), null);
        if (callback) {
            callback(JSON.stringify(result.insertId));
            return;
        }
    });
}

// Récupération du black market du jour
function getDailyBlackMarket(db, date, callback) {
    db.query("SELECT R.ASSET_CARD, C.NAME, C.RARITY_VALUE, R.IS_GOLD, R.IS_REVERSED, R.IS_HOLO FROM OURSS.CARD_BLACK_MARKET_RELATION R JOIN OURSS.BLACK_MARKET BM ON R.ASSET_BLACK_MARKET = BM.ASSET_ID JOIN OURSS.CARD C ON R.ASSET_CARD = C.ASSET_ID WHERE BM.DATE = '" + date + "' ORDER BY RARITY_VALUE;", function (err, result) {
        _log("getDailyBlackMarket:" + JSON.stringify(result), null);
        if (callback) {
            callback(JSON.parse(JSON.stringify(result)));
            return;
        }
    });
}

// Insertion d'un nouvel black market en base
function deleteCardInBlackMarket(db, cardID, callback) {
    db.query("DELETE FROM OURSS.CARD_BLACK_MARKET_RELATION WHERE ASSET_CARD = " + cardID + ";", function (err, result) {
        if (err) {
            _log("deleteCardInBlackMarket:" + JSON.stringify(err), "ERROR");
        }
        _log("deleteCardInBlackMarket:" + JSON.stringify(result), null);
        if (callback) {
            callback();
            return;
        }
    });
}

function _log(message, severity = null) {
    if (severity == null) {
        severity = "INFO";
    }
    var d = new Date(Date.now());
    var m = d + " db.js  - S:" + severity + " : " + message;
    fs.appendFile('communist_manifesto.log', m + "\n", function (err) {
        if (err) return console.log(err);
        if (DEBUG) console.log(m);
    });
};



// Liste des exports (toutes les fonctions publiques doivent Ãªtre listÃ© lÃ  dedans)
module.exports = {
    getDbConnexion,
    query,
    givePointsToUser,
    giveFragmentToUser,
    removeCardFromUser,
    giveCardToUser,
    getRandomCards,
    getUserMoney,
    getLastDaily,
    updateLastDaily,
    giveMoneyToUser,
    giveMoneyToUserFromUserName,
    checkIfUserExist,
    insertNewUser,
    tradeCardFromSourceToTarget,
    getLastBlackMarket,
    insertNewBlackMarket,
    setCardToBlackMarket,
    getDailyBlackMarket,
    deleteCardInBlackMarket
};