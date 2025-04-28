using UnityEngine;
using Newtonsoft.Json;
using UnityJSONExporter;

[System.Serializable]
public class ObjectMoveAndLookAtControllerComponentInfo : ComponentInfoBase
{
    [JsonProperty(PropertyName = "lp")]
    public RawVector3 LocalPosition;

    // LookAtTargetNameは、LookAtTargetの名前を保持する
    [JsonProperty(PropertyName = "tn")]
    public string LookAtTargetName;

    public ObjectMoveAndLookAtControllerComponentInfo(ObjectMoveAndLookAtController objectMoveAndLookAtController) : base(ComponentType.ObjectMoveAndLookAtController)
    {
        LocalPosition = objectMoveAndLookAtController.LocalPosition;
        LookAtTargetName = objectMoveAndLookAtController.LookAtTarget.name;
    }
}
