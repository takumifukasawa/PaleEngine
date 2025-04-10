using System;
using UnityEditor;
using UnityEngine.Timeline;

namespace UnityJSONExporter
{
    public class LightControlTrackInfo : ClipTrackInfoBase
    {
        public LightControlTrackInfo(
            LightControlTrack track,
            string targetName,
            bool minifyPropertyName
        ) : base(TrackInfoType.LightControlTrack, targetName)
        {
            var timelineClips = track.GetClips();
            foreach (var timelineClip in timelineClips)
            {
                Clips.Add(GenerateLightControlClipInfo(
                    // track as LightControlTrack,
                    timelineClip,
                    minifyPropertyName
                ));
            }
        }

        ClipInfoBase GenerateLightControlClipInfo(
            TimelineClip timelineClip,
            bool minifyPropertyName
        )
        {
            // var lightControlClip = timelineClip.asset as LightControlClip;
            var animationClip = timelineClip.curves;
            var bindings = AnimationUtility.GetCurveBindings(animationClip);

            var lightControlClipInfo = new LightControlClipInfo(
                (float)timelineClip.start,
                (float)timelineClip.duration
            );

            foreach (var binding in bindings)
            {
                var clipBinding = new ClipBinding();
                lightControlClipInfo.Bindings.Add(clipBinding);

                // TODO: property name はそのまま入っちゃうので短縮化したい
                clipBinding.PropertyName =
                    minifyPropertyName
                        ? PropertyNameResolver.ResolveUnityBuiltinPropertyName(binding.propertyName)
                        : binding.propertyName;

                // for debug
                // property check
                // Debug.Log($"[PlayableDirectorComponentInfo.GenerateLightControlClipInfo] binding: {binding}");
                // Debug.Log($"[PlayableDirectorComponentInfo.GenerateLightControlClipInfo] binding property name: {binding.propertyName}");

                var curve = AnimationUtility.GetEditorCurve(animationClip, binding);

                foreach (var key in curve.keys)
                {
                    float keyValue = key.value;
                    var clipKeyframe = new ClipKeyframe();
                    clipKeyframe.Time = key.time;
                    clipKeyframe.Value = keyValue;
                    clipKeyframe.InTangent = key.inTangent;
                    clipKeyframe.OutTangent = key.outTangent;
                    // for obj
                    // clipBinding.Keyframes.Add(clipKeyframe);
                    // for arr
                    clipBinding.AddKeyframe(key.time, keyValue, key.inTangent, key.outTangent);
                }
            }

            return lightControlClipInfo;
        }
    }
}
