using System.Linq;
using Newtonsoft.Json;
using UnityEngine;

namespace UnityJSONExporter
{
    public static class JsonUtilities
    {
        public static string ResolveJsonProperty<T>(
            T component,
            string targetField
            // bool needsMinify
        ) where T : Component
        {
            // if (!needsMinify)
            // {
            //     return targetField;
            // }

            var type = typeof(T);
            var fields = type.GetFields();
            // for debug
            LoggerProxy.Log($"[JsonUtilities.ResolveJsonProperty] ===================================");
            LoggerProxy.Log($"[JsonUtilities.ResolveJsonProperty] type: {type}, target field: {targetField}, fields: {fields.Length}");

            // 1: オブジェクト名
            // 2: フィールド
            var fieldObjectPattern = @"(^.*?)\.(x|y|z|w|r|g|b|a)$";

            // オブジェクトの場合。color, vectorなど
            var matchFieldObject = System.Text.RegularExpressions.Regex.Match(targetField, fieldObjectPattern);

            LoggerProxy.Log($"[JsonUtilities.ResolveJsonProperty] field: {targetField}, match object field: {matchFieldObject.Success}");

            // 一致するfieldを探索
            foreach (var field in fields)
            {
                // 宣言されているjsonpropertryを取得
                var jsonProperty = field
                    .GetCustomAttributes(typeof(JsonPropertyAttribute), false)
                    .Cast<JsonPropertyAttribute>()
                    .FirstOrDefault();
                var fieldName = field.Name;

                if (jsonProperty == null)
                {
                    continue;
                }

                // for debug
                // if (matchFieldObject.Success)
                // {
                //     LoggerProxy.Log($"[JsonUtilities.ResolveJsonProperty] field: {fieldName}, match object field: // {matchFieldObject.Groups[1].Value}, json property: {jsonProperty.PropertyName}");
                // }
                
                // オブジェクトの場合
                if (
                    matchFieldObject.Success
                    && matchFieldObject.Groups[1].Value == fieldName
                )
                {
                    return $"{jsonProperty.PropertyName}.{matchFieldObject.Groups[2].Value}";
                }

                // 完全一致していたらそのまま変換. float など
                if (field.Name == targetField)
                {
                    return jsonProperty.PropertyName;
                }
            }

            // fallback
            return targetField;
        }
    }
}
