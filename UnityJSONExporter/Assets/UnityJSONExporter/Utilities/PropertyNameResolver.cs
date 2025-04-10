using System.Collections.Generic;
using UnityEngine;

namespace UnityJSONExporter
{
    public static class PropertyNameResolver
    {
        //
        // general
        //
        
        public const string ANIMATION_CLIP_PROPERTY_LOCAL_POSITION_X = "m_LocalPosition.x";
        public const string ANIMATION_CLIP_PROPERTY_LOCAL_POSITION_X_SHORTEN = "lp.x";

        public const string ANIMATION_CLIP_PROPERTY_LOCAL_POSITION_Y = "m_LocalPosition.y";
        public const string ANIMATION_CLIP_PROPERTY_LOCAL_POSITION_Y_SHORTEN = "lp.y";

        public const string ANIMATION_CLIP_PROPERTY_LOCAL_POSITION_Z = "m_LocalPosition.z";
        public const string ANIMATION_CLIP_PROPERTY_LOCAL_POSITION_Z_SHORTEN = "lp.z";

        public const string ANIMATION_CLIP_PROPERTY_LOCAL_EULER_ANGLES_RAW_X = "localEulerAnglesRaw.x";
        public const string ANIMATION_CLIP_PROPERTY_LOCAL_EULER_ANGLES_RAW_X_SHORTEN = "lr.x";

        public const string ANIMATION_CLIP_PROPERTY_LOCAL_EULER_ANGLES_RAW_Y = "localEulerAnglesRaw.y";
        public const string ANIMATION_CLIP_PROPERTY_LOCAL_EULER_ANGLES_RAW_Y_SHORTEN = "lr.y";

        public const string ANIMATION_CLIP_PROPERTY_LOCAL_EULER_ANGLES_RAW_Z = "localEulerAnglesRaw.z";
        public const string ANIMATION_CLIP_PROPERTY_LOCAL_EULER_ANGLES_RAW_Z_SHORTEN = "lr.z";

        public const string ANIMATION_CLIP_PROPERTY_LOCAL_SCALE_X = "m_LocalScale.x";
        public const string ANIMATION_CLIP_PROPERTY_LOCAL_SCALE_X_SHORTEN = "ls.x";

        public const string ANIMATION_CLIP_PROPERTY_LOCAL_SCALE_Y = "m_LocalScale.y";
        public const string ANIMATION_CLIP_PROPERTY_LOCAL_SCALE_Y_SHORTEN = "ls.y";

        public const string ANIMATION_CLIP_PROPERTY_LOCAL_SCALE_Z = "m_LocalScale.z";
        public const string ANIMATION_CLIP_PROPERTY_LOCAL_SCALE_Z_SHORTEN = "ls.z";

        public const string LIGHT_CONTROL_CLIP_PROPERTY_COLOR_R = "color.r";
        public const string LIGHT_CONTROL_CLIP_PROPERTY_COLOR_R_SHORTEN = "c.r";

        public const string LIGHT_CONTROL_CLIP_PROPERTY_COLOR_G = "color.g";
        public const string LIGHT_CONTROL_CLIP_PROPERTY_COLOR_G_SHORTEN = "c.g";

        public const string LIGHT_CONTROL_CLIP_PROPERTY_COLOR_B = "color.b";
        public const string LIGHT_CONTROL_CLIP_PROPERTY_COLOR_B_SHORTEN = "c.b";

        public const string LIGHT_CONTROL_CLIP_PROPERTY_COLOR_A = "color.a";
        public const string LIGHT_CONTROL_CLIP_PROPERTY_COLOR_A_SHORTEN = "c.a";

        //
        // material
        //
        
        public const string MATERIAL_PROPERTY_BASE_COLOR_R = "material._BaseColor.r";
        public const string MATERIAL_PROPERTY_BASE_COLOR_R_SHORTEN = "m.bc.r";

        public const string MATERIAL_PROPERTY_BASE_COLOR_G = "material._BaseColor.g";
        public const string MATERIAL_PROPERTY_BASE_COLOR_G_SHORTEN = "m.bc.g";

        public const string MATERIAL_PROPERTY_BASE_COLOR_B = "material._BaseColor.b";
        public const string MATERIAL_PROPERTY_BASE_COLOR_B_SHORTEN = "m.bc.b";

        public const string MATERIAL_PROPERTY_BASE_COLOR_A = "material._BaseColor.a";
        public const string MATERIAL_PROPERTY_BASE_COLOR_A_SHORTEN = "m.bc.a";

        //
        // light
        //
        
        public const string LIGHT_CONTROL_CLIP_PROPERTY_BOUNCE_INTENSITY = "bounceIntensity";
        public const string LIGHT_CONTROL_CLIP_PROPERTY_BOUNCE_INTENSITY_SHORTEN = "bi";

        public const string LIGHT_CONTROL_CLIP_PROPERTY_INTENSITY = "intensity";
        public const string LIGHT_CONTROL_CLIP_PROPERTY_INTENSITY_SHORTEN = "i";

