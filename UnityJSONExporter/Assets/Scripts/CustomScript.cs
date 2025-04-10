using System.Collections;
using System.Collections.Generic;
using Newtonsoft.Json;
using UnityEngine;
using UnityJSONExporter;

namespace Custom
{
    // public class CustomScript : MonoBehaviour
    public class CustomScript : TimelineBindingObjectBase
    {
        [JsonProperty(PropertyName = "f")]
        public float CustomPropertyFloat = 0.5f;

        [JsonProperty(PropertyName = "c")]
        public Color CustomPropertyColor = Color.white;

        [JsonProperty(PropertyName = "v")]
        public Vector3 CustomPropertyVector3 = Vector3.zero;

        public override string ResolvePropertyName(string propertyName)
        {
            var res = JsonUtilities.ResolveJsonProperty(this, propertyName);
            LoggerProxy.Log($"[CustomScript] type: {this.GetType()},ResolvePropertyName: {propertyName}, res: {res}");
            return res;
        }
    }
}
