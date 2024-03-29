//Created by David Bates, Bodrul Babul, Andrew Garza, and Derek Stanford.

#include <GL/glew.h>
#include <GL/freeglut.h>
#include <glm/glm.hpp>
#include <glm/ext.hpp>

#include <iostream>
#include "shader.h"
#include "shaderprogram.h"
#include <ctime>
#include <vector>
/*=================================================================================================
	DOMAIN
=================================================================================================*/

// Window dimensions
const float InitWindowWidth  = 800; //x
const float InitWindowHeight = 800; //y
float WindowWidth  = InitWindowWidth; //x
float WindowHeight = InitWindowHeight; //y

// Last mouse cursor position
int LastMousePosX = 0;
int LastMousePosY = 0;

// Arrays that track which keys are currently pressed
bool key_states[256];
bool key_special_states[256];
bool mouse_states[8];

// Other parameters
bool draw_wireframe = false;

/*=================================================================================================
	SHADERS & TRANSFORMATIONS
=================================================================================================*/



ShaderProgram RayTracer1;
ShaderProgram RayTracer2;
ShaderProgram RayTracer3;
ShaderProgram RayTracer4;
ShaderProgram RayTracer5;

int curShad = 0;


glm::mat4 PerspProjectionMatrix( 1.0f );
glm::mat4 PerspViewMatrix( 1.0f );
glm::mat4 PerspModelMatrix( 1.0f );

float perspZoom = 1.0f, perspSensitivity = 0.35f;
float perspRotationX = 0.0f, perspRotationY = 0.0f;

/*=================================================================================================
	OBJECTS
=================================================================================================*/

//VAO -> the object "as a whole", the collection of buffers that make up its data
//VBOs -> the individual buffers/arrays with data, for ex: one for coordinates, one for color, etc.

GLuint axis_VAO;
GLuint axis_VBO[2];

float axis_vertices[] = {
	//front 
	-2.0f,  -2.0f,  -2.0f, 1.0f,
	2.0f,  -2.0f,  -2.0f, 1.0f,
	2.0f, 2.0f, -2.0f, 1.0f,

	-2.0f, 2.0f, -2.0f, 1.0f,
	- 2.0f,  -2.0f,  -2.0f, 1.0f,
	2.0f, 2.0f, -2.0f, 1.0f,
	//back
	2.0f,  -2.0f,  2.0f, 1.0f,
	-2.0f,  -2.0f,  2.0f, 1.0f,
	-2.0f, 2.0f, 2.0f, 1.0f,

	2.0f,  -2.0f,  2.0f, 1.0f,
	-2.0f, 2.0f, 2.0f, 1.0f,
	2.0f, 2.0f, 2.0f, 1.0f,

	//left
	- 2.0f,  -2.0f,  -2.0f, 1.0f,
	- 2.0f,  2.0f,  -2.0f, 1.0f,
	-2.0f,  -2.0f,  2.0f, 1.0f,

	-2.0f,  2.0f,  2.0f, 1.0f,
	-2.0f,  -2.0f,  2.0f, 1.0f,
	-2.0f,  2.0f,  -2.0f, 1.0f,
	//right
	2.0f,-2.0f,-2.0f,1.0f,
	2.0f,-2.0f,2.0f, 1.0f,
	2.0f,2.0f,2.0f,1.0f,

	2.0f,2.0f,-2.0f,1.0f,
	2.0f,-2.0f,-2.0f,1.0f,
	2.0f,2.0f,2.0f,1.0f,

	//bottom

	-2.0f,-2.0f,2.0f,1.0f,
	2.0f,-2.0f,2.0f,1.0f,
	2.0f,-2.0f,-2.0f,1.0f,

	-2.0f,-2.0f,2.0f,1.0f,
	2.0f,-2.0f,-2.0f,1.0f,
	-2.0f,-2.0f,-2.0f,1.0f,

	//top

	-2.0f,2.0f,-2.0f,1.0f,
	2.0f,2.0f,-2.0f,1.0f,
	2.0f,2.0f,2.0f,1.0f,

	-2.0f,2.0f,-2.0f,1.0f,
	2.0f,2.0f,2.0f,1.0f,
	-2.0f,2.0f,2.0f,1.0f,
};


