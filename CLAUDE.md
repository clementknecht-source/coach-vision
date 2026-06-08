# Coach Vision — Guide Claude Code

## Description
Application web de coaching football avec IA intégrée.
Interface complète : séances, analyse tactique, avant-match, profils joueurs, etc.

## Structure du projet
```
coach-vision/
├── index.html      ← Application complète (HTML + CSS + JS en un seul fichier)
├── server.js       ← Serveur Node.js local (proxy API Anthropic)
├── manifest.json   ← Config PWA (icône, nom)
├── sw.js           ← Service Worker (cache offline)
├── .env            ← Clé API Anthropic (à créer)
├── .env.example    ← Modèle pour le .env
├── package.json    ← Config Node.js
└── icons/          ← Icônes de l'app (72px à 512px)
```

## Démarrage rapide

### 1. Installer Node.js (si pas déjà fait)
Télécharge sur https://nodejs.org → version LTS

### 2. Créer le fichier .env
Copie .env.example en .env et mets ta clé API :
```
ANTHROPIC_API_KEY=sk-ant-ta-cle-ici
```

### 3. Lancer le serveur
```bash
node server.js
```

### 4. Ouvrir l'app
Va sur http://localhost:3000 dans ton navigateur

## Accès depuis le téléphone (même réseau WiFi)
1. Lance le serveur sur ton PC : `node server.js`
2. Trouve l'IP de ton PC : `ipconfig` (Windows) → cherche "Adresse IPv4"
3. Sur ton téléphone, ouvre Chrome → `http://192.168.X.X:3000`
4. Menu Chrome ⋮ → "Ajouter à l'écran d'accueil"
5. ✅ L'app est installée sur ton téléphone !

## Développement avec Claude Code
Pour modifier l'app, toutes les fonctionnalités sont dans index.html.
Les sections JS sont clairement délimitées par des commentaires ═══.

Fonctionnalités principales :
- pgDash() → Tableau de bord
- pgPlayers() → Base de joueurs
- pgTactical() → Analyse tactique
- pgSessions() → Séances
- pgPrematch() → Avant-match IA
- pgSpeech() → Causerie
- pgSit() → Situations de jeu
- pgTeamDB() → Dashboard équipe
- pgComp() → Composition IA
- pgTacLib() → Bibliothèque tactique
- pgReports() → Rapports de match
- pgOpponents() → Adversaires

## Déploiement Netlify (avec clé API)
Si tu veux mettre en ligne :
1. Crée un compte sur netlify.com
2. Glisse le dossier sur app.netlify.com/drop
3. Configure la variable d'environnement ANTHROPIC_API_KEY dans Netlify
   (Site settings → Environment variables)
