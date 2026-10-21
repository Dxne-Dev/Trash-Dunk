using System;
using System.IO;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media.Animation;
using System.Windows.Threading;

namespace TrashDunkApp
{
    public partial class MainWindow : Window
    {
        private string? _targetFilePath;
        private UserConfig _config;
        private DispatcherTimer _gaugeTimer;
        private double _needlePos = 0;
        private double _needleSpeed = 5.0;
        private const double GaugeWidth = 380;
        private bool _isShooting = false;
        private int _currentStreak = 0;

        public MainWindow()
        {
            InitializeComponent();
            _config = ConfigService.Load();

            // Gestion de l'argument (fichier passé par clic droit ou glisser-déposer)
            string[] args = Environment.GetCommandLineArgs();
            if (args.Length > 1 && !string.IsNullOrEmpty(args[1]))
            {
                _targetFilePath = args[1];
            }

            TxtTotalDunks.Text = _config.TotalDunks.ToString();
            _currentStreak = 0;
            TxtCurrentStreak.Text = _currentStreak.ToString();

            if (!string.IsNullOrEmpty(_targetFilePath))
            {
                TxtFileName.Text = Path.GetFileName(_targetFilePath);
            }
            else
            {
                TxtFileName.Text = "Mode Démo (Aucun fichier)";
            }

            // Timer de la jauge oscillante
            _gaugeTimer = new DispatcherTimer
            {
                Interval = TimeSpan.FromMilliseconds(16)
            };
            _gaugeTimer.Tick += GaugeTimer_Tick;
        }

        private void Window_Loaded(object sender, RoutedEventArgs e)
        {
            // Positionner le panier en haut à droite
            double screenW = ActualWidth > 0 ? ActualWidth : SystemParameters.PrimaryScreenWidth;
            double screenH = ActualHeight > 0 ? ActualHeight : SystemParameters.PrimaryScreenHeight;

            Canvas.SetLeft(HoopCanvas, screenW - 240);
            Canvas.SetTop(HoopCanvas, 140);

            // Positionner le ballon en bas à gauche
            Canvas.SetLeft(BallCanvas, 180);
            Canvas.SetTop(BallCanvas, screenH - 300);

            _needleSpeed = 6.0 * _config.GaugeSpeed;
            _gaugeTimer.Start();
        }

        private void GaugeTimer_Tick(object? sender, EventArgs e)
        {
            if (_isShooting) return;

            _needlePos += _needleSpeed;
            if (_needlePos > (GaugeWidth - 20) || _needlePos < 10)
            {
                _needleSpeed = -_needleSpeed;
            }

            GaugeNeedle.Margin = new Thickness(_needlePos, 0, 0, 0);
        }

        private void BtnShoot_Click(object sender, RoutedEventArgs e)
        {
            ExecuteShot();
        }

        private void Window_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.Key == Key.Escape)
            {
                Close();
            }
            else if (e.Key == Key.Space)
            {
                ExecuteShot();
            }
        }

        private void ExecuteShot()
        {
            if (_isShooting) return;
            _isShooting = true;
            _gaugeTimer.Stop();

            // La zone verte fait 90px au centre de 380px -> centre = 190 -> de 145 à 235
            double greenMin = (GaugeWidth / 2) - 45;
            double greenMax = (GaugeWidth / 2) + 45;
            bool isSuccess = _needlePos >= greenMin && _needlePos <= greenMax;

            double startX = Canvas.GetLeft(BallCanvas);
            double startY = Canvas.GetTop(BallCanvas);

            double hoopX = Canvas.GetLeft(HoopCanvas) + 80;
            double hoopY = Canvas.GetTop(HoopCanvas) + 70;

            double targetX = isSuccess ? hoopX : hoopX + 180;
            double targetY = isSuccess ? hoopY : hoopY + 120;

            // Animation du tir
            var animX = new DoubleAnimation(startX, targetX, TimeSpan.FromMilliseconds(700));
            var animY = new DoubleAnimation(startY, targetY, TimeSpan.FromMilliseconds(700));
            animY.EasingFunction = new QuadraticEase { EasingMode = EasingMode.EaseOut };

            animX.Completed += (s, ev) =>
            {
                if (isSuccess)
                {
                    SoundService.PlaySwoosh();
                    TxtFeedback.Text = "🔥 SWISH ! FICHIER ÉLIMINÉ !";
                    TxtFeedback.Foreground = System.Windows.Media.Brushes.LightGreen;

                    // Suppression réelle vers la corbeille si fichier valide
                    if (!string.IsNullOrEmpty(_targetFilePath))
                    {
                        FileRecycleService.SendToRecycleBin(_targetFilePath);
                    }

                    _config.TotalDunks++;
                    _currentStreak++;
                    if (_currentStreak > _config.BestStreak) _config.BestStreak = _currentStreak;
                    ConfigService.Save(_config);

                    TxtTotalDunks.Text = _config.TotalDunks.ToString();
                    TxtCurrentStreak.Text = _currentStreak.ToString();

                    // Fermeture douce après célébration
                    var timer = new DispatcherTimer { Interval = TimeSpan.FromSeconds(1.2) };
                    timer.Tick += (st, et) => { timer.Stop(); Close(); };
                    timer.Start();
                }
                else
                {
                    SoundService.PlayMiss();
                    TxtFeedback.Text = "❌ BRICK ! LE FICHIER RESTE SUR LE BUREAU.";
                    TxtFeedback.Foreground = System.Windows.Media.Brushes.OrangeRed;
                    _currentStreak = 0;
                    TxtCurrentStreak.Text = "0";

                    var timer = new DispatcherTimer { Interval = TimeSpan.FromSeconds(1.5) };
                    timer.Tick += (st, et) => { timer.Stop(); Close(); };
                    timer.Start();
                }
            };

            BallCanvas.BeginAnimation(Canvas.LeftProperty, animX);
            BallCanvas.BeginAnimation(Canvas.TopProperty, animY);
        }

        private void BtnRegisterMenu_Click(object sender, RoutedEventArgs e)
        {
            bool ok = ShellRegistryService.RegisterContextMenu();
            if (ok)
            {
                MessageBox.Show(
                    "Menu 'Dunk it 🏀' activé avec succès dans le clic droit Windows !",
                    "TrashDunk",
                    MessageBoxButton.OK,
                    MessageBoxImage.Information
                );
            }
            else
            {
                MessageBox.Show(
                    "Impossible d'enregistrer le menu contextuel (droits insuffisants).",
                    "TrashDunk",
                    MessageBoxButton.OK,
                    MessageBoxImage.Warning
                );
            }
        }
    }
}
