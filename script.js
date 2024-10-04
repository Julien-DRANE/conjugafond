// Déclaration des temps pour les modes normal, extrême et duo
const normalTenses = [
    "présent",
    "passé composé",
    "imparfait",
    "futur simple"
];

const extremeTenses = [
    "imparfait du subjonctif",
    "subjonctif passé",
    "conditionnel présent",
    "passé simple",
    "plus-que-parfait",
    "passé antérieur",
    "futur antérieur",
    "conditionnel passé première forme"
];

const duoTenses = [
    "passé simple",
    "futur antérieur"
];

// Variables globales
let currentVerb = "";
let currentTense = "";
let currentPronoun = "";
let attemptsLeft = 3;
let points = 0;
let extremeMode = false;
let duoMode = false;
let revealAnswerUsed = false; // Variable pour vérifier si le joueur a révélé la réponse
let gameActive = true;

let comboCount = 0; // Ajouter une variable pour le Combo
const maxCombo = 4; // Nombre de bonnes réponses consécutives pour le Combo

// Variables pour les sons
let successSound = document.getElementById("success-sound");
let wrongSound = document.getElementById("wrong-sound");
let comboSound = document.getElementById("combo-sound"); // Ajouter la référence au son Combo

// JSON des conjugaisons de verbes (à remplir avec votre JSON des conjugaisons)
let verbData = {};

// Charger le JSON depuis un fichier local
fetch('verbs.json')
    .then(response => response.json())
    .then(data => {
        verbData = data;
        console.log("JSON Loaded:", verbData);
        spin(); // Démarrer le premier tour
    })
    .catch(error => console.error("Error loading JSON:", error));

// Fonction pour activer/désactiver le mode extrême
function toggleExtremeMode() {
    if (!gameActive) return;

    extremeMode = !extremeMode;
    duoMode = false; // Désactiver le mode duo si le mode extrême est activé
    document.body.classList.toggle("extreme-mode", extremeMode);
    document.body.classList.remove("duo-mode"); // Retirer la classe duo-mode
    document.getElementById("toggle-mode-btn").textContent = extremeMode ? "Désactiver Mode Extrême" : "Mode Extrême";
    document.getElementById("toggle-duo-btn").textContent = "Mode Duo";
    spin(); // Recharger un verbe avec les temps extrêmes
}

// Fonction pour activer/désactiver le mode duo
function toggleDuoMode() {
    if (!gameActive) return;

    duoMode = !duoMode;
    extremeMode = false; // Désactiver le mode extrême si le mode duo est activé
    document.body.classList.toggle("duo-mode", duoMode);
    document.body.classList.remove("extreme-mode"); // Retirer la classe extreme-mode
    document.getElementById("toggle-duo-btn").textContent = duoMode ? "Désactiver Mode Duo" : "Mode Duo";
    document.getElementById("toggle-mode-btn").textContent = "Mode Extrême";
    spin(); // Recharger un verbe avec les temps duo
}

