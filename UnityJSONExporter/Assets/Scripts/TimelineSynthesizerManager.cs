using System;
using Newtonsoft.Json;
using UnityEngine;
using UnityEngine.Playables;
using UnityJSONExporter;

namespace TimelineSynthesizer
{
    /// <summary>
    /// 
    /// </summary>
    public class TimelineSynthesizerSeekData
    {
        public string Type = "seekTimeline";
        public float CurrentTime;

        public TimelineSynthesizerSeekData(float time)
        {
            CurrentTime = time;
        }
    }

    public class TimelineSynthesizerPlayData
    {
        public string Type = "playTimeline";
        public float CurrentTime;

        public TimelineSynthesizerPlayData(float time)
        {
            CurrentTime = time;
        }
    }

    public class TimelineSynthesizerStopData
    {
        public string Type = "stopTimeline";
    }

    /// <summary>
    /// 
    /// </summary>
    [ExecuteInEditMode]
    public class TimelineSynthesizerManager : MonoBehaviour
    {
        // ----------------------------------------------------------------------------
        // members, fields
        // ----------------------------------------------------------------------------

        // serialize --------------------------------------------

        [SerializeField]
        private WebSocketConnector _webSocketConnector;

        [SerializeField]
        private PlayableDirector _playableDirector;

        // [Space(13)]
        // [SerializeField]
        // private float _sendInterval = 1f;

        [Space(13)]
        [SerializeField]
        private float _sendIntervalFps = 5f;

        [SerializeField]
        private bool _showLog = false;

        // public --------------------------------------------

        public bool IsPlaying => _isPlaying;

        // private --------------------------------------------

        private bool _isPlaying = false;
        private DateTime _prevDateTimeNow;

        // ----------------------------------------------------------------------------
        // methods
        // ----------------------------------------------------------------------------

        // engine --------------------------------------------

        void Update()
        {
#if UNITY_EDITOR
            SendSeek();
#endif
        }

        // private --------------------------------------------

        async void SendSeek()
        {
            if (_playableDirector == null || _webSocketConnector == null)
            {
                return;
            }

            if (_prevDateTimeNow == null)
            {
                _prevDateTimeNow = DateTime.Now;
            }

            if (!_webSocketConnector.CanSend)
            {
                return;
            }

            // guard by interval
            if ((DateTime.Now - _prevDateTimeNow).TotalSeconds < Mathf.Max(1f / Mathf.Max(0.1f, _sendIntervalFps), 1f / 60f))
            {
                return;
            }

            if (_isPlaying)
            {
                return;
            }

            // LoggerProxy.Log($"diff: {(DateTime.Now - _prevDateTimeNow).TotalSeconds}");
            _prevDateTimeNow = DateTime.Now;

            var data = new TimelineSynthesizerSeekData((float)_playableDirector.time);

            var jsonContent = JsonConvert.SerializeObject(data, new JsonSerializerSettings()
            {
                ContractResolver = new PropertyNameSwitchResolver(false),
                Formatting = Formatting.None
            });

            if (_showLog)
            {
                LoggerProxy.Log("[WebSocketConnector.SendSeek] sending...");
                LoggerProxy.Log($"[WebSocketConnector.SendSeek] send json: {jsonContent}");
            }

            _webSocketConnector.TrySendText(jsonContent);
        }

        public async void SendPlay()
        {
            if (_isPlaying)
            {
                return;
            }

            _isPlaying = true;

            var data = new TimelineSynthesizerPlayData((float)_playableDirector.time);

            var jsonContent = JsonConvert.SerializeObject(data, new JsonSerializerSettings()
            {
                ContractResolver = new PropertyNameSwitchResolver(false),
                Formatting = Formatting.None
            });

            if (_showLog)
            {
                LoggerProxy.Log("[WebSocketConnector.SendPlay] sending...");
                LoggerProxy.Log($"[WebSocketConnector.SendPlay] send json: {jsonContent}");
            }

            _webSocketConnector.TrySendText(jsonContent);
        }

        public async void SendStop()
        {
            if (!_isPlaying)
            {
                return;
            }

            _isPlaying = false;

            var data = new TimelineSynthesizerStopData();

            var jsonContent = JsonConvert.SerializeObject(data, new JsonSerializerSettings()
            {
                ContractResolver = new PropertyNameSwitchResolver(false),
                Formatting = Formatting.None
            });


            if (_showLog)
            {
                LoggerProxy.Log("[WebSocketConnector.SendStop] sending...");
                LoggerProxy.Log($"[WebSocketConnector.SendStop] send json: {jsonContent}");
            }

            _webSocketConnector.TrySendText(jsonContent);
        }
    }
}
