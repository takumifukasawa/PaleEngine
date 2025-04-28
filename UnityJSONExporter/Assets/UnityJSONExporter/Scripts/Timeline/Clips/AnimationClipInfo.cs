using System.Collections.Generic;
using Newtonsoft.Json;
using UnityEngine;

namespace UnityJSONExporter
{

    /// <summary>
    /// 
    /// </summary>
    public class AnimationClipInfo : ClipInfoBase
    {
        // [JsonProperty(PropertyName = "s")]
        // public float Start;

        // [JsonProperty(PropertyName = "d")]
        // public float Duration;

        [JsonProperty(PropertyName = "op")]
        public Vector3Info OffsetPosition;

        [JsonProperty(PropertyName = "or")]
        public Vector3Info OffsetRotation;

        [JsonProperty(PropertyName = "b")]
        public List<ClipBinding> Bindings = new List<ClipBinding>();

        // [JsonProperty(PropertyName = "b")]
        // public List<AnimationClipBinding> Bindings = new List<AnimationClipBinding>();

        public AnimationClipInfo(float s, float d) : base(ClipInfoType.AnimationClip, s, d)
        {
            OffsetPosition = new Vector3Info(0, 0, 0);
            OffsetRotation = new Vector3Info(0, 0, 0);
        }

        public AnimationClipInfo(float s, float d, Vector3 op, Vector3 or) : base(ClipInfoType.AnimationClip, s, d)
        {
            OffsetPosition = new Vector3Info(op);
            OffsetRotation = new Vector3Info(or);
        }
    }

}
