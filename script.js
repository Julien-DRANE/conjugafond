// Variables globales 
let verbes;
let verbesTurbo;
let verbesExtreme; // Ajout pour le mode EXTREME
let groupeActuel = "premierGroupe";

const sujets = ["je", "tu", "il", "nous", "vous", "ils"];
const descriptionPronoms = {
    je: "à la première personne du singulier",
    tu: "à la deuxième personne du singulier",
    il: "à la troisième personne du singulier",
    nous: "à la première personne du pluriel",
    vous: "à la deuxième personne du pluriel",
    ils: "à la troisième personne du pluriel"
};

const coefficients = {
    premierGroupe: 1,
    deuxiemeGroupe: 2,
    troisiemeGroupe: 3,
    extreme: 3 // Coefficient pour le mode EXTREME
};

let score = 0;
let currentQuestion = 0;
const totalQuestions = 5;
let temps;
let verbeActuel;
let historique = [];
let modeAleatoireActif = true;
let modeTurboActif = false; // Mode TURBO désactivé par défaut
let modeExtremeActif = false; // Mode EXTREME désactivé par défaut
let groupesUtilises = new Set();

const tempsTurbo = [
    "présent",
    "futur",
    "imparfait",
    "passé composé",
    "imparfait du subjonctif",
    "conditionnel présent",
    "subjonctif présent",
    "impératif",
    "passé simple",
    "participe présent"
];

const tempsExtreme = [
    "passé antérieur",
    "passé simple",
    "plus-que-parfait",
    "futur antérieur",
    "subjonctif passé",
    "subjonctif imparfait",
    "subjonctif plus-que-parfait",
    "conditionnel passé"
];

let tentatives = 0;
const maxTentativesParQuestion = 3;

// Charger les verbes depuis les fichiers JSON
async function chargerVerbes() {
    try {
        const response = await fetch('verbes.json');
        const responseTurbo = await fetch('verbes_turbo.json');
        const responseExtreme = await fetch('verbes_extreme.json'); // Charger les verbes EXTREME

        if (!response.ok || !responseTurbo.ok || !responseExtreme.ok) {
            throw new Error('Erreur lors du chargement des fichiers JSON');
        }

        verbes = await response.json();
        verbesTurbo = await responseTurbo.json(); // Charger les verbes TURBO
        verbesExtreme = await responseExtreme.json(); // Charger les verbes EXTREME

        console.log("Verbes chargés : ", verbes);
        console.log("Verbes TURBO chargés : ", verbesTurbo);
        console.log("Verbes EXTREME chargés : ", verbesExtreme); // Vérification

        // Générer la première phrase après le chargement des verbes
        genererPhrase(true); // Générer une phrase initiale
    } catch (error) {
        console.error('Erreur : ', error);
    }
}

// Activer le mode TURBO
function activerModeTurbo() {
    modeTurboActif = !modeTurboActif;
    const modeTurboButton = document.getElementById('modeTurbo');
    const turboX2 = document.getElementById('turbo-x2'); // Récupérer l'élément x2
    modeTurboButton.classList.toggle('active', modeTurboActif);
    modeTurboButton.innerText = modeTurboActif ? "Mode TURBO (Actif)" : "Mode TURBO (Inactif)";
    document.body.classList.toggle('turbo-mode', modeTurboActif);
    
    // Afficher ou masquer le symbole x2
    turboX2.style.display = modeTurboActif ? 'inline-block' : 'none';

    // Afficher ou masquer les boutons en fonction de l'état du mode TURBO
    const boutonsGroupes = document.querySelectorAll('#premierGroupe, #deuxiemeGroupe, #troisiemeGroupe, #modeAleatoire, #modeExtreme');
    boutonsGroupes.forEach(bouton => {
        bouton.style.display = modeTurboActif ? 'none' : 'inline-block';
    });

    // Générer une nouvelle phrase uniquement à partir des verbes TURBO lorsque le mode est activé
    genererPhrase(true);
}