float axis_colors[] = {
	//x axis
	1.0f, 0.0f, 0.0f, 1.0f,
	1.0f, 0.0f, 0.0f, 1.0f,
	1.0f, 0.0f, 0.0f, 1.0f,
	1.0f, 0.0f, 0.0f, 1.0f,
	1.0f, 0.0f, 0.0f, 1.0f,
	1.0f, 0.0f, 0.0f, 1.0f,
	1.0f, 0.0f, 0.0f, 1.0f,
	1.0f, 0.0f, 0.0f, 1.0f,
	1.0f, 0.0f, 0.0f, 1.0f,
	0.0f, 1.0f, 0.0f, 1.0f,
	0.0f, 0.0f,1.0f, 1.0f,
	0.0f, 1.0f, 0.0f, 1.0f,
	1.0f, 0.0f, 0.0f, 1.0f,
	0.0f, 0.0f,1.0f, 1.0f,
	1.0f, 0.0f, 0.0f, 1.0f,
	0.0f, 1.0f, 0.0f, 1.0f,
	0.0f, 0.0f,1.0f, 1.0f,
	1.0f, 0.0f, 0.0f, 1.0f,
	0.0f, 1.0f, 0.0f, 1.0f,
	0.0f, 0.0f,1.0f, 1.0f,
	1.0f, 0.0f, 0.0f, 1.0f,
	0.0f, 1.0f, 0.0f, 1.0f,
	0.0f, 0.0f,1.0f, 1.0f,
	1.0f, 0.0f, 0.0f, 1.0f,
	0.0f, 1.0f, 0.0f, 1.0f,
	0.0f, 0.0f,1.0f, 1.0f,
	1.0f, 0.0f, 0.0f, 1.0f,
	0.0f, 1.0f, 0.0f, 1.0f,
	0.0f, 0.0f,1.0f, 1.0f,
	1.0f, 0.0f, 0.0f, 1.0f,
	0.0f, 1.0f, 0.0f, 1.0f,
	0.0f, 0.0f,1.0f, 1.0f,
	1.0f, 0.0f, 0.0f, 1.0f,
	0.0f, 1.0f, 0.0f, 1.0f,
	0.0f, 0.0f,1.0f, 1.0f,
	1.0f, 0.0f, 0.0f, 1.0f,
	0.0f, 1.0f, 0.0f, 1.0f,
	0.0f, 0.0f,1.0f, 1.0f,
	1.0f, 0.0f, 0.0f, 1.0f,
	0.0f, 1.0f, 0.0f, 1.0f,
	0.0f, 0.0f,1.0f, 1.0f,
	1.0f, 0.0f, 0.0f, 1.0f,
	0.0f, 1.0f, 0.0f, 1.0f,
	0.0f, 0.0f,1.0f, 1.0f,
	1.0f, 0.0f, 0.0f, 1.0f,
	0.0f, 1.0f, 0.0f, 1.0f,
	0.0f, 0.0f,1.0f, 1.0f,
};


//Time for animation

std::clock_t start = std::clock();


/*=================================================================================================
	HELPER FUNCTIONS
=================================================================================================*/

void window_to_scene( int wx, int wy, float& sx, float& sy )
{
	sx = ( 2.0f * (float)wx / WindowWidth ) - 1.0f;
	sy = 1.0f - ( 2.0f * (float)wy / WindowHeight );
}

/*=================================================================================================
	SHADERS
=================================================================================================*/

void CreateTransformationMatrices( void )
{
	// PROJECTION MATRIX
	PerspProjectionMatrix = glm::perspective<float>( glm::radians( 60.0f ), (float)WindowWidth / (float)WindowHeight, 0.01f, 1000.0f );

	// VIEW MATRIX
	glm::vec3 eye(0.0, 0.0, 0.00000001);
	glm::vec3 center(0.0, 0.0, 0.0);
	glm::vec3 up(0.0, 1, 0.0);

	PerspViewMatrix = glm::lookAt( eye, center, up );

	// MODEL MATRIX
	PerspModelMatrix = glm::mat4( 1.0 );
	PerspModelMatrix = glm::rotate( PerspModelMatrix, glm::radians( perspRotationX ), glm::vec3( 1.0, 0.0, 0.0 ) );
	PerspModelMatrix = glm::rotate( PerspModelMatrix, glm::radians( perspRotationY ), glm::vec3( 0.0, 1.0, 0.0 ) );
	PerspModelMatrix = glm::scale( PerspModelMatrix, glm::vec3( perspZoom ) );
}

void CreateShaders(void)
{

	RayTracer1.Create("./shaders/raytracer.vert", "./shaders/raytracer1.frag");
	RayTracer2.Create("./shaders/raytracer.vert", "./shaders/raytracer2.frag");
	RayTracer3.Create("./shaders/raytracer.vert", "./shaders/raytracer3.frag");
	RayTracer4.Create("./shaders/raytracer.vert", "./shaders/raytracer4.frag");
	RayTracer5.Create("./shaders/raytracer.vert", "./shaders/raytracer5.frag");
}

