//----------------------------------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------------------------------
// Fonctions Base de données -------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------------------------------

// Include et require

'use strict';
const config = require('./config.json');

//----------------------------------------------------------------------------------------------------------------------------------------------


module.exports = class Card{
    constructor(cardID, isGold, isReversed, isHolo, ownerDiscordID){
        this.ID = cardID;
        this.name = null;
        this.isGold = isGold;
        this.isReversed = isReversed;
        this.isHolo = isHolo;
        this.ownerDiscordID = ownerDiscordID;
        this.rarityValue = null;
        this.tierMessage = null;
    };

    setID(ID) {
        this.ID = ID;
    };

    setName(name) {
        this.name = name;
    };

    test(){
        console.log("TOTO");
    };

    // Donne une rareté + altération aléatoire
    generateRarityAndAlteration() {
        // SELECTION DE LA CARTE
        var randomNumber = _getRandomInt(5000);
        var tier = '';
        var rarity_value = 0;

        if (randomNumber >= 0 && randomNumber <= 20) // LEGENDARY
        {
            console.log("LEGENDARY");
            tier = "LEGENDAIRE :star: :star: :star: :star: :star:";
            rarity_value = 1;
        }
        else if (randomNumber > 20 && randomNumber <= 150) // MYTHIC
        {
            console.log("MYTHIC");
            tier = "MYTHIQUE :star: :star: :star: :star:";
            rarity_value = 2;
        }
        else if (randomNumber > 150 && randomNumber <= 500) // EPIC
        {
            console.log("EPIC");
            tier = "EPIQUE :star: :star: :star:";
            rarity_value = 3;
        }
        else if (randomNumber > 500 && randomNumber <= 1500) // RARE
        {
            console.log("RARE");
            tier = "RARE :star: :star:";
            rarity_value = 4;
        }
        else if (randomNumber > 1500 && randomNumber <= 4800) // COMMON
        {
            console.log("COMMON");
            tier = "COMMUNE :star:";
            rarity_value = 5;
        }
        else if (randomNumber > 4800 && randomNumber <= 5000) // CURSED
        {
            console.log("CURSED");
            tier = "MAUDITE :skull:";
            rarity_value = 6;
        }
        else {
            console.log("error");
        }

        // SELECTION DU MODIFICATEUR DE CARTE
        // Gold
        var goldRandom = _getRandomInt(1000);
        var isGold = 0;
        if (goldRandom <= 50) {
            isGold = 1;
        }

        // Reversed
        var reversedRandom = _getRandomInt(1000);
        var isReversed = 0;
        if (reversedRandom <= 30) {
            isReversed = 1;
        }

        // Reversed
        var holoRandom = _getRandomInt(1000);
        var isHolo = 0;
        if (holoRandom <= 10) {
            isHolo = 1;
        }

        // Attribution des valeurs à l'instance
        this.rarityValue = rarity_value;
        this.tierMessage = tier;
        this.isGold = isGold;
        this.isReversed = isReversed;
        this.isHolo = isHolo;
    };

    // Donne une rareté + altération aléatoire
    generateRarityAndAlterationBlackMarket() {
        // SELECTION DE LA CARTE
        var randomNumber = _getRandomInt(5000);
        var tier = '';
        var rarity_value = 0;

        if (randomNumber >= 0 && randomNumber <= 1000) // LEGENDARY
        {
            console.log("LEGENDARY");
            tier = "LEGENDAIRE :star: :star: :star: :star: :star:";
            rarity_value = 1;
        }
        else if (randomNumber > 1000 && randomNumber <= 2500) // MYTHIC
        {
            console.log("MYTHIC");
            tier = "MYTHIQUE :star: :star: :star: :star:";
            rarity_value = 2;
        }
        else if (randomNumber > 2500 && randomNumber <= 4000) // EPIC
        {
            console.log("EPIC");
            tier = "EPIQUE :star: :star: :star:";
            rarity_value = 3;
        }
        else if (randomNumber > 4000 && randomNumber <= 4800) // RARE
        {
            console.log("RARE");
            tier = "RARE :star: :star:";
            rarity_value = 4;
        }
        else if (randomNumber > 4800 && randomNumber <= 5000) // COMMON
        {
            console.log("COMMON");
            tier = "COMMUNE :star:";
            rarity_value = 5;
        }
        else {
            console.log("error");
        }

        // SELECTION DU MODIFICATEUR DE CARTE
        // Gold
        var goldRandom = _getRandomInt(1000);
        var isGold = 0;
        if (goldRandom <= 700) {
            isGold = 1;
        }

        // Reversed
        var reversedRandom = _getRandomInt(1000);
        var isReversed = 0;
        if (reversedRandom <= 500) {
            isReversed = 1;
        }

        // Reversed
        var holoRandom = _getRandomInt(1000);
        var isHolo = 0;
        if (holoRandom <= 200) {
            isHolo = 1;
        }

        // Attribution des valeurs à l'instance
        this.rarityValue = rarity_value;
        this.tierMessage = tier;
        this.isGold = isGold;
        this.isReversed = isReversed;
        this.isHolo = isHolo;
    };

    // Calcul du nombre de fragment donné à l'utilisateur pour la ou les cartes qui veut recycler
    // TODO : refactoring pour implémenter la classe ObjCard
    calculateFragment(cardRarity, isGold, isReversed, isHolo, nbCard) {
        var nbFragment = 0;

        // LEG
        if (cardRarity == 1) {
            nbFragment = nbFragment + config.RECYCLE.LEG.CLC;

            if (isGold == 1) {
                nbFragment = nbFragment + config.RECYCLE.LEG.GLD;
            }
            if (isReversed == 1) {
                nbFragment = nbFragment + config.RECYCLE.LEG.REV;
            }
            if (isHolo == 1) {
                nbFragment = nbFragment + config.RECYCLE.LEG.HOL;
            }
        }
        // MYT
        if (cardRarity == 2) {
            nbFragment = nbFragment + config.RECYCLE.MYT.CLC;

            if (isGold == 1) {
                nbFragment = nbFragment + config.RECYCLE.MYT.GLD;
            }
            if (isReversed == 1) {
                nbFragment = nbFragment + config.RECYCLE.MYT.REV;
            }
            if (isHolo == 1) {
                nbFragment = nbFragment + config.RECYCLE.MYT.HOL;
            }
        }
        // EPI
        if (cardRarity == 3) {
            nbFragment = nbFragment + config.RECYCLE.EPI.CLC;

            if (isGold == 1) {
                nbFragment = nbFragment + config.RECYCLE.EPI.GLD;
            }
            if (isReversed == 1) {
                nbFragment = nbFragment + config.RECYCLE.EPI.REV;
            }
            if (isHolo == 1) {
                nbFragment = nbFragment + config.RECYCLE.EPI.HOL;
            }
        }
        // RAR
        if (cardRarity == 4) {
            nbFragment = nbFragment + config.RECYCLE.RAR.CLC;

            if (isGold == 1) {
                nbFragment = nbFragment + config.RECYCLE.RAR.GLD;
            }
            if (isReversed == 1) {
                nbFragment = nbFragment + config.RECYCLE.RAR.REV;
            }
            if (isHolo == 1) {
                nbFragment = nbFragment + config.RECYCLE.RAR.HOL;
            }
        }
        // COM
        if (cardRarity == 5) {
            nbFragment = nbFragment + config.RECYCLE.COM.CLC;

            if (isGold == 1) {
                nbFragment = nbFragment + config.RECYCLE.COM.GLD;
            }
            if (isReversed == 1) {
                nbFragment = nbFragment + config.RECYCLE.COM.REV;
            }
            if (isHolo == 1) {
                nbFragment = nbFragment + config.RECYCLE.COM.HOL;
            }
        }
        // MAU
        if (cardRarity == 6) {
            nbFragment = nbFragment + config.RECYCLE.MAU.CLC;

            if (isGold == 1) {
                nbFragment = nbFragment + config.RECYCLE.MAU.GLD;
            }
            if (isReversed == 1) {
                nbFragment = nbFragment + config.RECYCLE.MAU.REV;
            }
            if (isHolo == 1) {
                nbFragment = nbFragment + config.RECYCLE.MAU.HOL;
            }
        }

        nbFragment = nbFragment * nbCard;

        return nbFragment;
    };
}

// Retourne un entier aléatoire 
function _getRandomInt(number) {
    return Math.floor(Math.random() * Math.floor(number));
};


//----------------------------------------------------------------------------------------------------------------------------------------------


