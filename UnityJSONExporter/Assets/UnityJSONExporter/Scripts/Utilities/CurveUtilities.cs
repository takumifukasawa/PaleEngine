using System;
using System.Data;
using System.Linq;
using System.Security.Cryptography.X509Certificates;
using UnityEngine;

namespace UnityJSONExporter
{
    public static class CurveUtilities
    {
        /// <summary>
        /// 
        /// ref: https://discussions.unity.com/t/what-is-the-math-behind-animationcurve-evaluate/72058/2 
        /// </summary>
        /// <param name="t">t: 0-1</param>
        /// <param name="k0"></param>
        /// <param name="k1"></param>
        /// <returns></returns>
        public static float EvaluateRaw(float t, Keyframe k0, Keyframe k1)
        {
            // p(t) = (2t^3 - 3t^2 + 1)p0 + (t^3 - 2t^2 + t)m0 + (-2t^3 + 3t^2)p1 + (t^3 - t^2)m1;

            float dt = k1.time - k0.time;

            float m0 = k0.outTangent * dt;
            float m1 = k1.inTangent * dt;

            float t2 = t * t;
            float t3 = t2 * t;

            float a = 2 * t3 - 3 * t2 + 1;
            float b = t3 - 2 * t2 + t;
            float c = t3 - t2;
            float d = -2 * t3 + 3 * t2;

            return a * k0.value + b * m0 + c * m1 + d * k1.value;
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="t">t: absolute time</param>
        /// <param name="k0"></param>
        /// <param name="k1"></param>
        /// <returns></returns>
        public static float Evaluate(float t, Keyframe k0, Keyframe k1)
        {
            float rt = Mathf.InverseLerp(k0.time, k1.time, t);
            return EvaluateRaw(rt, k0, k1);
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="t"></param>
        /// <param name="curve"></param>
        /// <returns></returns>
        /// <exception cref="Exception"></exception>
        public static float EvaluateCurve(float t, AnimationCurve curve)
        {
            // TODO: infinite前提の場合はt自体をclampしてもよいかもしれない

            var keys = curve.keys;

            if (keys.Length == 0)
            {
                Debug.LogWarning("curve.keys.Length == 0");
                return 0;
            }

            if (keys.Length == 1)
            {
                return keys[0].value;
            }

            if (t < keys[0].time)
            {
                return keys[0].value;
            }

            if (t >= keys[keys.Length - 1].time)
            {
                return keys[keys.Length - 1].value;
            }

            // TODO: keyframeが多いとループ数が増えるのでtimeをbinarysearchかけるとよい
            for (var i = 0; i < keys.Length - 1; i++)
            {
                var k0 = keys[i];
                var k1 = keys[i + 1];
                if (k0.time <= t && t < k1.time)
                {
                    // for debug
                    //Debug.Log($"time: {t}, k0.time: {k0.time}");
                    //Debug.Log($"{i} -> {i + 1}");
                    return Evaluate(t, k0, k1);
                }
            }

            throw new Exception($"invalid curve or time. t: {t}, curve keyframe length: {curve.keys.Length}");
        }
    }
}
