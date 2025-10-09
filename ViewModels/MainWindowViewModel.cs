using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Windows.Input;
using LoLCustomGameHelper.Models;
using LoLCustomGameHelper.Services;

namespace LoLCustomGameHelper.ViewModels
{
    public class MainWindowViewModel : ViewModelBase
    {
        private readonly DatabaseService _databaseService;
        private readonly GameService _gameService;
        
        private GameSettings _gameSettings = new();
        private ObservableCollection<Player> _players = new();
        private string _newPlayerName = string.Empty;
        
        // Game results
        private ObservableCollection<Player> _blueTeam = new();
        private ObservableCollection<Player> _redTeam = new();
        private bool _showResults = false;

        public MainWindowViewModel()
        {
            _databaseService = new DatabaseService();
            _gameService = new GameService();
            
            // Commands
            AddPlayerCommand = new RelayCommand(AddPlayer, () => !string.IsNullOrWhiteSpace(NewPlayerName));
            RemovePlayerCommand = new RelayCommand<Player>(RemovePlayer);
            TogglePlayerSelectionCommand = new RelayCommand<Player>(TogglePlayerSelection);
            
            StartGameCommand = new RelayCommand(StartGame, CanStartGame);
            SaveMatchCommand = new RelayCommand(SaveMatch);
            
            LoadData();
        }

        // Properties
        public GameSettings GameSettings
        {
            get => _gameSettings;
            set => SetField(ref _gameSettings, value);
        }

        public ObservableCollection<Player> Players
        {
            get => _players;
            set => SetField(ref _players, value);
        }

        public ObservableCollection<Player> SelectedPlayers => 
            new(Players.Where(p => p.IsSelected));

        public string NewPlayerName
        {
            get => _newPlayerName;
            set 
            { 
                SetField(ref _newPlayerName, value);
                ((RelayCommand)AddPlayerCommand).RaiseCanExecuteChanged();
            }
        }

        public ObservableCollection<Player> BlueTeam
        {
            get => _blueTeam;
            set => SetField(ref _blueTeam, value);
        }

        public ObservableCollection<Player> RedTeam
        {
            get => _redTeam;
            set => SetField(ref _redTeam, value);
        }

        public bool ShowResults
        {
            get => _showResults;
            set => SetField(ref _showResults, value);
        }

        // Commands
        public ICommand AddPlayerCommand { get; }
        public ICommand RemovePlayerCommand { get; }
        public ICommand TogglePlayerSelectionCommand { get; }
        public ICommand StartGameCommand { get; }
        public ICommand SaveMatchCommand { get; }

        // Methods
        private async void LoadData()
        {
            var players = await _databaseService.GetAllPlayersAsync();
            Players.Clear();
            foreach (var player in players)
            {
                player.PropertyChanged += Player_PropertyChanged;
                Players.Add(player);
            }
        }

        private void Player_PropertyChanged(object? sender, System.ComponentModel.PropertyChangedEventArgs e)
        {
            if (e.PropertyName == nameof(Player.IsSelected))
            {
                OnPropertyChanged(nameof(SelectedPlayers));
                ((RelayCommand)StartGameCommand).RaiseCanExecuteChanged();
            }
        }

        private async void AddPlayer()
        {
            if (string.IsNullOrWhiteSpace(NewPlayerName)) return;

            try
            {
                var player = await _databaseService.AddPlayerAsync(NewPlayerName.Trim());
                player.PropertyChanged += Player_PropertyChanged;
                Players.Add(player);
                NewPlayerName = string.Empty;
            }
            catch (Exception ex)
            {
                // Handle duplicate name error
                Console.WriteLine($"Error adding player: {ex.Message}");
            }
        }

        public async void AddPlayer(string playerName)
        {
            if (string.IsNullOrWhiteSpace(playerName)) return;

            try
            {
                var player = await _databaseService.AddPlayerAsync(playerName.Trim());
                player.PropertyChanged += Player_PropertyChanged;
                Players.Add(player);
            }
            catch (Exception ex)
            {
                // Handle duplicate name error
                Console.WriteLine($"Error adding player: {ex.Message}");
            }
        }

        private async void RemovePlayer(Player? player)
        {
            if (player == null) return;

            await _databaseService.DeletePlayerAsync(player.Id);
            player.PropertyChanged -= Player_PropertyChanged;
            Players.Remove(player);
            OnPropertyChanged(nameof(SelectedPlayers));
        }

        private void TogglePlayerSelection(Player? player)
        {
            if (player != null)
            {
                player.IsSelected = !player.IsSelected;
            }
        }

        private bool CanStartGame()
        {
            return SelectedPlayers.Count >= 2;
        }

        private void StartGame()
        {
            if (SelectedPlayers.Count < 2)
            {
                // Not enough players
                return;
            }

            // Set ARAM mode if we're on ARAM tab (simplified logic)
            GameSettings.GameMode = GameMode.Classic5v5; // Default to 5v5 for now
            
            var (blueTeam, redTeam) = _gameService.CreateRandomTeams(SelectedPlayers.ToList(), GameSettings);
            
            BlueTeam.Clear();
            RedTeam.Clear();
            
            foreach (var player in blueTeam)
            {
                BlueTeam.Add(player.Player);
            }
            
            foreach (var player in redTeam)
            {
                RedTeam.Add(player.Player);
            }
            
            ShowResults = true;
        }

        private async void SaveMatch()
        {
            var blueTeamPlayers = BlueTeam.Select(p => new TeamPlayer { Player = p }).ToList();
            var redTeamPlayers = RedTeam.Select(p => new TeamPlayer { Player = p }).ToList();
            
            var match = new Match
            {
                Date = DateTime.Now,
                GameMode = GameSettings.GameMode,
                BlueTeam = blueTeamPlayers,
                RedTeam = redTeamPlayers
            };

            await _databaseService.SaveMatchAsync(match);
            ShowResults = false; // Hide results after saving
        }
    }

    // Simple RelayCommand implementation
    public class RelayCommand : ICommand
    {
        private readonly Action _execute;
        private readonly Func<bool>? _canExecute;

        public RelayCommand(Action execute, Func<bool>? canExecute = null)
        {
            _execute = execute;
            _canExecute = canExecute;
        }

        public event EventHandler? CanExecuteChanged;

        public bool CanExecute(object? parameter) => _canExecute?.Invoke() ?? true;

        public void Execute(object? parameter) => _execute();

        public void RaiseCanExecuteChanged() => CanExecuteChanged?.Invoke(this, EventArgs.Empty);
    }

    public class RelayCommand<T> : ICommand
    {
        private readonly Action<T?> _execute;
        private readonly Func<T?, bool>? _canExecute;

        public RelayCommand(Action<T?> execute, Func<T?, bool>? canExecute = null)
        {
            _execute = execute;
            _canExecute = canExecute;
        }

        public event EventHandler? CanExecuteChanged;

        public bool CanExecute(object? parameter) => _canExecute?.Invoke((T?)parameter) ?? true;

        public void Execute(object? parameter) => _execute((T?)parameter);

        public void RaiseCanExecuteChanged() => CanExecuteChanged?.Invoke(this, EventArgs.Empty);
    }
}