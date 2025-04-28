namespace UnityJSONExporter
{
    public static class LoggerProxy
    {
        private static bool _logEnabled = false;

        public static void Log(string message)
        {
            if (_logEnabled)
            {
                UnityEngine.Debug.Log(message);
            }
        }

        public static void LogWarning(string message)
        {
            if (_logEnabled)
            {
                UnityEngine.Debug.LogWarning(message);
            }
        }

        public static void LogError(string message)
        {
            if (_logEnabled)
            {
                UnityEngine.Debug.LogError(message);
            }
        }
    }
}
