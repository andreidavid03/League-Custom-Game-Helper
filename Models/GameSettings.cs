namespace LoLCustomGameHelper.Models
{
    public enum GameMode
    {
        Classic5v5,
        ARAM
    }

    public enum SelectionMethod
    {
        Random,
        Wheel,
        Captains
    }

    public enum Role
    {
        Top,
        Jungle,
        Mid,
        ADC,
        Support
    }

    public class GameSettings
    {
        public GameMode GameMode { get; set; }
        public bool RandomizeTeams { get; set; }
        public bool RandomizeRoles { get; set; }
        public bool RandomizeChampions { get; set; }
        public SelectionMethod SelectionMethod { get; set; }
    }
}