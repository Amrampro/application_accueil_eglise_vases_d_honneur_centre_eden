-- ATTENTION : supprime les données des tables de l’application.
-- Sauvegarder avant utilisation. Sélectionner vase_honneur dans phpMyAdmin.
-- Puis importer schema.sql. Aucune désactivation des clés étrangères.
DROP TABLE IF EXISTS schema_migrations;
DROP TABLE IF EXISTS member_actions;
DROP TABLE IF EXISTS group_members;
DROP TABLE IF EXISTS member_groups;
DROP TABLE IF EXISTS member_decisions;
DROP TABLE IF EXISTS members;
DROP TABLE IF EXISTS decision_today;
DROP TABLE IF EXISTS requests;
DROP TABLE IF EXISTS panoramas;
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS cells;
DROP TABLE IF EXISTS pastors;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS contacts;
DROP TABLE IF EXISTS schools;
DROP TABLE IF EXISTS ministries;
DROP TABLE IF EXISTS tours;
DROP TABLE IF EXISTS churches;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS admins;