// Activer le mode EXTREME
function activerModeExtreme() {
    modeExtremeActif = !modeExtremeActif;
    const modeExtremeButton = document.getElementById('modeExtreme');
    modeExtremeButton.classList.toggle('active', modeExtremeActif);
    modeExtremeButton.innerText = modeExtremeActif ? "Mode EXTREME (Actif)" : "Mode EXTREME (Inactif)";
    document.body.classList.toggle('extreme-mode', modeExtremeActif);

    // Afficher ou masquer les boutons en fonction de l'état du mode EXTREME
    const boutonsGroupes = document.querySelectorAll('#premierGroupe, #deuxiemeGroupe, #troisiemeGroupe, #modeAleatoire, #modeTurbo');
    boutonsGroupes.forEach(bouton => {
        bouton.style.display = modeExtremeActif ? 'none' : 'inline-block';
    });

    // Générer une nouvelle phrase uniquement à partir des verbes EXTREME lorsque le mode est activé
    genererPhrase(true);
}

// Choisir un groupe de verbes
function choisirGroupe(groupe) {
    groupeActuel = groupe;
    modeAleatoireActif = false; // Désactiver le mode aléatoire lorsqu'un groupe est choisi manuellement
    genererPhrase(true);
}

// Fonction d'aide pour obtenir les indices des pronoms disponibles
function obtenirIndicesPronomsDisponibles(verbe, temps) {
    const conjugaisons = verbe.conjugaisons[temps];
    if (!conjugaisons) return []; // Vérification pour éviter les erreurs

    return conjugaisons
        .map((conj, index) => conj !== "0" ? index : null)
        .filter(index => index !== null);
}

// Fonction d'aide pour choisir un pronom disponible
function choisirPronomDisponible(verbe, temps) {
    const indicesDisponibles = obtenirIndicesPronomsDisponibles(verbe, temps);
    if (indicesDisponibles.length === 0) return null;

    const indiceChoisi = indicesDisponibles[Math.floor(Math.random() * indicesDisponibles.length)];
    return { pronom: sujets[indiceChoisi], indice: indiceChoisi };
}

// Générer une phrase aléatoire
function genererPhrase(forceGenerate = false) {
    if (!forceGenerate && currentQuestion > 0) {
        console.log("Pas de génération de nouvelle phrase car forceGenerate est false et currentQuestion > 0.");
        return;
    }

    let verbesGroupe;
    let tempsChoisi;
    let pronomChoisi = null;

    if (modeExtremeActif) {
        // Utiliser uniquement les verbes EXTREME lorsque le mode EXTREME est activé
        verbesGroupe = verbesExtreme.verbes; // Assurez-vous que la clé est correcte
        tempsChoisi = tempsExtreme[Math.floor(Math.random() * tempsExtreme.length)];
    } else if (modeTurboActif) {
        // Utiliser uniquement les verbes TURBO lorsque le mode TURBO est activé
        verbesGroupe = verbesTurbo.TURBO;
        tempsChoisi = tempsTurbo[Math.floor(Math.random() * tempsTurbo.length)];
    } else {
        // Sélectionner les verbes en fonction du groupe actuel
        if (!verbes || !verbes[groupeActuel]) {
            console.error("Les verbes ne sont pas chargés correctement.");
            return;
        }

        // Gérer le mode aléatoire entre les groupes
        if (modeAleatoireActif) {
            const groupes = ["premierGroupe", "deuxiemeGroupe", "troisiemeGroupe"];
            if (groupesUtilises.size === groupes.length) {
                groupesUtilises.clear();
            }

            const groupesRestants = groupes.filter(groupe => !groupesUtilises.has(groupe));
            groupeActuel = groupesRestants.length > 0
                ? groupesRestants[Math.floor(Math.random() * groupesRestants.length)]
                : groupes[Math.floor(Math.random() * groupes.length)];

            groupesUtilises.add(groupeActuel);
        }

        verbesGroupe = verbes[groupeActuel];
        const tempsOptions = ["présent", "futur", "imparfait", "passé composé"];
        tempsChoisi = tempsOptions[Math.floor(Math.random() * tempsOptions.length)];
    }

    // Sélectionner un verbe au hasard dans le groupe sélectionné
    verbeActuel = verbesGroupe[Math.floor(Math.random() * verbesGroupe.length)];
    if (!verbeActuel) {
        console.error("Aucun verbe disponible pour le groupe sélectionné.");
        return;
    }

    // Choisir un pronom disponible
    pronomChoisi = choisirPronomDisponible(verbeActuel, tempsChoisi);
    if (pronomChoisi === null) {
        console.error(`Aucun pronom disponible pour le verbe "${verbeActuel.infinitif}" au temps "${tempsChoisi}".`);
        genererPhrase(true); // Tenter de générer une nouvelle phrase
        return;
    }

    // Stocker le temps et le pronom actuel pour la vérification
    temps = tempsChoisi;
    verbeActuel.pronomActuel = pronomChoisi.pronom;
    verbeActuel.indicePronomActuel = pronomChoisi.indice;

    console.log(`Phrase générée: Verbe "${verbeActuel.infinitif}", Temps "${temps}", Pronom "${pronomChoisi.pronom}".`);

    // Mettre à jour l'interface utilisateur avec le verbe et le temps sélectionnés
    document.getElementById('verbe-container').innerText = `Verbe : ${verbeActuel.infinitif}`;
    document.getElementById('temps-container').innerText = `Temps : ${temps.charAt(0).toUpperCase() + temps.slice(1)}`;

    // Décrire le pronom
    const sujetChoisi = modeTurboActif || modeExtremeActif // Vérification pour déterminer le bon mode
        ? descriptionPronoms[verbeActuel.pronomActuel]
        : verbeActuel.pronomActuel;

    document.getElementById('phrase-container').innerText = `${sujetChoisi} ___`;
}

