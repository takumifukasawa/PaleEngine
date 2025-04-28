using System;
using System.Collections.Generic;
using UnityEditor;
using UnityEngine;
using UnityEngine.Timeline;

namespace UnityJSONExporter
{
    public class ObjectMoveAndLookAtTrackInfo : ClipTrackInfoBase
    {
        public ObjectMoveAndLookAtTrackInfo(
            ObjectMoveAndLookAtTrack track,
            string targetName,
            ConvertAxis convertAxis,
            bool minifyPropertyName,
            Type checkType = null,
            bool convertTransformValue = false
        ) : base(TrackInfoType.ObjectMoveAndLookAtTrack, targetName)
        {
            var timelineClips = track.GetClips();

            foreach (var timelineClip in timelineClips)
            {
                // for debug
                LoggerProxy.Log($"[ObjectMoveAndLookAtTrackInfo.constructor] timeline clip : {timelineClip}");
                LoggerProxy.Log($"[ObjectMoveAndLookAtTrackInfo.constructor] animation clip : {timelineClip.animationClip}");
                LoggerProxy.Log($"[ObjectMoveAndLookAtTrackInfo.constructor] asset : {timelineClip.asset}");
                var animationClip = timelineClip.animationClip;
                Clips.Add(GenerateMoveAndLookAtTrackClipInfo(
                    timelineClip,
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
        ClipInfoBase GenerateMoveAndLookAtTrackClipInfo(
            TimelineClip timelineClip,
            ConvertAxis convertAxis,
            bool minifyPropertyName,
            Type checkType = null,
            bool convertTransformValue = false
        )
        {
            // var lightControlClip = timelineClip.asset as LightControlClip;
            var animationClip = timelineClip.curves;
            var bindings = AnimationUtility.GetCurveBindings(animationClip);

            var clipInfo = new ObjectMoveAndLookAtClipInfo(
                (float)timelineClip.start,
                (float)timelineClip.duration
            );

            foreach (var binding in bindings)
            {
                var clipBinding = new ClipBinding();
                clipInfo.Bindings.Add(clipBinding);

                clipBinding.PropertyName = binding.propertyName;

                // for debug
                LoggerProxy.Log($"[ObjectMoveAndLookAtTrackInfo.GenerateMoveAndLookAtTrackClipInfo] property: {binding.propertyName}");

                // NOTE: AnimationClipの場合はいろんなpropertyの可能性があるのでガードしない（transform, material, ...)
                // if (checkType != null && binding.type.FullName != checkType.FullName)
                // {
                //     continue;
                // }

                var curve = AnimationUtility.GetEditorCurve(animationClip, binding);

                foreach (var key in curve.keys)
                {
                    LoggerProxy.Log($"[ObjectMoveAndLookAtTrackInfo.GenerateMoveAndLookAtTrackClipInfo] property: {binding.propertyName}, key: {key.time}, {key.value}, {key.inTangent}, {key.outTangent}");

                    // tmp
                    // float keyValue = convertTransformValue && TransformConverter.IsTransformProperty(binding.propertyName)
                    //     ? TransformConverter.ConvertTransformCurveValue(binding, key.value, convertAxis)
                    //     : key.value;

                    float keyValue = key.value;

                    switch (binding.propertyName)
                    {
                        // TODO: shorthand
                        case "LocalPosition.x":
                            keyValue = TransformConverter.ConvertValue(convertAxis, TransformConverter.TransformType.Position, TransformConverter.AxisDirection.X, keyValue);
                            if (minifyPropertyName)
                            {
                                clipBinding.PropertyName = "lp.x";
                            }

                            break;
                        case "LocalPosition.y":
                            keyValue = TransformConverter.ConvertValue(convertAxis, TransformConverter.TransformType.Position, TransformConverter.AxisDirection.Y, keyValue);
                            if (minifyPropertyName)
                            {
                                clipBinding.PropertyName = "lp.y";
                            }

                            break;
                        case "LocalPosition.z":
                            keyValue = TransformConverter.ConvertValue(convertAxis, TransformConverter.TransformType.Position, TransformConverter.AxisDirection.Z, keyValue);
                            if (minifyPropertyName)
                            {
                                clipBinding.PropertyName = "lp.z";
                            }

                            break;
                        default:
                            throw new Exception($"[ObjectMoveAndLookAtTrackInfo.GenerateMoveAndLookAtTrackClipInfo] invalid property: {binding.propertyName}");
                    }


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

            return clipInfo;
        }
    }
}
