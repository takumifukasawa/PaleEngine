// #define LIGHT_CONTROL_TRACK_ENABLED

using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using UnityEditor;
using UnityEngine;
using UnityEngine.Playables;
using UnityEngine.Timeline;

namespace UnityJSONExporter
{
    /// <summary>
    /// 
    /// </summary>
    [System.Serializable]
    public class PlayableDirectorComponentInfo : ComponentInfoBase
    {
        [JsonProperty(PropertyName = "n")]
        public string Name;

        [JsonProperty(PropertyName = "d")]
        public double Duration;

        [JsonProperty(PropertyName = "ts")]
        public List<TrackInfoBase> Tracks = new List<TrackInfoBase>();

        public PlayableDirectorComponentInfo(PlayableDirector playableDirector, ConvertAxis convertAxis, bool minifyPropertyName, bool exportSignalEmitter) : base(ComponentType.PlayableDirector)
        {
            var asset = playableDirector.playableAsset;

            LoggerProxy.Log($"[PlayableDirectorComponentInfo] duration: {playableDirector.duration}");

            Duration = asset.duration;
            Name = asset.name;

            var timelineAsset = playableDirector.playableAsset as TimelineAsset;

            var fps = 60f;
            var spf = 1f / fps;
            var frameCount = playableDirector.duration / spf;

            foreach (var rootTrack in timelineAsset.GetRootTracks())
            {
                LoggerProxy.Log($"[PlayableDirectorComponentInfo] root track: {rootTrack.name}");
                if (rootTrack is GroupTrack groupTrack)
                {
                    foreach (var childTrack in groupTrack.GetChildTracks())
                    {
                        if (TryGenerateTrack(
                                playableDirector,
                                childTrack,
                                convertAxis,
                                minifyPropertyName,
                                exportSignalEmitter,
                                out TrackInfoBase trackInfo
                            ) && trackInfo != null)
                        {
                            Tracks.Add(trackInfo);
                        }
                    }
                }
                else
                {
                    if (TryGenerateTrack(
                            playableDirector,
                            rootTrack,
                            convertAxis,
                            minifyPropertyName,
                            exportSignalEmitter,
                            out TrackInfoBase trackInfo
                        ) && trackInfo != null)
                    {
                        Tracks.Add(trackInfo);
                    }
                }
            }

            // foreach (var track in timelineAsset.GetOutputTracks())
            // {
            //     // for debug
            //     LoggerProxy.Log($"[PlayableDirectorComponentInfo] ===== track name: {track.name}, muted: {track.muted}, type: {track.GetType()} =====");

            //     var bindingObject = playableDirector.GetGenericBinding(track);
            //     // for debug
            //     // track.outputs.ToList().ForEach(o =>
            //     // {
            //     //     LoggerProxy.Log($"[PlayableDirectorComponentInfo] output source: {o.sourceObject}");
            //     //     LoggerProxy.Log($"[PlayableDirectorComponentInfo] output stream name: {o.streamName}");
            //     //     LoggerProxy.Log($"[PlayableDirectorComponentInfo] output target name: {o.outputTargetType}");
            //     // });

            //     // ミュート状態のtrackは使わないので書き出さない
            //     if (track.muted)
            //     {
            //         continue;
            //     }

            //     TrackInfoBase trackInfo = null;

            //     //
            //     // trackの種別によって処理を追加していく
            //     //

            //     //
            //     // marker track
            //     //
            //     if (track.GetType() == typeof(MarkerTrack))
            //     {
            //         LoggerProxy.Log($"[PlayableDirectorComponentInfo] marker track: {track.name}");
            //         var markerTrack = track as MarkerTrack;
            //         var outputs = markerTrack.outputs;
            //         var markers = markerTrack.GetMarkers();
            //         LoggerProxy.Log($"[PlayableDirectorComponentInfo] marker track: {track.name}, marker track output count: {markerTrack.outputs.Count()}, outputs count: {outputs.Count()}, marker count: {markers.Count()}");
            //         var signalEmitterInfo = new List<SignalEmitterInfo>();
            //         foreach (var marker in markers)
            //         {
            //             var signalEmitter = marker as SignalEmitter;
            //             LoggerProxy.Log($"[PlayableDirectorComponentInfo] signal emitter: {signalEmitter.name}");
            //             signalEmitterInfo.Add(new SignalEmitterInfo(signalEmitter.name, (float)signalEmitter.time));
            //         }

            //         trackInfo = new MarkerTrackInfo(signalEmitterInfo);
            //     }


            //     //
            //     // animation track
            //     //
            //     if (track.GetType() == typeof(AnimationTrack))
            //     {
            //         // for debug
            //         // var boundObject = playableDirector.GetGenericBinding(track);
            //         // LoggerProxy.Log($"[PlayableDirectorComponentInfo] animation track: {track.name}, bound object: {boundObject}");
            //         var animationTrack = track as AnimationTrack;
            //         trackInfo = new AnimationTrackInfo(
            //             animationTrack,
            //             bindingObject.name,
            //             convertAxis,
            //             minifyPropertyName,
            //             typeof(UnityEngine.Object),
            //             true
            //         );
            //     }

            //     //
            //     // light control track
            //     //
            //     if (track.GetType() == typeof(LightControlTrack))
            //     {
            //         LoggerProxy.Log($"[PlayableDirectorComponentInfo] light control track: {track.name}");
            //         var lightControlTrack = track as LightControlTrack;
            //         trackInfo = new LightControlTrackInfo(
            //             lightControlTrack,
            //             bindingObject.name,
            //             minifyPropertyName
            //         );
            //     }

            //     //
            //     // control track
            //     //
            //     if (track.GetType() == typeof(ControlTrack))
            //     {
            //         LoggerProxy.Log($"[PlayableDirectorComponentInfo] control track: {track.name}");
            //         // TODO: 追加
            //     }

            //     //
            //     // activation track
            //     //
            //     if (track.GetType() == typeof(ActivationTrack))
            //     {
            //         LoggerProxy.Log($"[PlayableDirectorComponentInfo] activation track: {track.name}");
            //         var activationTrack = track as ActivationTrack;
            //         trackInfo = new ActivationTrackInfo(activationTrack, bindingObject.name);
            //     }

            //     // object move and look at track
            //     if (track.GetType() == typeof(ObjectMoveAndLookAtTrack))
            //     {
            //         LoggerProxy.Log($"[PlayableDirectorComponentInfo] object move and look at track: {track.name}");
            //         var objectMoveAndLookAtTrack = track as ObjectMoveAndLookAtTrack;
            //         LoggerProxy.Log($"[PlayableDirectorComponentInfo] object move and look at track: {objectMoveAndLookAtTrack.name}");
            //         LoggerProxy.Log($"[PlayableDirectorComponentInfo] binding object: {bindingObject.name}");
            //         LoggerProxy.Log($"[PlayableDirectorComponentInfo] convert axis: {convertAxis}");
            //         LoggerProxy.Log($"[PlayableDirectorComponentInfo] minify property name: {minifyPropertyName}");
            //         LoggerProxy.Log($"[PlayableDirectorComponentInfo] typeof(UnityEngine.Object): {typeof(UnityEngine.Object)}");
            //         trackInfo = new ObjectMoveAndLookAtTrackInfo(
            //             objectMoveAndLookAtTrack,
            //             bindingObject.name,
            //             convertAxis,
            //             minifyPropertyName,
            //             typeof(UnityEngine.Object),
            //             true
            //         );
            //     }

            //     if (trackInfo != null)
            //     {
            //         Tracks.Add(trackInfo);
            //     }
            //     else
            //     {
            //         LoggerProxy.LogError($"[PlayableDirectorComponentInfo] unknown track type: {track.GetType()}");
            //     }
            // }
        }

