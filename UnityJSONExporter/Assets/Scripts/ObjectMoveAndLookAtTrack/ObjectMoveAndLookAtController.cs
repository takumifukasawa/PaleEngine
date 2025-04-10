using UnityEngine;
using UnityJSONExporter;

public class ObjectMoveAndLookAtController : MonoBehaviour
{
    public static readonly string LocalPositionPropertyName = "LocalPosition";
    public static readonly string LookAtTargetPropertyName = "LookAtTarget";

    public RawVector3 LocalPosition = RawVector3.zero;

    public Transform LookAtTarget;
    
    public void MoveAndLookAt(Vector3 p, Transform lookAt)
    {
        transform.localPosition = p;
        transform.LookAt(lookAt);
    }
}
