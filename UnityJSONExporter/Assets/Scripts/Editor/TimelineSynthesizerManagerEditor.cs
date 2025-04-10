using TimelineSynthesizer;
using UnityEditor;
using UnityEngine;

[CustomEditor(typeof(TimelineSynthesizerManager))]
    public class TimelineSynthesizerManagerEditor : Editor
{
    public override void OnInspectorGUI()
    {
        base.OnInspectorGUI();
       
        var script = target as TimelineSynthesizerManager;

        GUILayout.Space(13);
        
        GUILayout.Label($"is playing: {script.IsPlaying}");

        GUILayout.Space(13);
        
        if (GUILayout.Button("Play"))
        {
            script.SendPlay();
        }

        if (GUILayout.Button("Stop"))
        {
            script.SendStop();
        }
    }
}