// Fonction pour faire tourner les slots
function spin() {
    if (!gameActive) return;

    let verbs = verbData.verbs;
    if (!verbs || verbs.length === 0) {
        console.error("Aucun verbe chargé dans le JSON");
        return;
    }

    // Sélectionner un verbe aléatoire
    let randomVerb = verbs[Math.floor(Math.random() * verbs.length)];
    currentVerb = randomVerb.infinitive;

    // Déterminer les temps en fonction du mode
    let tenses = normalTenses;
    if (extremeMode) {
        tenses = extremeTenses;
    } else if (duoMode) {
        tenses = duoTenses;
    }
    currentTense = tenses[Math.floor(Math.random() * tenses.length)];

    // Sélectionner un pronom aléatoire parmi les pronoms disponibles pour le temps choisi
    let pronouns = Object.keys(randomVerb.conjugations[currentTense]);
    if (!pronouns || pronouns.length === 0) {
        console.error(`Aucun pronom trouvé pour le temps ${currentTense} du verbe ${currentVerb}`);
        return;
    }
    currentPronoun = pronouns[Math.floor(Math.random() * pronouns.length)];

    // Mettre à jour les slots de l'interface
    document.getElementById("verb-slot").textContent = currentVerb;
    document.getElementById("tense-slot").textContent = currentTense;
    document.getElementById("pronoun-slot").textContent = currentPronoun;
    document.getElementById("display-pronoun").textContent = currentPronoun;

    // Réinitialiser l'input et cacher le message
    document.getElementById("user-input").value = "";
    document.getElementById("message").style.display = "none";

    // Réinitialiser les tentatives
    attemptsLeft = 3;
    document.getElementById("attempts").textContent = attemptsLeft;

    // Réinitialiser la révélation de la réponse
    revealAnswerUsed = false;

    // Mettre à jour la jauge Combo
    updateComboGauge();

    console.log(`Nouvelle question : ${currentPronoun} ${currentVerb} à ${currentTense}`);
}

// Fonction pour vérifier la réponse
function checkAnswer() {
    if (!gameActive) return;

    let userInput = document.getElementById("user-input").value.trim().toLowerCase();
    let verbEntry = verbData.verbs.find(v => v.infinitive === currentVerb);
    if (!verbEntry) {
        console.error(`Verbe ${currentVerb} non trouvé dans le JSON.`);
        return;
    }
    let expectedAnswer = verbEntry.conjugations[currentTense][currentPronoun].toLowerCase();

    if (userInput === expectedAnswer) {
        if (!revealAnswerUsed) { // Incrémenter le Combo seulement si la réponse n'a pas été révélée
            points += duoMode ? 2 : (extremeMode ? 3 : 1); // Points normaux, doublés ou triplés en fonction du mode
            comboCount += 1; // Incrémenter le Combo
            updateComboGauge();
        } else {
            // Si la réponse a été révélée, ne pas incrémenter le Combo
            document.getElementById("message").textContent = "Bonne réponse ! (Réponse révélée)";
        }

        points = Math.max(points, 0); // Assurez-vous que les points ne descendent pas en dessous de 0
        document.getElementById("points").textContent = `${points} / 33`;
        document.getElementById("message").classList.remove("error");
        document.getElementById("message").classList.add("success");
        document.getElementById("message").style.display = "block";
        successSound.play();

        // Vérifier si le Combo est atteint
        if (comboCount === maxCombo) {
            points += 5; // Bonus de points pour le Combo
            document.getElementById("points").textContent = `${points} / 33`;
            document.getElementById("message").textContent += " Combo ! +5 points !";
            comboSound.play(); // Jouer le son Combo
            // Réinitialiser le Combo
            comboCount = 0;
            updateComboGauge();
        }

        // Afficher la bulle "Bonne Réponse !" pendant 1,5 seconde
        showGoodAnswerBubble();

        // Vérifier la fin de partie (atteinte de 33 points)
        if (points >= 33) {
            showWinningMessage();
        } else {
            // Charger un nouveau verbe après un délai pour permettre à la bulle d'être visible
            setTimeout(spin, 2000); // 2 secondes
        }
    } else {
        // Mauvaise réponse
        comboCount = 0; // Réinitialiser le Combo
        updateComboGauge();
        attemptsLeft -= 1;
        document.getElementById("attempts").textContent = attemptsLeft;

        if (attemptsLeft === 0) {
            // Après trois échecs
            points -= 1; // Retirer 1 point
            points = Math.max(points, 0); // Assurez-vous que les points ne descendent pas en dessous de 0
            document.getElementById("points").textContent = `${points} / 33`;
            document.getElementById("message").textContent = `Mauvaise réponse. La bonne réponse était : ${expectedAnswer}`;
            document.getElementById("message").classList.remove("success");
            document.getElementById("message").classList.add("error");
            document.getElementById("message").style.display = "block";
            wrongSound.play();

            // Réinitialiser les tentatives
            attemptsLeft = 3;
            document.getElementById("attempts").textContent = attemptsLeft;

            // Charger un nouveau verbe après un délai
            setTimeout(spin, 2000); // 2 secondes
        } else {
            // Moins de trois échecs
            document.getElementById("message").textContent = "Mauvaise réponse. Réessayez.";
            document.getElementById("message").classList.remove("success");
            document.getElementById("message").classList.add("error");
            document.getElementById("message").style.display = "block";
            wrongSound.play();
        }
    }

    document.getElementById("user-input").value = "";
}

