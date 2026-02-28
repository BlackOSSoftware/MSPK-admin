import { CANDLE_VERTEX_SHADER, WICK_VERTEX_SHADER, FRAGMENT_SHADER } from './shaders';

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader Compile Error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function createProgram(gl, vsSource, fsSource) {
    const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        console.error('Program Link Error:', gl.getProgramInfoLog(prog));
        return null;
    }
    return prog;
}

export class WebGLChart {
    constructor(canvas, checkInteract) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl2', { alpha: true, antialias: false });
        if (!this.gl) throw new Error("WebGL 2 not supported");

        this.data = []; // Raw OHLC
        this.bufferData = new Float32Array(0);
        
        // View State
        this.view = {
            scaleX: 10,     // Pixels per candle
            translateX: 0,  // Pixel offset
            scaleY: 1,      // Pixels per price unit
            translateY: 0,  // Price offset
            width: canvas.width,
            height: canvas.height
        };

        this.interactions = { isDragging: false, lastX: 0, lastY: 0 };
        this.checkInteract = checkInteract; // Function to check if interaction allowed

        this.initGL();
        this.setupEvents();
        
        requestAnimationFrame(this.render.bind(this));
    }

    initGL() {
        const gl = this.gl;
        
        // Programs
        this.programs = {
            body: createProgram(gl, CANDLE_VERTEX_SHADER, FRAGMENT_SHADER),
            wick: createProgram(gl, WICK_VERTEX_SHADER, FRAGMENT_SHADER)
        };

        // Geometry (Standard Quad -0.5 to 0.5)
        const quad = new Float32Array([
            -0.5, -0.5,
             0.5, -0.5,
            -0.5,  0.5,
            -0.5,  0.5,
             0.5, -0.5,
             0.5,  0.5
        ]);

        // VAOs
        this.vao = {};
        
        // 1. Setup Body VAO
        this.vao.body = gl.createVertexArray();
        gl.bindVertexArray(this.vao.body);
        
        const posBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

        // Instance Buffer (Dynamic)
        this.instanceBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
        // Stride: Index(1) + Open(1) + High(1) + Low(1) + Close(1) = 5 floats * 4 bytes = 20 bytes
        const stride = 5 * 4;
        
        // Index
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 1, gl.FLOAT, false, stride, 0);
        gl.vertexAttribDivisor(1, 1);
        
        // Open
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 1, gl.FLOAT, false, stride, 4);
        gl.vertexAttribDivisor(2, 1);
        
        // High
        gl.enableVertexAttribArray(3);
        gl.vertexAttribPointer(3, 1, gl.FLOAT, false, stride, 8);
        gl.vertexAttribDivisor(3, 1);
        
        // Low
        gl.enableVertexAttribArray(4);
        gl.vertexAttribPointer(4, 1, gl.FLOAT, false, stride, 12);
        gl.vertexAttribDivisor(4, 1);
        
        // Close
        gl.enableVertexAttribArray(5);
        gl.vertexAttribPointer(5, 1, gl.FLOAT, false, stride, 16);
        gl.vertexAttribDivisor(5, 1);

        // 2. Setup Wick VAO (Shares Instance Buffer)
        this.vao.wick = gl.createVertexArray();
        gl.bindVertexArray(this.vao.wick);
        
        // Reuse Quad Geometry for Wick (will be scaled narrowly in shader)
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

        // Reuse Instance Buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
        
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 1, gl.FLOAT, false, stride, 0);
        gl.vertexAttribDivisor(1, 1); // Index
        
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 1, gl.FLOAT, false, stride, 4);
        gl.vertexAttribDivisor(2, 1); // Open
        
        gl.enableVertexAttribArray(3);
        gl.vertexAttribPointer(3, 1, gl.FLOAT, false, stride, 8);
        gl.vertexAttribDivisor(3, 1); // High
        
        gl.enableVertexAttribArray(4);
        gl.vertexAttribPointer(4, 1, gl.FLOAT, false, stride, 12);
        gl.vertexAttribDivisor(4, 1); // Low
        
        gl.enableVertexAttribArray(5);
        gl.vertexAttribPointer(5, 1, gl.FLOAT, false, stride, 16);
        gl.vertexAttribDivisor(5, 1); // Close

        gl.bindVertexArray(null);
    }

    setData(candles) {
        // Candles: { time, open, high, low, close }
        this.data = candles;
        
        // Flatten to Float32Array [Index, Open, High, Low, Close]
        const count = candles.length;
        this.bufferData = new Float32Array(count * 5);
        
        for (let i = 0; i < count; i++) {
            const c = candles[i];
            const offset = i * 5;
            this.bufferData[offset] = i;      // Index
            this.bufferData[offset + 1] = c.open;
            this.bufferData[offset + 2] = c.high;
            this.bufferData[offset + 3] = c.low;
            this.bufferData[offset + 4] = c.close;
        }

        const gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.bufferData, gl.DYNAMIC_DRAW);
        
        // Auto-Zoom to end
        this.view.translateX = -((count * this.view.scaleX) - this.view.width + 100); 
        this.autoScaleY();
    }

    resize(width, height) {
        this.view.width = width;
        this.view.height = height;
        this.canvas.width = width;
        this.canvas.height = height;
        this.gl.viewport(0, 0, width, height);
    }

    autoScaleY() {
        if (this.data.length === 0) return;
        
        // Find visible range
        const startIdx = Math.floor((-this.view.translateX) / this.view.scaleX);
        const countIdx = Math.ceil(this.view.width / this.view.scaleX);
        const endIdx = Math.min(startIdx + countIdx, this.data.length - 1);
        
        let min = Infinity, max = -Infinity;
        
        const effectiveStart = Math.max(0, startIdx);
        
        for (let i = effectiveStart; i <= endIdx; i++) {
            const c = this.data[i];
            if (c.low < min) min = c.low;
            if (c.high > max) max = c.high;
        }
        
        if (min === Infinity) return;

        // Add padding
        const padding = (max - min) * 0.1;
        min -= padding;
        max += padding;
        const range = max - min;
        
        this.view.scaleY = this.view.height / range;
        this.view.translateY = -min; // Offset in Price space
    }
    
    // Simple Interaction Logic
    pan(dx) {
        this.view.translateX += dx;
        // Limits
        const maxTrans = 100; 
        const minTrans = -((this.data.length * this.view.scaleX) - 50);
        
        // Allow some overscroll
        
        // Re-scale Y on pan
        this.autoScaleY();
    }
    
    zoom(delta, clientX) {
        const oldScale = this.view.scaleX;
        const newScale = Math.max(1, Math.min(100, oldScale * (1 - delta * 0.1)));
        
        // Zoom towards mouse
        // ScreenX = Index * Scale + Trans
        // We want ScreenX to stay same for Index under mouse
        // MouseX = I * OLD + T_OLD  => I = (Mouse - T_OLD) / OLD
        // MouseX = I * NEW + T_NEW  => T_NEW = Mouse - I * NEW
        
        // Mouse relative to canvas
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = clientX ? clientX - rect.left : this.view.width / 2;
        
        const indexUnderMouse = (mouseX - this.view.translateX) / oldScale;
        
        this.view.translateX = mouseX - (indexUnderMouse * newScale);
        this.view.scaleX = newScale;
        
        this.autoScaleY();
    }

    setupEvents() {
        const c = this.canvas;
        c.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.zoom(Math.sign(e.deltaY), e.clientX);
        });

        c.addEventListener('mousedown', (e) => {
            this.interactions.isDragging = true;
            this.interactions.lastX = e.clientX;
        });

        window.addEventListener('mouseup', () => {
             this.interactions.isDragging = false;
        });

        c.addEventListener('mousemove', (e) => {
            if (this.interactions.isDragging) {
                const dx = e.clientX - this.interactions.lastX;
                this.pan(dx);
                this.interactions.lastX = e.clientX;
            }
        });
        
        // Touch support basics
        c.addEventListener('touchstart', (e) => {
             if(e.touches.length === 1) {
                 this.interactions.isDragging = true;
                 this.interactions.lastX = e.touches[0].clientX;
             }
        });
        
        c.addEventListener('touchmove', (e) => {
             if(this.interactions.isDragging && e.touches.length === 1) {
                 e.preventDefault();
                 const dx = e.touches[0].clientX - this.interactions.lastX;
                 this.pan(dx);
                 this.interactions.lastX = e.touches[0].clientX;
             }
        });
    }

    render() {
        const gl = this.gl;
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.viewport(0, 0, this.view.width, this.view.height);
        
        if (this.data.length === 0) {
             requestAnimationFrame(this.render.bind(this));
             return;
        }

        // --- Draw Wicks ---
        gl.useProgram(this.programs.wick);
        
        // Uniforms
        const locResW = gl.getUniformLocation(this.programs.wick, 'u_resolution');
        const locTransW = gl.getUniformLocation(this.programs.wick, 'u_translation');
        const locScaleW = gl.getUniformLocation(this.programs.wick, 'u_scale');
        
        gl.uniform2f(locResW, this.view.width, this.view.height);
        gl.uniform2f(locTransW, this.view.translateX, this.view.translateY);
        gl.uniform2f(locScaleW, this.view.scaleX, this.view.scaleY);
        
        gl.bindVertexArray(this.vao.wick);
        gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, this.data.length);


        // --- Draw Bodies ---
        gl.useProgram(this.programs.body);

        const locResB = gl.getUniformLocation(this.programs.body, 'u_resolution');
        const locTransB = gl.getUniformLocation(this.programs.body, 'u_translation');
        const locScaleB = gl.getUniformLocation(this.programs.body, 'u_scale');
        const locWidthB = gl.getUniformLocation(this.programs.body, 'u_candleWidth');
        
        gl.uniform2f(locResB, this.view.width, this.view.height);
        gl.uniform2f(locTransB, this.view.translateX, this.view.translateY);
        gl.uniform2f(locScaleB, this.view.scaleX, this.view.scaleY);
        
        // Candle Width (Pixels) - Leave some gap
        const candlePixelWidth = Math.max(1, this.view.scaleX * 0.8);
        gl.uniform1f(locWidthB, candlePixelWidth);

        gl.bindVertexArray(this.vao.body);
        gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, this.data.length);

        requestAnimationFrame(this.render.bind(this));
    }
}
