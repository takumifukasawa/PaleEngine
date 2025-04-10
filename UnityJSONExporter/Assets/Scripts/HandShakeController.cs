using System;
using Newtonsoft.Json;
using Unity.VisualScripting;
using UnityEngine;
using UnityEngine.Playables;
using UnityJSONExporter;

[ExecuteInEditMode]
public class HandShakeController : TimelineBindingObjectBase
{
    [JsonProperty(PropertyName = "a")]
    public Vector3 Amplitude;
    [JsonProperty(PropertyName = "s")]
    public Vector3 Speed;

    public override string ResolvePropertyName(string propertyName)
    {
        var res = JsonUtilities.ResolveJsonProperty(this, propertyName);
        LoggerProxy.Log($"[HandShakeController] type: {this.GetType()},ResolvePropertyName: {propertyName}, res: {res}");
        return res;
    }
}
