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


Material silver() {
  vec3 aCol = vec3(0.19225);
  vec3 dCol = vec3(0.50754);
  vec3 sCol = vec3(0.50754);
  float a = 10.;
  float r = 0.4;
  return Material(aCol, dCol, sCol, a, r);
}



Material sidewalk() {
  vec3 aCol = vec3(0.20);
  vec3 dCol = vec3(0.7);
  vec3 sCol = 0.1 * vec3(1, 1, 1);
  float a = 2.;
  float r = 0.;
  return Material(aCol, dCol, sCol, a, r);
}

Material green() {
  vec3 aCol = vec3(0.1);
  vec3 dCol = vec3(0.05, 0.15, 0.05);
  vec3 sCol = vec3(0.);
  float a = 15.;
  float r = 0.;
  return Material(aCol, dCol, sCol, a, r);
}

Material darkGreen() {
  vec3 aCol = vec3(0.05, 0.25, 0.05);
  vec3 dCol = vec3(0.11, 0.25, 0.11);
  vec3 sCol = vec3(0);
  float a = 15.;
  float r = 0.;
  return Material(aCol, dCol, sCol, a, r);
}


Material road(vec3 p) {

  vec3 aCol = vec3(0.0);
  if(abs(p.x) <= 0.1)
  {
    if(3*mod(floor(p.z),3.0) > 0.0)
    {
        aCol = vec3(1.0,1.0,0);
    }
  }

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

Material brown() {
  vec3 aCol = 0.1 * vec3(0.56, 0.29, 0);
  vec3 dCol = 1 * vec3(0.56, 0.29, 0);
  vec3 sCol = vec3(0);
  float a = 1.;
  float r = 0.;
  return Material(aCol, dCol, sCol, a, r);
}

Material blackRubber() {
  vec3 aCol = vec3(0.02);
  vec3 dCol = vec3(0.01);
  vec3 sCol = vec3(0.1);
  float a = 2.;
  float r = 0.;
  return Material(aCol, dCol, sCol, a, r);
}

Material steel() {
  vec3 aCol = vec3(0.);
  vec3 dCol = vec3(0.2);
  vec3 sCol = vec3(0.1);
  float a = 2.;
  float r = 0.1;
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
//# shapes 
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


//regular torus
float sdTorus(vec3 p, vec2 t)
{
   
    vec2 q = (vec2(length(p.xz) - t.x, p.y));
    return length(q) - t.y;
}

float sdCappedCylinder( vec3 p, float h, float r )
{
  vec2 d = abs(vec2(length(p.xz),p.y)) - vec2(r,h);
  return min(max(d.x,d.y),0.0) + length(max(d,0.0));
}







//scene, basically adding stuff to this adds shapes to the scene
Surface sdScene(vec3 p)
{
    //background
    Surface roadBox = Surface(4, sdBox(p-vec3(0,-0.8, 0), vec3(2.5,0.8,100)), road(p));
    Surface sideWalk1 = Surface(4, sdBox(p - vec3(2.5,-2, 0), vec3(0.5,2.2,100)), sidewalk());
    Surface sideWalk2 = Surface(4, sdBox(p - vec3(-2.5,-2, 0), vec3(0.5,2.2,100)), sidewalk());
    Surface grass = Surface(1, p.y + 0.05,green());

    Surface res = opU(sideWalk1, sideWalk2);

    float boundingBox = sdBox(p - vec3(1,0,0), vec3(2.5,3,3));

    
     if(boundingBox < PRECISION ) 
     {
    //bike wheels
    Surface tire1 = Surface(1, sdTorus((p - vec3(1, 0.55, 1)) * rotateZ(3.14/2), vec2(0.5,0.1)),blackRubber()); 
    Surface wheel1 = Surface(1, sdCappedCylinder((p - vec3(1, 0.55, 1)) * rotateZ(3.14/2), 0.025, 0.5), silver());
    Surface tire2 = Surface(1, sdTorus((p - vec3(1, 0.55, -1)) * rotateZ(3.14/2), vec2(0.5,0.1)),blackRubber()); 
    Surface wheel2 = Surface(1, sdCappedCylinder((p - vec3(1, 0.55, -1)) * rotateZ(3.14/2), 0.025, 0.5), silver());

    //bike frame
    Surface frame1 = Surface(1, sdCappedCylinder((p - vec3(1, 1, 0.75)) * rotateX(3.14/6), 0.6, 0.11), red());
    Surface frame2 = Surface(1, sdCappedCylinder((p - vec3(1, 1.2, 0)) * rotateX((3.14 * 5)/9), 0.55, 0.11), red());
    Surface frame3 = Surface(1, sdCappedCylinder((p - vec3(1, 0.8, 0.2)) * rotateX((3.14 * 7)/9), 0.6, 0.11), red());
    Surface frame4 = Surface(1, sdCappedCylinder((p - vec3(1, 0.8, -0.45)) * rotateX(3.14*0.7/6), 0.6, 0.11), red());
    Surface frame5 = Surface(1, sdCappedCylinder((p - vec3(1, 0.92, -0.5)) * rotateX(3.14*0.7/6), 0.7, 0.075), steel());
    Surface frame6 = Surface(1, sdCappedCylinder((p - vec3(1, 0.83, -0.75)) * rotateX((3.14 * 7)/9), 0.4, 0.11), red());
    Surface frame7 = Surface(1, sdCappedCylinder((p - vec3(1, 0.4, -0.70)) * rotateX((3.14 * 3.5)/9), 0.41, 0.11), red());
    
    //bike seat
    Surface bikeSeat = Surface(1, sdBox(p - vec3(1, 1.6, -0.69), vec3(0.1,0.05,0.3)), blackRubber());
    

    //handles
    Surface handle1 = Surface(1, sdCappedCylinder((p - vec3(1, 1.4, 0.53)) * rotateX(3.14/6), 0.6, 0.075), steel());
    Surface handle2 = Surface(1, sdCappedCylinder((p - vec3(1, 1.9, 0.22)) * rotateZ((3.14)/2), 0.41, 0.09), steel());
    Surface handle3 = Surface(1, sdCappedCylinder((p - vec3(1.4, 1.9, 0.22)) * rotateZ((3.14)/2), 0.2, 0.1), blackRubber());
    Surface handle4 = Surface(1, sdCappedCylinder((p - vec3(0.6, 1.9, 0.22)) * rotateZ((3.14)/2), 0.2, 0.1), blackRubber());
    res = opU(res, tire1);
    res = opU(res, wheel1);
    res = opU(res, tire2);
    res = opU(res, wheel2);
    res = opU(res, frame1);
    res = opU(res, frame2);
    res = opU(res, frame3);
    res = opU(res, frame4);
    res = opU(res, frame5);
    res = opU(res, frame6);
    res = opU(res, frame7);
    res = opU(res, bikeSeat);
    res = opU(res, handle1);
    res = opU(res, handle2);
    res = opU(res, handle3);
    res = opU(res, handle4);
    }




    //tree tree
    Surface trunk = Surface(1, sdCappedCylinder((p - vec3(4., 1.4, -3)) * rotateX(3.14),3, 0.4), brown());
    Surface leaf1 = Surface(1, sdSphere((p - vec3(4., 4, -3)),1.5), darkGreen());
    Surface leaf2 = Surface(1, sdSphere((p - vec3(3.0, 3.7, -2.6)),0.7), darkGreen());
    Surface leaf3 = Surface(1, sdSphere((p - vec3(3.6, 4.8, -2.4)),0.9), darkGreen());
    Surface leaf4 = Surface(1, sdSphere((p - vec3(4.4, 3.5, -2.1)),0.8), darkGreen());


    
    res = opU(res, grass);
   
    res = opU(res, trunk);
    res = opU(res, leaf1);
    res = opU(res, leaf2);
    res = opU(res, leaf3);
    res = opU(res, leaf4);
    return opU(res, roadBox);
    
    
}


mat3 camera(vec3 cameraPos, vec3 lookAtPoint) {
	vec3 cd = normalize(lookAtPoint - cameraPos); // camera direction
	vec3 cr = normalize(cross(vec3(0, 1, 0), cd)); // camera right
	vec3 cu = normalize(cross(cd, cr)); // camera up
	
	return mat3(-cr, cu, -cd); // negative signs can be turned positive (or vice versa) to flip coordinate space conventions
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
    vec3 backgroundColor = vec3(0.52, 0.80, 0.92);
    
    vec3 lookatPoint = vec3(0, 2, 0); // lookat point (aka camera target)
    vec3 rayOrigin = vec3(8 * cos(time/4), 3,8* sin(time/4)); // ray origin that represents camera position
    vec3 rayDirection = camera(rayOrigin, lookatPoint) * normalize(vec3(uv, -1)); // ray direction


    Surface co = rayMarch(rayOrigin, rayDirection, MIN_DIST, MAX_DIST);

    vec3 col = vec3(0);
    vec3 col2 = vec3(0);

    if (co.sd > MAX_DIST) {
        col = backgroundColor;
    } else {
        
        vec3 p = rayOrigin + rayDirection * co.sd; // point on surface found by ray marching
        vec3 normal = calcNormal(p); // surface normal

        // light #1
        vec3 lightPosition1 = vec3(6,10, 0.5);
        vec3 lightDirection1 = normalize(lightPosition1 - p);
        float lightIntensity1 = 0.9;



        float softShadow1 = clamp(softShadow(p, lightDirection1, 0.002, 30),  0.4, 1.0);
        
        col = lightIntensity1 * phong(lightDirection1, normal, rayDirection, co.mat) * softShadow1 ;


        float refMod = 1.0 * co.mat.r;
            for(int i = 0; i < 100; i++)
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
            vec3 lightPosition3 = vec3(6,10, 0.5);
            vec3 lightDirection3 = normalize(lightPosition3 - p2);
            float lightIntensity3 = 0.2;


           float shadow = clamp(softShadow(p2 + normal2 *  PRECISION, lightDirection3, 0.002, 30), 0.4, 1.0);
          
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
        

        col = mix(col, backgroundColor, 1.0 - exp(-0.000001 * co.sd* co.sd* co.sd));
        col = pow(col, vec3(1.0/1.6)); // Gamma correction

    }


        frag_Color = vec4(col,1.0);
}