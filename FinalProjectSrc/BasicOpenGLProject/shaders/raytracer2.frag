//Andrew Garza

#version 400

in vec4 gl_FragCoord;
in  vec4 vert_Color;


out vec4 frag_Color;


uniform vec2 windowSize;
uniform float time;


const int MAX_MARCHING_STEPS = 500;
const float MIN_DIST = 0.0;
const float MAX_DIST = 100.0;
const float PRECISION = 0.0001;


struct Material {
    vec3 ambientColor; // k_a * i_a
    vec3 diffuseColor; // k_d * i_d
    vec3 specularColor; // k_s * i_s
    float alpha; // shininess
    float r; //reflectiveness 
};

struct Surface {
  int id; // id of object
  float sd; // signed distance value from SDF
  Material mat; // material of object
};


Material blue() {
  vec3 aCol = 0.2 * vec3(0.11, 0.56, 1);
  vec3 dCol = vec3(0.11, 0.56, 1);
  vec3 sCol = 0.1 * vec3(1, 1, 1);
  float a = 2.;
  float r = 0.;
  return Material(aCol, dCol, sCol, a, r);
}

Material red() {
  vec3 aCol = 0.1 * vec3(0.56, 0.11, .11);
  vec3 dCol = 1 * vec3(0.56, 0.11, .11);
  vec3 sCol = 0.1 * vec3(1, 1, 1);
  float a = 15.;
  float r = 0.;
  return Material(aCol, dCol, sCol, a, r);
}


// Rotation matrix around the X axis.
mat3 rotateX(float theta) {
    float c = cos(theta);
    float s = sin(theta);
    return mat3(
        vec3(1, 0, 0),
        vec3(0, c, -s),
        vec3(0, s, c)
    );
}

// Rotation matrix around the Y axis.
mat3 rotateY(float theta) {
    float c = cos(theta);
    float s = sin(theta);
    return mat3(
        vec3(c, 0, s),
        vec3(0, 1, 0),
        vec3(-s, 0, c)
    );
}

// Rotation matrix around the Z axis.
mat3 rotateZ(float theta) {
    float c = cos(theta);
    float s = sin(theta);
    return mat3(
        vec3(c, -s, 0),
        vec3(s, c, 0),
        vec3(0, 0, 1)
    );
}



//modified min function that works with Surface structs
Surface opU(Surface sur1, Surface sur2)
{
    if (sur2.sd < sur1.sd) return sur2;
    return sur1;
}



//twisty torus
float sdTwisty( vec3 p, vec2 t)
{
  const float k = 2.0;
  float c = cos(k*p.y);
  float s = sin(k*p.y);
  mat2 m = mat2(c, -s,s,c);
  vec3 q = vec3(m*p.xz,p.y);
  vec2 q2 = vec2(length(q.xz) - t.x, q.y);
  return length(q2) - t.y;
}

float opRep( vec3 p, vec3 c, vec2 t)
{
    vec3 q = mod(p+0.5*c,c)-0.5*c;
    return sdTwisty( q ,t );
}



//scene, basically adding stuff to this adds shapes to the scene
Surface sdScene(vec3 p)
{    
    Surface tor1 = Surface(3, opRep((p - vec3(0, 1, -4.5)) * rotateX(time/5)* rotateY(time/5),vec3(3),vec2(.4,0.2)),red());
    return tor1; 
}


Surface rayMarch(vec3 rayOrigin, vec3 rayDirection, float start, float end)
{
    float depth = start;
    Surface co; // closest object

    for(int i = 0; i < MAX_MARCHING_STEPS; i++)
    {
        vec3 p = rayOrigin + depth * rayDirection;
        co = sdScene(p);
        depth += co.sd;        
        if(co.sd < PRECISION || depth > end) 
            break;
    }

    co.sd = depth;
    return co;
}

