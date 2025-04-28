using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Playables;
using UnityEngine.Rendering;
using UnityEngine.SceneManagement;

namespace UnityJSONExporter
{
    /// <summary>
    /// 
    /// </summary>
    public class SceneInfoBuilder
    {
        public const string EXCLUDE_TAG = "ExcludeExport";

        // ---------------------------------------------------------------------------------------------
        // public
        // ---------------------------------------------------------------------------------------------

        public SceneInfoBuilder(ConvertAxis exportAxis, bool minifyPropertyName, bool exportSignalEmitter)
        {
            _convertAxis = exportAxis;
            _minifyPropertyName = minifyPropertyName;
            _exportSignalEmitter = exportSignalEmitter;
        }

        /// <summary>
        /// 
        /// </summary>
        /// <returns></returns>
        public SceneInfo GenerateSceneInfo()
        {
            // for debug
            // LoggerProxy.Log("[SceneInfo.GenerateSceneInfo]");

            var sceneInfo = new SceneInfo();
            // sceneInfo.Name = SceneManager.GetActiveScene().name;

            var objectInfoList = RecursiveBuildGameObjectInfo();

            sceneInfo.Objects = objectInfoList;

            return sceneInfo;
        }

        // ---------------------------------------------------------------------------------------------
        // private
        // ---------------------------------------------------------------------------------------------

        private ConvertAxis _convertAxis;
        private bool _minifyPropertyName;
        private bool _exportSignalEmitter;

        /// <summary>
        /// 
        /// </summary>
        /// <returns></returns>
        List<ObjectInfo> RecursiveBuildGameObjectInfo()
        {
            var objectInfoList = new List<ObjectInfo>();

            // シーンのルートオブジェクトを取得
            var rootObjects = SceneManager.GetActiveScene().GetRootGameObjects();

            foreach (var rootObject in rootObjects)
            {
                if (!rootObject.tag.Equals(EXCLUDE_TAG))
                {
                    // シーン直下のオブジェクト
                    var objectInfo = GenerateObjectInfo(rootObject);

                    foreach (Transform child in rootObject.transform)
                    {
                        if (!child.gameObject.tag.Equals(EXCLUDE_TAG))
                        {
                            InternalRecursiveBuildGameObjectInfo(child.gameObject, ref objectInfo);
                        }
                    }

                    objectInfoList.Add(objectInfo);
                }
            }

            return objectInfoList;
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="parent"></param>
        /// <param name="go"></param>
        /// <returns></returns>
        void InternalRecursiveBuildGameObjectInfo(GameObject go, ref ObjectInfo parent)
        {
            var objectInfo = GenerateObjectInfo(go);
            parent.AddChild(objectInfo);

            foreach (Transform child in go.transform)
            {
                InternalRecursiveBuildGameObjectInfo(child.gameObject, ref objectInfo);
            }
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="go"></param>
        /// <returns></returns>
        ObjectInfo GenerateObjectInfo(GameObject go)
        {
            var objectInfo = new ObjectInfo(go, _convertAxis);
            objectInfo.Components = ParseComponents(go);
            return objectInfo;
        }

        /// <summary>
        /// TODO: genericsにしたい
        /// parseしたいcomponentを列挙
        /// 対象となるcomponentが増えた場合はここに追加する
        /// </summary>
        /// <param name="go"></param>
        /// <returns></returns>
        List<ComponentInfoBase> ParseComponents(GameObject go)
        {
            var componentInfoList = new List<ComponentInfoBase>();

            //
            // camera
            //
            if (go.TryGetComponent(out Camera camera))
            {
                var cameraComponentInfo = new CameraComponentInfo(camera);
                componentInfoList.Add(cameraComponentInfo);
            }

            //
            // light
            //
            if (go.TryGetComponent(out Light light))
            {
                var lightComponentInfo = LightComponentInfo.BuildLightComponentInfo(light);
                componentInfoList.Add(lightComponentInfo);
            }

            //
            // mesh renderer
            //
            if (go.TryGetComponent(out MeshRenderer meshRenderer))
            {
                var meshRendererComponentInfo = new MeshRendererComponentInfo(meshRenderer);
                componentInfoList.Add(meshRendererComponentInfo);
            }

            //
            // mesh filter
            //
            if (go.TryGetComponent(out MeshFilter meshFilter))
            {
                var meshFilterComponentInfo = new MeshFilterComponentInfo(meshFilter);
                componentInfoList.Add(meshFilterComponentInfo);
            }

            //
            // playable director
            //
            if (go.TryGetComponent(out PlayableDirector playableDirector))
            {
                var playableDirectorComponentInfo = new PlayableDirectorComponentInfo(
                    playableDirector,
                    _convertAxis,
                    _minifyPropertyName,
                    _exportSignalEmitter
                );
                componentInfoList.Add(playableDirectorComponentInfo);
            }

            //
            // volume (post processing)
            //
            if (go.TryGetComponent(out Volume volume))
            {
                var volumeComponentInfo = new VolumeComponentInfo(volume);
                componentInfoList.Add(volumeComponentInfo);
            }
            
            // custom components
            
            //
            // object move and look at controller
            //
            if (go.TryGetComponent(out ObjectMoveAndLookAtController objectMoveAndLookAtController))
            {
                var objectMoveAndLookAtControllerComponentInfo = new ObjectMoveAndLookAtControllerComponentInfo(objectMoveAndLookAtController);
                componentInfoList.Add(objectMoveAndLookAtControllerComponentInfo);
            }

            return componentInfoList;
        }
    }
}