// Mettre à jour l'historique des réponses
function mettreAJourHistorique(isCorrect, userResponse = "") {
    const historiqueContainer = document.getElementById('historique');
    const nouvelItem = document.createElement('li');
    const pronom = verbeActuel.pronomActuel;
    const conjugaisonCorrecte = verbeActuel.conjugaisons[temps][verbeActuel.indicePronomActuel];
    if (isCorrect) {
        nouvelItem.textContent = `Verbe : ${verbeActuel.infinitif}, Temps : ${temps}, ${descriptionPronoms[pronom]}, Réponse : ${conjugaisonCorrecte}`;
    } else {
        nouvelItem.textContent = `Verbe : ${verbeActuel.infinitif}, Temps : ${temps}, ${descriptionPronoms[pronom]}, Réponse : Incorrecte (Réponse correcte : ${conjugaisonCorrecte})`;
    }
    historiqueContainer.appendChild(nouvelItem);
    console.log(`Historique mis à jour: ${nouvelItem.textContent}`);
}

// Vérifier la réponse de l'utilisateur
function verifierReponse() {
    const reponseUtilisateur = document.getElementById('reponse').value.trim().toLowerCase(); // Convertir en minuscules
    const pronomActuel = verbeActuel.pronomActuel;
    const indicePronomActuel = verbeActuel.indicePronomActuel;
    let conjugaisonCorrecte = "";

    // Récupérer la conjugaison correcte en fonction de l'indice
    if (verbeActuel.conjugaisons[temps]) {
        conjugaisonCorrecte = verbeActuel.conjugaisons[temps][indicePronomActuel].toLowerCase();
    }

    console.log(`Vérification de la réponse pour le verbe "${verbeActuel.infinitif}", temps "${temps}", pronom "${pronomActuel}".`);
    console.log(`Réponse utilisateur : "${reponseUtilisateur}"`);
    console.log(`Conjugaison correcte : "${conjugaisonCorrecte}"`);

    if (conjugaisonCorrecte !== "0" && reponseUtilisateur === conjugaisonCorrecte.toLowerCase()) {
        alert("Bonne réponse !");
        // Calcul des points : points doublés en mode TURBO
        const pointsGagnes = coefficients[groupeActuel] * (tempsTurbo.includes(temps) ? 3 : 1);
        score += modeTurboActif ? pointsGagnes * 2 : (modeExtremeActif ? pointsGagnes * 3 : pointsGagnes);
        
        // **Mise à jour de l'élément HTML du score**
        document.getElementById('score').innerText = score;
        
        currentQuestion++;
        tentatives = 0; // Réinitialiser les tentatives

        // Mettre à jour l'historique uniquement si la réponse est correcte
        mettreAJourHistorique(true, reponseUtilisateur);

        console.log(`Bonne réponse! Score actuel: ${score}. Question actuelle: ${currentQuestion}/${totalQuestions}.`);

        // Vérifier si le jeu est terminé
        if (currentQuestion < totalQuestions) {
            genererPhrase(true); // Générer une nouvelle phrase pour la prochaine question
        } else {
            afficherScoreFinal(); // Afficher le score final si le nombre total de questions est atteint
        }
    } else {
        tentatives++;
        if (tentatives < maxTentativesParQuestion) {
            alert(`Mauvaise réponse ! -1 point. Tentatives restantes: ${maxTentativesParQuestion - tentatives}`);
        } else {
            alert(`Mauvaise réponse ! -1 point.\nNombre maximum de tentatives atteint. La réponse correcte était: "${conjugaisonCorrecte}".`);
        }
        score -= 1;
        
        // **Mise à jour de l'élément HTML du score**
        document.getElementById('score').innerText = score;
        
        console.log(`Mauvaise réponse! Score actuel: ${score}. Tentatives: ${tentatives}/${maxTentativesParQuestion}.`);

        if (tentatives >= maxTentativesParQuestion) {
            // Enregistrer l'incorrect après le nombre maximal de tentatives
            mettreAJourHistorique(false, reponseUtilisateur);
            tentatives = 0;
            currentQuestion++;

            if (currentQuestion < totalQuestions) {
                genererPhrase(true);
            } else {
                afficherScoreFinal();
            }
        }
    }

    // Réinitialiser le champ de réponse
    document.getElementById('reponse').value = "";
}

