# Frontend - Vérificateur de Disponibilité de Médicaments

Application mobile React Native (Expo) pour vérifier la disponibilité des médicaments dans les pharmacies.

## Prérequis

- Node.js (v14 ou supérieur)
- npm ou yarn
- Expo CLI
- Un smartphone avec l'application Expo Go installée ou un émulateur

## Installation

1. Clonez le dépôt et accédez au dossier frontend :

```bash
cd frontend
```

2. Installez les dépendances :

```bash
npm install
```

3. Créez un fichier `.env` à la racine du dossier frontend avec les variables suivantes :

```
API_URL=http://VOTRE_ADRESSE_IP:3000/api
```

**Note importante :** Pour connaître votre adresse IP, démarrez d'abord le serveur Expo avec la commande `npx expo start`. L'adresse IP sera affichée dans la console. Copiez cette adresse IP et utilisez-la dans le fichier `.env`. Cela est nécessaire car le frontend et le backend seront testés sur la même machine.

Exemple :
```
API_URL=http://192.168.1.15:3000/api
```

## Démarrage de l'application

Pour démarrer l'application en mode développement :

```bash
npx expo start
```

Cela lancera le serveur de développement Expo. Vous pourrez alors :

- Scanner le QR code avec l'application Expo Go sur votre smartphone (assurez-vous que votre téléphone est sur le même réseau Wi-Fi que votre ordinateur)
- Appuyer sur `a` pour ouvrir l'application dans un émulateur Android
- Appuyer sur `i` pour ouvrir l'application dans un émulateur iOS (macOS uniquement)

## Structure du projet

```
frontend/
├── app/                 # Écrans et navigation (Expo Router)
│   ├── (tabs)/          # Écrans principaux avec navigation par onglets
│   ├── auth/            # Écrans d'authentification
│   ├── drugs/           # Écrans de détails des médicaments
│   ├── pharmacies/      # Écrans de détails des pharmacies
│   ├── reports/         # Écrans de gestion des rapports
│   ├── _layout.tsx      # Configuration de la navigation principale
│   └── index.tsx        # Point d'entrée de l'application
├── assets/              # Images, polices et autres ressources statiques
├── components/          # Composants réutilisables
│   ├── ui/              # Composants d'interface utilisateur de base
│   └── ...              # Autres composants
├── constants/           # Constantes et configuration
├── context/             # Contextes React (authentification, etc.)
├── hooks/               # Hooks personnalisés
├── i18n/                # Internationalisation et traductions
├── services/            # Services pour les appels API
├── .env                 # Variables d'environnement
├── app.json             # Configuration Expo
├── package.json         # Dépendances et scripts
└── README.md            # Documentation
```

## Fonctionnalités principales

### Utilisateurs non authentifiés

- Recherche de médicaments
- Consultation des détails d'un médicament
- Consultation des rapports de disponibilité
- Recherche de pharmacies
- Consultation des pharmacies à proximité
- Changement de langue (français/anglais)

### Utilisateurs authentifiés (rôle "user")

- Toutes les fonctionnalités des utilisateurs non authentifiés
- Confirmation ou contestation des rapports existants
- Consultation de ses propres rapports

### Administrateurs (rôle "admin")

- Toutes les fonctionnalités des utilisateurs authentifiés
- Création de rapports de disponibilité
- Gestion des médicaments (ajout, modification, suppression)
- Gestion des pharmacies (ajout, modification, suppression)

## Comptes de test

Vous pouvez utiliser les comptes suivants pour tester l'application :

### Compte administrateur

```
Email: admin@example.com
Mot de passe: admin123
```

### Compte utilisateur régulier

```
Email: pierre@example.com
Mot de passe: password123
```

## Internationalisation

L'application est disponible en français et en anglais. Vous pouvez changer la langue dans les paramètres de l'application.

## Dépannage

### Problèmes de connexion à l'API

Si vous rencontrez des problèmes de connexion à l'API backend :

1. Vérifiez que le serveur backend est bien démarré
2. Assurez-vous que l'adresse IP dans le fichier `.env` est correcte
3. Vérifiez que votre téléphone/émulateur et votre ordinateur sont sur le même réseau

### Problèmes avec Expo

Si vous rencontrez des problèmes avec Expo :

1. Essayez de redémarrer le serveur Expo (`npx expo start`)
2. Effacez le cache (`npx expo start -c`)
3. Vérifiez que vous avez la dernière version d'Expo CLI et d'Expo Go

## Licence

Ce projet est sous licence MIT.
