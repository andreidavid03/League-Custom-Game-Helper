using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Avalonia.Controls;
using Avalonia.Controls.Shapes;
using Avalonia.Interactivity;
using Avalonia.Threading;
using Avalonia.Input;
using Avalonia.Media;
using LoLCustomGameHelper.ViewModels;
using LoLCustomGameHelper.Models;
using LoLCustomGameHelper.Services;
using System.Linq;
using System.IO;

namespace LoLCustomGameHelper.Views
{
    public partial class MainWindow : Window
    {
        private MainWindowViewModel? ViewModel => DataContext as MainWindowViewModel;
        private List<Player> _wheelPlayers = new();
        private List<Player> _availablePlayersForDraft = new();
        private bool _isBlueTeamTurn = true;
        private bool _captainsSet = false;
        
        // New Wheel of Names system variables
        private List<Role> _roleWheelItems = new();
        private bool _isInRoleAssignment = false;
        private int _currentPlayerForRole = 0;
        private List<Player> _playersNeedingRoles = new();
        private AudioService _audioService = new();
        
        // Wheel of Names color palette
        private readonly string[] _wheelColors = new[]
        {
            "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", 
            "#F7DC6F", "#BB8FCE", "#85C1E9", "#F8C471", "#82E0AA",
            "#F1948A", "#85C1E9", "#F4D03F", "#AED6F1", "#A9DFBF"
        };
        
        // Wheel physics constants (like Wheel of Names)
        private bool _isSpinning = false;
        private double _currentRotation = 0;

        public MainWindow()
        {
            InitializeComponent();
            DataContext = new MainWindowViewModel();
            
            // Set up event handlers for radio buttons
            SetupGameModeHandlers();
        }

        private void SetupGameModeHandlers()
        {
            var randomRadio = this.FindControl<RadioButton>("RandomModeRadio");
            var captainRadio = this.FindControl<RadioButton>("CaptainModeRadio");
            var wheelRadio = this.FindControl<RadioButton>("WheelModeRadio");
            
            if (randomRadio != null) randomRadio.IsCheckedChanged += OnGameModeChanged;
            if (captainRadio != null) captainRadio.IsCheckedChanged += OnGameModeChanged;
            if (wheelRadio != null) wheelRadio.IsCheckedChanged += OnGameModeChanged;
        }

        private void OnGameModeChanged(object? sender, RoutedEventArgs e)
        {
            var randomControls = this.FindControl<StackPanel>("RandomControls");
            var captainControls = this.FindControl<StackPanel>("CaptainControls");
            var wheelControls = this.FindControl<StackPanel>("WheelControls");
            var wheelDisplay = this.FindControl<StackPanel>("WheelDisplay");
            var vsDisplay = this.FindControl<StackPanel>("VSDisplay");
            
            var randomRadio = this.FindControl<RadioButton>("RandomModeRadio");
            var captainRadio = this.FindControl<RadioButton>("CaptainModeRadio");
            var wheelRadio = this.FindControl<RadioButton>("WheelModeRadio");

            if (randomControls != null && captainControls != null && wheelControls != null)
            {
                // Clear teams when switching modes
                ClearTeams_Click(null, new RoutedEventArgs());
                
                bool isRandomMode = randomRadio?.IsChecked == true;
                bool isCaptainMode = captainRadio?.IsChecked == true;
                bool isWheelMode = wheelRadio?.IsChecked == true;
                
                randomControls.IsVisible = isRandomMode;
                captainControls.IsVisible = isCaptainMode;
                wheelControls.IsVisible = isWheelMode;
                
                // Update captain mode status
                if (isCaptainMode)
                {
                    UpdateCaptainModeStatus();
                    UpdateCaptainComboBoxes();
                }
                
                // Show/hide wheel display
                if (wheelDisplay != null) wheelDisplay.IsVisible = isWheelMode;
                if (vsDisplay != null) vsDisplay.IsVisible = !isWheelMode;
                
                // If switching to wheel mode and we have selected players, set up the wheel preview
                if (isWheelMode && ViewModel != null)
                {
                    var selectedPlayers = ViewModel.Players.Where(p => p.IsSelected).ToList();
                    if (selectedPlayers.Count > 0)
                    {
                        _wheelPlayers = new List<Player>(selectedPlayers);
                        SetupWheelDisplay();
                        
                        // Update wheel status
                        var wheelCurrentPlayer = this.FindControl<TextBlock>("WheelCurrentPlayer");
                        if (wheelCurrentPlayer != null)
                        {
                            wheelCurrentPlayer.Text = $"Preview: {selectedPlayers.Count} players ready!";
                        }
                    }
                    else
                    {
                        var wheelCurrentPlayer = this.FindControl<TextBlock>("WheelCurrentPlayer");
                        if (wheelCurrentPlayer != null)
                        {
                            wheelCurrentPlayer.Text = "Please select players first!";
                        }
                    }
                }
                
                _captainsSet = false;
                var draftPanel = this.FindControl<Border>("DraftPanel");
                if (draftPanel != null) draftPanel.IsVisible = false;
                
                // Update captain ComboBoxes with selected players only
                if (isCaptainMode)
                {
                    // Use a small delay to ensure UI is ready
                    Dispatcher.UIThread.Post(() => UpdateCaptainComboBoxes(), DispatcherPriority.Background);
                    
                    // Also update after a short delay to catch any late updates
                    Task.Delay(100).ContinueWith(_ => 
                        Dispatcher.UIThread.Post(() => UpdateCaptainComboBoxes(), DispatcherPriority.Background));
                }
            }
        }

        private void UpdateCaptainModeStatus()
        {
            var stepIndicator = this.FindControl<TextBlock>("CaptainStepIndicator");
            if (stepIndicator == null || ViewModel == null) return;
            
            var selectedCount = ViewModel.Players.Count(p => p.IsSelected);
            
            if (selectedCount == 0)
            {
                stepIndicator.Text = "📋 Step 1: First, select 10 players from the list above";
            }
            else if (selectedCount < 10)
            {
                stepIndicator.Text = $"📋 Step 1: Select {10 - selectedCount} more players ({selectedCount}/10 selected)";
            }
            else if (selectedCount == 10)
            {
                stepIndicator.Text = "👑 Step 2: Perfect! Now choose your captains below and start the draft";
            }
            else
            {
                stepIndicator.Text = $"⚠️ Too many players selected! Please select exactly 10 players ({selectedCount}/10)";
            }
        }

