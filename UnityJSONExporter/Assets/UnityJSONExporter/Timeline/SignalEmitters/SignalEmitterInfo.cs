
using Newtonsoft.Json;

namespace UnityJSONExporter
{
   
    /// <summary>
    /// 
    /// </summary>
    public class SignalEmitterInfo
    {
        [JsonProperty(PropertyName = "n")]
        public string Name;

        [JsonProperty(PropertyName = "t")]
        public float Time;

        public SignalEmitterInfo(string name, float time)
        {
            Name = name;
            Time = time;
        }
    }

}
