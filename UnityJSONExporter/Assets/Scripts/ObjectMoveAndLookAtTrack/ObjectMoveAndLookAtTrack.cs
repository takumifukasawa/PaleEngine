using UnityEngine;
using UnityEngine.Playables;
using UnityEngine.Timeline;

[TrackColor(0.2f, 0.4f, 0.6f)]
[TrackClipType(typeof(ObjectMoveAndLookAtClip))]
[TrackBindingType(typeof(ObjectMoveAndLookAtController))]
public class ObjectMoveAndLookAtTrack : TrackAsset
{
    public override Playable CreateTrackMixer(PlayableGraph graph, GameObject go, int inputCount)
    {
        return ScriptPlayable<ObjectMoveAndLookAtMixerBehaviour>.Create(graph, inputCount);
    }

    public override void GatherProperties(PlayableDirector director, IPropertyCollector driver)
    {
#if UNITY_EDITOR
        ObjectMoveAndLookAtController trackBinding = director.GetGenericBinding(this) as ObjectMoveAndLookAtController;
        if (trackBinding == null)
            return;
        driver.AddFromName<ObjectMoveAndLookAtController>(trackBinding.gameObject, ObjectMoveAndLookAtController.LocalPositionPropertyName);
        driver.AddFromName<ObjectMoveAndLookAtController>(trackBinding.gameObject, ObjectMoveAndLookAtController.LookAtTargetPropertyName);
#endif
        base.GatherProperties(director, driver);
    }
}
