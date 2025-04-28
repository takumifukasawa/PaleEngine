using System;
using System.Collections.Generic;
using Newtonsoft.Json;
using UnityEngine.Timeline;

namespace UnityJSONExporter
{
    public class ClipTrackInfoBase : TrackInfoBase
    {
        [JsonProperty(PropertyName = "tn")]
        public string TargetName;
        
        [JsonProperty(PropertyName = "cs")]
        public List<ClipInfoBase> Clips = new List<ClipInfoBase>();

        public ClipTrackInfoBase(TrackInfoType type, string targetName) : base(type)
        {
            TargetName = targetName;
        }
    }
}
