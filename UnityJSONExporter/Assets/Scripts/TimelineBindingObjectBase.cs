using UnityEngine;
using UnityJSONExporter;

public abstract class TimelineBindingObjectBase : MonoBehaviour
{
    public abstract string ResolvePropertyName(string propertyName);
}
