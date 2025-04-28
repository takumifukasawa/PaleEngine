using Newtonsoft.Json;
using UnityEngine;
using UnityJSONExporter;

public class BackgroundController : TimelineBindingObjectBase
{
    [JsonProperty(PropertyName = "pc")]
    public Color PrimaryColor;

    public override string ResolvePropertyName(string propertyName)
    {
        var res = JsonUtilities.ResolveJsonProperty(this, propertyName);
        LoggerProxy.Log($"[BackgroundController] type: {this.GetType()},ResolvePropertyName: {propertyName}, res: {res}");
        return res;
    }
}
