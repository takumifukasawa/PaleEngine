using System.Collections.Generic;
using Newtonsoft.Json;
using UnityEditor;
using UnityEngine;
using UnityEngine.Playables;
using UnityEngine.Timeline;

namespace UnityJSONExporter
{
    /// <summary>
    ///
    /// </summary>
    public enum ComponentType
    {
        None, // 0,
        PlayableDirector, // 1
        Light, // 2
        Camera, // 3
        MeshRenderer, // 4
        MeshFilter, // 5
        Volume, // 6
        ObjectMoveAndLookAtController // 7
    }

    /// <summary>
    /// 
    /// </summary>
    [System.Serializable]
    public class ComponentInfoBase
    {
        [JsonProperty(PropertyName = "t")]
        public ComponentType Type;

        public ComponentInfoBase(ComponentType type)
        {
            Type = type;
        }
    }
}
