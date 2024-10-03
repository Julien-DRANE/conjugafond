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

// Variables pour les sons
let successSound = new Audio("sounds/success.mp3");
let wrongSound = new Audio("sounds/wrong.mp3");

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
    currentPronoun = pronouns[Math.floor(Math.random() * pronouns.length)];

    // Mettre à jour les slots de l'interface
    document.getElementById("verb-slot").textContent = currentVerb;
    document.getElementById("tense-slot").textContent = currentTense;
    document.getElementById("pronoun-slot").textContent = currentPronoun;
    document.getElementById("display-pronoun").textContent = currentPronoun;

    // Réinitialiser l'input et cacher le message
    document.getElementById("user-input").value = "";
    document.getElementById("message").style.display = "none";

    // Masquer le bouton "Afficher la réponse" jusqu'à ce que le joueur échoue deux fois
    document.getElementById("show-answer-btn").style.display = "none";
    revealAnswerUsed = false;

    console.log(`Nouvelle question : ${currentPronoun} ${currentVerb} à ${currentTense}`);
}

// Fonction pour vérifier la réponse
function checkAnswer() {
    if (!gameActive) return;

    let userInput = document.getElementById("user-input").value.trim().toLowerCase();
    let expectedAnswer = verbData.verbs.find(v => v.infinitive === currentVerb).conjugations[currentTense][currentPronoun].toLowerCase();

    console.log(`Réponse attendue : ${expectedAnswer}, Réponse donnée : ${userInput}`);

    if (userInput === expectedAnswer) {
        if (!revealAnswerUsed) { // Si la réponse n'a pas été révélée
            points += duoMode ? 2 : (extremeMode ? 3 : 1); // Points normaux, doublés ou triplés en fonction du mode
        }
        attemptsLeft = 3;
        document.getElementById("points").textContent = `${points} / 33`;
        document.getElementById("message").textContent = "Bonne réponse !";
        document.getElementById("message").classList.remove("error");
        document.getElementById("message").classList.add("success");
        document.getElementById("message").style.display = "block";
        successSound.play();

        // Afficher l'image "Bonne Réponse !" pendant 1,5 seconde
        const goodAnswerImg = document.getElementById("good-answer-img");
        goodAnswerImg.style.display = "block";
        setTimeout(() => {
            goodAnswerImg.style.display = "none";
        }, 1500);

        // Afficher la bulle "Bonne Réponse !"
        showGoodAnswerBubble();

        // Vérifier la fin de partie (atteinte de 33 points)
        if (points >= 33) {
            showWinningMessage();
        } else {
            spin(); // Recharger un nouveau verbe
        }
    } else {
        points -= 1; // Retirer 1 point dans tous les modes en cas de mauvaise réponse
        attemptsLeft -= 1;
        document.getElementById("points").textContent = `${points} / 33`;
        console.log(`Mauvaise réponse. Tentatives restantes : ${attemptsLeft}`);

        if (attemptsLeft > 0) {
            document.getElementById("message").textContent = "Mauvaise réponse. Réessayez.";
        } else {
            document.getElementById("message").textContent = `Mauvaise réponse. La bonne réponse était : ${expectedAnswer}`;
            attemptsLeft = 3;

            // Afficher le bouton "Afficher la réponse" après deux erreurs (soit au troisième essai)
            document.getElementById("show-answer-btn").style.display = "block";
            console.log("Bouton 'Afficher la réponse' affiché.");

            spin(); // Recharger un nouveau verbe après affichage de la bonne réponse
        }
        document.getElementById("message").classList.remove("success");
        document.getElementById("message").classList.add("error");
        document.getElementById("message").style.display = "block";
        wrongSound.play();
    }

    document.getElementById("user-input").value = "";
    document.getElementById("attempts").textContent = attemptsLeft;
}

// Fonction pour afficher la bulle "Bonne Réponse !"
function showGoodAnswerBubble() {
    const bubble = document.getElementById("good-answer-bubble");
    bubble.style.display = "block"; // Afficher la bulle
    bubble.classList.add("show-answer-bubble"); // Ajouter la classe d'animation

    // Cacher la bulle après 1,3 seconde
    setTimeout(() => {
        bubble.classList.remove("show-answer-bubble");
        bubble.classList.add("hide-answer-bubble");
    }, 1300);

    // Cacher définitivement après 1,5 seconde
    setTimeout(() => {
        bubble.classList.remove("hide-answer-bubble");
        bubble.style.display = "none";
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
    document.getElementById("points").textContent = `${points} / 33`;
    document.getElementById("attempts").textContent = attemptsLeft;
    spin();
    gameActive = true;
}

// Écouteurs d'événements
document.getElementById("spin-btn").addEventListener("click", spin);
document.getElementById("submit-btn").addEventListener("click", checkAnswer);
document.getElementById("toggle-mode-btn").addEventListener("click", toggleExtremeMode);
document.getElementById("toggle-duo-btn").addEventListener("click", toggleDuoMode);
document.getElementById("show-answer-btn").addEventListener("click", () => {
    document.getElementById("message").textContent = `Réponse : ${verbData.verbs.find(v => v.infinitive === currentVerb).conjugations[currentTense][currentPronoun]}`;
    document.getElementById("message").classList.remove("error");
    document.getElementById("message").classList.add("success");
    document.getElementById("message").style.display = "block";
    revealAnswerUsed = true; // Marquer que la réponse a été révélée
    gameActive = false; // Désactiver le jeu si la réponse est affichée
});

// Validation par la touche Entrée
document.getElementById("user-input").addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        checkAnswer();
    }
});
