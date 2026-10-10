# Vase d’honneur Centre Eden

Borne d’accueil tactile et administration de l’église. Les contenus publics proviennent de MySQL via l’API Express : aucune liste de ministères, départements ou contacts n’est codée dans l’interface.

## Démarrage

Prérequis : Node.js 22, npm et MySQL 8 ou MariaDB 10.4+. Démarrer MySQL avant l’API.

1. Dans phpMyAdmin, créer une base vide `vase_honneur` avec la collation `utf8mb4_unicode_ci`, la sélectionner puis importer `api/database/schema.sql` (la copie à la racine est identique). Ce fichier contient uniquement la création des tables et les données initiales : 8 ministères, 48 départements, 3 écoles et 8 contacts. Pour recommencer une installation existante, sauvegarder les données utiles puis importer `api/database/reset.sql` avant `schema.sql` : **reset.sql efface les 13 tables et leurs données**. En terminal : `npm run db:import` pour une base vide, ou `npm run db:import -- --reset` après sauvegarde pour réinitialiser.
2. Dans `api`, exécuter `npm install`. Le fichier `.env` local est déjà configuré avec les informations de connexion fournies et une clé de session aléatoire. Sur une autre machine, copier `.env.example` vers `.env` et remplacer `JWT_SECRET` par une clé aléatoire d’au moins 32 caractères.
3. Créer votre compte administrateur depuis PowerShell dans `api` :

```powershell
$env:ADMIN_PASSWORD = Read-Host 'Choisissez un mot de passe de 12 à 72 caractères' -MaskInput
npm run create-admin -- votre-email@exemple.com "Administration"
Remove-Item Env:ADMIN_PASSWORD
```

4. Dans un premier terminal :

```powershell
cd api
npm run dev
```

5. Dans un deuxième terminal :

```powershell
cd webapp
npm install
npm run dev
```

Accueil : http://localhost:5173 — Administration : http://localhost:5173/admin — État de l’API : http://localhost:3001/api/health.

Le proxy Vite transmet `/api` à l’API sur le port 3001. Pour une tablette connectée au même réseau, ouvrir `http://ADRESSE-IP-DU-PC:5173`. Laisser l’API accessible uniquement au serveur web et protéger l’administration par un accès réservé à l’équipe.

## Fonctionnalités

- Accueil adaptatif, navigation tactile, animations d’apparition au défilement, effets de survol, prise en compte de la préférence de mouvement réduit.
- Ministères et départements avec recherche, filtrage et fiche détaillée. Le parcours pour servir dirige vers le responsable de l’intégration indiqué dans le document.
- Présentation de l’église, équipe pastorale, cellules de maison, formations, agenda et contacts : gérés dans l’administration.
- Demandes de rendez-vous pastoral : prénom, nom, sexe, type de besoin, motif, coordonnées et date souhaitée. La demande n’est pas une réservation confirmée.
- Inscriptions aux formations, intentions de prière et témoignages : enregistrés en base et consultables uniquement dans l’administration.
- Administration : connexion, tableau de bord, création/modification/suppression des contenus, publication/masquage, ordre d’affichage, recherche et suivi des demandes par statut.
- Changement de mot de passe avec révocation des sessions existantes. Les comptes sont créés par la commande dédiée, sans mot de passe public par défaut.
- Retour à l’accueil après cinq minutes d’inactivité, avertissement trente secondes avant et effacement des formulaires ouverts. Le retour à l’accueil ferme la session administrateur. L’administration se déconnecte aussi après quinze minutes d’inactivité.

## Informations à compléter

Les données du document sont intégrées. Les horaires de culte, l’adresse précise, les biographies/portraits des pasteurs, les descriptions des départements et les lieux/horaires des cellules n’étaient pas fournis : les saisir dans l’administration. L’agenda est initialement vide. La marque graphique actuelle est un symbole décoratif, à remplacer par le logo officiel si souhaité. Une URL HTTPS peut servir à personnaliser l’image d’accueil et les portraits.

## Vérifications

```powershell
cd webapp
npm run lint
npm run build
```

```powershell
cd api
npm run test:unit
npm test
```

Les tests d’intégration nécessitent une base initialisée. Ils créent puis suppriment leurs propres données de test. Utiliser une base de vérification, pas une base en production. Pour tester une autre instance, définir `DB_HOST` / `DB_PORT` dans le terminal ; ces variables prennent priorité sur `.env`.

## État de cette machine

L’erreur **#1932 — Table doesn’t exist in engine** signifie qu’une table annoncée par MariaDB est inaccessible au moteur de stockage. Le fichier séparé `api/database/reset.sql` supprime les tables enfants avant les parents ; `schema.sql` crée ensuite les tables dans la base vide, explicitement en InnoDB avec leurs relations. Après import, recréer le compte avec `npm run create-admin`. Si l’import échoue encore avec une erreur InnoDB ou de tablespace, arrêter les tentatives et rétablir une instance MySQL/MariaDB saine : du SQL ne peut pas réparer un stockage corrompu. Ne pas supprimer ni remplacer manuellement les fichiers `ibdata1`, `ib_logfile*` ou les dossiers de bases.

