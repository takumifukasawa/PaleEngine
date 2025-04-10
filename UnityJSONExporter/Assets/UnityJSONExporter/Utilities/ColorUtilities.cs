using UnityEngine;

namespace UnityJSONExporter
{
    /// <summary>
    /// 
    /// </summary>
    public static class ColorUtilities
    {
        public static string ConvertColorToHexString(Color color)
        {
            var r = Mathf.RoundToInt(color.r * 255);
            var g = Mathf.RoundToInt(color.g * 255);
            var b = Mathf.RoundToInt(color.b * 255);
            var a = Mathf.RoundToInt(color.a * 255);

            // for debug
            // LoggerProxy.Log(r.ToString("X2"));
            // LoggerProxy.Log(g.ToString("X2"));
            // LoggerProxy.Log(b.ToString("X2"));
            // LoggerProxy.Log(a.ToString("X2"));

            string hexColor = string.Format("{0:X2}{1:X2}{2:X2}{3:X2}", r, g, b, a);

            return hexColor;
        }
    }
}
