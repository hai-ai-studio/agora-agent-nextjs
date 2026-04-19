// Minimal WebGL helper. Scope is deliberately narrow: one program, one full-screen quad,
// uniform bindings by name. No abstractions we don't use.

export type UniformValue =
  | { kind: 'f'; value: number }
  | { kind: 'v2'; value: [number, number] }
  | { kind: 'v3'; value: [number, number, number] };

export type GLContext = {
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  quadBuffer: WebGLBuffer;
  aPositionLoc: number;
  uniformLoc: (name: string) => WebGLUniformLocation | null;
  dispose: () => void;
};

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('createShader failed');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) ?? 'unknown';
    gl.deleteShader(shader);
    throw new Error(`Shader compile error: ${log}`);
  }
  return shader;
}

export function createGLContext(
  canvas: HTMLCanvasElement,
  vertSrc: string,
  fragSrc: string,
): GLContext {
  // Request a context that survives premultiplied-alpha blending so the canvas can sit on any bg.
  const gl =
    canvas.getContext('webgl', { premultipliedAlpha: true, antialias: true }) ??
    canvas.getContext('experimental-webgl', { premultipliedAlpha: true });
  if (!gl) throw new Error('WebGL not supported');

  const webgl = gl as WebGLRenderingContext;

  const vert = compileShader(webgl, webgl.VERTEX_SHADER, vertSrc);
  const frag = compileShader(webgl, webgl.FRAGMENT_SHADER, fragSrc);
  const program = webgl.createProgram();
  if (!program) throw new Error('createProgram failed');
  webgl.attachShader(program, vert);
  webgl.attachShader(program, frag);
  webgl.linkProgram(program);
  if (!webgl.getProgramParameter(program, webgl.LINK_STATUS)) {
    const log = webgl.getProgramInfoLog(program) ?? 'unknown';
    throw new Error(`Program link error: ${log}`);
  }
  // Shaders are retained by the linked program; safe to delete the source objects.
  webgl.deleteShader(vert);
  webgl.deleteShader(frag);

  const aPositionLoc = webgl.getAttribLocation(program, 'a_position');
  const quadBuffer = webgl.createBuffer();
  if (!quadBuffer) throw new Error('createBuffer failed');
  webgl.bindBuffer(webgl.ARRAY_BUFFER, quadBuffer);
  // Full-screen triangle strip covering clip space [-1,1]^2.
  webgl.bufferData(
    webgl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    webgl.STATIC_DRAW,
  );

  const uniformCache = new Map<string, WebGLUniformLocation | null>();
  const uniformLoc = (name: string) => {
    if (!uniformCache.has(name)) {
      uniformCache.set(name, webgl.getUniformLocation(program, name));
    }
    return uniformCache.get(name) ?? null;
  };

  const dispose = () => {
    webgl.deleteBuffer(quadBuffer);
    webgl.deleteProgram(program);
  };

  return { gl: webgl, program, quadBuffer, aPositionLoc, uniformLoc, dispose };
}

export function setUniforms(ctx: GLContext, values: Record<string, UniformValue>) {
  const { gl, uniformLoc } = ctx;
  for (const [name, u] of Object.entries(values)) {
    const loc = uniformLoc(name);
    if (!loc) continue;
    switch (u.kind) {
      case 'f':
        gl.uniform1f(loc, u.value);
        break;
      case 'v2':
        gl.uniform2f(loc, u.value[0], u.value[1]);
        break;
      case 'v3':
        gl.uniform3f(loc, u.value[0], u.value[1], u.value[2]);
        break;
    }
  }
}

export function drawQuad(ctx: GLContext) {
  const { gl, aPositionLoc, quadBuffer } = ctx;
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
  gl.enableVertexAttribArray(aPositionLoc);
  gl.vertexAttribPointer(aPositionLoc, 2, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

// Resize the canvas backing store to match CSS size × DPR, clamped to 2× to keep shader cost bounded.
export function resizeToDisplaySize(canvas: HTMLCanvasElement): boolean {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cssWidth = canvas.clientWidth;
  const cssHeight = canvas.clientHeight;
  const width = Math.max(1, Math.round(cssWidth * dpr));
  const height = Math.max(1, Math.round(cssHeight * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
    return true;
  }
  return false;
}
