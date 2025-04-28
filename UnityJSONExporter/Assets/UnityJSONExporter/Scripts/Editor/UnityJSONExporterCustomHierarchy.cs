using UnityEngine;
using UnityEditor;
using UnityEngine.UIElements;

namespace UnityJSONExporter
{
    [InitializeOnLoad]
    public class UnityJSONExporterCustomHierarchy : MonoBehaviour
    {
        static UnityJSONExporterCustomHierarchy()
        {
            EditorApplication.hierarchyWindowItemOnGUI += HierarchyItemCB;
        }

        private static void HierarchyItemCB(int instanceID, Rect selectionRect)
        {
            GameObject gameObject = EditorUtility.InstanceIDToObject(instanceID) as GameObject;

            if (gameObject != null && !gameObject.CompareTag(SceneInfoBuilder.EXCLUDE_TAG))
            {
                EditorGUI.DrawRect(selectionRect, new Color(1f, 0.6f, 0.2f, 0.2f));
            }
        }
        
    }
}