        private void UpdateCaptainComboBoxes()
        {
            if (ViewModel == null) return;
            
            var selectedPlayers = ViewModel.Players.Where(p => p.IsSelected).ToList();
            
            var blueCaptainCombo = this.FindControl<ComboBox>("BlueCaptainCombo");
            var redCaptainCombo = this.FindControl<ComboBox>("RedCaptainCombo");
            
            if (blueCaptainCombo != null)
            {
                blueCaptainCombo.ItemsSource = selectedPlayers;
                blueCaptainCombo.DisplayMemberBinding = new Avalonia.Data.Binding("Name");
                blueCaptainCombo.SelectedItem = null;
            }
            
            if (redCaptainCombo != null)
            {
                redCaptainCombo.ItemsSource = selectedPlayers;
                redCaptainCombo.DisplayMemberBinding = new Avalonia.Data.Binding("Name");
                redCaptainCombo.SelectedItem = null;
            }
        }

        private void AddPlayer_Click(object? sender, RoutedEventArgs e)
        {
            var textBox = this.FindControl<TextBox>("PlayerNameInput");
            if (textBox != null && !string.IsNullOrWhiteSpace(textBox.Text) && ViewModel != null)
            {
                var player = new Player { Name = textBox.Text.Trim() };
                ViewModel.Players.Add(player);
                textBox.Text = "";
                textBox.Focus();
            }
        }

        private void PlayerNameInput_KeyDown(object? sender, KeyEventArgs e)
        {
            if (e.Key == Key.Enter)
            {
                AddPlayer_Click(sender, new RoutedEventArgs());
            }
        }

        private void RemovePlayer_Click(object? sender, RoutedEventArgs e)
        {
            if (sender is Button button && button.Tag is Player player && ViewModel != null)
            {
                ViewModel.Players.Remove(player);
            }
        }

        private void SelectAll_Click(object? sender, RoutedEventArgs e)
        {
            if (ViewModel == null) return;
            
            foreach (var player in ViewModel.Players)
            {
                player.IsSelected = true;
            }
            
            // Update captain ComboBoxes if in captain mode
            var captainRadio = this.FindControl<RadioButton>("CaptainModeRadio");
            if (captainRadio?.IsChecked == true)
            {
                UpdateCaptainComboBoxes();
                UpdateCaptainModeStatus();
            }
        }

        private void ClearSelection_Click(object? sender, RoutedEventArgs e)
        {
            if (ViewModel == null) return;
            
            foreach (var player in ViewModel.Players)
            {
                player.IsSelected = false;
            }
            
            // Update captain ComboBoxes if in captain mode
            var captainRadio = this.FindControl<RadioButton>("CaptainModeRadio");
            if (captainRadio?.IsChecked == true)
            {
                UpdateCaptainComboBoxes();
                UpdateCaptainModeStatus();
            }
        }

        private void StartRandomGame_Click(object? sender, RoutedEventArgs e)
        {
            if (ViewModel == null) return;

            var selectedPlayers = ViewModel.Players.Where(p => p.IsSelected).ToList();
            
            if (selectedPlayers.Count != 10)
            {
                ShowMessage($"Please select exactly 10 players for 5v5 mode! (Currently selected: {selectedPlayers.Count})");
                return;
            }

            var assignRoles = this.FindControl<CheckBox>("AssignRandomRolesCheckBox");
            StartRandomTeams(selectedPlayers, false);
            
            var manageRolesBtn = this.FindControl<Button>("ManageRolesBtn");
            if (manageRolesBtn != null) manageRolesBtn.IsVisible = true;
            
            if (assignRoles?.IsChecked == true)
            {
                ShowRoleAssignmentWheel();
            }
            else
            {
                ShowMessage("Teams formed! You can assign roles later or start the game.");
                ShowChampionsTab();
            }
        }

        private void StartWheel_Click(object? sender, RoutedEventArgs e)
        {
            if (ViewModel == null) return;

            var selectedPlayers = ViewModel.Players.Where(p => p.IsSelected).ToList();
            
            if (selectedPlayers.Count != 10)
            {
                ShowMessage($"Please select exactly 10 players for 5v5 mode! (Currently selected: {selectedPlayers.Count})");
                return;
            }

            // Initialize wheel players first
            _wheelPlayers = new List<Player>(selectedPlayers);
            
            var wheelDisplay = this.FindControl<StackPanel>("WheelDisplay");
            if (wheelDisplay != null) wheelDisplay.IsVisible = true;
            
            SetupWheelDisplay();
            
            var wheelCurrentPlayer = this.FindControl<TextBlock>("WheelCurrentPlayer");
            if (wheelCurrentPlayer != null)
            {
                wheelCurrentPlayer.Text = $"Ready to spin! {_wheelPlayers.Count} players loaded";
                wheelCurrentPlayer.IsVisible = true;
            }
            
            StartWheelMode(selectedPlayers, false);
        }

        private void ShowChampionsTab()
        {
            var championsTab = this.FindControl<TabItem>("ChampionsTab");
            if (championsTab != null)
            {
                championsTab.IsVisible = true;
            }
        }

        private void StartRandomTeams(List<Player> players, bool assignRoles)
        {
            var random = new Random();
            var shuffled = players.OrderBy(x => random.Next()).ToList();
            
            ViewModel?.BlueTeam.Clear();
            ViewModel?.RedTeam.Clear();
            
            for (int i = 0; i < 5; i++)
            {
                var bluePlayer = shuffled[i];
                var redPlayer = shuffled[i + 5];
                
                if (assignRoles)
                {
                    bluePlayer.Role = GetRoleForPosition(i);
                    redPlayer.Role = GetRoleForPosition(i);
                }
                
                ViewModel?.BlueTeam.Add(bluePlayer);
                ViewModel?.RedTeam.Add(redPlayer);
            }
            
            // Show Champions tab when teams are complete
            ShowChampionsTab();
        }