        bool TryGenerateTrack(
            PlayableDirector playableDirector,
            TrackAsset track,
            ConvertAxis convertAxis,
            bool minifyPropertyName,
            bool exportSignalEmitter,
            out TrackInfoBase trackInfo
        )
        {
            trackInfo = null;

            // for debug
            LoggerProxy.Log($"[PlayableDirectorComponentInfo] ===== track name: {track.name}, muted: {track.muted}, type: {track.GetType()} =====");

            var bindingObject = playableDirector.GetGenericBinding(track);
            // for debug
            // track.outputs.ToList().ForEach(o =>
            // {
            //     LoggerProxy.Log($"[PlayableDirectorComponentInfo] output source: {o.sourceObject}");
            //     LoggerProxy.Log($"[PlayableDirectorComponentInfo] output stream name: {o.streamName}");
            //     LoggerProxy.Log($"[PlayableDirectorComponentInfo] output target name: {o.outputTargetType}");
            // });

            // ミュート状態のtrackは使わないので書き出さない
            if (track.muted)
            {
                return false;
            }

            //
            // trackの種別によって処理を追加していく
            //

            //
            // marker track
            //
            if (track.GetType() == typeof(MarkerTrack))
            {
                if (!exportSignalEmitter)
                {
                    return true;
                }
                LoggerProxy.Log($"[PlayableDirectorComponentInfo] marker track: {track.name}");
                var markerTrack = track as MarkerTrack;
                var outputs = markerTrack.outputs;
                var markers = markerTrack.GetMarkers();
                LoggerProxy.Log($"[PlayableDirectorComponentInfo] marker track: {track.name}, marker track output count: {markerTrack.outputs.Count()}, outputs count: {outputs.Count()}, marker count: {markers.Count()}");
                var signalEmitterInfo = new List<SignalEmitterInfo>();
                foreach (var marker in markers)
                {
                    var signalEmitter = marker as SignalEmitter;
                    LoggerProxy.Log($"[PlayableDirectorComponentInfo] signal emitter: {signalEmitter.name}");
                    signalEmitterInfo.Add(new SignalEmitterInfo(signalEmitter.name, (float)signalEmitter.time));
                }

                trackInfo = new MarkerTrackInfo(signalEmitterInfo);
            }


            //
            // animation track
            //
            if (track.GetType() == typeof(AnimationTrack))
            {
                // for debug
                // var boundObject = playableDirector.GetGenericBinding(track);
                // LoggerProxy.Log($"[PlayableDirectorComponentInfo] animation track: {track.name}, bound object: {boundObject}");
                var animationTrack = track as AnimationTrack;
                trackInfo = new AnimationTrackInfo(
                    animationTrack,
                    bindingObject.name,
                    convertAxis,
                    minifyPropertyName,
                    typeof(UnityEngine.Object),
                    true
                );
            }

            //
            // light control track
            //
#if LIGHT_CONTROL_TRACK_ENABLED
            if (track.GetType() == typeof(LightControlTrack))
            {
                LoggerProxy.Log($"[PlayableDirectorComponentInfo] light control track: {track.name}");
                var lightControlTrack = track as LightControlTrack;
                trackInfo = new LightControlTrackInfo(
                    lightControlTrack,
                    bindingObject.name,
                    minifyPropertyName
                );
            }
#endif
            
            //
            // control track
            //
            if (track.GetType() == typeof(ControlTrack))
            {
                LoggerProxy.Log($"[PlayableDirectorComponentInfo] control track: {track.name}");
                // TODO: 追加
            }

            //
            // activation track
            //
            if (track.GetType() == typeof(ActivationTrack))
            {
                LoggerProxy.Log($"[PlayableDirectorComponentInfo] activation track: {track.name}");
                var activationTrack = track as ActivationTrack;
                trackInfo = new ActivationTrackInfo(activationTrack, bindingObject.name);
            }

            // object move and look at track
            if (track.GetType() == typeof(ObjectMoveAndLookAtTrack))
            {
                LoggerProxy.Log($"[PlayableDirectorComponentInfo] object move and look at track: {track.name}");
                var objectMoveAndLookAtTrack = track as ObjectMoveAndLookAtTrack;
                LoggerProxy.Log($"[PlayableDirectorComponentInfo] object move and look at track: {objectMoveAndLookAtTrack.name}");
                LoggerProxy.Log($"[PlayableDirectorComponentInfo] binding object: {bindingObject.name}");
                LoggerProxy.Log($"[PlayableDirectorComponentInfo] convert axis: {convertAxis}");
                LoggerProxy.Log($"[PlayableDirectorComponentInfo] minify property name: {minifyPropertyName}");
                LoggerProxy.Log($"[PlayableDirectorComponentInfo] typeof(UnityEngine.Object): {typeof(UnityEngine.Object)}");
                trackInfo = new ObjectMoveAndLookAtTrackInfo(
                    objectMoveAndLookAtTrack,
                    bindingObject.name,
                    convertAxis,
                    minifyPropertyName,
                    typeof(UnityEngine.Object),
                    true
                );
            }

            if (trackInfo == null)
            {
                LoggerProxy.LogError($"[PlayableDirectorComponentInfo] unknown track type: {track.GetType()}");
                return false;
            }

            return true;
        }
    }
}