/*=================================================================================================
	BUFFERS
=================================================================================================*/

void CreateAxisBuffers( void )
{
	glGenVertexArrays( 1, &axis_VAO ); //generate 1 new VAO, its ID is returned in axis_VAO
	glBindVertexArray( axis_VAO ); //bind the VAO so the subsequent commands modify it

	glGenBuffers( 2, &axis_VBO[0] ); //generate 2 buffers for data, their IDs are returned to the axis_VBO array

	// first buffer: vertex coordinates
	glBindBuffer( GL_ARRAY_BUFFER, axis_VBO[0] ); //bind the first buffer using its ID
	glBufferData( GL_ARRAY_BUFFER, sizeof( axis_vertices ), axis_vertices, GL_STATIC_DRAW ); //send coordinate array to the GPU
	glVertexAttribPointer( 0, 4, GL_FLOAT, GL_FALSE, 4 * sizeof( float ), (void*)0 ); //let GPU know this is attribute 0, made up of 4 floats
	glEnableVertexAttribArray( 0 );

	// second buffer: colors
	glBindBuffer( GL_ARRAY_BUFFER, axis_VBO[1] ); //bind the second buffer using its ID
	glBufferData( GL_ARRAY_BUFFER, sizeof( axis_colors ), axis_colors, GL_STATIC_DRAW ); //send color array to the GPU
	glVertexAttribPointer( 1, 4, GL_FLOAT, GL_FALSE, 4 * sizeof( float ), (void*)0 ); //let GPU know this is attribute 1, made up of 4 floats
	glEnableVertexAttribArray( 1 );

	glBindVertexArray( 0 ); //unbind when done

	//NOTE: You will probably not use an array for your own objects, as you will need to be
	//      able to dynamically resize the number of vertices. Remember that the sizeof()
	//      operator will not give an accurate answer on an entire vector. Instead, you will
	//      have to do a calculation such as sizeof(v[0]) * v.size().
}

//
//void CreateMyOwnObject( void ) ...
//

/*=================================================================================================
	CALLBACKS
=================================================================================================*/

//-----------------------------------------------------------------------------
// CALLBACK DOCUMENTATION
// https://www.opengl.org/resources/libraries/glut/spec3/node45.html
// http://freeglut.sourceforge.net/docs/api.php#WindowCallback
//-----------------------------------------------------------------------------

void idle_func()
{
	//uncomment below to repeatedly draw new frames
	glutPostRedisplay();
}

void reshape_func( int width, int height )
{
	WindowWidth  = width;
	WindowHeight = height;

	glViewport( 0, 0, width, height );
	glutPostRedisplay();
}

void keyboard_func( unsigned char key, int x, int y )
{
	key_states[ key ] = true;

	switch( key )
	{
		case 'w':
		{
			curShad++;
			if (curShad >= 5)
				curShad = 0;
			break;
		}

		// Exit on escape key press
		case '\x1B':
		{
			exit( EXIT_SUCCESS );
			break;
		}
	}
}



