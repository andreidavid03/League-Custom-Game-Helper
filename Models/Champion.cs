using System;
using System.Collections.Generic;
using System.Linq;

namespace LoLCustomGameHelper.Models
{
    public class Champion
    {
        public string Name { get; set; } = string.Empty;
        public List<Role> PrimaryRoles { get; set; } = new();
        public string ImagePath { get; set; } = string.Empty;
    }

    public static class ChampionData
    {
        public static List<Champion> GetAllChampions()
        {
            return new List<Champion>
            {
                // Top Lane Champions
                new Champion { Name = "Aatrox", PrimaryRoles = new List<Role> { Role.Top } },
                new Champion { Name = "Camille", PrimaryRoles = new List<Role> { Role.Top } },
                new Champion { Name = "Darius", PrimaryRoles = new List<Role> { Role.Top } },
                new Champion { Name = "Fiora", PrimaryRoles = new List<Role> { Role.Top } },
                new Champion { Name = "Garen", PrimaryRoles = new List<Role> { Role.Top } },
                new Champion { Name = "Irelia", PrimaryRoles = new List<Role> { Role.Top, Role.Mid } },
                new Champion { Name = "Jax", PrimaryRoles = new List<Role> { Role.Top } },
                new Champion { Name = "Malphite", PrimaryRoles = new List<Role> { Role.Top } },
                new Champion { Name = "Nasus", PrimaryRoles = new List<Role> { Role.Top } },
                new Champion { Name = "Ornn", PrimaryRoles = new List<Role> { Role.Top } },
                new Champion { Name = "Renekton", PrimaryRoles = new List<Role> { Role.Top } },
                new Champion { Name = "Shen", PrimaryRoles = new List<Role> { Role.Top } },
                new Champion { Name = "Teemo", PrimaryRoles = new List<Role> { Role.Top } },
                new Champion { Name = "Volibear", PrimaryRoles = new List<Role> { Role.Top, Role.Jungle } },

                // Jungle Champions
                new Champion { Name = "Graves", PrimaryRoles = new List<Role> { Role.Jungle } },
                new Champion { Name = "Hecarim", PrimaryRoles = new List<Role> { Role.Jungle } },
                new Champion { Name = "Kha'Zix", PrimaryRoles = new List<Role> { Role.Jungle } },
                new Champion { Name = "Lee Sin", PrimaryRoles = new List<Role> { Role.Jungle } },
                new Champion { Name = "Master Yi", PrimaryRoles = new List<Role> { Role.Jungle } },
                new Champion { Name = "Nidalee", PrimaryRoles = new List<Role> { Role.Jungle } },
                new Champion { Name = "Olaf", PrimaryRoles = new List<Role> { Role.Jungle } },
                new Champion { Name = "Rengar", PrimaryRoles = new List<Role> { Role.Jungle } },
                new Champion { Name = "Shaco", PrimaryRoles = new List<Role> { Role.Jungle } },
                new Champion { Name = "Udyr", PrimaryRoles = new List<Role> { Role.Jungle } },
                new Champion { Name = "Warwick", PrimaryRoles = new List<Role> { Role.Jungle } },
                new Champion { Name = "Xin Zhao", PrimaryRoles = new List<Role> { Role.Jungle } },

                // Mid Lane Champions
                new Champion { Name = "Ahri", PrimaryRoles = new List<Role> { Role.Mid } },
                new Champion { Name = "Akali", PrimaryRoles = new List<Role> { Role.Mid } },
                new Champion { Name = "Annie", PrimaryRoles = new List<Role> { Role.Mid } },
                new Champion { Name = "Azir", PrimaryRoles = new List<Role> { Role.Mid } },
                new Champion { Name = "Fizz", PrimaryRoles = new List<Role> { Role.Mid } },
                new Champion { Name = "Katarina", PrimaryRoles = new List<Role> { Role.Mid } },
                new Champion { Name = "LeBlanc", PrimaryRoles = new List<Role> { Role.Mid } },
                new Champion { Name = "Lux", PrimaryRoles = new List<Role> { Role.Mid, Role.Support } },
                new Champion { Name = "Malzahar", PrimaryRoles = new List<Role> { Role.Mid } },
                new Champion { Name = "Orianna", PrimaryRoles = new List<Role> { Role.Mid } },
                new Champion { Name = "Syndra", PrimaryRoles = new List<Role> { Role.Mid } },
                new Champion { Name = "Twisted Fate", PrimaryRoles = new List<Role> { Role.Mid } },
                new Champion { Name = "Veigar", PrimaryRoles = new List<Role> { Role.Mid } },
                new Champion { Name = "Yasuo", PrimaryRoles = new List<Role> { Role.Mid } },
                new Champion { Name = "Zed", PrimaryRoles = new List<Role> { Role.Mid } },

                // ADC Champions
                new Champion { Name = "Ashe", PrimaryRoles = new List<Role> { Role.ADC } },
                new Champion { Name = "Caitlyn", PrimaryRoles = new List<Role> { Role.ADC } },
                new Champion { Name = "Draven", PrimaryRoles = new List<Role> { Role.ADC } },
                new Champion { Name = "Ezreal", PrimaryRoles = new List<Role> { Role.ADC } },
                new Champion { Name = "Jinx", PrimaryRoles = new List<Role> { Role.ADC } },
                new Champion { Name = "Kai'Sa", PrimaryRoles = new List<Role> { Role.ADC } },
                new Champion { Name = "Lucian", PrimaryRoles = new List<Role> { Role.ADC } },
                new Champion { Name = "Miss Fortune", PrimaryRoles = new List<Role> { Role.ADC } },
                new Champion { Name = "Sivir", PrimaryRoles = new List<Role> { Role.ADC } },
                new Champion { Name = "Tristana", PrimaryRoles = new List<Role> { Role.ADC } },
                new Champion { Name = "Twitch", PrimaryRoles = new List<Role> { Role.ADC } },
                new Champion { Name = "Vayne", PrimaryRoles = new List<Role> { Role.ADC } },
                new Champion { Name = "Varus", PrimaryRoles = new List<Role> { Role.ADC } },
                new Champion { Name = "Xayah", PrimaryRoles = new List<Role> { Role.ADC } },

                // Support Champions
                new Champion { Name = "Alistar", PrimaryRoles = new List<Role> { Role.Support } },
                new Champion { Name = "Blitzcrank", PrimaryRoles = new List<Role> { Role.Support } },
                new Champion { Name = "Braum", PrimaryRoles = new List<Role> { Role.Support } },
                new Champion { Name = "Janna", PrimaryRoles = new List<Role> { Role.Support } },
                new Champion { Name = "Leona", PrimaryRoles = new List<Role> { Role.Support } },
                new Champion { Name = "Lulu", PrimaryRoles = new List<Role> { Role.Support } },
                new Champion { Name = "Morgana", PrimaryRoles = new List<Role> { Role.Support } },
                new Champion { Name = "Nami", PrimaryRoles = new List<Role> { Role.Support } },
                new Champion { Name = "Nautilus", PrimaryRoles = new List<Role> { Role.Support } },
                new Champion { Name = "Rakan", PrimaryRoles = new List<Role> { Role.Support } },
                new Champion { Name = "Soraka", PrimaryRoles = new List<Role> { Role.Support } },
                new Champion { Name = "Thresh", PrimaryRoles = new List<Role> { Role.Support } },
                new Champion { Name = "Yuumi", PrimaryRoles = new List<Role> { Role.Support } },
                new Champion { Name = "Zyra", PrimaryRoles = new List<Role> { Role.Support } }
            };
        }
    }
}