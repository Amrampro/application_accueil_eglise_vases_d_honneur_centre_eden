# Architecture Vase Honneur

config/db.js charge la configuration et crée le pool MySQL. server.js initialise Express, les protections HTTP, le CORS, les routes et le traitement des erreurs. routes/index.js expose les parcours publics et administratifs. middlewares/auth.js vérifie la signature du jeton et sa version en base. controllers/content.js orchestre les lectures et écritures. services/content.js définit les rubriques autorisées et valide les entrées. database contient le schéma initial et les utilitaires de création de compte. tests contient les validations et un parcours MySQL complet.

Les requêtes SQL utilisent des paramètres pour les valeurs. Les noms de tables et de colonnes proviennent uniquement de listes autorisées. Les départements ont une référence obligatoire vers un ministère ; une suppression ne peut pas produire de références orphelines. Les demandes sont privées, stockées dans requests et consultables uniquement après authentification. Les contenus masqués sont exclus de l’API publique ; un ministère masqué masque également ses départements.

L’interface React consulte uniquement l’API. Vite transmet /api au port 3001 en développement. En exploitation, le serveur web assure cette transmission et le repli des routes vers index.html. La session administrateur expire après quatre heures et le changement de mot de passe révoque les jetons antérieurs.
