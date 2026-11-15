-- ===================================================
-- VECTOR 2.0 Seed Data (60 Real Levels & Default User)
-- ===================================================

INSERT INTO `players` (`id`, `uuid`, `nickname`, `total_stars`, `highest_unlocked_level`)
VALUES (1, '00000000-0000-0000-0000-000000000001', 'PlayerOne', 0, 1)
ON DUPLICATE KEY UPDATE `id` = `id`;

-- World 1: Origin
INSERT INTO `levels` (`id`, `world`, `name`, `width`, `height`, `par_moves`) VALUES
(1, 'origin', 'First Steps', 6, 6, 3),
(2, 'origin', 'The Turn', 6, 6, 2),
(3, 'origin', 'Corridor', 6, 6, 3),
(4, 'origin', 'Pivot', 6, 6, 2),
(5, 'origin', 'Crossroad', 6, 6, 3),
(6, 'origin', 'Fracture I', 7, 7, 4),
(7, 'origin', 'Fracture II', 7, 7, 4),
(8, 'origin', 'Deflection', 7, 7, 3),
(9, 'origin', 'Rebound', 7, 7, 3),
(10, 'origin', 'Square Loop', 7, 7, 3),
(11, 'origin', 'Laser Hazard', 7, 7, 4),
(12, 'origin', 'Grid Matrix', 7, 7, 4),
(13, 'origin', 'The Blockade', 7, 7, 4),
(14, 'origin', 'Reflex', 7, 7, 4),
(15, 'origin', 'Echo', 7, 7, 5),
(16, 'origin', 'Diamond Core', 7, 7, 5),
(17, 'origin', 'Shift', 7, 7, 4),
(18, 'origin', 'Labyrinth', 7, 7, 4),
(19, 'origin', 'Pinball', 7, 7, 4),
(20, 'origin', 'Pulse Hazard', 7, 7, 4),
(21, 'origin', 'Symmetry', 8, 8, 5),
(22, 'origin', 'Kinetic Shock', 8, 8, 5),
(23, 'origin', 'Centrifuge', 8, 8, 6),
(24, 'origin', 'Vector Shift', 8, 8, 5),
(25, 'origin', 'Gridlock', 8, 8, 5),
(26, 'origin', 'Paradox', 8, 8, 6),
(27, 'origin', 'Quantum Trap', 8, 8, 6),
(28, 'origin', 'Continuum', 8, 8, 7),
(29, 'origin', 'Vortex', 8, 8, 6),
(30, 'origin', 'The Citadel', 8, 8, 5)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `par_moves` = VALUES(`par_moves`);

-- World 2: Cores
INSERT INTO `levels` (`id`, `world`, `name`, `width`, `height`, `par_moves`) VALUES
(31, 'keys', 'Core Activation', 8, 8, 4),
(32, 'keys', 'Dual Resonance', 8, 8, 6),
(33, 'keys', 'Keyhole Matrix', 8, 8, 6),
(34, 'keys', 'Cipher Core', 8, 8, 5),
(35, 'keys', 'Access Port', 8, 8, 4),
(36, 'keys', 'Vault Lock', 8, 8, 6),
(37, 'keys', 'Detour', 8, 8, 5),
(38, 'keys', 'Checkpoint X', 8, 8, 5),
(39, 'keys', 'Perimeter', 8, 8, 5),
(40, 'keys', 'Iron Hazard', 8, 8, 4),
(41, 'keys', 'Redirection', 8, 8, 6),
(42, 'keys', 'Core Ring', 8, 8, 5),
(43, 'keys', 'Infiltration', 8, 8, 4),
(44, 'keys', 'Firewall X', 8, 8, 4),
(45, 'keys', 'Deadbolt', 8, 8, 6),
(46, 'keys', 'Twin Core Alpha', 9, 9, 5),
(47, 'keys', 'Binary Hazard', 9, 9, 6),
(48, 'keys', 'Dual Core Beta', 9, 9, 7),
(49, 'keys', 'Bastion', 9, 9, 7),
(50, 'keys', 'Sanction', 9, 9, 5),
(51, 'keys', 'Cryptography', 9, 9, 7),
(52, 'keys', 'Sequencer', 9, 9, 6),
(53, 'keys', 'Overload Trap', 9, 9, 7),
(54, 'keys', 'Fortress', 9, 9, 7),
(55, 'keys', 'Obsidian Core', 9, 9, 6),
(56, 'keys', 'Matrix Hazard', 9, 9, 6),
(57, 'keys', 'Singularity', 9, 9, 8),
(58, 'keys', 'Enigma Gate', 9, 9, 6),
(59, 'keys', 'Apex Vector', 9, 9, 8),
(60, 'keys', 'Vector Prime', 9, 9, 7)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `par_moves` = VALUES(`par_moves`);
