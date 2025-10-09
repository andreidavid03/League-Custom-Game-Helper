using System;
using System.Collections.Generic;
using System.Linq;
using LoLCustomGameHelper.Models;

namespace LoLCustomGameHelper.Services
{
    public class GameService
    {
        private readonly Random _random = new();

        public (List<TeamPlayer> blueTeam, List<TeamPlayer> redTeam) CreateRandomTeams(
            List<Player> players, 
            GameSettings settings)
        {
            var shuffledPlayers = players.OrderBy(x => _random.Next()).ToList();
            var blueTeam = new List<TeamPlayer>();
            var redTeam = new List<TeamPlayer>();

            // For ARAM, just split players randomly
            if (settings.GameMode == GameMode.ARAM)
            {
                for (int i = 0; i < shuffledPlayers.Count; i++)
                {
                    var teamPlayer = new TeamPlayer { Player = shuffledPlayers[i] };
                    
                    if (settings.RandomizeChampions)
                    {
                        teamPlayer.Champion = GetRandomChampion();
                    }

                    if (i % 2 == 0)
                        blueTeam.Add(teamPlayer);
                    else
                        redTeam.Add(teamPlayer);
                }
            }
            else // 5v5
            {
                var maxPlayersPerTeam = Math.Min(5, shuffledPlayers.Count / 2);
                
                for (int i = 0; i < maxPlayersPerTeam; i++)
                {
                    var bluePlayer = new TeamPlayer { Player = shuffledPlayers[i] };
                    var redPlayer = new TeamPlayer { Player = shuffledPlayers[i + maxPlayersPerTeam] };

                    if (settings.RandomizeRoles)
                    {
                        var availableRoles = Enum.GetValues<Role>().ToList();
                        bluePlayer.Role = availableRoles[_random.Next(availableRoles.Count)];
                        redPlayer.Role = availableRoles[_random.Next(availableRoles.Count)];
                    }

                    if (settings.RandomizeChampions)
                    {
                        bluePlayer.Champion = GetRandomChampion(bluePlayer.Role);
                        redPlayer.Champion = GetRandomChampion(redPlayer.Role);
                    }

                    blueTeam.Add(bluePlayer);
                    redTeam.Add(redPlayer);
                }
            }

            return (blueTeam, redTeam);
        }

        public (List<TeamPlayer> blueTeam, List<TeamPlayer> redTeam) CreateCaptainDraftTeams(
            List<Player> players,
            Player captain1,
            Player captain2,
            List<Player> draftOrder,
            GameSettings settings)
        {
            var blueTeam = new List<TeamPlayer> { new() { Player = captain1 } };
            var redTeam = new List<TeamPlayer> { new() { Player = captain2 } };

            // Alternate picks
            bool blueTeamPick = true;
            foreach (var player in draftOrder)
            {
                var teamPlayer = new TeamPlayer { Player = player };

                if (blueTeamPick)
                    blueTeam.Add(teamPlayer);
                else
                    redTeam.Add(teamPlayer);

                blueTeamPick = !blueTeamPick;
            }

            // Assign roles and champions if needed
            if (settings.RandomizeRoles && settings.GameMode == GameMode.Classic5v5)
            {
                AssignRandomRoles(blueTeam);
                AssignRandomRoles(redTeam);
            }

            if (settings.RandomizeChampions)
            {
                foreach (var player in blueTeam)
                    player.Champion = GetRandomChampion(player.Role);
                foreach (var player in redTeam)
                    player.Champion = GetRandomChampion(player.Role);
            }

            return (blueTeam, redTeam);
        }

        public string SpinWheel(List<string> options)
        {
            if (options == null || !options.Any())
                return string.Empty;

            return options[_random.Next(options.Count)];
        }

        public Player SpinWheelForPlayer(List<Player> players)
        {
            if (players == null || !players.Any())
                return new Player();

            return players[_random.Next(players.Count)];
        }

        public Role SpinWheelForRole()
        {
            var roles = Enum.GetValues<Role>();
            return roles[_random.Next(roles.Length)];
        }

        public string SpinWheelForChampion(Role? role = null)
        {
            return GetRandomChampion(role);
        }

        private void AssignRandomRoles(List<TeamPlayer> team)
        {
            var availableRoles = Enum.GetValues<Role>().ToList();
            var assignedRoles = new List<Role>();

            foreach (var player in team)
            {
                if (assignedRoles.Count >= availableRoles.Count)
                {
                    // If we've assigned all roles, pick randomly
                    player.Role = availableRoles[_random.Next(availableRoles.Count)];
                }
                else
                {
                    // Pick from remaining roles
                    var remainingRoles = availableRoles.Except(assignedRoles).ToList();
                    var selectedRole = remainingRoles[_random.Next(remainingRoles.Count)];
                    player.Role = selectedRole;
                    assignedRoles.Add(selectedRole);
                }
            }
        }

        private string GetRandomChampion(Role? role = null)
        {
            var champions = ChampionData.GetAllChampions();

            if (role.HasValue)
            {
                var roleChampions = champions.Where(c => c.PrimaryRoles.Contains(role.Value)).ToList();
                if (roleChampions.Any())
                    return roleChampions[_random.Next(roleChampions.Count)].Name;
            }

            return champions[_random.Next(champions.Count)].Name;
        }

        public List<Role> GetAvailableRoles(GameMode gameMode)
        {
            if (gameMode == GameMode.ARAM)
                return new List<Role>(); // No roles in ARAM

            return Enum.GetValues<Role>().ToList();
        }
    }
}