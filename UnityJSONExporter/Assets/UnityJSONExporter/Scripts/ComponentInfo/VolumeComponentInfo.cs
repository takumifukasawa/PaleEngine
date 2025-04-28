using System;
using System.Collections.Generic;
using UnityEngine;
using Newtonsoft.Json;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;

namespace UnityJSONExporter
{
    public enum VolumeLayerType
    {
        None, // 0
        Bloom, // 1
        DepthOfField, // 2
    }
    
    /// <summary>
    /// 
    /// </summary>
    [System.Serializable]
    public class VolumeComponentInfo : ComponentInfoBase
    {
        [JsonProperty(PropertyName = "vl")]
        public List<VolumeLayerBase> VolumeLayers = new List<VolumeLayerBase>();
        
        public VolumeComponentInfo(Volume volume) : base(ComponentType.Volume)
        {
            foreach (var item in volume.profile.components)
            {
                if (item is Bloom bloom)
                {
                    VolumeLayers.Add(new VolumeLayerBloom(bloom));
                }
                else if (item is DepthOfField dof)
                {
                    VolumeLayers.Add(new VolumeLayerDepthOfField(dof));
                }
            }
        }
    }

    [System.Serializable]
    public class VolumeLayerBase
    {
        [JsonProperty (PropertyName = "l")]
        public string LayerType;
        
        public VolumeLayerBase(VolumeLayerType layerType)
        {
            LayerType = layerType.ToString();
        }
    }
    
    [System.Serializable]
    public class VolumeLayerBloom : VolumeLayerBase
    {
        [JsonProperty(PropertyName = "bl_i")]
        public float Intensity;

        public VolumeLayerBloom(Bloom bloom) : base(UnityJSONExporter.VolumeLayerType.Bloom)
        {
            Intensity = bloom.intensity.value;
        }
    }

    [System.Serializable]
    public class VolumeLayerDepthOfField : VolumeLayerBase
    {
        [JsonProperty(PropertyName = "dof_fd")]
        public float FocusDistance;
        
        public VolumeLayerDepthOfField(DepthOfField dof) : base(UnityJSONExporter.VolumeLayerType.DepthOfField)
        {
            FocusDistance = dof.focusDistance.value;
        }
    }
}
