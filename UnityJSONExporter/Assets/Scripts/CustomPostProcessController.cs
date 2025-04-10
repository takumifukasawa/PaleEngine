using System.Collections;
using System.Collections.Generic;
using Newtonsoft.Json;
using UnityEngine;
using UnityJSONExporter;

public class CustomPostProcessController : TimelineBindingObjectBase
{
    [Space(13)]
    [Header("Bloom")]
    [Range(0, 10)]
    [JsonProperty(PropertyName = "bl_i")]
    public float BloomIntensity;
    
    [Space(13)]
    [Header("Dof")]
    [JsonProperty(PropertyName = "dof_fr")]
    public float DofFocusRange;
    
    [JsonProperty(PropertyName = "dof_br")]
    public float DofBokehRadius;
    
    [Header("Volumetric Fog")]
    [Range(0, 1)]
    [JsonProperty(PropertyName = "vl_rs")]
    public float VolumetricLightRayStep;
    
    // [Header("Glitch")]
    // [Range(0, 1)]
    // [JsonProperty(PropertyName = "gl_e")]
    // public float GlitchEnabled;
    
    [Range(0, 1)]
    [JsonProperty(PropertyName = "gl_r")]
    public float GlitchRate;
    
    [Header("Color Cover Pass")]
    [JsonProperty(PropertyName = "cbr")]
    [Range(0, 1)]
    public float ColorCoverPassBlendRate = 0;

    public override string ResolvePropertyName(string propertyName)
    {
        var res = JsonUtilities.ResolveJsonProperty(this, propertyName);
        LoggerProxy.Log($"[CustomPostProcessController] type: {this.GetType()},ResolvePropertyName: {propertyName}, res: {res}");
        return res;
    }
}