        public const string LIGHT_CONTROL_CLIP_PROPERTY_RANGE = "range";
        public const string LIGHT_CONTROL_CLIP_PROPERTY_RANGE_SHORTEN = "r";

        //
        // camera
        //
        
        public const string CAMERA_FIELD_OF_VIEW = "field of view";
        public const string CAMERA_FIELD_OF_VIEW_SHORTEN = "fov";
        
        //
        // create pair
        //
        
        private static Dictionary<string, string> _propertyPairs = new Dictionary<string, string>
        {
            {
                ANIMATION_CLIP_PROPERTY_LOCAL_POSITION_X,
                ANIMATION_CLIP_PROPERTY_LOCAL_POSITION_X_SHORTEN
            },
            {
                ANIMATION_CLIP_PROPERTY_LOCAL_POSITION_Y,
                ANIMATION_CLIP_PROPERTY_LOCAL_POSITION_Y_SHORTEN
            },
            {
                ANIMATION_CLIP_PROPERTY_LOCAL_POSITION_Z,
                ANIMATION_CLIP_PROPERTY_LOCAL_POSITION_Z_SHORTEN
            },
            {
                ANIMATION_CLIP_PROPERTY_LOCAL_EULER_ANGLES_RAW_X,
                ANIMATION_CLIP_PROPERTY_LOCAL_EULER_ANGLES_RAW_X_SHORTEN
            },
            {
                ANIMATION_CLIP_PROPERTY_LOCAL_EULER_ANGLES_RAW_Y,
                ANIMATION_CLIP_PROPERTY_LOCAL_EULER_ANGLES_RAW_Y_SHORTEN
            },
            {
                ANIMATION_CLIP_PROPERTY_LOCAL_EULER_ANGLES_RAW_Z,
                ANIMATION_CLIP_PROPERTY_LOCAL_EULER_ANGLES_RAW_Z_SHORTEN
            },
            {
                ANIMATION_CLIP_PROPERTY_LOCAL_SCALE_X,
                ANIMATION_CLIP_PROPERTY_LOCAL_SCALE_X_SHORTEN
            },
            {
                ANIMATION_CLIP_PROPERTY_LOCAL_SCALE_Y,
                ANIMATION_CLIP_PROPERTY_LOCAL_SCALE_Y_SHORTEN
            },
            {
                ANIMATION_CLIP_PROPERTY_LOCAL_SCALE_Z,
                ANIMATION_CLIP_PROPERTY_LOCAL_SCALE_Z_SHORTEN
            },
            {
                LIGHT_CONTROL_CLIP_PROPERTY_COLOR_R,
                LIGHT_CONTROL_CLIP_PROPERTY_COLOR_R_SHORTEN
            },
            {
                LIGHT_CONTROL_CLIP_PROPERTY_COLOR_G,
                LIGHT_CONTROL_CLIP_PROPERTY_COLOR_G_SHORTEN
            },
            {
                LIGHT_CONTROL_CLIP_PROPERTY_COLOR_B,
                LIGHT_CONTROL_CLIP_PROPERTY_COLOR_B_SHORTEN
            },
            {
                LIGHT_CONTROL_CLIP_PROPERTY_COLOR_A,
                LIGHT_CONTROL_CLIP_PROPERTY_COLOR_A_SHORTEN
            },
            {
                MATERIAL_PROPERTY_BASE_COLOR_R,
                MATERIAL_PROPERTY_BASE_COLOR_R_SHORTEN
            },
            {
                MATERIAL_PROPERTY_BASE_COLOR_G,
                MATERIAL_PROPERTY_BASE_COLOR_G_SHORTEN
            },
            {
                MATERIAL_PROPERTY_BASE_COLOR_B,
                MATERIAL_PROPERTY_BASE_COLOR_B_SHORTEN
            },
            {
                MATERIAL_PROPERTY_BASE_COLOR_A,
                MATERIAL_PROPERTY_BASE_COLOR_A_SHORTEN
            },
            {
                LIGHT_CONTROL_CLIP_PROPERTY_BOUNCE_INTENSITY,
                LIGHT_CONTROL_CLIP_PROPERTY_BOUNCE_INTENSITY_SHORTEN
            },
            {
                LIGHT_CONTROL_CLIP_PROPERTY_INTENSITY,
                LIGHT_CONTROL_CLIP_PROPERTY_INTENSITY_SHORTEN
            },
            {
                LIGHT_CONTROL_CLIP_PROPERTY_RANGE,
                LIGHT_CONTROL_CLIP_PROPERTY_RANGE_SHORTEN
            },
            {
                CAMERA_FIELD_OF_VIEW,
                CAMERA_FIELD_OF_VIEW_SHORTEN
            }
        };

        public static string ResolveUnityBuiltinPropertyName(string propertyName)
        {
            if (_propertyPairs.ContainsKey(propertyName))
            {
                return _propertyPairs[propertyName];
            }

            LoggerProxy.LogWarning($"[PropertyNameResolver.ResolveUnityBuiltinPropertyName] invalid property name: {propertyName}");


            return propertyName;
        }
    }
}
