using UnityEngine;
using UnityEngine.Playables;

[System.Serializable]
public class ObjectLookAtAsset : PlayableAsset
{
    // public ExposedReference<Transform> Target;  // Timeline上でExposeできるように設定

    public override Playable CreatePlayable(PlayableGraph graph, GameObject owner)
    {
        var playable = ScriptPlayable<ObjectLookAtBehaviour>.Create(graph);

        // ObjectLookAtBehaviour behaviour = playable.GetBehaviour();
        // behaviour.Target = Target.Resolve(graph.GetResolver());

        return playable;
    }
}
