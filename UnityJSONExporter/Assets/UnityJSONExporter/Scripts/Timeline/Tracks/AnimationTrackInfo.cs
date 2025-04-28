using System;
using System.Collections.Generic;
using UnityEditor;
using UnityEngine;
using UnityEngine.Timeline;

namespace UnityJSONExporter
{
    public class AnimationTrackInfo : ClipTrackInfoBase
    {
        public AnimationTrackInfo(
            AnimationTrack track,
            string targetName,
            ConvertAxis convertAxis,
            bool minifyPropertyName,
            Type checkType = null,
            bool convertTransformValue = false
        ) : base(TrackInfoType.AnimationTrack, targetName)
        {
            var timelineClips = track.GetClips();

            foreach (var timelineClip in timelineClips)
            {
                // for debug
                // LoggerProxy.Log($"[PlayableDirectorComponentInfo.GenerateClipInfoList] timeline clip : {timelineClip}");
                // LoggerProxy.Log($"[PlayableDirectorComponentInfo.GenerateClipInfoList] animation clip : {timelineClip.animationClip}");
                // LoggerProxy.Log($"[PlayableDirectorComponentInfo.GenerateClipInfoList] asset : {timelineClip.asset}");
                // // LoggerProxy.Log($"[PlayableDirectorComponentInfo.GenerateClipInfoList] asset is activation control playable: {timelineClip.asset is UnityEngine.Timeline.ActivationPlayableAsset}");
                // // LoggerProxy.Log($"[PlayableDirectorComponentInfo.GenerateClipInfoList] asset is activation control playable: {typeof(timelineClip.asset)}");
                var animationClip = timelineClip.animationClip;
                Clips.Add(GenerateAnimationClipInfo(
                    timelineClip,
                    animationClip,
                    convertAxis,
                    minifyPropertyName,
                    checkType,
                    convertTransformValue
                ));
            }
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="timelineClip"></param>
        /// <param name="convertAxis"></param>
        /// <param name="checkType"></param>
        /// <param name="convertTransformValue"></param>
        /// <returns></returns>
        ClipInfoBase GenerateAnimationClipInfo(
            TimelineClip timelineClip,
            AnimationClip animationClip,
            ConvertAxis convertAxis,
            bool minifyPropertyName,
            Type checkType = null,
            bool convertTransformValue = false
        )
        {
            // TODO: offsetの適用
            // check timeline clip offset
            var animationPlayableAsset = timelineClip.asset as AnimationPlayableAsset;
            var offsetMatrix = new Matrix4x4();
            offsetMatrix.SetTRS(
                animationPlayableAsset.position,
                animationPlayableAsset.rotation,
                Vector3.one
            );

            var clipInfo = new AnimationClipInfo(
                (float)timelineClip.start,
                (float)timelineClip.duration
            );

            var bindings = AnimationUtility.GetCurveBindings(animationClip);

            foreach (var binding in bindings)
            {
                var clipBinding = new ClipBinding();
                clipInfo.Bindings.Add(clipBinding);

                clipBinding.PropertyName = binding.propertyName;

                var curve = AnimationUtility.GetEditorCurve(animationClip, binding);

                var targetComponent = SceneUtilities.FindComponentInScene(binding.type);
                LoggerProxy.Log(
                    $"[AnimationTrackInfo.GenerateAnimationClipInfo] timeline clip name: {timelineClip.displayName}, type: {checkType}, binding.propertyName: {binding.propertyName}, binding.type: {binding.type}, target component: {targetComponent}, component type: {targetComponent.GetType()}");

                var type = targetComponent.GetType();
                // if (targetComponent is )
                clipBinding.PropertyName = binding.propertyName;

                if (minifyPropertyName)
                {
                    if (targetComponent is TimelineBindingObjectBase)
                    {
                        clipBinding.PropertyName = (targetComponent as TimelineBindingObjectBase).ResolvePropertyName(binding.propertyName);
                        // clipBinding.PropertyName = JsonUtilities.ResolveJsonProperty<type>(
                        //     // targetComponent as PostProcessController,
                        //     targetComponent as type,
                        //     binding.propertyName,
                        //     minifyPropertyName
                        // );
                    }
                    else
                    {
                        // clipBinding.PropertyName = binding.propertyName;
                        clipBinding.PropertyName = PropertyNameResolver.ResolveUnityBuiltinPropertyName(binding.propertyName);
                    }
                }


                foreach (var key in curve.keys)
                {
                    float keyValue = convertTransformValue && TransformConverter.IsTransformProperty(binding.propertyName)
                        ? TransformConverter.ConvertTransformCurveValue(binding, key.value, convertAxis)
                        : key.value;

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

                LoggerProxy.Log($"[AnimationTrackInfo.GenerateAnimationClipInfo] clipBinding.PropertyName: {clipBinding.PropertyName}, keyframe num: {clipBinding.Keyframes.Count}");
            }

            return clipInfo;
        }
    }
}
