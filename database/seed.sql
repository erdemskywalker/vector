-- ===================================================
-- VECTOR Game Seed Data (60 Real Levels & Default User)
-- ===================================================

INSERT INTO `players` (`id`, `uuid`, `nickname`, `total_stars`, `highest_unlocked_level`)
VALUES (1, '00000000-0000-0000-0000-000000000001', 'PlayerOne', 0, 1)
ON DUPLICATE KEY UPDATE `id` = `id`;

-- World 1: Origin
INSERT INTO `levels` (`id`, `world`, `name`, `width`, `height`, `par_moves`) VALUES
(1, 'origin', 'First Steps', 6, 6, 2),
(2, 'origin', 'The Turn', 6, 6, 3),
(3, 'origin', 'Corridor', 6, 6, 3),
(4, 'origin', 'Pivot', 6, 6, 3),
(5, 'origin', 'Crossroad', 6, 6, 2),
(6, 'origin', 'Angle', 7, 7, 5),
(7, 'origin', 'Zigzag', 7, 7, 4),
(8, 'origin', 'Deflection', 7, 7, 4),
(9, 'origin', 'Rebound', 7, 7, 4),
(10, 'origin', 'Square Loop', 7, 7, 5),
(11, 'origin', 'Orbit', 7, 7, 4),
(12, 'origin', 'Precision', 7, 7, 4),
(13, 'origin', 'The Blockade', 7, 7, 5),
(14, 'origin', 'Reflex', 7, 7, 4),
(15, 'origin', 'Echo', 7, 7, 4),
(16, 'origin', 'Diamond', 8, 8, 5),
(17, 'origin', 'Shift', 8, 8, 5),
(18, 'origin', 'Labyrinth', 8, 8, 5),
(19, 'origin', 'Pinball', 8, 8, 6),
(20, 'origin', 'Pulse', 8, 8, 5),
(21, 'origin', 'Symmetry', 8, 8, 5),
(22, 'origin', 'Kinetic', 8, 8, 5),
(23, 'origin', 'Centrifuge', 8, 8, 6),
(24, 'origin', 'Vector Shift', 8, 8, 5),
(25, 'origin', 'Gridlock', 8, 8, 5),
(26, 'origin', 'Paradox', 9, 9, 7),
(27, 'origin', 'Quantum', 9, 9, 6),
(28, 'origin', 'Continuum', 9, 9, 7),
(29, 'origin', 'Vortex', 9, 9, 6),
(30, 'origin', 'The Citadel', 9, 9, 7)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `par_moves` = VALUES(`par_moves`);

-- World 2: Keys
INSERT INTO `levels` (`id`, `world`, `name`, `width`, `height`, `par_moves`) VALUES
(31, 'keys', 'First Lock', 8, 8, 6),
(32, 'keys', 'The Barrier', 8, 8, 5),
(33, 'keys', 'Keyhole', 8, 8, 4),
(34, 'keys', 'Cipher', 8, 8, 4),
(35, 'keys', 'Access Port', 8, 8, 6),
(36, 'keys', 'Vault', 8, 8, 4),
(37, 'keys', 'Detour', 8, 8, 4),
(38, 'keys', 'Checkpoint', 8, 8, 5),
(39, 'keys', 'Perimeter', 8, 8, 5),
(40, 'keys', 'Iron Gate', 8, 8, 4),
(41, 'keys', 'Redirection', 8, 8, 4),
(42, 'keys', 'Key Ring', 8, 8, 4),
(43, 'keys', 'Infiltration', 8, 8, 5),
(44, 'keys', 'Firewall', 8, 8, 4),
(45, 'keys', 'Deadbolt', 8, 8, 5),
(46, 'keys', 'Twin Lock', 9, 9, 5),
(47, 'keys', 'Binary Gate', 9, 9, 7),
(48, 'keys', 'Dual Core', 9, 9, 6),
(49, 'keys', 'Bastion', 9, 9, 6),
(50, 'keys', 'Sanction', 9, 9, 6),
(51, 'keys', 'Cryptography', 9, 9, 5),
(52, 'keys', 'Sequencer', 9, 9, 6),
(53, 'keys', 'Overload', 9, 9, 5),
(54, 'keys', 'Fortress', 9, 9, 5),
(55, 'keys', 'Obsidian', 9, 9, 7),
(56, 'keys', 'Matrix', 9, 9, 6),
(57, 'keys', 'Singularity', 9, 9, 8),
(58, 'keys', 'Enigma', 9, 9, 8),
(59, 'keys', 'Apex', 9, 9, 6),
(60, 'keys', 'Vector Prime', 9, 9, 7)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `par_moves` = VALUES(`par_moves`);
