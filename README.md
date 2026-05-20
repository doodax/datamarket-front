# Datamarket — Front-end

Interface web de l'activité pédagogique "Le marché des données".
Stack : React 18 + Vite + TailwindCSS + Socket.IO.

## Développement local

```bash
npm install
npm run dev
```

Ouvre `http://localhost:5173`. Par défaut, l'app pointe vers le back-end Railway de production. Pour changer :

1. Soit créer un fichier `.env.local` avec :
   ```
   VITE_API_URL=http://localhost:3000
   ```
2. Soit utiliser le menu "Settings" sur la page d'accueil pour saisir une URL personnalisée (stockée dans le localStorage).

## Déploiement sur GitHub Pages

### Configuration initiale (à faire une seule fois)

1. Pousser le code sur un repo GitHub
2. Aller dans **Settings → Pages**
3. Source : **GitHub Actions**
4. Le workflow `.github/workflows/deploy.yml` se déclenche au push sur `main`

### Adapter le base path

Si votre repo s'appelle autrement que `datamarket-front`, modifier `vite.config.js` :

```js
base: mode === 'production' ? '/votre-nom-de-repo/' : '/'
```

### URL finale

Après le premier déploiement réussi, votre app sera accessible à :
`https://VOTRE_USERNAME.github.io/datamarket-front/`

## Structure

```
src/
├── components/         Composants UI réutilisables
│   ├── Logo.jsx
│   ├── Timer.jsx
│   ├── DataCard.jsx
│   └── CompanyLogo.jsx
├── views/              Vues principales
│   ├── HomeView.jsx
│   ├── TeacherLoginView.jsx
│   ├── TeacherView.jsx           Création + dashboard sessions
│   ├── TeacherSessionView.jsx    Pilotage d'une session en direct
│   ├── GroupView.jsx             Vue élève (catalogue + achats)
│   └── ResultsView.jsx           Rapports + synthèse
├── hooks/
│   ├── useConfig.js              Charge la config pédagogique
│   └── useSessionSocket.js       Socket.IO + état temps réel
├── utils/
│   └── api.js                    Client API
├── styles/
│   └── index.css                 Tailwind + classes custom
├── App.jsx                       Routing
└── main.jsx                      Entrée React
```

## Esthétique

Direction : **"Surveillance corporate"** — interface qui imite un véritable outil
B2B de marketing data. Sombre, monospace pour les chiffres, accents néon cyan/vert.
L'idée pédagogique repose en partie sur le fait que les élèves doivent **croire**
qu'ils utilisent un vrai outil professionnel — c'est ce qui rend la révélation
finale percutante.

## Flux utilisateur

### Élèves (groupes)

1. Accueil → saisir le code session reçu → "Rejoindre"
2. Choisir un numéro de groupe + nom d'équipe optionnel
3. Lire la mission (avec note interne si présente)
4. Acheter des données dans le catalogue (toggle clic)
5. Attendre le timer / la révélation des résultats
6. Découvrir le rapport de campagne (profil ciblé, bénéfice, risque)

### Enseignant·e

1. Accueil → "Espace administrateur" → mot de passe
2. "Nouvelle session" → choisir mode + missions + difficulté + durée
3. Partager le code aux groupes
4. Voir les achats en temps réel sur le tableau de bord
5. Démarrer le timer → suivre la progression
6. Verrouiller / révéler les résultats
7. Exporter en Markdown pour archivage