Lors de la vérification, MySQL XAMPP sur le port 3306 s’est arrêté pendant l’import. Ses journaux signalent des incohérences InnoDB antérieures au projet. Aucune réparation des bases existantes n’a été entreprise. Les tests ont été réalisés avec le même moteur MariaDB, dans un dossier `.test-mysql` isolé sur le port 3307. Les huit tests passent, y compris la validation et le téléversement des panoramas. La configuration livrée reste celle demandée : `localhost:3306`, base `vase_honneur`, utilisateur `root`, mot de passe vide.

L’aperçu ouvert utilise temporairement la base isolée. Ses identifiants sont enregistrés dans `ACCES-APERCU.local`, exclu du versionnement. Pour l’installation définitive, rétablir un MySQL fonctionnel sur le port 3306, importer `schema.sql` et créer le compte administrateur. Le dossier `.test-mysql`, les caches, `.env`, les fichiers `.local`, les dépendances et les fichiers compilés sont exclus du versionnement.

## Mise en service

Compiler le front-end avec `npm run build`, servir `webapp/dist` avec un serveur web et démarrer l’API avec `npm start` dans `api`. Le serveur web doit transmettre `/api` à `127.0.0.1:3001` et renvoyer `index.html` pour les routes de l’application. Un exemple Nginx est fourni dans `docs/nginx.conf`. Si l’API se trouve sur un autre domaine, définir `VITE_API_URL` avant la compilation et adapter `CORS_ORIGIN` dans l’API. HTTPS est nécessaire pour une mise en service publique.

Le projet n’effectue aucun envoi d’e-mail ou de WhatsApp automatique. Les liens ouvrent le canal de contact ; les formulaires créent des demandes que l’équipe traite dans le back-office.

## Accueil tactile et visites à 360 degrés

L’accueil affiche huit grandes cases photographiques : Nos églises, Nos ministères, Nos départements, Nos formations, Agenda, Rendez-vous pastoral, Nous contacter et Visiter notre église. La couleur et le logo reprennent le PNG fourni. Le formulaire pastoral est accessible directement en un toucher et le bouton Accueil reste visible sur chaque page.

Pour mettre à jour une base déjà installée, importer `api/database/migrations/002-kiosk-tours.sql`. Le `schema.sql` principal contient aussi les nouvelles tables pour une installation initiale. La migration ajoute les tables sans supprimer les données existantes.

Dans Administration, ouvrir Lieux de visite et créer un lieu, par exemple Hall principal. Ouvrir Photos 360°, puis Ajouter plusieurs photos 360° ; sélectionner le lieu et les fichiers. Chaque photo peut ensuite être renommée, réordonnée, masquée ou remplacée. Le visiteur choisit le lieu puis un point de vue, glisse horizontalement ou verticalement, zoome ou passe en plein écran. Un bouton explicite permet de quitter le plein écran.

Les panoramas doivent être de vraies images équirectangulaires 2:1 issues d’une caméra ou d’un assemblage 360°, au moins 1024 × 512 pixels, JPEG, PNG ou WebP, 32 Mo maximum. L’API vérifie les fichiers, les optimise en JPEG et limite les panoramas à 8192 pixels de large. Les images sont conservées dans `api/uploads` : sauvegarder ce dossier avec la base et le conserver lors des déploiements. Supprimer une fiche ne supprime pas automatiquement un fichier qui peut être partagé par plusieurs contenus.

Les photographies des cases sont des illustrations locales, pas des photos certifiées de l’église. Le logo est celui fourni par l’utilisateur. Les vraies photos de l’église et les panoramas sont ajoutés depuis l’administration ; aucune photo panoramique étrangère n’est préinstallée dans les visites publiques. Les crédits figurent dans `docs/images.md`. Le lecteur utilise [Pannellum](https://pannellum.org/documentation/reference/).

L’aperçu de cette révision est ouvert sur http://localhost:5174, API sur le port 3002, avec la base de vérification sur 3307. Ces ports évitent les services déjà ouverts. La configuration habituelle reste 5173 → 3001 → MySQL 3306. Pour un aperçu sur un autre port, `API_PROXY` permet de définir la cible du proxy Vite.

La rubrique Nos départements affiche uniquement les départements dans de grandes cartes tactiles, avec une recherche insensible aux accents. Nos ministères conserve sa présentation des ministères et de leurs départements. Les textes d’accueil ont des animations automatiques continues, désactivées lorsque l’appareil demande de réduire les mouvements.

## Localisation et dons

Pour une base existante, exécuter `npm run db:migrate` dans `api` pour ajouter les paramètres de localisation et de dons. Dans Administration > Informations générales, saisir le lien Google Maps (y compris les liens courts), le lien HTTPS de don et importer l’image du QR code. Le lien court est résolu lors de l’enregistrement pour afficher la carte dans l’application. Si Google ne permet pas cette résolution, copier l’adresse `src` depuis Google Maps > Partager > Intégrer une carte dans « URL de carte intégrée ». Cette carte doit correspondre au lieu du lien Google Maps. Laisser ce champ vide lors d’un changement de lieu pour recalculer la carte. Les rubriques affichent un message d’attente tant que leurs moyens ne sont pas renseignés ; aucun lien d’exemple ou de paiement n’est activé par défaut.
