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