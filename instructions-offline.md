# Guide de Lancement BAOU Finance en Mode Local (Sans Internet)

Ce guide fournit les commandes PowerShell pour configurer et lancer l'intégralité du projet en local sans aucune connexion Internet (Offline).

---

## 💾 1. Bascule de la Base de Données (Supabase Cloud ➡️ SQLite Local)

Puisque la base de données par défaut est sur Supabase, vous devez la rediriger vers une base de données SQLite locale sous forme de fichier pour fonctionner sans Internet.

### Étape A : Modifier le type de base de données dans Prisma
Ouvrez le fichier `backend/prisma/schema.prisma` et remplacez le bloc `datasource db` par :
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

### Étape B : Configurer la variable d'environnement locale
Dans le fichier `backend/.env`, modifiez la ligne `DATABASE_URL` pour pointer vers le fichier local SQLite :
```env
DATABASE_URL="file:./dev.db"
```

### Étape C : Créer la base de données locale et générer les tables
Ouvrez une console PowerShell et exécutez :
```powershell
cd backend
npx prisma db push
```
*(Cette commande va créer automatiquement le fichier `dev.db` à la racine de votre dossier `backend/prisma` et y structurer toutes vos tables).*

### Étape D : Insérer les comptes de test locaux
Exécutez la commande suivante pour insérer à nouveau le compte admin de test dans votre nouvelle base locale :
```powershell
npx ts-node prisma/seed-admin.ts
```

---

## 🚀 2. Commandes de Démarrage en Mode Hors-ligne

Une fois la base de données locale générée, ouvrez trois onglets de console PowerShell distincts pour lancer les différents composants :

### 🖥️ Onglet 1 : Lancer le Backend NestJS
```powershell
cd backend
npm run start:dev
```

### 🌐 Onglet 2 : Lancer le Portail Client Next.js
```powershell
cd client-portal
npm run dev
```
*(Le site est alors accessible en local sur [http://localhost:8080](http://localhost:8080)).*

### 📊 Onglet 3 : Lancer l'Explorateur de Base de Données Local
```powershell
cd backend
npx prisma studio --port 5555
```
*(Pour voir et modifier vos tables locales en direct sur [http://localhost:5555](http://localhost:5555)).*
