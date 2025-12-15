CREATE DATABASE IF NOT EXISTS pentaplay
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE pentaplay;



CREATE TABLE IF NOT EXISTS games (
  id INT AUTO_INCREMENT PRIMARY KEY,
  game_name VARCHAR(100) NOT NULL,
  config_json JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



CREATE TABLE IF NOT EXISTS algorithm_runs (
  id INT AUTO_INCREMENT PRIMARY KEY,

  game_id INT NOT NULL,
  algorithm_name VARCHAR(100) NOT NULL,

  metric_name VARCHAR(50) NOT NULL,
  metric_value INT NOT NULL,

  time_ms INT NOT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_algorithm_game
    FOREIGN KEY (game_id) REFERENCES games(id)
    ON DELETE CASCADE
);

CREATE INDEX idx_algorithm_game
ON algorithm_runs(game_id);




CREATE TABLE IF NOT EXISTS snake_ladder_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  game_id INT NOT NULL,
  player_name VARCHAR(100) NOT NULL,

  board_size INT NOT NULL,
  min_throws INT NOT NULL,
  player_choice INT NOT NULL,

  bfs_time_ms INT NOT NULL,
  dijkstra_time_ms INT NOT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  KEY idx_snake_game (game_id),

  CONSTRAINT fk_snake_game
    FOREIGN KEY (game_id) REFERENCES games(id)
    ON DELETE CASCADE
);



CREATE TABLE IF NOT EXISTS traffic_simulation_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  game_id INT NOT NULL,
  player_name VARCHAR(100) NOT NULL,

  max_flow INT NOT NULL,
  player_choice INT NOT NULL,

  edmonds_karp_time_ms INT NOT NULL,
  dinic_time_ms INT NOT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  KEY idx_traffic_game (game_id),

  CONSTRAINT fk_traffic_game
    FOREIGN KEY (game_id) REFERENCES games(id)
    ON DELETE CASCADE
);



CREATE TABLE IF NOT EXISTS traveling_salesman_results (
  id INT AUTO_INCREMENT PRIMARY KEY,

  game_id INT NOT NULL,
  player_name VARCHAR(100) NOT NULL,

  home_city CHAR(1) NOT NULL,
  selected_cities JSON NOT NULL,
  shortest_distance INT NOT NULL,
  shortest_route JSON NOT NULL,

  nn_time_ms INT NOT NULL,
  brute_force_time_ms INT NOT NULL,
  held_karp_time_ms INT NOT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  KEY idx_traveling_salesman_game (game_id),

  CONSTRAINT fk_traveling_salesman_game
    FOREIGN KEY (game_id) REFERENCES games(id)
    ON DELETE CASCADE
);




CREATE TABLE IF NOT EXISTS tower_of_hanoi_results (
  id INT AUTO_INCREMENT PRIMARY KEY,

  game_id INT NOT NULL,
  player_name VARCHAR(100) NOT NULL,

  disks INT NOT NULL,
  pegs INT NOT NULL,
  source_peg CHAR(1) NOT NULL,
  destination_peg CHAR(1) NOT NULL,

  correct_moves INT NOT NULL,
  player_moves INT NOT NULL,

  optimal_sequence JSON NULL,
  player_sequence JSON NULL,

  algo1_name VARCHAR(100) NOT NULL,
  algo1_time_ms INT NOT NULL,
  algo2_name VARCHAR(100) NOT NULL,
  algo2_time_ms INT NOT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  KEY idx_queens_game (game_id),

  CONSTRAINT fk_hanoi_game
    FOREIGN KEY (game_id) REFERENCES games(id)
    ON DELETE CASCADE
);




CREATE TABLE IF NOT EXISTS eight_queens_results (
  id INT AUTO_INCREMENT PRIMARY KEY,

  game_id INT NOT NULL,
  player_name VARCHAR(100) NOT NULL,

  board_size INT NOT NULL,
  correct_total INT NOT NULL,
  player_choice INT NULL,

  seq_time_ms INT NOT NULL,
  threaded_time_ms INT NOT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_queens_game
    FOREIGN KEY (game_id) REFERENCES games(id)
    ON DELETE CASCADE
);



CREATE TABLE IF NOT EXISTS queens_solution_claims (
  id INT AUTO_INCREMENT PRIMARY KEY,

  cycle_number INT NOT NULL,
  solution_sig VARCHAR(255) NOT NULL,
  player_name VARCHAR(100) NOT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  KEY idx_cycle (cycle_number)
);





