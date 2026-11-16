-- ===================================================
-- Migration 002: Expand to 120 Levels & 4 Worlds
-- ===================================================

ALTER TABLE `levels` 
  MODIFY COLUMN `world` ENUM('origin', 'keys', 'quantum', 'nexus') NOT NULL;

-- Source updated seed data
SOURCE ../seed.sql;
