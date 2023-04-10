#version 400

in vec4 gl_FragCoord;
in  vec4 vert_Color;


out vec4 frag_Color;


uniform vec2 windowSize;






vec3 circle(vec2 uv, float r, vec2 offset, vec3 currentColor, vec3 changeColor)
{
	float x = uv.x - offset.x;
	float y = uv.y - offset.y;


	float d = length(vec2(x,y))-r;

	return d > 0. ? currentColor : changeColor;
}




void main(void)
{
	
	vec2 uv = gl_FragCoord.xy/windowSize.xy;

	

	vec3 col = vec3(0.53, 0.8, 92 );

	if(uv.y < 0.5)
	col = vec3(0.6,0.6,0.6);


	col = circle(uv,0.2,vec2(0.5,0.5), col,vec3(0.3,0.3,0.3));

	col = circle(uv,0.03,vec2(0.6,0.6), col,vec3(0.9,0.9,0.9));


	frag_Color = vec4(col,1.0);
}




