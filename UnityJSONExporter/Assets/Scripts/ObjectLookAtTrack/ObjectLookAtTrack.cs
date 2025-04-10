
using UnityEngine;
using UnityEngine.Playables;
using UnityEngine.Timeline;

[TrackColor(0.855f, 0.8623f, 0.87f)]
[TrackBindingType(typeof(Transform))]  // 特定のオブジェクトにバインド
[TrackClipType(typeof(ObjectLookAtAsset))]  // AssetをClipとして設定
public class ObjectLookAtTrack : TrackAsset
{
    public override Playable CreateTrackMixer(PlayableGraph graph, GameObject go, int inputCount)
    {
        return ScriptPlayable<ObjectLookAtMixerBehaviour>.Create(graph, inputCount);
    }
}