        private void SetCaptains_Click(object? sender, RoutedEventArgs e)
        {
            var blueCaptainCombo = this.FindControl<ComboBox>("BlueCaptainCombo");
            var redCaptainCombo = this.FindControl<ComboBox>("RedCaptainCombo");
            var draftPanel = this.FindControl<Border>("DraftPanel");
            
            var blueCaptain = blueCaptainCombo?.SelectedItem as Player;
            var redCaptain = redCaptainCombo?.SelectedItem as Player;
            
            if (blueCaptain == null || redCaptain == null)
            {
                ShowMessage("Please select both captains!");
                return;
            }

            if (blueCaptain == redCaptain)
            {
                ShowMessage("Captains must be different players!");
                return;
            }

            // Clear teams and set captains
            ViewModel?.BlueTeam.Clear();
            ViewModel?.RedTeam.Clear();
            
            ViewModel?.BlueTeam.Add(blueCaptain);
            ViewModel?.RedTeam.Add(redCaptain);
            
            // Prepare available players for assignment (excluding captains)
            var selectedPlayers = ViewModel?.Players.Where(p => p.IsSelected).ToList() ?? new List<Player>();
            _availablePlayersForDraft = selectedPlayers.Where(p => p != blueCaptain && p != redCaptain).ToList();
            
            // Update UI
            UpdatePlayerAssignmentUI();
            
            // Show draft panel
            if (draftPanel != null) 
            {
                draftPanel.IsVisible = true;
                
                // Force UI update
                Dispatcher.UIThread.Post(() => 
                {
                    UpdatePlayerAssignmentUI();
                }, DispatcherPriority.Background);
            }
            
            _captainsSet = true;
            ShowMessage($"✅ Captains set! {blueCaptain.Name} (Blue) vs {redCaptain.Name} (Red). Now assign the remaining {_availablePlayersForDraft.Count} players.");
        }

        private void UpdatePlayerAssignmentUI()
        {
            // Update available players dropdown
            var playerCombo = this.FindControl<ComboBox>("PlayerToAssignCombo");
            if (playerCombo != null)
            {
                playerCombo.ItemsSource = _availablePlayersForDraft.ToList();
                playerCombo.DisplayMemberBinding = new Avalonia.Data.Binding("Name");
                playerCombo.SelectedItem = null;
            }

            // Update available players list display
            var availableControl = this.FindControl<ItemsControl>("AvailablePlayersForDraft");
            if (availableControl != null)
            {
                availableControl.ItemsSource = _availablePlayersForDraft.ToList();
            }

            // Update team counts
            UpdateTeamCounts();
        }

        private void UpdateTeamCounts()
        {
            var blueCount = this.FindControl<TextBlock>("BlueTeamCount");
            var redCount = this.FindControl<TextBlock>("RedTeamCount");
            var remainingCount = this.FindControl<TextBlock>("RemainingCount");

            if (blueCount != null)
                blueCount.Text = $"🛡️ Blue: {ViewModel?.BlueTeam.Count ?? 0}/5 players";
            
            if (redCount != null)
                redCount.Text = $"⚔️ Red: {ViewModel?.RedTeam.Count ?? 0}/5 players";
            
            if (remainingCount != null)
                remainingCount.Text = $"📋 Remaining: {_availablePlayersForDraft.Count} players";
        }

        private void AssignToBlue_Click(object? sender, RoutedEventArgs e)
        {
            var playerCombo = this.FindControl<ComboBox>("PlayerToAssignCombo");
            if (playerCombo?.SelectedItem is not Player selectedPlayer)
            {
                ShowMessage("Please select a player to assign!");
                return;
            }

            if ((ViewModel?.BlueTeam.Count ?? 0) >= 5)
            {
                ShowMessage("Blue team is already full!");
                return;
            }

            // Add to blue team and remove from available
            ViewModel?.BlueTeam.Add(selectedPlayer);
            _availablePlayersForDraft.Remove(selectedPlayer);
            
            UpdatePlayerAssignmentUI();
            CheckIfDraftComplete();
            ShowMessage($"{selectedPlayer.Name} assigned to Blue Team!");
        }

        private void AssignToRed_Click(object? sender, RoutedEventArgs e)
        {
            var playerCombo = this.FindControl<ComboBox>("PlayerToAssignCombo");
            if (playerCombo?.SelectedItem is not Player selectedPlayer)
            {
                ShowMessage("Please select a player to assign!");
                return;
            }

            if ((ViewModel?.RedTeam.Count ?? 0) >= 5)
            {
                ShowMessage("Red team is already full!");
                return;
            }

            // Add to red team and remove from available
            ViewModel?.RedTeam.Add(selectedPlayer);
            _availablePlayersForDraft.Remove(selectedPlayer);
            
            UpdatePlayerAssignmentUI();
            CheckIfDraftComplete();
            ShowMessage($"{selectedPlayer.Name} assigned to Red Team!");
        }

        private void FinishDraft_Click(object? sender, RoutedEventArgs e)
        {
            if ((ViewModel?.BlueTeam.Count ?? 0) != 5 || (ViewModel?.RedTeam.Count ?? 0) != 5)
            {
                ShowMessage("Both teams must have exactly 5 players! Assign the remaining players first.");
                return;
            }

            // Show role assignment panel
            var rolePanel = this.FindControl<Border>("CaptainRolePanel");
            if (rolePanel != null) rolePanel.IsVisible = true;

            ShowMessage("🎉 All players assigned! Now assign roles to complete the setup.");
        }

        private void CheckIfDraftComplete()
        {
            if (_availablePlayersForDraft.Count == 0 && 
                (ViewModel?.BlueTeam.Count ?? 0) == 5 && 
                (ViewModel?.RedTeam.Count ?? 0) == 5)
            {
                // Auto-show role panel when draft is complete
                var rolePanel = this.FindControl<Border>("CaptainRolePanel");
                if (rolePanel != null) rolePanel.IsVisible = true;

                ShowMessage("🎉 Draft complete! Both teams have 5 players. Now assign roles.");
            }
        }

        private void UpdateAvailablePlayersForDraft()
        {
            var availableControl = this.FindControl<ItemsControl>("AvailablePlayersForDraft");
            if (availableControl != null)
            {
                availableControl.ItemsSource = _availablePlayersForDraft.ToList();
            }
        }

