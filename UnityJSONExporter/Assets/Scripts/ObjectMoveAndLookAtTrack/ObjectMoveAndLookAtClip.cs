using UnityEngine;
using UnityEngine.Playables;
using UnityEngine.Timeline;

[System.Serializable]
public class ObjectMoveAndLookAtClip : PlayableAsset, ITimelineClipAsset
{
    public ObjectMoveAndLookAtBehaviour template = new ObjectMoveAndLookAtBehaviour();

    public ClipCaps clipCaps
    {
        get
        {
            return ClipCaps.Blending;
        }
    }
    
    // public ExposedReference<Transform> Target;

    public override Playable CreatePlayable(PlayableGraph graph, GameObject owner)
    {
        var playable = ScriptPlayable<ObjectMoveAndLookAtBehaviour>.Create(graph, template);
        return playable;
    }
}
