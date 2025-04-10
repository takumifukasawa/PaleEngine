using System;
using UnityEngine;
using Newtonsoft.Json;

namespace UnityJSONExporter
{
    /// <summary>
    /// NOTE: materialは1つまで対応
    /// </summary>
    [System.Serializable]
    public class MeshRendererComponentInfo : ComponentInfoBase
    {
        [JsonProperty(PropertyName = "mn")]
        public string MaterialName;

        [JsonProperty(PropertyName = "m")]
        public MaterialInfo Material;

        public MeshRendererComponentInfo(MeshRenderer meshRenderer) : base(ComponentType.MeshRenderer)
        {
            var srcMaterial = meshRenderer.sharedMaterial;
            MaterialName = srcMaterial.name;
            switch (srcMaterial.shader.name)
            {
                case "Universal Render Pipeline/Lit":
                    Material = new LitMaterialInfo(
                        srcMaterial.name,
                        srcMaterial.GetColor("_BaseColor"),
                        srcMaterial.GetFloat("_Metallic"),
                        srcMaterial.GetFloat("_Glossiness"),
                        srcMaterial.GetInt("_ReceiveShadows")
                    );
                    return;
                case "TextMeshPro/Distance Field":
                    Material = null;
                    break;
                default:

                    throw new Exception("Unsupported shader: " + srcMaterial.shader.name);
            }
        }
    }
}
