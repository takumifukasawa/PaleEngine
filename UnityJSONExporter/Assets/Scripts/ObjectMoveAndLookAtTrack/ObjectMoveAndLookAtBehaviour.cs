using UnityEngine;
using UnityEngine.Playables;

[System.Serializable]
public class ObjectMoveAndLookAtBehaviour : PlayableBehaviour
{
    // ObjectMoveAndLookAtControllerと同じにしておく
    // property name を string で指定する際に分かりやすくするため

    public Vector3 LocalPosition;
    public ExposedReference<Transform> LookAtTarget;
    
    public override void ProcessFrame(Playable playable, FrameData info, object playerData)
    {
        var objectMoveAndLookAtController = playerData as ObjectMoveAndLookAtController;
        
        var director = playable.GetGraph().GetResolver() as PlayableDirector;
        var lookAtTarget = LookAtTarget.Resolve(director);
       
        // for debug
        // Debug.Log($"[ObjectMoveAndLookAtBehaviour.ProcessFrame] p: {LocalPosition}, look at: {lookAtTarget}");
        
        objectMoveAndLookAtController.MoveAndLookAt(LocalPosition, lookAtTarget);
    }
}
