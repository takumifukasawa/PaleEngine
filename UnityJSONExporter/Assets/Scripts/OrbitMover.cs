using System;
using Newtonsoft.Json;
using Unity.VisualScripting;
using UnityEngine;
using UnityEngine.Playables;
using UnityJSONExporter;

[ExecuteInEditMode]
public class OrbitMover : TimelineBindingObjectBase
{
    [SerializeField]
    private PlayableDirector _playableDirector;

    [JsonProperty(PropertyName = "r")]
    public float Radius = 2.0f;

    [JsonProperty(PropertyName = "s")]
    public float Speed = 1.0f;

    [JsonProperty(PropertyName = "d")]
    public float Delay = 0f;

    [JsonProperty(PropertyName = "op")]
    public Vector3 OffsetPosition;

    public void Update()
    {
        if (_playableDirector)
        {
            var t = (float)_playableDirector.time;
            var r = t * Speed - Delay;
            var x = Mathf.Cos(r) * Radius;
            var z = Mathf.Sin(r) * Radius;
            transform.position = new Vector3(x, 0, z) + OffsetPosition;
        }
    }

    public override string ResolvePropertyName(string propertyName)
    {
        var res = JsonUtilities.ResolveJsonProperty(this, propertyName);
        LoggerProxy.Log($"[OrbitMover] type: {this.GetType()},ResolvePropertyName: {propertyName}, res: {res}");
        return res;
    }
}
