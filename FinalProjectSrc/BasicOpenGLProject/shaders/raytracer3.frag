//David Bates

#version 400

in vec4 gl_FragCoord;
in  vec4 vert_Color;


out vec4 frag_Color;


uniform vec2 windowSize;
uniform float time;


const int MAX_MARCHING_STEPS = 200;
const float MIN_DIST = 0.0;
const float MAX_DIST = 100.0;
const float PRECISION = 0.00001;

//vec3 colors
vec3 v3white = vec3(1, 1, 1);
vec3 v3purple = vec3(0.627, 0.125, 0.941);
vec3 v3pink = vec3(1.0,0.753,0.796);
vec3 v3blue = vec3(0.075,0.0,1.0);
vec3 v3brown = vec3(0.11, 0.56, 1);
vec3 v3green = vec3(0.031,0.78,0.584);
vec3 v3yellow = vec3(0.925,1.0,0.0);
vec3 v3teal = vec3(.0667,.9333,.7333);
vec3 v3orange = vec3(0, 0.35, 1);


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


Material checkerboard(vec3 p) {
  vec3 aCol = vec3(1. + 0.7*mod(floor(p.x) + floor(p.z), 2.0)) * 0.3;
  vec3 dCol = v3orange;
  vec3 sCol = v3blue;
  float a = 1.;
  float r = 0.;
  return Material(aCol, dCol, sCol, a, r);
}

Material blue() {
  vec3 aCol = 0.2 * v3brown;
  vec3 dCol = v3brown;
  vec3 sCol = 0.1 * v3white;
  float a = 2.;
  float r = 0.1;
  return Material(aCol, dCol, sCol, a, r);
}

Material white() {
  vec3 aCol = 0.1 * v3white;
  vec3 dCol = 1 * v3white;
  vec3 sCol = 0.1 * v3white;
  float a = 15.;
  float r = 0.;
  return Material(aCol, dCol, sCol, a, r);
}

Material purple() {
  vec3 aCol = 0.5 * v3purple;
  vec3 dCol = 0.6 * v3purple;
  vec3 sCol = 0.3 * v3white;
  float a = 15.;
  float r = 0.4;
  return Material(aCol, dCol, sCol, a, r);
}

Material pink() {
  vec3 aCol = 0.5 * v3pink;
  vec3 dCol = 0.6 * v3pink;
  vec3 sCol = 0.3 * v3white;
  float a = 15.;
  float r = 0.2;
  return Material(aCol, dCol, sCol, a, r);
}

Material teal() {
  vec3 aCol = 0.5 * v3teal;
  vec3 dCol = 0.6 * v3teal;
  vec3 sCol = 0.3 * v3white;
  float a = 15.;
  float r = 0.2;
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

// Identity matrix.
mat3 identity() {
    return mat3(
        vec3(1, 0, 0),
        vec3(0, 1, 0),
        vec3(0, 0, 1)
    );
}


//modified min function that works with Surface structs
Surface opU(Surface sur1, Surface sur2)
{
    if (sur2.sd < sur1.sd) return sur2;
    return sur1;
}


//##########
//# shapes #
//##########
float sdSphere( vec3 p, float r)
{
     return length(p) - r;
}

float sdPlane( vec3 p)
{
    return p.y + 1;

}

//regular box
float sdBox(vec3 p, vec3 boundaries)
{
    vec3 q = abs(p) - boundaries;    
    return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
}

    //p = (p - offset) * transform; for rotation



//regular torus
float sdTorus(vec3 p, vec2 t)
{
   
    vec2 q = (vec2(length(p.xz) - t.x, p.y));
    return length(q) - t.y;
}


//sphere with dent
float sdSphereDent( in vec3 p2, in float ra, float rb, in float d )
{
  // sampling independent computations (only depend on shape)
  float a = (ra*ra - rb*rb + d*d)/(2.0*d);
  float b = sqrt(max(ra*ra-a*a,0.0));
	
  // sampling dependant computations
  vec2 p = vec2( p2.x, length(p2.yz) );
  if( p.x*b-p.y*a > d*max(b-p.y,0.0) )
    return length(p-vec2(a,b));
  else
    return max( (length(p          )-ra),
               -(length(p-vec2(d,0))-rb));
}





//scene, basically adding stuff to this adds shapes to the scene
Surface sdScene(vec3 p)
{
    Surface leftSphereEye = Surface(1, sdSphereDent( (p - vec3(-0.6,1.4,-4)) * rotateY(1.5) * rotateY(cos(time * 3)) , 0.5, (-sin(4*time)/25 + .5), 0.8), pink());
    Surface rightSphereEye = Surface(2, sdSphereDent( (p - vec3(0.6,1.4,-4)) * rotateY(1.5) * rotateY(-1 * cos(time)) * rotateZ(sin(time * 10)), 0.5, 0.5, 0.8), purple());
    
    Surface torusMouth = Surface(3, sdTorus((p - vec3(0, 0.1, -4)) * rotateX(30) , vec2( (cos(5*time)/54 + .6), (-sin(10*time)/54 + .15))), blue()); //* (cos(time * 5) / 50 - 1)
    Surface torusFace = Surface(4, sdTorus((p - vec3(0, 1.1, -4)) * rotateX(30) , vec2( 1.95, (-sin(10*time)/54 + .15))), teal()); //* (cos(time * 5) / 50 - 1)

    Surface plane = Surface(5, sdPlane(p), checkerboard(p));

    Surface res = opU(leftSphereEye, rightSphereEye);
    res = opU(res, torusMouth);
    res = opU(res, torusFace);
    return opU(res, plane);
}











//i dont think anything under this has to be modified
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

float softShadow( vec3 ro, vec3 rd, float mint, float maxt )
{
  float res = 1.0;
  float t = mint;

  for(int i = 0; i < 200; i++) {
    float h = sdScene(ro + rd * t).sd;
      res = min(res, 10.0*h/t);
      t += clamp(h, 0.02, 0.10);
      if(h < 0.001 || t > maxt) break;
  }
    return res;
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
    vec3 backgroundColor = mix(v3pink, v3blue, uv.y);

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
        vec3 lightPosition1 = vec3(0,6, 0.5);
        vec3 lightDirection1 = normalize(lightPosition1 - p);
        float lightIntensity1 = 1;
      

        // final color of object


        float softShadow1 = clamp(softShadow(p, lightDirection1, 0.002, 10),  0.4, 1.0);
        

        col = lightIntensity1 * phong(lightDirection1, normal, rayDirection, co.mat) * softShadow1 ;
       
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
            


           float shadow = clamp(softShadow(p2 + normal2 *  PRECISION, lightDirection3, 0.002, 10), 0.4, 1.0);
          
            col2 = lightIntensity3 * phong(lightDirection3, normal2, reflectDir, reflection.mat) * shadow;


            
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
        

        //col = mix(col, backgroundColor, 1.0 - exp(-0.0002 * co.sd * co.sd * co.sd));
        //col = pow(col, vec3(1.0/1.1)); // Gamma correction

    }


        frag_Color = vec4(col,1.0);
}