// Fonction pour afficher la bulle "Bonne Réponse !"
function showGoodAnswerBubble() {
    const bubble = document.getElementById("answer-bubble");
    bubble.style.display = "block"; // Afficher la bulle
    bubble.style.opacity = "1"; // Rendre visible

    // Cacher la bulle après 1,5 seconde
    setTimeout(() => {
        bubble.style.opacity = "0"; // Rendre invisible
        setTimeout(() => {
            bubble.style.display = "none"; // Cacher complètement
        }, 500); // Temps de transition
    }, 1500);
}

// Fonction pour afficher le message de victoire
function showWinningMessage() {
    const winningMessage = document.getElementById("winning-bubble");
    winningMessage.style.display = "block";
    winningMessage.textContent = `Gagné ! Votre score : ${points} / 33`;

    // Jouer un son de victoire si disponible
    // let victorySound = new Audio("sounds/victory.mp3");
    // victorySound.play();

    // Réinitialiser le jeu après 2 secondes
    setTimeout(() => {
        winningMessage.style.display = "none";
        resetGame(); // Réinitialiser le jeu après avoir affiché le message de victoire
    }, 2000);
}

// Réinitialisation du jeu
function resetGame() {
    points = 0;
    attemptsLeft = 3;
    comboCount = 0; // Réinitialiser le Combo
    document.getElementById("points").textContent = `${points} / 33`;
    document.getElementById("attempts").textContent = attemptsLeft;
    updateComboGauge(); // Réinitialiser la jauge Combo
    spin();
    gameActive = true;
}

// Fonction pour mettre à jour la jauge Combo avec un gradient dynamique
function updateComboGauge() {
    const comboGauge = document.getElementById("combo-gauge");
    const percentage = (comboCount / maxCombo) * 100;
    comboGauge.style.width = `${percentage}%`;

    // Changer le gradient en fonction de la progression
    if (percentage <= 50) {
        comboGauge.style.background = `linear-gradient(to right, orange, yellow ${percentage}%)`;
    } else {
        comboGauge.style.background = `linear-gradient(to right, orange, yellow 50%, green ${percentage}%)`;
    }
}

// Écouteurs d'événements
document.getElementById("spin-btn").addEventListener("click", spin);
document.getElementById("submit-btn").addEventListener("click", checkAnswer);
document.getElementById("toggle-mode-btn").addEventListener("click", toggleExtremeMode);
document.getElementById("toggle-duo-btn").addEventListener("click", toggleDuoMode);
document.getElementById("show-answer-btn").addEventListener("click", () => {
    const verbEntry = verbData.verbs.find(v => v.infinitive === currentVerb);
    if (!verbEntry) {
        console.error(`Verbe ${currentVerb} non trouvé dans le JSON.`);
        return;
    }
    const expectedAnswer = verbEntry.conjugations[currentTense][currentPronoun];
    document.getElementById("message").textContent = `Réponse : ${expectedAnswer}`;
    document.getElementById("message").classList.remove("error");
    document.getElementById("message").classList.add("success");
    document.getElementById("message").style.display = "block";
    revealAnswerUsed = true; // Marquer que la réponse a été révélée
});

// Validation par la touche Entrée
document.getElementById("user-input").addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        checkAnswer();
    }
});
