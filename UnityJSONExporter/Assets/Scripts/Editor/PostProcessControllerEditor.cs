using UnityEditor;
using UnityEngine;

[CustomEditor(typeof(PostProcessController))]
public class PostProcessControllerEditor : Editor
{
    public override void OnInspectorGUI()
    {
        base.OnInspectorGUI();

        if (GUILayout.Button("Cache Components"))
        {
            var script = target as PostProcessController;
            script.CacheComponents();
        }
    }
}
