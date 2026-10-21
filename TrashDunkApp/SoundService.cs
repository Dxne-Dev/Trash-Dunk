using System;
using System.IO;
using System.Media;
using System.Threading.Tasks;

namespace TrashDunkApp
{
    public static class SoundService
    {
        public static void PlaySwoosh()
        {
            Task.Run(() =>
            {
                try
                {
                    // Beep sonore sportif aigu & rapide
                    Console.Beep(1200, 90);
                    Console.Beep(1800, 120);
                }
                catch { }
            });
        }

        public static void PlayMiss()
        {
            Task.Run(() =>
            {
                try
                {
                    // Son de rebond sourd / échec
                    Console.Beep(320, 200);
                    Console.Beep(260, 250);
                }
                catch { }
            });
        }
    }
}
