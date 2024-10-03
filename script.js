// Déclaration des temps pour les modes normal, extrême et duo
const normalTenses = [
    "présent",
    "passé composé",
    "imparfait",
    "passé simple",
    "futur simple"
];

const extremeTenses = [
    "imparfait du subjonctif",
    "subjonctif passé",
    "conditionnel présent",
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

// Variables pour les sons
let successSound = new Audio("sounds/success.mp3");
let wrongSound = new Audio("sounds/wrong.mp3");

// JSON des conjugaisons de verbes (à remplir avec votre JSON des conjugaisons)
let verbData = {};

// Charger le JSON depuis un fichier local (assurez-vous que 'verbs.json' est bien à la racine de votre projet)
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
    duoMode = !duoMode;
    extremeMode = false; // Désactiver le mode extrême si le mode duo est activé
    document.body.classList.toggle("duo-mode", duoMode);
    document.body.classList.remove("extreme-mode"); // Retirer la classe extreme-mode
    document.getElementById("toggle-duo-btn").textContent = duoMode ? "Désactiver Mode Duo" : "Mode Duo";
    document.getElementById("toggle-mode-btn").textContent = "Mode Extrême";
    spin(); // Recharger un verbe avec les temps du mode duo
}

// Fonction pour faire tourner les slots
function spin() {
    let verbs = verbData.verbs;
    if (!verbs || verbs.length === 0) {
        console.error("Aucun verbe chargé dans le JSON");
        return;
    }

    let randomVerb = verbs[Math.floor(Math.random() * verbs.length)];
    currentVerb = randomVerb.infinitive;

    // Choisir les temps en fonction du mode activé
    let tenses;
    if (duoMode) {
        tenses = duoTenses;
    } else if (extremeMode) {
        tenses = extremeTenses;
    } else {
        tenses = normalTenses;
    }

    currentTense = tenses[Math.floor(Math.random() * tenses.length)];

    let pronouns = Object.keys(randomVerb.conjugations[currentTense]);
    currentPronoun = pronouns[Math.floor(Math.random() * pronouns.length)];

    document.getElementById("verb-slot").textContent = currentVerb;
    document.getElementById("tense-slot").textContent = currentTense;
    document.getElementById("pronoun-slot").textContent = currentPronoun;
    document.getElementById("display-pronoun").textContent = currentPronoun;

    document.getElementById("user-input").value = "";
    document.getElementById("message").style.display = "none";
    document.getElementById("show-answer-btn").style.display = "none"; // Cacher le bouton "Afficher la réponse"
    revealAnswerUsed = false; // Réinitialiser la variable de révélation de réponse
}

// Fonction pour vérifier la réponse
function checkAnswer() {
    let userInput = document.getElementById("user-input").value.trim().toLowerCase();
    let expectedAnswer = verbData.verbs.find(v => v.infinitive === currentVerb).conjugations[currentTense][currentPronoun].toLowerCase();

    if (userInput === expectedAnswer) {
        if (!revealAnswerUsed) { // Si la réponse n'a pas été révélée
            points += duoMode ? 2 : (extremeMode ? 3 : 1); // Points normaux, doublés ou triplés en fonction du mode
        }
        attemptsLeft = 3;
        document.getElementById("points").textContent = points;
        document.getElementById("message").textContent = "Bonne réponse !";
        document.getElementById("message").classList.remove("error");
        document.getElementById("message").classList.add("success");
        document.getElementById("message").style.display = "block";

        // Jouer le son de réussite
        successSound.play();

        // Afficher la bulle "Bonne Réponse !"
        showGoodAnswerBubble();

        // Vérifier si le score atteint 33 dans n'importe quel mode
        if (points >= 33) {
            showWinningMessage();
        } else {
            spin(); // Recharger un nouveau verbe
        }
    } else {
        points -= 1; // Retirer 1 point dans tous les modes en cas de mauvaise réponse
        attemptsLeft -= 1;
        if (attemptsLeft > 0) {
            document.getElementById("message").textContent = "Mauvaise réponse. Réessayez.";
        } else {
            document.getElementById("message").textContent = `Mauvaise réponse. La bonne réponse était : ${expectedAnswer}`;
            attemptsLeft = 3;
            spin();
        }
        document.getElementById("message").classList.remove("success");
        document.getElementById("message").classList.add("error");
        document.getElementById("message").style.display = "block";

        // Jouer le son d'erreur
        wrongSound.play();

        // Afficher le bouton "Afficher la réponse" après le 3ème essai
        if (attemptsLeft === 0) {
            document.getElementById("show-answer-btn").style.display = "block";
        }
    }

    document.getElementById("user-input").value = "";
    document.getElementById("attempts").textContent = attemptsLeft;
    document.getElementById("points").textContent = points;
}

// Fonction pour afficher la bulle "Bonne Réponse !"
function showGoodAnswerBubble() {
    const bubble = document.getElementById("good-answer-bubble");
    bubble.style.display = "block"; // Afficher la bulle
    bubble.classList.add("zoom-in"); // Ajouter la classe d'animation
    setTimeout(() => {
        bubble.style.display = "none"; // Cacher la bulle après 1,3 seconde
        bubble.classList.remove("zoom-in"); // Retirer la classe d'animation
    }, 1300);
}

// Fonction pour afficher le message de victoire
function showWinningMessage() {
    const winningMessage = document.getElementById("winning-message");
    winningMessage.style.display = "block";
    setTimeout(() => {
        winningMessage.style.display = "none";
        resetGame(); // Réinitialiser le jeu après avoir affiché le message de victoire
    }, 2000);
}

// Réinitialisation du jeu
function resetGame() {
    points = 0;
    attemptsLeft = 3;
    document.getElementById("points").textContent = points;
    document.getElementById("attempts").textContent = attemptsLeft;
    spin();
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
});

// Validation par la touche Entrée
document.getElementById("user-input").addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        checkAnswer();
    }
});
