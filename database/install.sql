-- ===================================================
-- VECTOR Game Database Initialization
-- ===================================================

CREATE DATABASE IF NOT EXISTS `vector_game` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `vector_game`;

SOURCE tables.sql;
SOURCE seed.sql;
