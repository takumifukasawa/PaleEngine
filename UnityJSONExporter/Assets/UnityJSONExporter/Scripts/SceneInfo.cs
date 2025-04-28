using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Security.Cryptography.X509Certificates;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json.Serialization;
using UnityEditor;
using UnityEngine;
using UnityEngine.Playables;
using UnityEngine.Rendering.UI;
using UnityEngine.Timeline;

namespace UnityJSONExporter
{
    // ---------------------------------------------------------------------------------------------
    // public
    // ---------------------------------------------------------------------------------------------

    /// <summary>
    /// 一個だけプロパティを持たせる
    /// </summary>
    [System.Serializable]
    public class SceneInfo
    {
        // [JsonProperty(PropertyName = "n")]
        // public string Name;

        [JsonProperty(PropertyName = "o")]
        public List<ObjectInfo> Objects;
    }

    /// <summary>
    /// 
    /// </summary>
    [System.Serializable]
    public class ObjectInfo
    {
        // [JsonIgnore]
        // public GameObject InternalGameObject;
        [JsonProperty(PropertyName = "n")]
        public string Name;

        [JsonProperty(PropertyName = "t")]
        public TransformInfo Transform;

        [JsonProperty(PropertyName = "co")]
        public List<ComponentInfoBase> Components = new List<ComponentInfoBase>();

        [JsonProperty(PropertyName = "ch")]
        public List<ObjectInfo> Children = new List<ObjectInfo>();

        public ObjectInfo(GameObject obj, ConvertAxis axis)
        {
            // NOTE: spotlightの場合はぐるっと一周させた状態をつくるテスト
            var needsFacingAwayY = false;
            if (obj.TryGetComponent(out Light light) && light.type == LightType.Spot)
            {
                // needsFacingAwayY = true;
            }

            Name = obj.name;
            var localPosition = obj.transform.localPosition;
            var localRotation = needsFacingAwayY
                ? Quaternion.AngleAxis(180f, Vector3.up) * obj.transform.localRotation
                : obj.transform.localRotation;
            var localScale = obj.transform.localScale;

            // for debug
            // Debug.Log("object info name: " + Name);

            Transform = new TransformInfo()
            {
                LocalPosition = TransformConverter.ConvertPosition(axis, localPosition),
                // LocalRotation = TransformConverter.ConvertRotationEuler(axis, localRotation.eulerAngles),
                LocalRotation = TransformConverter.ConvertRotationQuaternion(axis, localRotation),
                LocalScale = TransformConverter.ConvertScale(axis, localScale)
            };
        }

        public void AddChild(ObjectInfo child)
        {
            Children.Add(child);
        }
    }

    /// <summary>
    /// 
    /// </summary>
    public class Vector3Info
    {
        public float X;
        public float Y;
        public float Z;

        public Vector3Info(float x, float y, float z)
        {
            X = x;
            Y = y;
            Z = z;
        }

        public Vector3Info(Vector3 v)
        {
            X = v.x;
            Y = v.y;
            Z = v.z;
        }
    }

    /// <summary>
    /// 
    /// </summary>
    public class Vector4Info
    {
        public float X;
        public float Y;
        public float Z;
        public float W;

        public Vector4Info(float x, float y, float z, float w)
        {
            X = x;
            Y = y;
            Z = z;
            W = w;
        }
    }

    /// <summary>
    /// 
    /// </summary>
    public class TransformInfo
    {
        [JsonProperty(PropertyName = "lp")]
        public Vector3Info LocalPosition;

        [JsonProperty(PropertyName = "lr")]
        public Vector4Info LocalRotation;

        [JsonProperty(PropertyName = "ls")]
        public Vector3Info LocalScale;
    }
}
