using System;
using System.Collections.Generic;
using Newtonsoft.Json;
using UnityEngine.Timeline;

namespace UnityJSONExporter
{
    public class TrackInfoBase
    {
        [JsonProperty(PropertyName = "t")]
        public TrackInfoType Type;

        public TrackInfoBase(TrackInfoType type)
        {
            Type = type;
        }
    }
}
