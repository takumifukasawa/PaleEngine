using UnityEditor;
using UnityEngine;

[CustomEditor(typeof(WebSocketConnector))]
public class WebSocketConnectorEditor : Editor
{
    public override void OnInspectorGUI()
    {
        base.OnInspectorGUI();
       
        var script = target as WebSocketConnector;
        
        if (GUILayout.Button("Connect"))
        {
            script.Connect();
        }

        if (GUILayout.Button("Close"))
        {
            script.Close();
        }
    }
}
