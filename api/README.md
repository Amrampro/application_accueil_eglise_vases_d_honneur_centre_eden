# API Vase Honneur

Consulter ../README.md pour l’installation complète, le compte administrateur et les vérifications.

- `npm run dev` : serveur de développement.
- `npm start` : serveur d’exploitation.
- `npm run db:import` : import du schéma initial.
- `npm run create-admin -- email nom` : création du compte avec ADMIN_PASSWORD dans l’environnement.
- `npm run test:unit` : validations sans base.
- `npm test` : validations et parcours complet sur MySQL.

Les routes publiques sont GET /api/content, GET /api/health et POST /api/requests. POST /api/auth/login retourne un jeton. Les routes /api/admin exigent ce jeton dans Authorization: Bearer.
