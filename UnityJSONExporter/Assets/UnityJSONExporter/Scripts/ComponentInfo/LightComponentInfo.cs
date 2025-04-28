using System;
using UnityEngine;
using Newtonsoft.Json;

namespace UnityJSONExporter
{
    /// <summary>
    /// 
    /// </summary>
    [System.Serializable]
    public class LightComponentInfo : ComponentInfoBase
    {
        [JsonProperty(PropertyName = "l")]
        public string LightType;

        [JsonProperty(PropertyName = "i")]
        public float Intensity;

        [JsonProperty(PropertyName = "c")]
        public string Color;

        public LightComponentInfo(Light light) : base(ComponentType.Light)
        {
            LightType = light.type.ToString();
            Intensity = light.intensity;
            Color = ColorUtilities.ConvertColorToHexString(light.color);
        }

        public static LightComponentInfo BuildLightComponentInfo(Light light)
        {
            var lightType = light.type.ToString();

            switch (lightType)
            {
                case "Directional":
                    return new DirectionalLightComponentInfo(light);
                // case "Point":
                //     return new PointLightComponentInfo(light);
                case "Spot":
                    return new SpotLightComponentInfo(light);
                default:
                    throw new Exception($"[LightComponentInfo.BuildLightComponentInfo] Unsupported light type: {lightType}");
            }
        }
    }

    public class DirectionalLightComponentInfo : LightComponentInfo
    {
        public DirectionalLightComponentInfo(Light light) : base(light)
        {
        }
    }

    public class SpotLightComponentInfo : LightComponentInfo
    {
        [JsonProperty(PropertyName = "r")]
        public float Range;

        [JsonProperty(PropertyName = "isa")]
        public float InnerSpotAngle;

        [JsonProperty(PropertyName = "sa")]
        public float SpotAngle;

        public SpotLightComponentInfo(Light light) : base(light)
        {
            Range = light.range;
            InnerSpotAngle = light.innerSpotAngle;
            SpotAngle = light.spotAngle;
        }
    }
}
