using System;
using UnityEngine;
using NativeWebSocket;
using UnityEngine.Playables;

[ExecuteInEditMode]
public class WebSocketConnector : MonoBehaviour
{
    // ----------------------------------------------------------------------------
    // serialize
    // ----------------------------------------------------------------------------

    [SerializeField]
    private int _port;

    [SerializeField]
    private bool _connectOnAwake = false;

    // ----------------------------------------------------------------------------
    // unity engine
    // ----------------------------------------------------------------------------

    /// <summary>
    /// 
    /// </summary>
    private void Awake()
    {
        if (_connectOnAwake)
        {
            Connect();
        }
    }

    /// <summary>
    /// 
    /// </summary>
    private void OnDisable()
    {
        Close();
    }

    /// <summary>
    /// 
    /// </summary>
    private void Update()
    {
#if !UNITY_WEBGL || UNITY_EDITOR
        if (_webSocket != null)
        {
            _webSocket.DispatchMessageQueue();
        }
#endif
    }

    /// <summary>
    /// 
    /// </summary>
    private void OnApplicationQuit()
    {
        Close();
    }

    // ----------------------------------------------------------------------------
    // public
    // ----------------------------------------------------------------------------


    /// <summary>
    /// 
    /// </summary>
    public async void Connect()
    {
        Debug.Log($"[WebSocketConnector.Connect] port: {_port}, websocket: {_webSocket}");
        if (_webSocket != null)
        {
            // await _webSocket.Close();
            return;
        }

        _webSocket = new WebSocket($"ws://localhost:{_port}");
        Debug.Log("init websocket");

        _webSocket.OnOpen += () => { Debug.Log("Connection open!"); };

        _webSocket.OnError += (e) => { Debug.Log("Error! " + e); };

        _webSocket.OnClose += (e) => { Debug.Log("Connection closed!"); };

        // _webSocket.OnMessage += (bytes) =>
        // {
        //     Debug.Log("OnMessage!");
        //     // getting the message as a string
        //     var message = System.Text.Encoding.UTF8.GetString(bytes);
        //     Debug.Log("OnMessage! " + message);
        // };

        // InvokeRepeating("SendWebSocketMessage", 0.0f, 0.3f);

        await _webSocket.Connect();
    }


    /// <summary>
    /// 
    /// </summary>
    public async void Close()
    {
        Debug.Log($"[WebSocketConnector.Close] websocket: {_webSocket}");
        if (_webSocket == null)
        {
            return;
        }

        Debug.Log($"[WebSocketConnector.Close] websocket close...");
        await _webSocket.Close();
        Debug.Log($"[WebSocketConnector.Close] websocket closed");
        _webSocket = null;
    }

    // ----------------------------------------------------------------------------
    // private
    // ----------------------------------------------------------------------------

    private bool _isSending = false;

    private WebSocket _webSocket;

    private DateTime _prevDateTimeNow;

    public bool CanSend
    {
        get
        {
            if (_webSocket == null)
            {
                return false;
            }

            if (_webSocket.State != WebSocketState.Open)
            {
                return false;
            }

            return true;
        }
    }

    /// <summary>
    /// 
    /// </summary>
    /// <param name="text"></param>
    public async void TrySendText(string text, bool forceSend = false)
    {
        if (_webSocket == null)
        {
            return;
        }

        if (_webSocket.State != WebSocketState.Open)
        {
            return;
        }

        if (!forceSend && _isSending)
        {
            return;
        }

        _isSending = true;
        await _webSocket.SendText(text);
        _isSending = false;
    }
}
