
using System.Collections.Generic;
using Newtonsoft.Json;

namespace UnityJSONExporter
{
    /// <summary>
    /// 
    /// </summary>
    public class ObjectMoveAndLookAtClipInfo : ClipInfoBase
    {
        [JsonProperty(PropertyName = "b")]
        public List<ClipBinding> Bindings = new List<ClipBinding>();

        public ObjectMoveAndLookAtClipInfo(float s, float d) : base(ClipInfoType.ObjectMoveAndLookAtClip, s, d)
        {
        }
    }
}