/*=================================================================================================
	RENDERING
=================================================================================================*/
glm::vec2 windowSize = { WindowWidth, WindowHeight };
void display_func( void )
{
	// Clear the contents of the back buffer
	glClear( GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT );

	// Update transformation matrices
	CreateTransformationMatrices();

	
	windowSize = { WindowWidth, WindowHeight };
	
	
	float inputTime = (std::clock() - start) / (float)(CLOCKS_PER_SEC);

	// Choose which shader to user, and send the transformation matrix information to it


	if (curShad == 0) {

		RayTracer1.Use();
		RayTracer1.SetUniform("projectionMatrix", glm::value_ptr(PerspProjectionMatrix), 4, GL_FALSE, 1);
		RayTracer1.SetUniform("viewMatrix", glm::value_ptr(PerspViewMatrix), 4, GL_FALSE, 1);
		RayTracer1.SetUniform("modelMatrix", glm::value_ptr(PerspModelMatrix), 4, GL_FALSE, 1);
		RayTracer1.SetUniform("windowSize", WindowWidth, WindowHeight);
		RayTracer1.SetUniform("time", inputTime);

	}

	if (curShad == 1) 
	{
		RayTracer2.Use();
		RayTracer2.SetUniform("projectionMatrix", glm::value_ptr(PerspProjectionMatrix), 4, GL_FALSE, 1);
		RayTracer2.SetUniform("viewMatrix", glm::value_ptr(PerspViewMatrix), 4, GL_FALSE, 1);
		RayTracer2.SetUniform("modelMatrix", glm::value_ptr(PerspModelMatrix), 4, GL_FALSE, 1);
		RayTracer2.SetUniform("windowSize", WindowWidth, WindowHeight);
		RayTracer2.SetUniform("time", inputTime);
	}

	if (curShad == 2)
	{
		
		RayTracer3.Use();
		RayTracer3.SetUniform("projectionMatrix", glm::value_ptr(PerspProjectionMatrix), 4, GL_FALSE, 1);
		RayTracer3.SetUniform("viewMatrix", glm::value_ptr(PerspViewMatrix), 4, GL_FALSE, 1);
		RayTracer3.SetUniform("modelMatrix", glm::value_ptr(PerspModelMatrix), 4, GL_FALSE, 1);
		RayTracer3.SetUniform("windowSize", WindowWidth, WindowHeight);
		RayTracer3.SetUniform("time", inputTime);
		
	}

	if (curShad == 3)
	{

		RayTracer4.Use();
		RayTracer4.SetUniform("projectionMatrix", glm::value_ptr(PerspProjectionMatrix), 4, GL_FALSE, 1);
		RayTracer4.SetUniform("viewMatrix", glm::value_ptr(PerspViewMatrix), 4, GL_FALSE, 1);
		RayTracer4.SetUniform("modelMatrix", glm::value_ptr(PerspModelMatrix), 4, GL_FALSE, 1);
		RayTracer4.SetUniform("windowSize", WindowWidth, WindowHeight);
		RayTracer4.SetUniform("time", inputTime);

	}
	if (curShad == 4)
	{

		RayTracer5.Use();
		RayTracer5.SetUniform("projectionMatrix", glm::value_ptr(PerspProjectionMatrix), 4, GL_FALSE, 1);
		RayTracer5.SetUniform("viewMatrix", glm::value_ptr(PerspViewMatrix), 4, GL_FALSE, 1);
		RayTracer5.SetUniform("modelMatrix", glm::value_ptr(PerspModelMatrix), 4, GL_FALSE, 1);
		RayTracer5.SetUniform("windowSize", WindowWidth, WindowHeight);
		RayTracer5.SetUniform("time", inputTime);

	}
	glBindVertexArray( axis_VAO );
	glDrawArrays( GL_TRIANGLES, 0, 48 ); // 6 = number of vertices in the object


	glBindVertexArray( 0 );

	// Swap the front and back buffers
	glutSwapBuffers();
}

/*=================================================================================================
	INIT
=================================================================================================*/

void init( void )
{
	// Print some info
	std::cout << "Vendor:         " << glGetString( GL_VENDOR   ) << "\n";
	std::cout << "Renderer:       " << glGetString( GL_RENDERER ) << "\n";
	std::cout << "OpenGL Version: " << glGetString( GL_VERSION  ) << "\n";
	std::cout << "GLSL Version:   " << glGetString( GL_SHADING_LANGUAGE_VERSION ) << "\n\n";

	// Set OpenGL settings
	glClearColor( 0.0f, 0.0f, 0.0f, 0.0f ); // background color
	glEnable( GL_DEPTH_TEST ); // enable depth test
	glEnable( GL_CULL_FACE ); // enable back-face culling

	// Create shaders
	CreateShaders();

	// Create axis buffers
	CreateAxisBuffers();



	std::cout << "Finished initializing...\n\n";
}

/*=================================================================================================
	MAIN
=================================================================================================*/

int main( int argc, char** argv )
{
	// Create and initialize the OpenGL context
	glutInit( &argc, argv );

	glutInitWindowPosition( 100, 100 );
	glutInitWindowSize( InitWindowWidth, InitWindowHeight );
	glutInitDisplayMode( GLUT_DOUBLE | GLUT_RGBA | GLUT_DEPTH );

	glutCreateWindow( "CSE-170 Computer Graphics" );

	// Initialize GLEW
	GLenum ret = glewInit();
	if( ret != GLEW_OK ) {
		std::cerr << "GLEW initialization error." << std::endl;
		glewGetErrorString( ret );
		return -1;
	}

	// Register callback functions
	glutDisplayFunc( display_func );
	glutIdleFunc( idle_func );
	glutReshapeFunc( reshape_func );
	glutKeyboardFunc( keyboard_func );


	// Do program initialization
	init();

	// Enter the main loop
	glutMainLoop();

	return EXIT_SUCCESS;
}
