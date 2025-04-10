using System.Collections.Generic;
using Newtonsoft.Json;

namespace UnityJSONExporter
{
    public class MarkerTrackInfo : TrackInfoBase
    {
        [JsonProperty(PropertyName = "ses")]
        public List<SignalEmitterInfo> SignalEmitters = new List<SignalEmitterInfo>();

        public MarkerTrackInfo(List<SignalEmitterInfo> signalEmitterInfos) : base(TrackInfoType.MarkerTrack)
        {
            SignalEmitters = signalEmitterInfos;
        }
    }
}
