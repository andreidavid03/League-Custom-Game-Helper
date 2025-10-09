using System;
using System.Collections.Generic;

namespace LoLCustomGameHelper.Models
{
    public class Match
    {
        public int Id { get; set; }
        public DateTime Date { get; set; }
        public GameMode GameMode { get; set; }
        public List<TeamPlayer> BlueTeam { get; set; } = new();
        public List<TeamPlayer> RedTeam { get; set; } = new();
        public string? Winner { get; set; }
        public int? BlueTeamScore { get; set; }
        public int? RedTeamScore { get; set; }
        public string? Notes { get; set; }
    }

    public class TeamPlayer
    {
        public Player Player { get; set; } = new();
        public Role? Role { get; set; }
        public string? Champion { get; set; }
        public int? PersonalScore { get; set; }
    }
}