using System;
using UnityEditor;
using UnityEngine;

namespace UnityJSONExporter
{
    /// <summary>
    /// 
    /// </summary>
    public abstract class PropertyBinder
    {
        public PropertyBinder(
            AnimationClip animationClip,
            EditorCurveBinding[] bindings,
            float time
        )
        {
        }
    }


    /// <summary>
    /// 
    /// </summary>
    public class AnimationTrackBinder : PropertyBinder
    {
        // ---------------------------------------------------------------------------
        // public
        // ---------------------------------------------------------------------------

        /// <summary>
        /// 
        /// </summary>
        /// <param name="animationClip"></param>
        /// <param name="bindings"></param>
        /// <param name="time"></param>
        /// <returns></returns>
        /// <exception cref="Exception"></exception>
        public AnimationTrackBinder(
            AnimationClip animationClip,
            EditorCurveBinding[] bindings,
            float time
        ) : base(animationClip, bindings, time)
        {
            foreach (var binding in bindings)
            {
                // animated transform
                if (binding.type.FullName == typeof(Transform).FullName)
                {
                    var curve = AnimationUtility.GetEditorCurve(animationClip, binding);
                    var value = CurveUtilities.EvaluateCurve(time, curve);

                    switch (binding.propertyName)
                    {
                        case PropertyNameResolver.ANIMATION_CLIP_PROPERTY_LOCAL_POSITION_X:
                            _hasLocalPosition = true;
                            _localPosition.x = value;
                            break;
                        case PropertyNameResolver.ANIMATION_CLIP_PROPERTY_LOCAL_POSITION_Y:
                            _hasLocalPosition = true;
                            _localPosition.y = value;
                            break;
                        case PropertyNameResolver.ANIMATION_CLIP_PROPERTY_LOCAL_POSITION_Z:
                            _hasLocalPosition = true;
                            _localPosition.z = value;
                            break;
                        case PropertyNameResolver.ANIMATION_CLIP_PROPERTY_LOCAL_EULER_ANGLES_RAW_X:
                            _hasLocalRotationEuler = true;
                            _localRotationEuler.x = value;
                            break;
                        case PropertyNameResolver.ANIMATION_CLIP_PROPERTY_LOCAL_EULER_ANGLES_RAW_Y:
                            _hasLocalRotationEuler = true;
                            _localRotationEuler.y = value;
                            break;
                        case PropertyNameResolver.ANIMATION_CLIP_PROPERTY_LOCAL_EULER_ANGLES_RAW_Z:
                            _hasLocalRotationEuler = true;
                            _localRotationEuler.z = value;
                            break;
                        case PropertyNameResolver.ANIMATION_CLIP_PROPERTY_LOCAL_SCALE_X:
                            _hasLocalScale = true;
                            _localScale.x = value;
                            break;
                        case PropertyNameResolver.ANIMATION_CLIP_PROPERTY_LOCAL_SCALE_Y:
                            _hasLocalScale = true;
                            _localScale.y = value;
                            break;
                        case PropertyNameResolver.ANIMATION_CLIP_PROPERTY_LOCAL_SCALE_Z:
                            _hasLocalScale = true;
                            _localScale.z = value;
                            break;
                        default:
                            throw new Exception($"invalid property: {binding.propertyName}");
                    }
                }
            }
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="t"></param>
        public void AssignProperty(Transform t)
        {
            // LoggerProxy.Log("==========");
            // LoggerProxy.Log(LocalPosition);
            // LoggerProxy.Log(LocalRotationEuler);
            // LoggerProxy.Log(LocalScale);
            if (_hasLocalPosition)
            {
                t.localPosition = _localPosition;
            }

            if (_hasLocalRotationEuler)
            {
                t.localRotation = Quaternion.Euler(_localRotationEuler);
            }

            if (_hasLocalScale)
            {
                t.localScale = _localScale;
            }
        }

        // ---------------------------------------------------------------------------
        // private
        // ---------------------------------------------------------------------------

        private bool _hasLocalPosition;
        private bool _hasLocalRotationEuler;
        private bool _hasLocalScale;

        private Vector3 _localPosition = Vector3.zero;
        private Vector3 _localRotationEuler = Vector3.zero;
        private Vector3 _localScale = Vector3.one;
    }

    /// <summary>
    /// 
    /// </summary>
    public class LightControlTrackPropertyBinder : PropertyBinder
    {
        // ---------------------------------------------------------------------------
        // public
        // ---------------------------------------------------------------------------

        public Color Color => _color;
        public float Intensity => _intensity;
        public float BounceIntensity => _bounceIntensity;
        public float Range => _range;

        public LightControlTrackPropertyBinder(
            AnimationClip animationClip,
            EditorCurveBinding[] bindings,
            float time
        ) : base(animationClip, bindings, time)
        {
            foreach (var binding in bindings)
            {
                // for debug
                // LoggerProxy.Log($"binding type: {binding.type}, path: {binding.path}, property name: {binding.propertyName}");
                var curve = AnimationUtility.GetEditorCurve(animationClip, binding);
                var value = CurveUtilities.EvaluateCurve(time, curve);

                switch (binding.propertyName)
                {
                    case PropertyNameResolver.LIGHT_CONTROL_CLIP_PROPERTY_COLOR_R:
                        _hasColor = true;
                        _color.r = value;
                        break;
                    case PropertyNameResolver.LIGHT_CONTROL_CLIP_PROPERTY_COLOR_G:
                        _hasColor = true;
                        _color.g = value;
                        break;
                    case PropertyNameResolver.LIGHT_CONTROL_CLIP_PROPERTY_COLOR_B:
                        _hasColor = true;
                        _color.b = value;
                        break;
                    case PropertyNameResolver.LIGHT_CONTROL_CLIP_PROPERTY_COLOR_A:
                        _hasColor = true;
                        _color.a = value;
                        break;
                    case PropertyNameResolver.LIGHT_CONTROL_CLIP_PROPERTY_BOUNCE_INTENSITY:
                        _hasBounceIntensity = true;
                        _bounceIntensity = value;
                        break;
                    case PropertyNameResolver.LIGHT_CONTROL_CLIP_PROPERTY_INTENSITY:
                        _hasIntensity = true;
                        _intensity = value;
                        break;
                    case PropertyNameResolver.LIGHT_CONTROL_CLIP_PROPERTY_RANGE:
                        _hasRange = true;
                        _range = value;
                        break;
                    default:
                        throw new Exception($"invalid property: {binding.propertyName}");
                }
            }
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="light"></param>
        public void AssignProperty(Light light)
        {
            if (_hasIntensity)
            {
                light.intensity = _intensity;
            }

            if (_hasBounceIntensity)
            {
                light.bounceIntensity = _bounceIntensity;
            }

            if (_hasRange)
            {
                light.range = _range;
            }

            if (_hasColor)
            {
                light.color = _color;
            }
        }

        // ---------------------------------------------------------------------------
        // private
        // ---------------------------------------------------------------------------

        private bool _hasIntensity;
        private bool _hasBounceIntensity;
        private bool _hasRange;
        private bool _hasColor;

        private float _intensity;
        private float _bounceIntensity;
        private float _range;
        private Color _color = new Color();
    }
}
