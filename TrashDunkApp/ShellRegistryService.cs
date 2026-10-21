using System;
using System.Diagnostics;
using Microsoft.Win32;

namespace TrashDunkApp
{
    public static class ShellRegistryService
    {
        private const string MenuKeyPath = @"*\shell\TrashDunk";

        public static bool RegisterContextMenu()
        {
            try
            {
                string exePath = Process.GetCurrentProcess().MainModule?.FileName ?? "";
                if (string.IsNullOrEmpty(exePath)) return false;

                using var key = Registry.CurrentUser.CreateSubKey(MenuKeyPath);
                if (key != null)
                {
                    key.SetValue("", "Dunk it 🏀");
                    key.SetValue("Icon", exePath);

                    using var commandKey = key.CreateSubKey("command");
                    commandKey?.SetValue("", $"\"{exePath}\" \"%1\"");
                }
                return true;
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Erreur registre : {ex.Message}");
                return false;
            }
        }

        public static bool UnregisterContextMenu()
        {
            try
            {
                Registry.CurrentUser.DeleteSubKeyTree(MenuKeyPath, false);
                return true;
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Erreur suppression registre : {ex.Message}");
                return false;
            }
        }
    }
}