        private void AssignRandomRoles_Click(object? sender, RoutedEventArgs e)
        {
            if (ViewModel == null) return;
            
            // Get all players from both teams
            var allPlayers = ViewModel.BlueTeam.Concat(ViewModel.RedTeam).ToList();
            var roles = new[] { Role.Top, Role.Jungle, Role.Mid, Role.ADC, Role.Support };
            var random = new Random();
            
            // Shuffle roles for each team separately
            var blueRoles = roles.OrderBy(x => random.Next()).ToArray();
            var redRoles = roles.OrderBy(x => random.Next()).ToArray();
            
            // Assign roles to blue team
            for (int i = 0; i < ViewModel.BlueTeam.Count && i < blueRoles.Length; i++)
            {
                ViewModel.BlueTeam[i].Role = blueRoles[i];
            }
            
            // Assign roles to red team
            for (int i = 0; i < ViewModel.RedTeam.Count && i < redRoles.Length; i++)
            {
                ViewModel.RedTeam[i].Role = redRoles[i];
            }
            
            ShowMessage("🎉 Random roles assigned! Teams are ready to play!");
            ShowChampionsTab();
        }

        private void ShowManualRoles_Click(object? sender, RoutedEventArgs e)
        {
            ShowMessage("Manual role assignment feature coming soon! Use 'Manage Roles' button for now.");
        }

        private void ShowRoleManagement_Click(object? sender, RoutedEventArgs e)
        {
            ShowMessage("Role Management Panel: Feature coming soon! For now, use 'Random Roles' in Captain mode.");
        }

        private Role GetRoleForPosition(int position)
        {
            return position switch
            {
                0 => Role.Top,
                1 => Role.Jungle,
                2 => Role.Mid,
                3 => Role.ADC,
                4 => Role.Support,
                _ => Role.Top
            };
        }

        private void StartWheelMode(List<Player> players, bool assignRoles)
        {
            _wheelPlayers = new List<Player>(players);
            _isBlueTeamTurn = true;
            
            ViewModel?.BlueTeam.Clear();
            ViewModel?.RedTeam.Clear();
            
            SetupWheelDisplay();
            
            // Initialize wheel current player display
            var wheelCurrentPlayer = this.FindControl<TextBlock>("WheelCurrentPlayer");
            if (wheelCurrentPlayer != null)
            {
                wheelCurrentPlayer.Text = $"Ready to spin! {_wheelPlayers.Count} players loaded";
                wheelCurrentPlayer.IsVisible = true;
            }
            
            // Enable spin button
            var spinButton = this.FindControl<Button>("SpinWheelBtn");
            if (spinButton != null) spinButton.IsEnabled = true;
        }

        private void SetupWheelDisplay()
        {
            var wheelCanvas = this.FindControl<Canvas>("WheelPlayersCanvas");
            var divisionsCanvas = this.FindControl<Canvas>("WheelDivisionsCanvas");
            
            if (_isInRoleAssignment)
            {
                SetupRoleWheelDisplay();
                return;
            }
            
            if (wheelCanvas == null || _wheelPlayers.Count == 0) return;
            
            wheelCanvas.Children.Clear();
            divisionsCanvas?.Children.Clear();
            
            // LoL-themed wheel setup with precise calculations
            var radius = 140;
            var centerX = 215;
            var centerY = 215;
            var anglePerSegment = 360.0 / _wheelPlayers.Count;
            
            Console.WriteLine($"🎡 WHEEL SETUP:");
            Console.WriteLine($"   Players: {_wheelPlayers.Count}");
            Console.WriteLine($"   Angle per segment: {anglePerSegment}°");
            
            // Draw division lines FIRST (these define the segments)
            if (divisionsCanvas != null && _wheelPlayers.Count > 1)
            {
                for (int i = 0; i < _wheelPlayers.Count; i++)
                {
                    // Division lines start at 0° and go clockwise
                    var divisionAngle = anglePerSegment * i;
                    var radians = (divisionAngle - 90) * Math.PI / 180.0; // -90 to start at top
                    
                    var startX = centerX + 50 * Math.Cos(radians);
                    var startY = centerY + 50 * Math.Sin(radians);
                    var endX = centerX + 200 * Math.Cos(radians);
                    var endY = centerY + 200 * Math.Sin(radians);
                    
                    var line = new Line
                    {
                        StartPoint = new Avalonia.Point(startX, startY),
                        EndPoint = new Avalonia.Point(endX, endY),
                        Stroke = new SolidColorBrush(Color.Parse("#C89B3C")),
                        StrokeThickness = 2,
                        Opacity = 0.6
                    };
                    
                    divisionsCanvas.Children.Add(line);
                }
            }
            
            // Place players in CENTER of each segment
            for (int i = 0; i < _wheelPlayers.Count; i++)
            {
                // Player goes in the MIDDLE of segment i
                var segmentCenterAngle = (anglePerSegment * i) + (anglePerSegment / 2);
                var radians = (segmentCenterAngle - 90) * Math.PI / 180.0; // -90 to start at top
                
                var x = centerX + radius * Math.Cos(radians);
                var y = centerY + radius * Math.Sin(radians);
                
                var playerBorder = new Border
                {
                    Background = new SolidColorBrush(Color.Parse("#1E2328")),
                    BorderBrush = new SolidColorBrush(Color.Parse("#C89B3C")),
                    BorderThickness = new Avalonia.Thickness(3),
                    CornerRadius = new Avalonia.CornerRadius(10),
                    Padding = new Avalonia.Thickness(10, 6),
                    MinWidth = 80,
                    MaxWidth = 100,
                    Child = new StackPanel
                    {
                        Spacing = 2,
                        Children =
                        {
                            new TextBlock
                            {
                                Text = $"#{i + 1}",
                                Foreground = new SolidColorBrush(Color.Parse("#C89B3C")),
                                FontWeight = Avalonia.Media.FontWeight.Bold,
                                FontSize = 10,
                                HorizontalAlignment = Avalonia.Layout.HorizontalAlignment.Center
                            },
                            new TextBlock
                            {
                                Text = _wheelPlayers[i].Name,
                                Foreground = new SolidColorBrush(Color.Parse("#F0E6D2")),
                                FontWeight = Avalonia.Media.FontWeight.Bold,
                                FontSize = 12,
                                HorizontalAlignment = Avalonia.Layout.HorizontalAlignment.Center,
                                VerticalAlignment = Avalonia.Layout.VerticalAlignment.Center,
                                TextWrapping = Avalonia.Media.TextWrapping.NoWrap,
                                TextTrimming = Avalonia.Media.TextTrimming.CharacterEllipsis
                            }
                        }
                    }
                };
                
                Canvas.SetLeft(playerBorder, x - 40);
                Canvas.SetTop(playerBorder, y - 15);
                
                wheelCanvas.Children.Add(playerBorder);
                
                Console.WriteLine($"   Player {i + 1}: {_wheelPlayers[i].Name} at {segmentCenterAngle}° ({x:F1}, {y:F1})");
            }
        }
        
