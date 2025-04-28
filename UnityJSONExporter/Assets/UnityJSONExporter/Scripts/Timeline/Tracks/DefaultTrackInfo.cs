using System.Collections.Generic;
using Newtonsoft.Json;

namespace UnityJSONExporter
{
    public class DefaultTrackInfo : ClipTrackInfoBase
    {
        public DefaultTrackInfo(TrackInfoType type, string targetName) : base(type, targetName)
        {
        }
    }
}
