using System;
using UnityEditor;
using UnityEngine.Timeline;

namespace UnityJSONExporter
{
    public class ActivationTrackInfo : ClipTrackInfoBase
    {
        public ActivationTrackInfo(
            ActivationTrack track,
            string targetName
        ) : base(TrackInfoType.ActivationTrack, targetName)
        {
            var timelineClips = track.GetClips();
            foreach (var timelineClip in timelineClips)
            {
                Clips.Add(GenerateActivationControlClipInfo(
                    // track as LightControlTrack,
                    timelineClip
                ));
            }
        }
        
        ClipInfoBase GenerateActivationControlClipInfo(TimelineClip timelineClip)
        {
            var clipInfo = new ActivationControlClipInfo(
                (float)timelineClip.start,
                (float)timelineClip.duration
            );

            return clipInfo;
        }
    }
}