        private Avalonia.Controls.Shapes.Path CreateWheelSegment(double centerX, double centerY, double radius, double startAngle, double endAngle, string color)
        {
            var startRadians = (startAngle - 90) * Math.PI / 180; // -90 to start at top
            var endRadians = (endAngle - 90) * Math.PI / 180;
            
            var x1 = centerX + radius * Math.Cos(startRadians);
            var y1 = centerY + radius * Math.Sin(startRadians);
            var x2 = centerX + radius * Math.Cos(endRadians);
            var y2 = centerY + radius * Math.Sin(endRadians);
            
            var largeArcFlag = (endAngle - startAngle) > 180 ? 1 : 0;
            
            var pathGeometry = new PathGeometry();
            var pathFigure = new PathFigure
            {
                StartPoint = new Avalonia.Point(centerX, centerY),
                IsClosed = true
            };
            
            // Line to start of arc
            pathFigure.Segments.Add(new LineSegment { Point = new Avalonia.Point(x1, y1) });
            
            // Arc segment
            pathFigure.Segments.Add(new ArcSegment
            {
                Point = new Avalonia.Point(x2, y2),
                Size = new Avalonia.Size(radius, radius),
                IsLargeArc = largeArcFlag == 1,
                SweepDirection = SweepDirection.Clockwise
            });
            
            // Line back to center
            pathFigure.Segments.Add(new LineSegment { Point = new Avalonia.Point(centerX, centerY) });
            
            pathGeometry.Figures.Add(pathFigure);
            
            return new Avalonia.Controls.Shapes.Path
            {
                Data = pathGeometry,
                Fill = new SolidColorBrush(Color.Parse(color)),
                Stroke = new SolidColorBrush(Colors.White),
                StrokeThickness = 2
            };
        }
        
        private TextBlock CreateSegmentText(string text, double centerX, double centerY, double radius, double angle)
        {
            var radians = (angle - 90) * Math.PI / 180; // -90 to start at top
            var x = centerX + radius * Math.Cos(radians);
            var y = centerY + radius * Math.Sin(radians);
            
            var textBlock = new TextBlock
            {
                Text = text,
                Foreground = new SolidColorBrush(Colors.White),
                FontWeight = Avalonia.Media.FontWeight.Bold,
                FontSize = 14,
                HorizontalAlignment = Avalonia.Layout.HorizontalAlignment.Center,
                VerticalAlignment = Avalonia.Layout.VerticalAlignment.Center,
                TextAlignment = Avalonia.Media.TextAlignment.Center
            };
            
            // Position text
            Canvas.SetLeft(textBlock, x - 50); // Approximate center
            Canvas.SetTop(textBlock, y - 10);
            
            // Rotate text if needed for better readability
            if (angle > 90 && angle < 270)
            {
                textBlock.RenderTransform = new RotateTransform { Angle = angle + 180, CenterX = 50, CenterY = 10 };
            }
            else
            {
                textBlock.RenderTransform = new RotateTransform { Angle = angle, CenterX = 50, CenterY = 10 };
            }
            
            return textBlock;
        }
        
        private void SetupRoleWheelDisplay()
        {
            var wheelCanvas = this.FindControl<Canvas>("WheelPlayersCanvas");
            var divisionsCanvas = this.FindControl<Canvas>("WheelDivisionsCanvas");
            if (wheelCanvas == null || _roleWheelItems.Count == 0) return;
            
            wheelCanvas.Children.Clear();
            divisionsCanvas?.Children.Clear();
            
            var radius = 140;
            var centerX = 215;
            var centerY = 215;
            var anglePerSegment = 360.0 / _roleWheelItems.Count;
            
            Console.WriteLine($"🎭 ROLE WHEEL SETUP:");
            Console.WriteLine($"   Roles: {_roleWheelItems.Count}");
            
            // Draw division lines for roles
            if (divisionsCanvas != null && _roleWheelItems.Count > 1)
            {
                for (int i = 0; i < _roleWheelItems.Count; i++)
                {
                    var divisionAngle = anglePerSegment * i;
                    var radians = (divisionAngle - 90) * Math.PI / 180.0;
                    
                    var startX = centerX + 50 * Math.Cos(radians);
                    var startY = centerY + 50 * Math.Sin(radians);
                    var endX = centerX + 200 * Math.Cos(radians);
                    var endY = centerY + 200 * Math.Sin(radians);
                    
                    var line = new Line
                    {
                        StartPoint = new Avalonia.Point(startX, startY),
                        EndPoint = new Avalonia.Point(endX, endY),
                        Stroke = new SolidColorBrush(Color.Parse("#C89B3C")),
                        StrokeThickness = 2,
                        Opacity = 0.6
                    };
                    
                    divisionsCanvas.Children.Add(line);
                }
            }
            
            // Place roles in segments
            for (int i = 0; i < _roleWheelItems.Count; i++)
            {
                var segmentCenterAngle = (anglePerSegment * i) + (anglePerSegment / 2);
                var radians = (segmentCenterAngle - 90) * Math.PI / 180.0;
                
                var x = centerX + radius * Math.Cos(radians);
                var y = centerY + radius * Math.Sin(radians);
                
                var roleIcon = GetRoleIcon(_roleWheelItems[i]);
                var roleName = _roleWheelItems[i].ToString();
                
                var roleBorder = new Border
                {
                    Background = new SolidColorBrush(Color.Parse("#1E2328")),
                    BorderBrush = new SolidColorBrush(Color.Parse("#C89B3C")),
                    BorderThickness = new Avalonia.Thickness(3),
                    CornerRadius = new Avalonia.CornerRadius(10),
                    Padding = new Avalonia.Thickness(10, 6),
                    MinWidth = 80,
                    MaxWidth = 100,
                    Child = new StackPanel
                    {
                        Spacing = 2,
                        Children =
                        {
                            new TextBlock
                            {
                                Text = roleIcon,
                                Foreground = new SolidColorBrush(Color.Parse("#C89B3C")),
                                FontWeight = Avalonia.Media.FontWeight.Bold,
                                FontSize = 16,
                                HorizontalAlignment = Avalonia.Layout.HorizontalAlignment.Center
                            },
                            new TextBlock
                            {
                                Text = roleName,
                                Foreground = new SolidColorBrush(Color.Parse("#F0E6D2")),
                                FontWeight = Avalonia.Media.FontWeight.Bold,
                                FontSize = 10,
                                HorizontalAlignment = Avalonia.Layout.HorizontalAlignment.Center
                            }
                        }
                    }
                };
                
                Canvas.SetLeft(roleBorder, x - 40);
                Canvas.SetTop(roleBorder, y - 15);
                
                wheelCanvas.Children.Add(roleBorder);
            }
        }
        
