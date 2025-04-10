using UnityEngine;
using Newtonsoft.Json;

namespace UnityJSONExporter
{
    public enum MaterialType
    {
        None,
        Lit
    }

    [System.Serializable]
    public class MaterialInfo
    {
        [JsonProperty(PropertyName = "n")]
        public string Name;

        [JsonProperty(PropertyName = "t")]
        public MaterialType Type;

        public MaterialInfo(string name, MaterialType type)
        {
            Name = name;
            Type = type;
        }
    }

    [System.Serializable]
    public class LitMaterialInfo : MaterialInfo
    {
        [JsonProperty(PropertyName = "c")]
        public string Color;

        [JsonProperty(PropertyName = "m")]
        public float Metallic;

        [JsonProperty(PropertyName = "r")]
        public float Roughness;

        [JsonProperty(PropertyName = "rs")]
        public int ReceiveShadow;

        public LitMaterialInfo(string name, Color color, float metallic, float roughness, int receiveShadow) : base(name, MaterialType.Lit)
        {
            Color = ColorUtilities.ConvertColorToHexString(color);
            Metallic = metallic;
            Roughness = roughness;
            ReceiveShadow = receiveShadow;
        }
    }
}
