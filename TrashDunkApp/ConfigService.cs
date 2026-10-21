using System;
using System.IO;
using System.Text.Json;

namespace TrashDunkApp
{
    public class UserConfig
    {
        public bool SoundEnabled { get; set; } = true;
        public double GaugeSpeed { get; set; } = 1.0;
        public int TotalDunks { get; set; } = 0;
        public int BestStreak { get; set; } = 0;
    }

    public static class ConfigService
    {
        private static readonly string AppDataFolder = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
            "TrashDunk"
        );
        private static readonly string ConfigPath = Path.Combine(AppDataFolder, "config.json");

        public static UserConfig Load()
        {
            try
            {
                if (File.Exists(ConfigPath))
                {
                    var json = File.ReadAllText(ConfigPath);
                    return JsonSerializer.Deserialize<UserConfig>(json) ?? new UserConfig();
                }
            }
            catch { }

            return new UserConfig();
        }

        public static void Save(UserConfig config)
        {
            try
            {
                if (!Directory.Exists(AppDataFolder))
                {
                    Directory.CreateDirectory(AppDataFolder);
                }
                var json = JsonSerializer.Serialize(config, new JsonSerializerOptions { WriteIndented = true });
                File.WriteAllText(ConfigPath, json);
            }
            catch { }
        }
    }
}
