using Newtonsoft.Json;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;
using UnityJSONExporter;

/// <summary>
/// 
/// </summary>
[RequireComponent(typeof(Animator))]
[ExecuteAlways]
public class PostProcessController : TimelineBindingObjectBase
{
    [Space(13)]
    [Header("Bloom")]
    [Range(0, 10)]
    [JsonProperty(PropertyName = "bl_i")]
    public float BloomIntensity;

    [Space(13)]
    [Header("Depth of Field")]
    [Range(0, 10)]
    [JsonProperty(PropertyName = "dof_fd")]
    public float DepthOfFieldFocusDistance;

    [Space(13)]
    [Header("Vignette")]
    [Range(0, 1)]
    [JsonProperty(PropertyName = "vi_i")]
    public float VignetteIntensity;

    [Space(13)]
    [Header("Components")]
    [SerializeField]
    private VolumeProfile _volumeProfile;

    [SerializeField]
    private Bloom _bloomComponent;

    [SerializeField]
    private DepthOfField _depthOfFieldComponent;

    [SerializeField]
    private Vignette _vignetteComponent;

    private float _bloomIntensityCache;

    private float _depthOfFieldFocusDistanceCache;

    private float _vignetteIntensityCache;

    public override string ResolvePropertyName(string propertyName)
    {
        return JsonUtilities.ResolveJsonProperty(this, propertyName);
    }

    /// <summary>
    /// 
    /// </summary>
    void Update()
    {
        // for debug
        // LoggerProxy.Log("============");
        // LoggerProxy.Log(_volumeProfile);
        // LoggerProxy.Log(_bloomComponent);
        // LoggerProxy.Log(_depthOfFieldComponent);

        //
        // update bloom
        //

        if (_bloomComponent != null)
        {
            if (_bloomComponent.intensity.value != _bloomIntensityCache)
            {
                _bloomIntensityCache = _bloomComponent.intensity.value;
            }
            else if (BloomIntensity != _bloomIntensityCache)
            {
                _bloomIntensityCache = BloomIntensity;
            }

            BloomIntensity = _bloomIntensityCache;
            _bloomComponent.intensity.value = _bloomIntensityCache;
        }

        //
        // update dof
        //

        if (_depthOfFieldComponent != null)
        {
            if (_depthOfFieldComponent.focusDistance.value != _depthOfFieldFocusDistanceCache)
            {
                _depthOfFieldFocusDistanceCache = _depthOfFieldComponent.focusDistance.value;
            }
            else if (DepthOfFieldFocusDistance != _depthOfFieldFocusDistanceCache)
            {
                _depthOfFieldFocusDistanceCache = DepthOfFieldFocusDistance;
            }

            DepthOfFieldFocusDistance = _depthOfFieldFocusDistanceCache;
            _depthOfFieldComponent.focusDistance.value = _depthOfFieldFocusDistanceCache;
        }

        //
        // update vignette
        //

        if (_vignetteComponent != null)
        {
            if (_vignetteComponent.intensity.value != _vignetteIntensityCache)
            {
                _vignetteIntensityCache = _vignetteComponent.intensity.value;
            }
            else if (VignetteIntensity != _vignetteIntensityCache)
            {
                _vignetteIntensityCache = VignetteIntensity;
            }

            VignetteIntensity = _vignetteIntensityCache;
            _vignetteComponent.intensity.value = _vignetteIntensityCache;
        }
    }

    /// <summary>
    /// 
    /// </summary>
    public void CacheComponents()
    {
        _volumeProfile = null;
        _bloomComponent = null;
        _depthOfFieldComponent = null;
        _vignetteComponent = null;

        _volumeProfile = GetComponent<Volume>()?.profile;

        if (_volumeProfile != null)
        {
            // 不必要にループが回るので効率は良くないがエディター側のみなのでよしとする
            foreach (var item in _volumeProfile.components)
            {
                if (_bloomComponent == null && item is Bloom bloom)
                {
                    _bloomComponent = bloom;
                }

                if (_depthOfFieldComponent == null && item is DepthOfField dof)
                {
                    _depthOfFieldComponent = dof;
                }

                if (_vignetteComponent == null && item is Vignette vignette)
                {
                    _vignetteComponent = vignette;
                }
            }
        }
    }
}
