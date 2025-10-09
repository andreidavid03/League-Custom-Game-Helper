using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Threading.Tasks;
using LoLCustomGameHelper.Models;
using LoLCustomGameHelper.Services;

namespace LoLCustomGameHelper.ViewModels
{
    public class WheelViewModel : ViewModelBase
    {
        private readonly GameService _gameService;
        private bool _isSpinning = false;
        private string _selectedResult = string.Empty;
        private ObservableCollection<string> _wheelOptions = new();
        private double _wheelRotation = 0;

        public WheelViewModel(GameService gameService)
        {
            _gameService = gameService;
            SpinCommand = new RelayCommand(Spin, () => !IsSpinning && WheelOptions.Any());
        }

        public bool IsSpinning
        {
            get => _isSpinning;
            set => SetField(ref _isSpinning, value);
        }

        public string SelectedResult
        {
            get => _selectedResult;
            set => SetField(ref _selectedResult, value);
        }

        public ObservableCollection<string> WheelOptions
        {
            get => _wheelOptions;
            set => SetField(ref _wheelOptions, value);
        }

        public double WheelRotation
        {
            get => _wheelRotation;
            set => SetField(ref _wheelRotation, value);
        }

        public RelayCommand SpinCommand { get; }

        public void SetPlayers(List<Player> players)
        {
            WheelOptions.Clear();
            foreach (var player in players)
            {
                WheelOptions.Add(player.Name);
            }
        }

        public void SetRoles()
        {
            WheelOptions.Clear();
            foreach (var role in Enum.GetValues<Role>())
            {
                WheelOptions.Add(role.ToString());
            }
        }

        public void SetChampions(Role? role = null)
        {
            var champions = ChampionData.GetAllChampions();
            if (role.HasValue)
            {
                champions = champions.Where(c => c.PrimaryRoles.Contains(role.Value)).ToList();
            }

            WheelOptions.Clear();
            foreach (var champion in champions)
            {
                WheelOptions.Add(champion.Name);
            }
        }

        private async void Spin()
        {
            if (IsSpinning || !WheelOptions.Any()) return;

            IsSpinning = true;
            SelectedResult = string.Empty;

            // Simulate wheel spinning with rotation
            var random = new Random();
            var totalRotation = 720 + random.Next(360, 1080); // 2-5 full rotations
            var startRotation = WheelRotation;

            // Animate wheel rotation
            for (int i = 0; i <= 50; i++)
            {
                var progress = (double)i / 50;
                // Ease out animation
                var easedProgress = 1 - Math.Pow(1 - progress, 3);
                WheelRotation = startRotation + (totalRotation * easedProgress);
                
                await Task.Delay(50);
            }

            // Determine result based on final rotation
            var finalAngle = WheelRotation % 360;
            var sectionSize = 360.0 / WheelOptions.Count;
            var selectedIndex = (int)((360 - finalAngle + (sectionSize / 2)) / sectionSize) % WheelOptions.Count;
            
            SelectedResult = WheelOptions[selectedIndex];
            IsSpinning = false;
        }
    }
}