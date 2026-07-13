# BAOU Finance CI - Plateforme Fintech & Trading BRVM

BAOU Finance CI est une plateforme technologique moderne d'investissement boursier et de gestion d'épargne en Côte d'Ivoire. Elle permet d'acheter et de vendre des actions cotées à la BRVM, de suivre l'évolution des portefeuilles et de réaliser des dépôts et retraits en ligne via Mobile Money grâce à l'intégration de l'API PawaPay v2.

---

## 🛠️ Prérequis et Dépendance Internet

> [!IMPORTANT]
> **Connexion Internet Requise** : La base de données PostgreSQL de l'application est hébergée sur le cloud de production de **Supabase**. Sans connexion Internet active, le serveur backend NestJS lèvera une erreur de réseau au démarrage et refusera de se lancer. Assurez-vous d'avoir un accès réseau stable avant de démarrer le backend.

---

## 🚀 Démarrage Rapide (Développement Local)

Pour lancer le projet, ouvrez trois fenêtres de terminal distinctes :

### 1. Démarrer le Backend NestJS
```bash
cd backend
npm run start:dev
```
Le serveur démarre en mode watch sur le port **3000** : `http://localhost:3000`.

### 2. Démarrer le Client-Portal Next.js
```bash
cd client-portal
npm run dev
```
Le portail client démarre sur le port **8080** : `http://localhost:8080`.

### 3. Démarrer l'Explorateur de Base de Données (Prisma Studio)
```bash
cd backend
npx prisma studio --port 5555
```
Prisma Studio démarre sur le port **5555** : `http://localhost:5555`.

---

## 🔑 Identifiants & Accès de Test (Back-office)

Pour tester les fonctionnalités d'administration, de gestion KYC, de validation d'ordres BRVM et d'analyse d'erreurs de support, connectez-vous avec les identifiants d'administration suivants :

*   **URL de connexion Admin** : [http://localhost:8080/admin-portal/login](http://localhost:8080/admin-portal/login)
*   **Adresse E-mail** : `admin@baou.ci`
*   **Mot de passe** : `adminBaou2026!`

---

## 📍 Portails et Outils Disponibles

| Portail / Service | URL Locale | Description |
| :--- | :--- | :--- |
| **Portail Client** | [http://localhost:8080](http://localhost:8080) | Landing, consultation en direct du marché BRVM, inscription et Dashboard utilisateur (portefeuille, historique, dépôt/retrait). |
| **Back-office Admin** | [http://localhost:8080/admin-portal](http://localhost:8080/admin-portal) | Gestion des demandes KYC, validation/annulation des ordres d'actions clients, consultation et export CSV des transactions. |
| **Portail Support** | [http://localhost:8080/support-portal](http://localhost:8080/support-portal) | Visualisation des erreurs et logs du serveur NestJS avec stack-trace en cas de bug de production. |
| **Prisma Studio** | [http://localhost:5555](http://localhost:5555) | Outil visuel de navigation et d'édition de la base de données Supabase. |

---

## 📱 Passerelle Sandbox PawaPay v2 (Simulateur Local)

Pour faciliter le développement et tester les flux transactionnels sans connexion opérateur réelle :
*   Les dépôts et retraits redirigent automatiquement l'utilisateur vers une page de simulation locale : `/payment-simulation`.
*   Cette page vous permet de simuler un **Paiement Réussi** (qui déclenche les webhooks et crédite/débite les wallets) ou un **Échec/Annulation**.
*   À la fin de la simulation, le site vous renvoie automatiquement vers le Dashboard avec une alerte de transaction mise à jour.
