using System;
using System.Diagnostics;

namespace MathBuddyLauncher
{
    class Program
    {
        static void Main()
        {
            try
            {
                // Try launching Microsoft Edge in borderless App Mode
                ProcessStartInfo edgeInfo = new ProcessStartInfo();
                edgeInfo.FileName = "msedge.exe";
                edgeInfo.Arguments = "--app=https://math-buddy-2xsw.onrender.com";
                edgeInfo.UseShellExecute = true;
                Process.Start(edgeInfo);
            }
            catch
            {
                try
                {
                    // Fallback to Google Chrome in App Mode
                    ProcessStartInfo chromeInfo = new ProcessStartInfo();
                    chromeInfo.FileName = "chrome.exe";
                    chromeInfo.Arguments = "--app=https://math-buddy-2xsw.onrender.com";
                    chromeInfo.UseShellExecute = true;
                    Process.Start(chromeInfo);
                }
                catch
                {
                    // Fallback to opening the default browser normally
                    Process.Start("https://math-buddy-2xsw.onrender.com");
                }
            }
        }
    }
}
