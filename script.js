// Variables globales 
let verbes;
let verbesTurbo;
let verbesExtreme; // Ajouter la variable pour les verbes extrêmes
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
    extreme: 3 // Coefficient pour le mode extrême
};
let score = 0;
let currentQuestion = 0;
const totalQuestions = 5;
let temps;
let verbeActuel;
let historique = [];
let modeAleatoireActif = true;
let modeTurboActif = false; // Mode TURBO désactivé par défaut
let modeExtremeActif = false; // Mode Extrême désactivé par défaut
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
let tentatives = 0;
const maxTentativesParQuestion = 3;

// Charger les verbes depuis les fichiers JSON
async function chargerVerbes() {
    try {
        const response = await fetch('verbes.json');
        const responseTurbo = await fetch('verbes_turbo.json');
        const responseExtreme = await fetch('verbes_extreme.json'); // Charger les verbes extrêmes
        if (!response.ok || !responseTurbo.ok || !responseExtreme.ok) {
            throw new Error('Erreur lors du chargement des fichiers JSON');
        }
        verbes = await response.json();
        verbesTurbo = await responseTurbo.json(); // Charger les verbes TURBO
        verbesExtreme = await responseExtreme.json(); // Charger les verbes EXTRÊMES
        console.log("Verbes chargés : ", verbes);
        console.log("Verbes TURBO chargés : ", verbesTurbo);
        console.log("Verbes EXTRÊMES chargés : ", verbesExtreme.verbes); // Changer pour accéder à la clé "verbes"

        // Générer la première phrase après le chargement des verbes
        genererPhrase(true); // Générer une phrase initiale
    } catch (error) {
        console.error('Erreur : ', error);
    }
}

// Activer le mode Extrême
function activerModeExtreme() {
    modeExtremeActif = !modeExtremeActif;
    const modeExtremeButton = document.getElementById('modeExtreme');
    modeExtremeButton.classList.toggle('active', modeExtremeActif);
    modeExtremeButton.innerText = modeExtremeActif ? "Mode Extrême (Actif)" : "Mode Extrême (Inactif)";
    document.body.classList.toggle('extreme-mode', modeExtremeActif); // Modifier les couleurs pour le mode extrême

    // Afficher ou masquer les boutons en fonction de l'état du mode Extrême
    cacherBoutonsModes(modeExtremeActif);

    // Générer une nouvelle phrase uniquement à partir des verbes Extrêmes lorsque le mode est activé
    genererPhrase(true);
}

// Générer une phrase aléatoire
function genererPhrase(forceGenerate = false) {
    // Si on ne doit pas générer de nouvelle phrase (après une mauvaise réponse), sortir
    if (!forceGenerate && currentQuestion > 0) {
        console.log("Pas de génération de nouvelle phrase car forceGenerate est false et currentQuestion > 0.");
        return;
    }

    let verbesGroupe;
    let tempsChoisi;
    let pronomChoisi = null;

    if (modeExtremeActif) {
        // Utiliser uniquement les verbes EXTRÊMES lorsque le mode extrême est activé
        if (!verbesExtreme || !verbesExtreme.verbes || verbesExtreme.verbes.length === 0) {
            console.error("Aucun verbe disponible pour le mode Extrême.");
            return;
        }
        verbesGroupe = verbesExtreme.verbes; // Accéder à la liste de verbes
        const tempsOptions = ["passé antérieur", "passé simple", "plus-que-parfait", "futur antérieur", "subjonctif passé", "subjonctif imparfait", "subjonctif plus-que-parfait", "conditionnel passé"];
        tempsChoisi = tempsOptions[Math.floor(Math.random() * tempsOptions.length)];
    } else if (modeTurboActif) {
        // Utiliser uniquement les verbes TURBO lorsque le mode TURBO est activé
        if (!verbesTurbo || !verbesTurbo.TURBO || verbesTurbo.TURBO.length === 0) {
            console.error("Aucun verbe disponible pour le mode Turbo.");
            return;
        }
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
    const sujetChoisi = modeExtremeActif
        ? `${descriptionPronoms[verbeActuel.pronomActuel]} ___ (ajoutez (e) si nécessaire)` // texte pour le mode extrême
        : modeTurboActif
            ? "Écrire le pronom et le verbe conjugué" // texte pour le mode TURBO
            : `${descriptionPronoms[verbeActuel.pronomActuel]} ___`; // texte pour le mode normal

    document.getElementById('phrase-container').innerText = sujetChoisi;
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
    document.getElementById('modeExtreme').addEventListener('click', activerModeExtreme); // Écouteur pour le mode Extrême
    document.getElementById('modeAleatoire').addEventListener('click', activerModeAleatoire);
    document.getElementById('premierGroupe').addEventListener('click', () => choisirGroupe('premierGroupe'));
    document.getElementById('deuxiemeGroupe').addEventListener('click', () => choisirGroupe('deuxiemeGroupe'));
    document.getElementById('troisiemeGroupe').addEventListener('click', () => choisirGroupe('troisiemeGroupe'));
};
