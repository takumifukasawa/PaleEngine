using System.Collections;
using System.Collections.Generic;
using Newtonsoft.Json;
using UnityEngine;
using UnityJSONExporter;

public class SpointLightBinder : TimelineBindingObjectBase
{
    [JsonProperty(PropertyName = "ca")]
    public float ConeAngle;

    [JsonProperty(PropertyName = "pa")]
    public float PenumbraAngle;

    public override string ResolvePropertyName(string propertyName)
    {
        var res = JsonUtilities.ResolveJsonProperty(this, propertyName);
        LoggerProxy.Log($"[SpotLightBinder] type: {this.GetType()},ResolvePropertyName: {propertyName}, res: {res}");
        return res;
    }
}
