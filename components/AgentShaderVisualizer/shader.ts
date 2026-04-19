// State → integer encoding. Keep in sync with index.tsx's stateToFloat().
// 0: not-joined, 1: joining, 2: ambient, 3: listening, 4: analyzing, 5: talking, 6: disconnected

export const vertSrc = /* glsl */ `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

// Fragment shader. Draws a centered, audio-reactive SDF blob with three-stop gradient fill.
// Keep cheap: 2-octave fbm, no ray marching, no loops on dynamic indices.
export const fragSrc = /* glsl */ `
precision mediump float;

varying vec2 v_uv;

uniform vec2  u_resolution;
uniform float u_time;
uniform float u_state;       // 0..6 (current)
uniform float u_prevState;   // 0..6 (previous)
uniform float u_stateT;      // 0..1 crossfade
uniform float u_bass;
uniform float u_mid;
uniform float u_treble;
uniform vec3  u_stop1;
uniform vec3  u_stop2;
uniform vec3  u_stop3;

// --- Noise helpers: 2D value noise + 2-octave fbm. Cheap and stable. ---
float hash(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  return 0.6 * valueNoise(p) + 0.3 * valueNoise(p * 2.07 + 1.3);
}

// Returns a per-state "profile" (baseRadius, edgeNoise, swirl, saturation).
vec4 stateProfile(float s) {
  // not-joined
  if (s < 0.5) return vec4(0.32, 0.02, 0.0, 0.55);
  // joining
  if (s < 1.5) return vec4(0.36, 0.05, 0.35, 0.70);
  // ambient
  if (s < 2.5) return vec4(0.38, 0.04, 0.0, 0.85);
  // listening
  if (s < 3.5) return vec4(0.40, 0.06, 0.1, 1.00);
  // analyzing
  if (s < 4.5) return vec4(0.38, 0.03, 0.8, 0.90);
  // talking
  if (s < 5.5) return vec4(0.42, 0.08, 0.2, 1.05);
  // disconnected
  return vec4(0.28, 0.01, 0.0, 0.25);
}

vec3 paletteRamp(float t) {
  // Smooth 3-stop ramp. t clamped elsewhere.
  vec3 a = mix(u_stop1, u_stop2, smoothstep(0.0, 0.55, t));
  return mix(a, u_stop3, smoothstep(0.5, 1.0, t));
}

void main() {
  // Square-aspect UV centered at 0.
  vec2 res = u_resolution;
  vec2 p = (v_uv * res - 0.5 * res) / min(res.x, res.y);

  // Rotate the sample for states with swirl (joining, analyzing).
  vec4 profCurr = stateProfile(u_state);
  vec4 profPrev = stateProfile(u_prevState);
  vec4 prof = mix(profPrev, profCurr, u_stateT);

  float swirl = prof.z;
  float ang = u_time * 0.35 * swirl;
  float ca = cos(ang), sa = sin(ang);
  vec2 pr = vec2(ca * p.x - sa * p.y, sa * p.x + ca * p.y);

  // Breathing: slow sine independent of audio, plus bass-driven radius pulse.
  float breathe = 0.03 * sin(u_time * 1.1);
  float radius = prof.x + breathe + u_bass * 0.10;

  // Edge noise: domain-warped fbm pulls the blob outline.
  vec2 noiseP = pr * 2.2 + vec2(u_time * 0.25, -u_time * 0.18);
  float n = fbm(noiseP) - 0.5;
  float edge = prof.y + u_treble * 0.22;

  float d = length(pr) - (radius + n * edge);

  // Fill: soft disk with smooth falloff. Inner gradient ramp driven by distance + mid band.
  float disk = smoothstep(0.01, -0.02, d);
  float halo = smoothstep(0.0, 0.10, -d + 0.12);
  float inner = clamp(length(pr) / max(radius, 0.001), 0.0, 1.0);
  float rampT = clamp(inner - u_mid * 0.25, 0.0, 1.0);
  vec3 col = paletteRamp(rampT);

  // Saturation / desaturation per state (disconnected → gray).
  float sat = prof.w;
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(lum), col, sat);

  // Composite disk + halo. Halo uses top palette for subtle rim light.
  float alpha = disk * 0.95 + halo * 0.15;
  vec3 rgb = col * (disk * 0.95) + u_stop3 * (halo * 0.15);

  gl_FragColor = vec4(rgb, alpha);
}
`;
