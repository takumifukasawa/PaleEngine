using UnityEngine;
using Newtonsoft.Json;

namespace UnityJSONExporter
{
        /// <summary>
    /// 
    /// </summary>
    [System.Serializable]
    public class CameraComponentInfo : ComponentInfoBase
    {
        [JsonProperty(PropertyName = "ct")]
        public string CameraType;

        [JsonProperty(PropertyName = "im")]
        public bool IsMain = false;

        [JsonProperty(PropertyName = "f")]
        public float Fov;

        public CameraComponentInfo(Camera camera) : base(ComponentType.Camera)
        {
            CameraType = camera.orthographic ? "Orthographic" : "Perspective";
            IsMain = camera.tag.Equals("MainCamera");
            Fov = camera.fieldOfView;
        }
    }
}
