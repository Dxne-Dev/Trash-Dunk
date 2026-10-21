using System;
using System.IO;
using Microsoft.VisualBasic.FileIO;

namespace TrashDunkApp
{
    public static class FileRecycleService
    {
        public static bool SendToRecycleBin(string path)
        {
            try
            {
                if (File.Exists(path))
                {
                    FileSystem.DeleteFile(
                        path,
                        UIOption.OnlyErrorDialogs,
                        RecycleOption.SendToRecycleBin
                    );
                    return true;
                }
                else if (Directory.Exists(path))
                {
                    FileSystem.DeleteDirectory(
                        path,
                        UIOption.OnlyErrorDialogs,
                        RecycleOption.SendToRecycleBin
                    );
                    return true;
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Erreur suppression corbeille : {ex.Message}");
            }
            return false;
        }
    }
}