vec3 rayMarchIntersect(vec3 rayOrigin, vec3 rayDirection, float start, float end)
{
    float depth = start;
    Surface co; // closest object

    for(int i = 0; i < MAX_MARCHING_STEPS; i++)
    {
        vec3 p = rayOrigin + depth * rayDirection;
        co = sdScene(p);
        depth += co.sd;        
        if(co.sd < PRECISION || depth > end) 
            break;
    }

    
    return rayOrigin + depth * rayDirection;
}


vec3 calcNormal(in vec3 p) {
    vec2 e = vec2(1.0, -1.0) * PRECISION; // epsilon
    return normalize(
      e.xyy * sdScene(p + e.xyy).sd +
      e.yyx * sdScene(p + e.yyx).sd +
      e.yxy * sdScene(p + e.yxy).sd +
      e.xxx * sdScene(p + e.xxx).sd);
}

vec3 phong(vec3 lightDir, vec3 normal, vec3 rd, Material mat)
{
    // ambient
     vec3 ambient = mat.ambientColor;

    // diffuse
    float dotLN = clamp(dot(lightDir, normal), 0., 1.);
    vec3 diffuse = mat.diffuseColor * dotLN;

    // specular
    float dotRV = clamp(dot(reflect(lightDir, normal), -rd), 0., 1.);
    vec3 specular = mat.specularColor * pow(dotRV, mat.alpha);

    return ambient + diffuse + specular;
}

void main(void)
{
    vec2 uv = gl_FragCoord.xy/windowSize.xy - 0.5;
    uv.x = (uv.x) * (windowSize.x/windowSize.y);
    vec3 backgroundColor = vec3(1);

    vec3 col = vec3(0);
    vec3 col2 = vec3(0);
    vec3 rayOrigin = vec3(0, 0, 3); // ray origin that represents camera position
    vec3 rayDirection = normalize(vec3(uv, -1)); // ray direction

    Surface co = rayMarch(rayOrigin, rayDirection, MIN_DIST, MAX_DIST);

    if (co.sd > MAX_DIST) {
        col = backgroundColor;
    } else {
        
        vec3 p = rayOrigin + rayDirection * co.sd; // point on surface found by ray marching
        vec3 normal = calcNormal(p); // surface normal

        // light #1
        vec3 lightPosition1 = vec3(0,0, 0.0);
        vec3 lightDirection1 = normalize(lightPosition1 - p);
        float lightIntensity1 = 1;


        col = lightIntensity1 * phong(lightDirection1, normal, rayDirection, co.mat);
       
        float refMod = 1.0 * co.mat.r;
            for(int i = 0; i < 10; i++)
            {
            vec3 intersectPoint = rayMarchIntersect(rayOrigin, rayDirection, MIN_DIST, MAX_DIST);
            vec3 reflectDir = reflect(rayDirection, normal);
            
            Surface reflection = rayMarch(intersectPoint + normal * 0.001, reflectDir, MIN_DIST, MAX_DIST);
            if(reflection.sd > MAX_DIST)
            {
                break;
            }
            else
            {


            vec3 p2 = intersectPoint + reflectDir * reflection.sd;
            vec3 normal2 = calcNormal(p2);
            
             // light #1
            vec3 lightPosition3 = vec3(0,6, 0.5);
            vec3 lightDirection3 = normalize(lightPosition3 - p2);
            float lightIntensity3 = 1;
            


            col2 = lightIntensity3 * phong(lightDirection3, normal2, reflectDir, reflection.mat) ;


            
            col = mix(col, col2, refMod);

            rayOrigin = p2;
            rayDirection = reflectDir;
            normal = normal2;
            refMod *= reflection.mat.r;

            if (refMod == 0)
            {break;
            }
            }
        }
        

        col = mix(col, backgroundColor, 1.0 - exp(-0.000001 * co.sd * co.sd * co.sd));
        col = pow(col, vec3(1.0/1.1)); // Gamma correction

    }


        frag_Color = vec4(col,1.0);
}