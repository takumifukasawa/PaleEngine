using System.Collections.Generic;
using Newtonsoft.Json;

namespace UnityJSONExporter
{
    /// <summary>
    /// 
    /// </summary>
    public class LightControlClipInfo : ClipInfoBase
    {
        [JsonProperty(PropertyName = "b")]
        public List<ClipBinding> Bindings = new List<ClipBinding>();

        public LightControlClipInfo(float s, float d) : base(ClipInfoType.LightControlClip, s, d)
        {
        }
    }
}