        private string GetRoleIcon(Role role)
        {
            return role switch
            {
                Role.Top => "🛡️",
                Role.Jungle => "🌿",
                Role.Mid => "⚡",
                Role.ADC => "🏹",
                Role.Support => "❤️",
                _ => "❓"
            };
        }

        private void SpinWheel_Click(object? sender, RoutedEventArgs e)
        {
            if (_wheelPlayers.Count == 0 || _isSpinning) return;
            
            SpinWheelAnimation();
        }

        private async void SpinWheelAnimation()
        {
            if (_isInRoleAssignment)
            {
                await SpinForRole();
            }
            else
            {
                await SpinForPlayer();
            }
        }
        
        private async Task SpinForPlayer()
        {
            if (_isSpinning || _wheelPlayers.Count == 0) return;
            
            _isSpinning = true;
            var spinButton = this.FindControl<Button>("SpinWheelBtn");
            var wheelCurrentPlayer = this.FindControl<TextBlock>("WheelCurrentPlayer");
            var wheelCanvas = this.FindControl<Canvas>("WheelCanvas");
            var wheelSpinText = this.FindControl<TextBlock>("WheelSpinText");
            var resultDisplay = this.FindControl<Border>("WheelResultDisplay");
            var winnerText = this.FindControl<TextBlock>("WheelWinnerText");
            
            if (spinButton != null) spinButton.IsEnabled = false;
            if (resultDisplay != null) resultDisplay.IsVisible = false;
            
            // Play spinning sound
            var soundPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Assets", "CSGO Case + Knife Opening Sound Effect - Nexiz.mp3");
            _ = _audioService.PlaySoundAsync(soundPath);
            
            if (wheelCurrentPlayer != null)
            {
                wheelCurrentPlayer.Text = "� Spinning...";
            }
            
            if (wheelSpinText != null)
            {
                wheelSpinText.Text = "🌀";
            }
            
            if (wheelCanvas != null && _wheelPlayers.Count > 0)
            {
                var random = new Random();
                
                // WHEEL OF NAMES PHYSICS:
                // 1. Determine target segment FIRST
                var selectedIndex = random.Next(_wheelPlayers.Count);
                var selectedPlayer = _wheelPlayers[selectedIndex];
                
                // 2. Calculate segment angles
                var anglePerSegment = 360.0 / _wheelPlayers.Count;
                var segmentStartAngle = anglePerSegment * selectedIndex;
                var segmentCenterAngle = segmentStartAngle + (anglePerSegment / 2);
                
                // 3. Calculate target rotation for wheel to stop with selected segment at top
                // The pointer is at the top (0°), so we need to rotate the wheel so the selected segment is at 0°
                var targetRotation = 360 - segmentCenterAngle;
                
                // 4. Add multiple spins for drama (like Wheel of Names)
                var numberOfSpins = 5 + random.NextDouble() * 5; // 5-10 full rotations
                var totalRotation = _currentRotation + (numberOfSpins * 360) + targetRotation;
                
                Console.WriteLine($"� WHEEL OF NAMES PHYSICS:");
                Console.WriteLine($"   Selected: #{selectedIndex + 1} {selectedPlayer.Name}");
                Console.WriteLine($"   Segment range: {segmentStartAngle}° - {segmentStartAngle + anglePerSegment}°");
                Console.WriteLine($"   Segment center: {segmentCenterAngle}°");
                Console.WriteLine($"   Target rotation: {targetRotation}°");
                Console.WriteLine($"   Total rotation: {totalRotation}°");
                Console.WriteLine($"   Spins: {numberOfSpins}");
                
                // 5. Animate with physics-based easing (like Wheel of Names deceleration)
                var animationDuration = 4000 + random.Next(1000, 2000); // 4-6 seconds
                var startTime = DateTime.Now;
                var startRotation = _currentRotation;
                
                while (true)
                {
                    var elapsed = DateTime.Now - startTime;
                    var progress = Math.Min(elapsed.TotalMilliseconds / animationDuration, 1.0);
                    
                    // Wheel of Names style easing: cubic-out for natural deceleration
                    var easedProgress = 1 - Math.Pow(1 - progress, 3);
                    var currentRotation = startRotation + (totalRotation - startRotation) * easedProgress;
                    
                    // Apply rotation to wheel container (not pointer!)
                    var transform = new RotateTransform
                    {
                        Angle = currentRotation,
                        CenterX = 215, // Wheel center
                        CenterY = 215  // Wheel center
                    };
                    wheelCanvas.RenderTransform = transform;
                    
                    if (progress >= 1.0) break;
                    
                    // Smooth 60fps animation
                    await Task.Delay(16);
                }
                
                // 6. Final position and bounce effect
                _currentRotation = totalRotation % 360;
                var finalTransform = new RotateTransform
                {
                    Angle = totalRotation,
                    CenterX = 215,
                    CenterY = 215
                };
                wheelCanvas.RenderTransform = finalTransform;
                
                // Stop sound
                _audioService.StopSound();
                
                // 7. Show result with celebration
                if (wheelSpinText != null)
                {
                    wheelSpinText.Text = "🎯";
                }
                
                if (wheelCurrentPlayer != null)
                {
                    var teamName = _isBlueTeamTurn ? "BLUE" : "RED";
                    var teamColor = _isBlueTeamTurn ? "🛡️" : "⚔️";
                    wheelCurrentPlayer.Text = $"🎉 {selectedPlayer.Name} → {teamColor} {teamName} TEAM!";
                }
                
                if (resultDisplay != null && winnerText != null)
                {
                    winnerText.Text = $"{selectedPlayer.Name} → {(_isBlueTeamTurn ? "🛡️ Blue Team" : "⚔️ Red Team")}";
                    resultDisplay.IsVisible = true;
                }
                
                // 8. Process the result
                if (_isBlueTeamTurn)
                {
                    ViewModel?.BlueTeam.Add(selectedPlayer);
                }
                else
                {
                    ViewModel?.RedTeam.Add(selectedPlayer);
                }
                
                _wheelPlayers.Remove(selectedPlayer);
                SetupWheelDisplay();
                _isBlueTeamTurn = !_isBlueTeamTurn;
                
                // 9. Continue or finish
                await Task.Delay(2000);
                
                if (_wheelPlayers.Count == 0)
                {
                    if (wheelCurrentPlayer != null)
                    {
                        wheelCurrentPlayer.Text = "🎉 ALL PLAYERS ASSIGNED! Starting role assignment...";
                    }
                    
                    await Task.Delay(1500);
                    ShowRoleAssignmentWheel();
                }
                else
                {
                    if (spinButton != null) spinButton.IsEnabled = true;
                    if (resultDisplay != null) resultDisplay.IsVisible = false;
                    
                    if (wheelCurrentPlayer != null)
                    {
                        var nextTeam = _isBlueTeamTurn ? "BLUE" : "RED";
                        var nextTeamIcon = _isBlueTeamTurn ? "🛡️" : "⚔️";
                        wheelCurrentPlayer.Text = $"Ready for next spin! → {nextTeamIcon} {nextTeam} TEAM ({_wheelPlayers.Count} players left)";
                    }
                }
            }
            
            _isSpinning = false;
        }
        
