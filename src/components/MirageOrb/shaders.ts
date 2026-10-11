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
uniform float uState;
varying vec2 vUv;

vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
float noise(vec2 v) {
  const vec4 C = vec4(0.2113248654, 0.3660254038, -0.5773502692, 0.0243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = x0.x > x0.y ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m *= m; m *= m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.7928429 - 0.8537347 * (a0*a0 + h*h);
  vec3 g;
  g.x = a0.x*x0.x + h.x*x0.y;
  g.yz = a0.yz*x12.xz + h.yz*x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vec2 p = vUv - 0.5;
  float radius = length(p) * 2.0;
  float angle = atan(p.y, p.x);
  float t = uTime * (0.32 + uAmplitude * 0.8);
  float deformation = (0.015 + 0.09 * uAmplitude) *
    (sin(angle * 2.0 + t) + 0.6 * sin(angle * 3.0 - t * 1.3) + 0.35 * sin(angle * 5.0 + t * 0.7));
  float edge = 0.416 + deformation * 0.5;
  float circle = 1.0 - smoothstep(edge - fwidth(radius), edge + fwidth(radius), radius);
  float n1 = noise(p * 3.0 + vec2(t, -t * 0.7)) * 0.5 + 0.5;
  float n2 = noise(p * 5.0 - vec2(t * 0.8, t * 0.4)) * 0.5 + 0.5;
  float n3 = noise(p * 8.0 + vec2(-t * 0.4, t)) * 0.5 + 0.5;
  vec3 turquoise = vec3(0.369, 0.918, 0.831);
  vec3 cyan = vec3(0.133, 0.827, 0.933);
  vec3 teal = vec3(0.055, 0.647, 0.647);
  vec3 blue = vec3(0.118, 0.251, 0.690);
  vec3 white = vec3(0.956, 0.961, 0.969);
  vec3 color = turquoise * n1 + cyan * n2 * 0.75 + teal * n3 * 0.6 + blue * 0.16;
  float core = exp(-length(p) * 8.0);
  color += white * core * (0.18 + uAmplitude * 0.16);
  float rim = smoothstep(0.36, 0.416, radius) * (0.55 + 0.2 * sin(uTime * 0.8 + angle));
  color += turquoise * rim * 0.8;
  float brightness = uState > 1.5 ? 1.0 : 1.0 + 0.08 * sin(uTime * 1.57);
  gl_FragColor = vec4(color * brightness, circle);
}
`
