using UnityEngine;
using Newtonsoft.Json;

namespace UnityJSONExporter
{
        /// <summary>
    /// 
    /// </summary>
    [System.Serializable]
    public class MeshFilterComponentInfo : ComponentInfoBase
    {
        [JsonProperty(PropertyName = "mn")]
        public string MeshName;
        
        public MeshFilterComponentInfo(MeshFilter meshFilter) : base(ComponentType.MeshFilter)
        {
            MeshName = meshFilter.sharedMesh.name;
        }
    }
}
