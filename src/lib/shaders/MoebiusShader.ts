import * as THREE from 'three';

/**
 * Moebius Style Shader (Phase 3: Continuous Curvy Outlines)
 * features: Sharp illustrative shading + continuous curvy/sketchy outlines using coherent noise.
 */
export const MoebiusShader = {
  uniforms: {
    'tDiffuse': { value: null },
    'tDepth': { value: null },
    'tNormal': { value: null },
    'cameraNear': { value: 0.1 },
    'cameraFar': { value: 1000 },
    'resolution': { value: new THREE.Vector2() },
    'outlineThickness': { value: 2.2 },
    'outlineColor': { value: new THREE.Color(0x1a151d) },
    'wiggleFrequency': { value: 0.12 },
    'wiggleAmplitude': { value: 2.5 },
    'time': { value: 0.0 },
    'lightDirection': { value: new THREE.Vector3(1, 1, 1).normalize() },
    'projectionMatrixInverse': { value: new THREE.Matrix4() }
  },

  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    #include <packing>

    varying vec2 vUv;
    uniform sampler2D tDiffuse;
    uniform sampler2D tDepth;
    uniform sampler2D tNormal;
    uniform float cameraNear;
    uniform float cameraFar;
    uniform vec2 resolution;
    uniform float outlineThickness;
    uniform vec3 outlineColor;
    uniform float wiggleFrequency;
    uniform float wiggleAmplitude;
    uniform float time;
    uniform vec3 lightDirection;

    float readDepth(vec2 coord) {
      float fragCoordZ = texture2D(tDepth, coord).x;
      return viewZToOrthographicDepth( perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar ), cameraNear, cameraFar );
    }

    float getLuminance(vec3 color) {
      return dot(color, vec3(0.2126, 0.7152, 0.0722));
    }

    // Coherent Value Noise for smooth "curvy" lines
    float noise(vec2 n) {
      return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
    }

    float smoothNoise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float a = noise(i);
      float b = noise(i + vec2(1.0, 0.0));
      float c = noise(i + vec2(0.0, 1.0));
      float d = noise(i + vec2(1.0, 1.0));
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      for (int i = 0; i < 2; i++) {
        v += a * smoothNoise(p);
        p *= 2.0;
        a *= 0.5;
      }
      return v;
    }

    float getEdge(vec2 uv, vec2 offset) {
      float d = readDepth(uv);
      float d_n = readDepth(uv + offset * vec2(0, 1));
      float d_e = readDepth(uv + offset * vec2(1, 0));
      float edgeDepth = (abs(d - d_n) + abs(d - d_e)) * 60.0;

      vec3 n = texture2D(tNormal, uv).rgb * 2.0 - 1.0;
      vec3 n_n = texture2D(tNormal, uv + offset * vec2(0, 1)).rgb * 2.0 - 1.0;
      vec3 n_e = texture2D(tNormal, uv + offset * vec2(1, 0)).rgb * 2.0 - 1.0;
      float edgeNormal = (distance(n, n_n) + distance(n, n_e)) * 2.5;

      return smoothstep(0.1, 0.35, edgeDepth + edgeNormal);
    }

    void main() {
      // 1. Base Sharp Sampling
      vec4 texel = texture2D(tDiffuse, vUv);
      vec3 normalSample = texture2D(tNormal, vUv).rgb * 2.0 - 1.0;
      vec2 offset = outlineThickness / resolution;

      // 2. Curvy Outlines (Phase 3: Coherent Noise)
      // Use low-frequency noise for continuous, smooth "sketchy" lines
      float outline = 0.0;
      
      // We render two "sketch" passes for a hand-drawn multi-stroke feel
      for(int i = 0; i < 2; i++) {
        float fi = float(i);
        
        // Lower frequency = larger, curvier waves. 
        // Higher amplitude = more deviation from the original edge.
        vec2 noiseScale = vec2(15.0); // Size of the "curviness"
        vec2 noiseUV = vUv * noiseScale + vec2(time * 0.1, fi * 3.7);
        
        vec2 curl = vec2(
          fbm(noiseUV),
          fbm(noiseUV + vec2(1.23, 4.56))
        ) * 2.0 - 1.0;

        // Apply displacement for curvier edge sampling
        vec2 wUv = vUv + curl * (wiggleAmplitude / resolution);
        outline = max(outline, getEdge(wUv, offset));
      }

      // 3. Illustrative Shading (Sharp)
      vec3 baseColor = texel.rgb;
      float dotNL = dot(normalize(normalSample), normalize(lightDirection));
      float light = smoothstep(-0.25, 0.45, dotNL);
      
      // Multi-layer Hatching (Sharp)
      float luma = getLuminance(baseColor) * (0.65 + 0.35 * light);
      float hatch = 0.0;
      float hatchScale = 5.0; // Sharp pixel scale
      
      if (luma < 0.78) {
        float h1 = mod((vUv.x + vUv.y) * resolution.y, hatchScale);
        if (h1 < 1.0) hatch = 0.35;
      }
      if (luma < 0.45) {
        float h2 = mod((vUv.x - vUv.y) * resolution.y, hatchScale);
        if (h2 < 1.0) hatch = 0.55;
      }

      // Layered shading
      vec3 pixelColor = baseColor;
      vec3 shadowColor = baseColor * 0.75;
      pixelColor = mix(shadowColor, baseColor, light);
      
      // Apply Outline & Hatching
      pixelColor = mix(pixelColor, outlineColor, hatch * (1.1 - light));
      pixelColor = mix(pixelColor, outlineColor, outline);

      // Sky Masking
      float rawDepth = texture2D(tDepth, vUv).x;
      if (rawDepth > 0.9999) {
        gl_FragColor = texel;
      } else {
        gl_FragColor = vec4(pixelColor, texel.a);
      }
    }
  `
};
