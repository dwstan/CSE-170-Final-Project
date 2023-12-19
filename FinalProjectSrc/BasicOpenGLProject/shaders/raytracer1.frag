//Derek Stanford

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

Material gold() {
  vec3 aCol = vec3(0.25, 0.2, 0.075);
  vec3 dCol = vec3(0.75, 0.61, 0.226);
  vec3 sCol = vec3(0.63, 0.56, 0.07);
  float a = 20.;
  float r = 0.4;

  return Material(aCol, dCol, sCol, a, r);
}

Material silver() {
  vec3 aCol = vec3(0.25);
  vec3 dCol = vec3(0.4);
  vec3 sCol = vec3(0.774597);
  float a = 10.;
  float r = 0.4;
  return Material(aCol, dCol, sCol, a, r);
}

Material mirror() {
  vec3 aCol = vec3(0);
  vec3 dCol = vec3(0);
  vec3 sCol = vec3(0.8);
  float a = 10.;
  float r = 0.8;
  return Material(aCol, dCol, sCol, a, r);
}


Material copper() {
  vec3 aCol = vec3(0.19,0.07,0.02);
  vec3 dCol = vec3(0.7,0.27,0.08);
  vec3 sCol = 1 * vec3(0.26,0.14,0.09);
  float a = 1;
  float r = 0.128;
  return Material(aCol, dCol, sCol, a, r);
}


Material blue() {
  vec3 aCol = 0.2 * vec3(0.11, 0.56, 1);
  vec3 dCol = vec3(0.11, 0.56, 1);
  vec3 sCol = 0.1 * vec3(1, 1, 1);
  float a = 2.;
  float r = 0.;
  return Material(aCol, dCol, sCol, a, r);
}

Material green() {
  vec3 aCol = 0.5 * vec3(0.11, 0.56, 0.11);
  vec3 dCol = 0.6 * vec3(0.11, 0.56, 0.11);
  vec3 sCol = 0.3 * vec3(1, 1, 1);
  float a = 15.;
  float r = 0.;
  return Material(aCol, dCol, sCol, a, r);
}


Material checkerboard(vec3 p) {
  vec3 aCol = vec3(1. + 0.7*mod(floor(p.x) + floor(p.z), 2.0)) * 0.3;
  vec3 dCol = vec3(0.3);
  vec3 sCol = vec3(0);
  float a = 1.;
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

Material white() {
  vec3 aCol = 0.1* vec3(1.);
  vec3 dCol = .7 * vec3(1.);
  vec3 sCol = vec3(0);
  float a = 1.;
  float r = 0;
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


//#################
//# shapes  #
//#################
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

float sdTwisty( vec3 p, vec2 t)
{
  const float k = 12.0;
  float c = cos(k*p.y);
  float s = sin(k*p.y);
  mat2 m = mat2(c, -s,s,c);
  vec3 q = vec3(m*p.xz,p.y);
  vec2 q2 = vec2(length(q.xz) - t.x, q.y);
  return length(q2) - t.y;
} 



//scene, basically adding stuff to this adds shapes to the scene
Surface sdScene(vec3 p)
{
    Surface plane1 = Surface(4, sdPlane(p), white());
    Surface plane2 = Surface(3, p.x+1, white());
    Surface rightBox = Surface(2, sdBox(p - vec3(2.0,0.0,0.0), vec3(1,1,6)), green());  
    Surface leftBox = Surface(2, sdBox(p + vec3(2.0,0.0,0.0), vec3(1,1,6)), red());
    Surface topBox = Surface(2, sdBox(p - vec3(0.0,2.0,0.0), vec3(1,1,6)), white());
    Surface backBox = Surface(2, sdBox(p - vec3(0.0,0.0,-2.0), vec3(1)), white());
    Surface bottomBox = Surface(2, sdBox(p - vec3(0.0,-2.0,0.0), vec3(1,1,6)), white());
    Surface otherBackBox = Surface(2, sdBox(p - vec3(0.0,0.0,5.0), vec3(1)), white());
    Surface mirrorBox = Surface(2, sdBox(p - vec3(1.49,-0.6,0.5), vec3(0.5)), mirror());
    Surface mirrorBox2 = Surface(2, sdBox(p - vec3(-1.49,-0.6,0.5), vec3(0.5)), mirror());

    Surface spinBox = Surface(2, sdBox((p - vec3(0.45,-0.6, -0.3)) * rotateX(time) * rotateZ(-time) * rotateY(time),vec3(0.1)), copper());
    Surface sphere = Surface(1,sdSphere(p-vec3(-0.6,-0.75,-0.4 * sin(time)),0.25),gold());
    Surface tor1 = Surface(3, sdTorus((p - vec3(0, -0.70, -0.4)) * rotateX(time) * rotateZ(time),vec2(.2,0.1)), blue());

    //Surface twist = Surface(1, sdTwisty((p - vec3(0, -0.70, -0.4))* rotateY(time), vec2(.2,0.1)), blue());



    Surface res = opU(leftBox, rightBox);
    res = opU(res, topBox);
    res = opU(res, backBox);
    res = opU(res, spinBox);
    res = opU(res, sphere);
    res = opU(res, tor1);
    res = opU(res, otherBackBox);
    res = opU(res, mirrorBox);
    res = opU(res, mirrorBox2);
    return opU(res, bottomBox);
    
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
      res = min(res, 8.0*h/t);
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
    vec3 backgroundColor = vec3(0.8);

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
        vec3 lightPosition1 = vec3(0,0.9, 0.5);
        vec3 lightDirection1 = normalize(lightPosition1 - p);
        float lightIntensity1 = .8;
      

        // final color of object


        float softShadow1 = clamp(softShadow(p, lightDirection1, 0.002, 1),  0.4, 1.0);
        

        col = lightIntensity1 * phong(lightDirection1, normal, rayDirection, co.mat) * softShadow1 ;
       
        float refMod = 1.0 * co.mat.r;
            for(int i = 0; i < 100; i++)
            {
            vec3 intersectPoint = rayMarchIntersect(rayOrigin, rayDirection, MIN_DIST, MAX_DIST);
            vec3 reflectDir = reflect(rayDirection, normal);
            
            Surface reflection = rayMarch(intersectPoint + normal * 0.001, reflectDir, MIN_DIST, MAX_DIST);
            if(reflection.sd > MAX_DIST)
            {
                col = mix(col,backgroundColor, refMod);
            }
            else
            {


            vec3 p2 = intersectPoint + reflectDir * reflection.sd;
            vec3 normal2 = calcNormal(p2);
            
             // light #1
            vec3 lightPosition3 = vec3(0,0.9, 0.5);
            vec3 lightDirection3 = normalize(lightPosition3 - p2);
            float lightIntensity3 = .8;
            


           float shadow = clamp(softShadow(p2 + normal2 *  PRECISION, lightDirection3, 0.002, 1), 0.4, 1.0);
          
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
        
        //col = mix(col, backgroundColor, 1.0 - exp(-0.0011 * co.sd * co.sd));
        col = pow(col, vec3(1.0/1.4)); // Gamma correction

    }


        frag_Color = vec4(col,1.0);
}