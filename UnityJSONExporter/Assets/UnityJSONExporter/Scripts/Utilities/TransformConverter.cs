using System;
using UnityEditor;
using UnityEngine;

namespace UnityJSONExporter
{
    public class RawVector3
    {
        public float x;
        public float y;
        public float z;
        public RawVector3(float x, float y, float z)
        {
            this.x = x;
            this.y = y;
            this.z = z;
        }

        public static RawVector3 zero
        {
            get { return new RawVector3(0, 0, 0); }
        }
        
        public static RawVector3 fromVector3(Vector3 v)
        {
            return new RawVector3(v.x, v.y, v.z);
        }
        
        public static Vector3 toVector3(RawVector3 v)
        {
            return new Vector3(v.x, v.y, v.z);
        }
    }
    
    public static class TransformConverter
    {
        /// <summary>
        /// 
        /// </summary>
        public enum TransformType
        {
            Position,
            Rotation,
            Scale,
        }

        /// <summary>
        /// 
        /// </summary>
        public enum AxisDirection
        {
            X,
            Y,
            Z
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="value"></param>
        /// <param name="convertAxis"></param>
        /// <param name="transformType"></param>
        /// <param name="axisDirection"></param>
        /// <returns></returns>
        /// <exception cref="Exception"></exception>
        public static float ConvertValue(
            ConvertAxis convertAxis,
            TransformType transformType,
            AxisDirection axisDirection,
            float value
        )
        {
            switch (convertAxis)
            {
                case ConvertAxis.RightHand:
                    if (transformType == TransformType.Position)
                    {
                        if (axisDirection == AxisDirection.Z)
                        {
                            return -value;
                        }
                    }

                    // TODO: 本当はc#側でxyを反転させて渡したいが、なぜかうまくいかないのでここだけフロント側で反転
                    // if (transformType == TransformType.Rotation)
                    // {
                    //     if (
                    //         axisDirection == AxisDirection.X ||
                    //         axisDirection == AxisDirection.Y
                    //     )
                    //     {
                    //         return -value;
                    //     }
                    // }

                    return value;

                case ConvertAxis.Default:
                    return value;

                default:
                    break;
            }

            throw new Exception("invalid params");
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="axis"></param>
        /// <param name="p"></param>
        /// <returns></returns>
        public static Vector3Info ConvertPosition(ConvertAxis axis, Vector3 p)
        {
            return new Vector3Info(
                ConvertValue(axis, TransformType.Position, AxisDirection.X, p.x),
                ConvertValue(axis, TransformType.Position, AxisDirection.Y, p.y),
                ConvertValue(axis, TransformType.Position, AxisDirection.Z, p.z)
            );
        }

        // /// <summary>
        // /// 
        // /// </summary>
        // /// <param name="axis"></param>
        // /// <param name="p"></param>
        // /// <returns></returns>
        // public static Vector3Info ConvertRotationEuler(ConvertAxis axis, Vector3 eulerAngles)
        // {
        //     return new Vector3Info(
        //         ConvertValue(axis, TransformType.Rotation, AxisDirection.X, eulerAngles.x),
        //         ConvertValue(axis, TransformType.Rotation, AxisDirection.Y, eulerAngles.y),
        //         ConvertValue(axis, TransformType.Rotation, AxisDirection.Z, eulerAngles.z)
        //     );
        // }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="axis"></param>
        /// <param name="quaternion"></param>
        /// <returns></returns>
        public static Vector4Info ConvertRotationQuaternion(ConvertAxis axis, Quaternion quaternion)
        {
            switch (axis)
            {
                case ConvertAxis.RightHand:
                    return new Vector4Info(quaternion.x, quaternion.y, -quaternion.z, -quaternion.w);
                    // return new Vector4Info(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
                default:
                    return new Vector4Info(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
            }
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="axis"></param>
        /// <param name="scale"></param>
        /// <returns></returns>
        public static Vector3Info ConvertScale(ConvertAxis axis, Vector3 scale)
        {
            return new Vector3Info(
                ConvertValue(axis, TransformType.Scale, AxisDirection.X, scale.x),
                ConvertValue(axis, TransformType.Scale, AxisDirection.Y, scale.y),
                ConvertValue(axis, TransformType.Scale, AxisDirection.Z, scale.z)
            );
        }
        
        
        /// <summary>
        /// 
        /// </summary>
        /// <param name="propertyName"></param>
        /// <returns></returns>
        public static bool IsTransformProperty(string propertyName)
        {
            return
                propertyName == PropertyNameResolver.ANIMATION_CLIP_PROPERTY_LOCAL_POSITION_X ||
                propertyName == PropertyNameResolver.ANIMATION_CLIP_PROPERTY_LOCAL_POSITION_Y ||
                propertyName == PropertyNameResolver.ANIMATION_CLIP_PROPERTY_LOCAL_POSITION_Z ||
                propertyName == PropertyNameResolver.ANIMATION_CLIP_PROPERTY_LOCAL_EULER_ANGLES_RAW_X ||
                propertyName == PropertyNameResolver.ANIMATION_CLIP_PROPERTY_LOCAL_EULER_ANGLES_RAW_Y ||
                propertyName == PropertyNameResolver.ANIMATION_CLIP_PROPERTY_LOCAL_EULER_ANGLES_RAW_Z ||
                propertyName == PropertyNameResolver.ANIMATION_CLIP_PROPERTY_LOCAL_SCALE_X ||
                propertyName == PropertyNameResolver.ANIMATION_CLIP_PROPERTY_LOCAL_SCALE_Y ||
                propertyName == PropertyNameResolver.ANIMATION_CLIP_PROPERTY_LOCAL_SCALE_Z;
        }
        /// <summary>
        /// 
        /// </summary>
        /// <param name="binding"></param>
        /// <param name="keyValue"></param>
        /// <param name="convertAxis"></param>
        /// <returns></returns>
        /// <exception cref="Exception"></exception>
        public static float ConvertTransformCurveValue(EditorCurveBinding binding, float keyValue, ConvertAxis convertAxis)
        {
            // for debug
            // Debug.Log($"[PlayableDirectorComponentInfo.ConvertTransformCurveValue] binding propertyName: {binding.propertyName}, keyValue: {keyValue}");

            switch (binding.propertyName)
            {
                case PropertyNameResolver.ANIMATION_CLIP_PROPERTY_LOCAL_POSITION_X:
                    return TransformConverter.ConvertValue(convertAxis, TransformConverter.TransformType.Position, TransformConverter.AxisDirection.X, keyValue);
                case PropertyNameResolver.ANIMATION_CLIP_PROPERTY_LOCAL_POSITION_Y:
                    return TransformConverter.ConvertValue(convertAxis, TransformConverter.TransformType.Position, TransformConverter.AxisDirection.Y, keyValue);
                case PropertyNameResolver.ANIMATION_CLIP_PROPERTY_LOCAL_POSITION_Z:
                    return TransformConverter.ConvertValue(convertAxis, TransformConverter.TransformType.Position, TransformConverter.AxisDirection.Z, keyValue);
                case PropertyNameResolver.ANIMATION_CLIP_PROPERTY_LOCAL_EULER_ANGLES_RAW_X:
                    return TransformConverter.ConvertValue(convertAxis, TransformConverter.TransformType.Rotation, TransformConverter.AxisDirection.X, keyValue);
                case PropertyNameResolver.ANIMATION_CLIP_PROPERTY_LOCAL_EULER_ANGLES_RAW_Y:
                    return TransformConverter.ConvertValue(convertAxis, TransformConverter.TransformType.Rotation, TransformConverter.AxisDirection.Y, keyValue);
                case PropertyNameResolver.ANIMATION_CLIP_PROPERTY_LOCAL_EULER_ANGLES_RAW_Z:
                    return TransformConverter.ConvertValue(convertAxis, TransformConverter.TransformType.Rotation, TransformConverter.AxisDirection.Z, keyValue);
                case PropertyNameResolver.ANIMATION_CLIP_PROPERTY_LOCAL_SCALE_X:
                    return TransformConverter.ConvertValue(convertAxis, TransformConverter.TransformType.Scale, TransformConverter.AxisDirection.X, keyValue);
                case PropertyNameResolver.ANIMATION_CLIP_PROPERTY_LOCAL_SCALE_Y:
                    return TransformConverter.ConvertValue(convertAxis, TransformConverter.TransformType.Scale, TransformConverter.AxisDirection.Y, keyValue);
                case PropertyNameResolver.ANIMATION_CLIP_PROPERTY_LOCAL_SCALE_Z:
                    return TransformConverter.ConvertValue(convertAxis, TransformConverter.TransformType.Scale, TransformConverter.AxisDirection.Z, keyValue);
                default:
                    throw new Exception($"[PlayableDirectorComponentInfo.ConvertTransformCurveValue] invalid property: {binding.propertyName}");
            }
        }
    }
}