        private async Task SpinForRole()
        {
            if (_isSpinning || _currentPlayerForRole >= _playersNeedingRoles.Count) return;
            
            _isSpinning = true;
            var wheelCurrentPlayer = this.FindControl<TextBlock>("WheelCurrentPlayer");
            var wheelContainer = this.FindControl<Canvas>("WheelContainer");
            var resultDisplay = this.FindControl<Border>("WheelResultDisplay");
            var winnerText = this.FindControl<TextBlock>("WheelWinnerText");
            var spinButton = this.FindControl<Button>("SpinWheelBtn");
            
            if (spinButton != null) spinButton.IsEnabled = false;
            if (resultDisplay != null) resultDisplay.IsVisible = false;
            
            var currentPlayer = _playersNeedingRoles[_currentPlayerForRole];
            
            // Play spinning sound
            var soundPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Assets", "CSGO Case + Knife Opening Sound Effect - Nexiz.mp3");
            _ = _audioService.PlaySoundAsync(soundPath);
            
            if (wheelCurrentPlayer != null)
            {
                wheelCurrentPlayer.Text = $"� Spinning role for {currentPlayer.Name}...";
            }
            
            if (wheelContainer != null && _roleWheelItems.Count > 0)
            {
                var random = new Random();
                var selectedIndex = random.Next(_roleWheelItems.Count);
                var selectedRole = _roleWheelItems[selectedIndex];
                
                var anglePerSegment = 360.0 / _roleWheelItems.Count;
                var segmentCenterAngle = (anglePerSegment * selectedIndex) + (anglePerSegment / 2);
                
                // Add 180° because arrow points down by default, but roles start at top
                var targetRotation = segmentCenterAngle - 90;
                
                var extraRotations = 3 + random.NextDouble() * 2;
                var totalRotation = (extraRotations * 360) + targetRotation;
                
                Console.WriteLine($"� ROLE WHEEL:");
                Console.WriteLine($"   Player: {currentPlayer.Name}");
                Console.WriteLine($"   Role: {selectedRole} (#{selectedIndex + 1})");
                Console.WriteLine($"   Target angle: {targetRotation}°");
                
                // Animation with correct center point
                var animationDuration = 2500;
                var frameRate = 60;
                var totalFrames = (animationDuration / 1000.0) * frameRate;
                
                for (int frame = 0; frame < totalFrames; frame++)
                {
                    var progress = (double)frame / totalFrames;
                    var easedProgress = 1 - Math.Pow(1 - progress, 3);
                    var currentRotation = totalRotation * easedProgress;
                    
                    var transform = new RotateTransform
                    {
                        Angle = currentRotation,
                        CenterX = 215, // Same as player wheel
                        CenterY = 215  // Same as player wheel
                    };
                    wheelContainer.RenderTransform = transform;
                    
                    await Task.Delay(16);
                }
                
                // Final position - not needed in new system
                
                // Assign role
                currentPlayer.Role = selectedRole;
                _roleWheelItems.Remove(selectedRole);
                _currentPlayerForRole++;
                
                SetupWheelDisplay(); // Refresh wheel without assigned role
                
                // Show result
                if (wheelCurrentPlayer != null)
                {
                    wheelCurrentPlayer.Text = $"🎉 {currentPlayer.Name} gets {GetRoleIcon(selectedRole)} {selectedRole}!";
                }
                
                if (resultDisplay != null && winnerText != null)
                {
                    winnerText.Text = $"{currentPlayer.Name} → {GetRoleIcon(selectedRole)} {selectedRole}";
                    resultDisplay.IsVisible = true;
                }
                
                await Task.Delay(2000);
                
                // Continue to next player or finish
                if (_currentPlayerForRole < _playersNeedingRoles.Count)
                {
                    if (spinButton != null) spinButton.IsEnabled = true;
                    if (resultDisplay != null) resultDisplay.IsVisible = false;
                    
                    var nextPlayer = _playersNeedingRoles[_currentPlayerForRole];
                    if (wheelCurrentPlayer != null)
                    {
                        wheelCurrentPlayer.Text = $"Ready! Next: {nextPlayer.Name} ({_roleWheelItems.Count} roles left)";
                    }
                }
                else
                {
                    // All done!
                    _isInRoleAssignment = false;
                    var wheelDisplay = this.FindControl<StackPanel>("WheelDisplay");
                    if (wheelDisplay != null) wheelDisplay.IsVisible = false;
                    
                    if (wheelCurrentPlayer != null)
                    {
                        wheelCurrentPlayer.Text = "🎉 ALL ROLES ASSIGNED! Teams ready to play!";
                    }
                    
                    ShowChampionsTab();
                }
            }
            
            _isSpinning = false;
        }

