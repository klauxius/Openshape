import React, { useEffect, useRef, useState } from 'react'

export default function WebGLTest() {
  const canvasRef = useRef(null)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    try {
      // Get the WebGL context
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      
      if (!gl) {
        throw new Error('WebGL not supported')
      }
      
      // Set clear color to black, fully opaque
      gl.clearColor(0.0, 0.0, 0.0, 1.0)
      // Clear the color buffer with specified clear color
      gl.clear(gl.COLOR_BUFFER_BIT)
      
      // Create a simple triangle
      const vertices = [
        0.0, 0.5, 0.0,    // Top
        -0.5, -0.5, 0.0,  // Bottom left
        0.5, -0.5, 0.0    // Bottom right
      ]
      
      // Create and bind a buffer
      const vertexBuffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)
      
      // Create vertex shader
      const vertexShaderSource = `
        attribute vec3 coordinates;
        void main(void) {
          gl_Position = vec4(coordinates, 1.0);
        }
      `
      
      // Create fragment shader
      const fragmentShaderSource = `
        precision mediump float;
        void main(void) {
          gl_FragColor = vec4(0.0, 0.8, 0.0, 1.0); // Green color
        }
      `
      
      // Create shaders
      const vertexShader = gl.createShader(gl.VERTEX_SHADER)
      gl.shaderSource(vertexShader, vertexShaderSource)
      gl.compileShader(vertexShader)
      
      const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
      gl.shaderSource(fragmentShader, fragmentShaderSource)
      gl.compileShader(fragmentShader)
      
      // Create and use the shader program
      const shaderProgram = gl.createProgram()
      gl.attachShader(shaderProgram, vertexShader)
      gl.attachShader(shaderProgram, fragmentShader)
      gl.linkProgram(shaderProgram)
      gl.useProgram(shaderProgram)
      
      // Connect the vertex buffer to the shader
      const coord = gl.getAttribLocation(shaderProgram, "coordinates")
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
      gl.vertexAttribPointer(coord, 3, gl.FLOAT, false, 0, 0)
      gl.enableVertexAttribArray(coord)
      
      // Draw the triangle
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      
      console.log('WebGL triangle rendered successfully')
      setSuccess(true)
    } catch (err) {
      console.error('WebGL test failed:', err)
      setError(err.message)
    }
  }, [])
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>WebGL Basic Test</h1>
      <p>This page tests if basic WebGL functionality is working in your browser.</p>
      
      {error && (
        <div style={{ padding: '10px', background: '#ffeeee', border: '1px solid #ffaaaa', marginBottom: '15px' }}>
          <h3>WebGL Error:</h3>
          <p>{error}</p>
        </div>
      )}
      
      {success && (
        <div style={{ padding: '10px', background: '#eeffee', border: '1px solid #aaffaa', marginBottom: '15px' }}>
          <h3>Success!</h3>
          <p>Basic WebGL is working. You should see a green triangle below.</p>
        </div>
      )}
      
      <div style={{ width: '600px', height: '400px', border: '1px solid #ccc' }}>
        <canvas 
          ref={canvasRef} 
          width={600} 
          height={400} 
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <h3>What This Means:</h3>
        <p>If you see a green triangle, your browser supports WebGL and should be able to run the JSCAD Fiber library.</p>
        <p>If you don't see a triangle or get an error, there might be an issue with your browser's WebGL support.</p>
      </div>
    </div>
  )
} 