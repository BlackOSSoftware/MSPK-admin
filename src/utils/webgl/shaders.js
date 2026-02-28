export const CANDLE_VERTEX_SHADER = `#version 300 es
layout(location = 0) in vec2 a_position;      // Quad vertex (-0.5 to 0.5)
layout(location = 1) in float a_index;        // Candle Index (Instance ID really, but explicitly passed)
layout(location = 2) in float a_open;
layout(location = 3) in float a_high;
layout(location = 4) in float a_low;
layout(location = 5) in float a_close;

uniform vec2 u_resolution;
uniform vec2 u_translation; // (x_offset_pixels, y_offset_price)
uniform vec2 u_scale;       // (x_pixels_per_candle, y_pixels_per_price)
uniform float u_candleWidth;

out vec4 v_color;

void main() {
    float x_screen = (a_index * u_scale.x) + u_translation.x;
    
    // Y Calculation
    // We render Body or Wick?
    // Let's assume we render BODY here.
    float y_top = max(a_open, a_close);
    float y_bottom = min(a_open, a_close);
    float height = max(y_top - y_bottom, 0.00001); // Avoid 0 height
    float y_center = (y_top + y_bottom) / 2.0;

    // Apply Transformation
    // Position = Center + (Vertex * Size)
    // Vertex.y is -0.5 to 0.5. Height is price diff.
    // Screen Y = (Price - Y_Offset) * Scale_Y
    
    // We maximize logic to Vertex Shader
    
    float x_final = x_screen + (a_position.x * u_candleWidth);
    
    // Price to Screen Y
    float price = y_center + (a_position.y * height);
    float y_final = (price + u_translation.y) * u_scale.y;

    // Normalized Device Coordinates (-1 to 1)
    // Screen Coords are 0 to Width/Height (Bottom-Left origin usually or Top-Left)
    // Let's assume GL standard (-1, -1 bottom left).
    // We map 0..W, 0..H to -1..1
    
    vec2 clipSpace = (vec2(x_final, y_final) / u_resolution) * 2.0 - 1.0;
    
    gl_Position = vec4(clipSpace, 0, 1);
    
    // Color Logic
    if (a_close >= a_open) {
        v_color = vec4(0.06, 0.73, 0.5, 1.0); // Green #10b981
    } else {
        v_color = vec4(0.94, 0.27, 0.27, 1.0); // Red #ef4444
    }
}
`;

export const WICK_VERTEX_SHADER = `#version 300 es
layout(location = 0) in vec2 a_position; 
layout(location = 1) in float a_index;
layout(location = 2) in float a_open;
layout(location = 3) in float a_high;
layout(location = 4) in float a_low;
layout(location = 5) in float a_close;

uniform vec2 u_resolution;
uniform vec2 u_translation;
uniform vec2 u_scale;

out vec4 v_color;

void main() {
    float x_screen = (a_index * u_scale.x) + u_translation.x;
    
    // Wick uses High and Low
    float height = a_high - a_low;
    float y_center = (a_high + a_low) / 2.0;
    
    float x_final = x_screen + (a_position.x * 1.0); // 1px width usually
    float price = y_center + (a_position.y * height);
    float y_final = (price + u_translation.y) * u_scale.y;
    
    vec2 clipSpace = (vec2(x_final, y_final) / u_resolution) * 2.0 - 1.0;
    gl_Position = vec4(clipSpace, 0, 1);
    
    if (a_close >= a_open) {
        v_color = vec4(0.06, 0.73, 0.5, 1.0);
    } else {
        v_color = vec4(0.94, 0.27, 0.27, 1.0);
    }
}
`;

export const FRAGMENT_SHADER = `#version 300 es
precision mediump float;
in vec4 v_color;
out vec4 outColor;

void main() {
    outColor = v_color;
}
`;
