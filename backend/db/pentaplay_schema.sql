CREATE TABLE IF NOT EXISTS games (
  id INT AUTO_INCREMENT PRIMARY KEY,
  game_name VARCHAR(100) NOT NULL,
  config_json JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



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

  CONSTRAINT fk_snake_game
    FOREIGN KEY (game_id) REFERENCES games(id)
    ON DELETE CASCADE
);

CREATE INDEX idx_snake_game ON snake_ladder_results(game_id);



CREATE TABLE IF NOT EXISTS traffic_simulation_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  game_id INT NOT NULL,
  player_name VARCHAR(100) NOT NULL,

  max_flow INT NOT NULL,
  player_choice INT NOT NULL,

  edmonds_karp_time_ms INT NOT NULL,
  dinic_time_ms INT NOT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_traffic_game
    FOREIGN KEY (game_id) REFERENCES games(id)
    ON DELETE CASCADE
);

CREATE INDEX idx_traffic_game ON traffic_simulation_results(game_id);



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

  CONSTRAINT fk_traveling_salesman_game
    FOREIGN KEY (game_id) REFERENCES games(id)
    ON DELETE CASCADE
);

CREATE INDEX idx_traveling_salesman_game
ON traveling_salesman_results(game_id);


