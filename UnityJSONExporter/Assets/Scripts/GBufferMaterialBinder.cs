using Newtonsoft.Json;
using UnityEngine;
using UnityJSONExporter;

public class GBufferMaterialBinder : TimelineBindingObjectBase
{
    [JsonProperty(PropertyName = "ec")]
    public Color EmissiveColor;

    public override string ResolvePropertyName(string propertyName)
    {
        var res = JsonUtilities.ResolveJsonProperty(this, propertyName);
        LoggerProxy.Log($"[GBufferMaterialBinder] type: {this.GetType()},ResolvePropertyName: {propertyName}, res: {res}");
        return res;
    }
}
