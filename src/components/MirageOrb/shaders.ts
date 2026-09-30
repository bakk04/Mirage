export const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export const fragmentShader = /* glsl */ `
uniform float uTime;
uniform float uAmplitude;
uniform vec2 uGaze;
uniform float uState;

varying vec2 vUv;

// Simplex 2D noise
vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

float snoise(vec2 v) {
  const vec4 C = vec4(
    0.211324865405187, 0.366025403784439,
    -0.577350269189626, 0.024390243902439
  );
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(
    permute(i.y + vec3(0.0, i1.y, 1.0)) +
    i.x + vec3(0.0, i1.x, 1.0)
  );
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m * m * m;
  vec3 x2 = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x2) - 0.5;
  vec3 ox = floor(x2 + 0.5);
  vec3 a0 = x2 - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

mat2 rotate2D(float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return mat2(c, -s, s, c);
}

float sdfCrescent(vec2 p, float outerR, float innerR, vec2 innerOffset) {
  float outer = length(p) - outerR;
  float inner = length(p - innerOffset) - innerR;
  return max(outer, -inner);
}

void main() {
  vec2 uv = vUv - 0.5;

  // State-driven properties
  float isThinking = step(3.0, uState) * (1.0 - step(4.0, uState));
  float isImagine = step(4.0, uState);
  float rotSpeed = 0.01047 * (1.0 + isThinking * 3.0);
  float noiseAmp = 0.04 * (1.0 + isImagine * 1.0);

  // Organic noise displacement
  float t = uTime * 0.15;
  float n1 = snoise(uv * 4.0 + t) * noiseAmp;
  float n2 = snoise(uv * 3.0 - t * 0.7 + vec2(5.3, 2.7)) * noiseAmp * 0.5;
  vec2 displaced = uv + vec2(n1, n2);

  // Gaze offset
  vec2 gaze = uGaze * 0.12;

  // Slow counter-rotation (60s per turn)
  float rot = uTime * rotSpeed;
  float baseAngle = 0.4363; // 25 degrees in radians

  // Crescent 1
  vec2 p1 = rotate2D(baseAngle + rot) * (displaced + gaze);
  float c1 = sdfCrescent(p1, 0.28, 0.20, vec2(0.115, 0.0));

  // Crescent 2 (counter-rotates)
  vec2 p2 = rotate2D(-baseAngle - rot) * (displaced - gaze);
  float c2 = sdfCrescent(p2, 0.28, 0.20, vec2(-0.115, 0.0));

  // Soft edges
  float sw = 0.015;
  float a1 = 1.0 - smoothstep(-sw, sw, c1);
  float a2 = 1.0 - smoothstep(-sw, sw, c2);

  // Fresnel glow at edges
  float g1 = smoothstep(0.0, 0.07, -c1) * (1.0 - a1);
  float g2 = smoothstep(0.0, 0.07, -c2) * (1.0 - a2);

  // Colors
  vec3 turquoise = vec3(0.369, 0.918, 0.831);
  vec3 cyan      = vec3(0.133, 0.827, 0.933);
  vec3 teal      = vec3(0.055, 0.647, 0.647);
  vec3 orange    = vec3(0.980, 0.573, 0.235);

  // Gradient along crescent shape
  float grad1 = clamp(p1.x * 2.0 + 0.5, 0.0, 1.0);
  float grad2 = clamp(p2.x * -2.0 + 0.5, 0.0, 1.0);
  vec3 col1 = mix(teal, turquoise, grad1);
  vec3 col2 = mix(cyan, teal, grad2);

  // Imagine mode: warm orange tint
  col1 = mix(col1, mix(turquoise, orange, 0.4), isImagine);
  col2 = mix(col2, mix(cyan, orange, 0.3), isImagine);

  // Additive composition
  vec3 glowColor = mix(turquoise, orange, isImagine * 0.5);
  vec3 finalColor = col1 * a1 * 0.75 + col2 * a2 * 0.75;
  finalColor += glowColor * (g1 + g2) * 1.8;

  // Amplitude reactivity
  float breathe = 1.0 + uAmplitude * 0.4;
  finalColor *= breathe;

  // Inner radial glow
  float innerGlow = exp(-length(uv) * 9.0) * 0.25;
  finalColor += glowColor * innerGlow;

  float alpha = clamp(a1 + a2 * 0.9 + (g1 + g2) * 0.4 + innerGlow, 0.0, 1.0);

  gl_FragColor = vec4(finalColor, alpha);
}
`