        private void ClearTeams_Click(object? sender, RoutedEventArgs e)
        {
            if (ViewModel != null)
            {
                // Clear roles from all players
                foreach (var player in ViewModel.Players)
                {
                    player.Role = null;
                }
                
                ViewModel.BlueTeam.Clear();
                ViewModel.RedTeam.Clear();
                
                // Reset wheel state
                _wheelPlayers.Clear();
                _isBlueTeamTurn = true;
                
                // Reset role wheel state
                _isInRoleAssignment = false;
                _roleWheelItems.Clear();
                _playersNeedingRoles.Clear();
                _currentPlayerForRole = 0;
                
                // Reset captain state
                _captainsSet = false;
                _availablePlayersForDraft.Clear();
                
                var wheelCurrentPlayer = this.FindControl<TextBlock>("WheelCurrentPlayer");
                var draftPanel = this.FindControl<Border>("DraftPanel");
                var captainRolePanel = this.FindControl<Border>("CaptainRolePanel");
                var manageRolesBtn = this.FindControl<Button>("ManageRolesBtn");
                var startCaptainGameBtn = this.FindControl<Button>("StartCaptainGameBtn");
                var blueCaptainCombo = this.FindControl<ComboBox>("BlueCaptainCombo");
                var redCaptainCombo = this.FindControl<ComboBox>("RedCaptainCombo");
                var wheelSpinText = this.FindControl<TextBlock>("WheelSpinText");
                var spinButton = this.FindControl<Button>("SpinWheelBtn");
                var championsTab = this.FindControl<TabItem>("ChampionsTab");
                
                if (wheelCurrentPlayer != null) wheelCurrentPlayer.Text = "Ready to spin!";
                if (draftPanel != null) draftPanel.IsVisible = false;
                if (captainRolePanel != null) captainRolePanel.IsVisible = false;
                if (manageRolesBtn != null) manageRolesBtn.IsVisible = false;
                if (startCaptainGameBtn != null) startCaptainGameBtn.IsVisible = false;
                if (blueCaptainCombo != null) blueCaptainCombo.SelectedItem = null;
                if (redCaptainCombo != null) redCaptainCombo.SelectedItem = null;
                if (wheelSpinText != null) wheelSpinText.Text = "🎯";
                if (spinButton != null) spinButton.IsEnabled = true;
                if (championsTab != null) championsTab.IsVisible = false;
                
                UpdateAvailablePlayersForDraft();
            }
        }

        private void StartGame_Click(object? sender, RoutedEventArgs e)
        {
            // Check if we have teams formed
            if (ViewModel?.BlueTeam.Count == 0 || ViewModel?.RedTeam.Count == 0)
            {
                ShowMessage("Please form teams first!");
                return;
            }

            // Switch to Champions & Stats tab
            var tabControl = this.FindControl<TabControl>("MainTabControl");
            if (tabControl != null)
            {
                tabControl.SelectedIndex = 3; // Champions & Stats tab
            }
        }

        private void StartAram_Click(object? sender, RoutedEventArgs e)
        {
            if (ViewModel == null) return;

            var selectedPlayers = ViewModel.Players.Where(p => p.IsSelected).ToList();
            
            if (selectedPlayers.Count < 2)
            {
                ShowMessage("Please select at least 2 players for ARAM!");
                return;
            }

            // Shuffle and divide teams (flexible team sizes for ARAM)
            var random = new Random();
            var shuffled = selectedPlayers.OrderBy(x => random.Next()).ToList();
            
            ViewModel.BlueTeam.Clear();
            ViewModel.RedTeam.Clear();
            
            int halfCount = shuffled.Count / 2;
            
            for (int i = 0; i < halfCount; i++)
            {
                ViewModel.BlueTeam.Add(shuffled[i]);
            }
            
            for (int i = halfCount; i < shuffled.Count; i++)
            {
                ViewModel.RedTeam.Add(shuffled[i]);
            }
        }

        private void ShowRoleAssignmentWheel()
        {
            // Prepare role assignment wheel
            _isInRoleAssignment = true;
            _currentPlayerForRole = 0;
            
            // Get all players that need roles
            _playersNeedingRoles.Clear();
            if (ViewModel != null)
            {
                _playersNeedingRoles.AddRange(ViewModel.BlueTeam);
                _playersNeedingRoles.AddRange(ViewModel.RedTeam);
            }
            
            // Prepare roles for the wheel
            _roleWheelItems = new List<Role> { Role.Top, Role.Jungle, Role.Mid, Role.ADC, Role.Support };
            
            // Show wheel display if hidden
            var wheelDisplay = this.FindControl<StackPanel>("WheelDisplay");
            if (wheelDisplay != null) wheelDisplay.IsVisible = true;
            
            // Update wheel display for roles
            SetupWheelDisplay();
            
            // Update UI messages
            var wheelCurrentPlayer = this.FindControl<TextBlock>("WheelCurrentPlayer");
            var wheelSpinText = this.FindControl<TextBlock>("WheelSpinText");
            var spinButton = this.FindControl<Button>("SpinWheelBtn");
            
            if (wheelCurrentPlayer != null && _playersNeedingRoles.Count > 0)
            {
                var firstPlayer = _playersNeedingRoles[0];
                wheelCurrentPlayer.Text = $"🎲 ROLE ASSIGNMENT! First up: {firstPlayer.Name}";
            }
            
            if (wheelSpinText != null)
            {
                wheelSpinText.Text = "🎯";
            }
            
            if (spinButton != null)
            {
                spinButton.IsEnabled = true;
            }
            
            ShowMessage("� Role Assignment Wheel is ready! Each player will get a random role.");
        }

        private void ShowMessage(string message)
        {
            Console.WriteLine($"INFO: {message}");
        }
    }
}