// Afficher le score final
function afficherScoreFinal() {
    document.getElementById('final-score-value').innerText = score;
    document.getElementById('final-score').style.display = 'block';
    console.log(`Score final affiché: ${score}.`);
}

// Réinitialiser le jeu
function resetGame() {
    score = 0;
    currentQuestion = 0;
    tentatives = 0;
    groupesUtilises.clear();
    historique = []; // Réinitialiser l'historique
    const historiqueContainer = document.getElementById('historique');
    historiqueContainer.innerHTML = ''; // Vider l'historique affiché
    document.getElementById('final-score').style.display = 'none';
    document.getElementById('score').innerText = score;
    console.log("Jeu réinitialisé.");
    genererPhrase(true);
}

// Détecter l'entrée avec la touche "Entrée"
function detecterEntree(event) {
    if (event.key === "Enter") {
        verifierReponse();
    }
}

// Afficher ou masquer la solution
function toggleSolution() {
    const solutionBulle = document.getElementById('solution-bulle');
    const solutionText = document.getElementById('solution-text');
    const pronomActuel = verbeActuel.pronomActuel;
    const indicePronomActuel = verbeActuel.indicePronomActuel;
    const conjugaisonCorrecte = verbeActuel.conjugaisons[temps][indicePronomActuel];

    if (solutionBulle.style.display === 'block') {
        solutionBulle.style.display = 'none'; // Masquer la bulle si elle est visible
    } else {
        if (conjugaisonCorrecte && conjugaisonCorrecte !== "0") {
            solutionText.innerText = conjugaisonCorrecte;
            console.log(`Solution affichée: ${conjugaisonCorrecte}`);
        } else {
            solutionText.innerText = "Pas de solution disponible.";
            console.log("Pas de solution disponible à afficher.");
        }
        solutionBulle.style.display = 'block'; // Afficher la bulle
    }
}

// Charger les verbes au démarrage du jeu et ajouter les écouteurs d'événements une seule fois
window.onload = () => {
    chargerVerbes();

    // Ajouter des écouteurs d'événements après le chargement des verbes
    document.getElementById('reponse').addEventListener('keydown', detecterEntree);
    document.getElementById('verifier').addEventListener('click', verifierReponse);
    document.getElementById('bouton-solution').addEventListener('click', toggleSolution);
    document.getElementById('nouvelle-partie').addEventListener('click', resetGame);
    document.getElementById('modeTurbo').addEventListener('click', activerModeTurbo);
    document.getElementById('modeExtreme').addEventListener('click', activerModeExtreme); // Ajout pour le mode EXTREME
    document.getElementById('modeAleatoire').addEventListener('click', activerModeAleatoire);
    document.getElementById('premierGroupe').addEventListener('click', () => choisirGroupe('premierGroupe'));
    document.getElementById('deuxiemeGroupe').addEventListener('click', () => choisirGroupe('deuxiemeGroupe'));
    document.getElementById('troisiemeGroupe').addEventListener('click', () => choisirGroupe('troisiemeGroupe'));
};
