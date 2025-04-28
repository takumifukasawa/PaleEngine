using System.Collections.Generic;
using Newtonsoft.Json;

namespace UnityJSONExporter
{
    public enum ClipInfoType
    {
        None, // 0
        AnimationClip, // 1
        LightControlClip, // 2
        ActivationControlClip, // 3
        SignalEmitter, // 4
        ObjectMoveAndLookAtClip // 5
    }
    
    public class ClipKeyframe
    {
        [JsonProperty(PropertyName = "t")]
        public float Time;

        [JsonProperty(PropertyName = "v")]
        public float Value;

        [JsonProperty(PropertyName = "i")]
        public float InTangent;

        [JsonProperty(PropertyName = "o")]
        public float OutTangent;
    }

    public class ClipBinding
    {
        [JsonProperty(PropertyName = "n")]
        public string PropertyName;

        // for obj
        // [JsonProperty(PropertyName = "k")]
        // public List<ClipKeyframe> Keyframes = new List<ClipKeyframe>();
       
        // for arr
        [JsonProperty(PropertyName = "k")]
        public List<List<float>> Keyframes = new List<List<float>>();

        public void AddKeyframe(float t, float v, float it, float ot)
        {
            // Keyframes.Add(new ClipKeyframe(t, v, it, ot));
            Keyframes.Add(new List<float> {t, v, it, ot});
        }
    }

    /// <summary>
    /// 
    /// </summary>
    public class ClipInfoBase
    {
        [JsonProperty(PropertyName = "t")]
        public ClipInfoType Type;

        [JsonProperty(PropertyName = "s")]
        public float Start;

        [JsonProperty(PropertyName = "d")]
        public float Duration;

        public ClipInfoBase(ClipInfoType type, float s, float d)
        {
            Type = type;
            Start = s;
            Duration = d;
        }
    }
}
