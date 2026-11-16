-- ===================================================
-- VECTOR Game Core Tables Definition
-- ===================================================

CREATE TABLE IF NOT EXISTS `players` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `uuid` VARCHAR(36) NOT NULL UNIQUE,
  `nickname` VARCHAR(50) NOT NULL DEFAULT 'VectorPlayer',
  `total_stars` INT UNSIGNED NOT NULL DEFAULT 0,
  `highest_unlocked_level` INT UNSIGNED NOT NULL DEFAULT 1,
  `sound_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `haptics_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_player_stars` (`total_stars` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `levels` (
  `id` INT UNSIGNED PRIMARY KEY,
  `world` ENUM('origin', 'keys', 'quantum', 'nexus') NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `width` TINYINT UNSIGNED NOT NULL,
  `height` TINYINT UNSIGNED NOT NULL,
  `par_moves` TINYINT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `player_level_progress` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `player_id` INT UNSIGNED NOT NULL,
  `level_id` INT UNSIGNED NOT NULL,
  `completed` TINYINT(1) NOT NULL DEFAULT 0,
  `stars` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `best_moves` INT UNSIGNED NULL,
  `completed_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_player_level` (`player_id`, `level_id`),
  CONSTRAINT `fk_progress_player` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_progress_level` FOREIGN KEY (`level_id`) REFERENCES `levels` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `game_sessions` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `session_token` VARCHAR(64) NOT NULL UNIQUE,
  `player_id` INT UNSIGNED NOT NULL,
  `level_id` INT UNSIGNED NOT NULL,
  `moves_taken` INT UNSIGNED NOT NULL DEFAULT 0,
  `par_moves` INT UNSIGNED NOT NULL,
  `stars_awarded` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `completed` TINYINT(1) NOT NULL DEFAULT 0,
  `started_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `finished_at` TIMESTAMP NULL,
  INDEX `idx_session_player` (`player_id`),
  CONSTRAINT `fk_session_player` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_session_level` FOREIGN KEY (`level_id`) REFERENCES `levels` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
