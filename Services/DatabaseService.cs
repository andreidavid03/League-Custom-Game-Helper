using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Data.Sqlite;
using LoLCustomGameHelper.Models;
using Newtonsoft.Json;

namespace LoLCustomGameHelper.Services
{
    public class DatabaseService
    {
        private readonly string _connectionString;
        private readonly string _dbPath;

        public DatabaseService()
        {
            _dbPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), 
                                  "LoLCustomGameHelper", "gamedata.db");
            _connectionString = $"Data Source={_dbPath}";
            
            // Ensure directory exists
            Directory.CreateDirectory(Path.GetDirectoryName(_dbPath)!);
            InitializeDatabase();
        }

        private void InitializeDatabase()
        {
            using var connection = new SqliteConnection(_connectionString);
            connection.Open();

            var createPlayersTable = @"
                CREATE TABLE IF NOT EXISTS Players (
                    Id INTEGER PRIMARY KEY AUTOINCREMENT,
                    Name TEXT NOT NULL UNIQUE,
                    IsActive BOOLEAN DEFAULT 1,
                    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
                )";

            var createMatchesTable = @"
                CREATE TABLE IF NOT EXISTS Matches (
                    Id INTEGER PRIMARY KEY AUTOINCREMENT,
                    Date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    GameMode INTEGER NOT NULL,
                    BlueTeamJson TEXT NOT NULL,
                    RedTeamJson TEXT NOT NULL,
                    Winner TEXT,
                    BlueTeamScore INTEGER,
                    RedTeamScore INTEGER,
                    Notes TEXT
                )";

            using var command = new SqliteCommand(createPlayersTable, connection);
            command.ExecuteNonQuery();

            command.CommandText = createMatchesTable;
            command.ExecuteNonQuery();
        }

        // Player operations
        public async Task<List<Player>> GetAllPlayersAsync()
        {
            var players = new List<Player>();
            using var connection = new SqliteConnection(_connectionString);
            await connection.OpenAsync();

            var command = new SqliteCommand("SELECT * FROM Players WHERE IsActive = 1 ORDER BY Name", connection);
            using var reader = await command.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                players.Add(new Player
                {
                    Id = reader.GetInt32(0),
                    Name = reader.GetString(1),
                    IsActive = reader.GetBoolean(2),
                    CreatedAt = reader.GetDateTime(3)
                });
            }

            return players;
        }

        public async Task<Player> AddPlayerAsync(string name)
        {
            using var connection = new SqliteConnection(_connectionString);
            await connection.OpenAsync();

            var command = new SqliteCommand(
                "INSERT INTO Players (Name) VALUES (@name); SELECT last_insert_rowid();", 
                connection);
            command.Parameters.AddWithValue("@name", name);

            var id = Convert.ToInt32(await command.ExecuteScalarAsync());
            
            return new Player
            {
                Id = id,
                Name = name,
                IsActive = true,
                CreatedAt = DateTime.Now
            };
        }

        public async Task DeletePlayerAsync(int playerId)
        {
            using var connection = new SqliteConnection(_connectionString);
            await connection.OpenAsync();

            var command = new SqliteCommand("UPDATE Players SET IsActive = 0 WHERE Id = @id", connection);
            command.Parameters.AddWithValue("@id", playerId);
            await command.ExecuteNonQueryAsync();
        }

        // Match operations
        public async Task<Match> SaveMatchAsync(Match match)
        {
            using var connection = new SqliteConnection(_connectionString);
            await connection.OpenAsync();

            var blueTeamJson = JsonConvert.SerializeObject(match.BlueTeam);
            var redTeamJson = JsonConvert.SerializeObject(match.RedTeam);

            var command = new SqliteCommand(@"
                INSERT INTO Matches (Date, GameMode, BlueTeamJson, RedTeamJson, Winner, BlueTeamScore, RedTeamScore, Notes)
                VALUES (@date, @gameMode, @blueTeam, @redTeam, @winner, @blueScore, @redScore, @notes);
                SELECT last_insert_rowid();", connection);

            command.Parameters.AddWithValue("@date", match.Date);
            command.Parameters.AddWithValue("@gameMode", (int)match.GameMode);
            command.Parameters.AddWithValue("@blueTeam", blueTeamJson);
            command.Parameters.AddWithValue("@redTeam", redTeamJson);
            command.Parameters.AddWithValue("@winner", match.Winner ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@blueScore", match.BlueTeamScore ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@redScore", match.RedTeamScore ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@notes", match.Notes ?? (object)DBNull.Value);

            match.Id = Convert.ToInt32(await command.ExecuteScalarAsync());
            return match;
        }

        public async Task<List<Match>> GetMatchHistoryAsync()
        {
            var matches = new List<Match>();
            using var connection = new SqliteConnection(_connectionString);
            await connection.OpenAsync();

            var command = new SqliteCommand("SELECT * FROM Matches ORDER BY Date DESC", connection);
            using var reader = await command.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                var blueTeam = JsonConvert.DeserializeObject<List<TeamPlayer>>(reader.GetString(3)) ?? new();
                var redTeam = JsonConvert.DeserializeObject<List<TeamPlayer>>(reader.GetString(4)) ?? new();

                matches.Add(new Match
                {
                    Id = reader.GetInt32(0),
                    Date = reader.GetDateTime(1),
                    GameMode = (GameMode)reader.GetInt32(2),
                    BlueTeam = blueTeam,
                    RedTeam = redTeam,
                    Winner = reader.IsDBNull(5) ? null : reader.GetString(5),
                    BlueTeamScore = reader.IsDBNull(6) ? null : (int?)reader.GetInt32(6),
                    RedTeamScore = reader.IsDBNull(7) ? null : (int?)reader.GetInt32(7),
                    Notes = reader.IsDBNull(8) ? null : reader.GetString(8)
                });
            }

            return matches;
        }

        public async Task<List<Match>> GetPlayerMatchHistoryAsync(int playerId)
        {
            var allMatches = await GetMatchHistoryAsync();
            return allMatches.Where(m => 
                m.BlueTeam.Any(p => p.Player.Id == playerId) || 
                m.RedTeam.Any(p => p.Player.Id == playerId)).ToList();
        }
    }
}