import * as THREE from "three";
import * as dat from 'dat.gui';
import Stats from "three/examples/jsm/libs/stats.module";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { createCamera, createRenderer, runApp, updateLoadingProgressBar } from "./core-utils";
import { loadTexture } from "./common-utils";
import { quizData } from "./quizQuestions";
import worldgen_1 from "./assets/worldgen_1.gif";
import worldgen_2 from "./assets/worldgen_2.gif";
import worldgen_3 from "./assets/worldgen_3.gif";
import worldgen_4 from './assets/worldgen_4.gif';
import worldgen_5 from './assets/worldgen_5.gif';

global.THREE = THREE;
THREE.ColorManagement.enabled = true;

const params = {
  sunIntensity: 2, // brightness of the sun
  speedFactor: 20, // rotation speed of the earth
};

// Create the scene
let scene = new THREE.Scene();
let renderer = createRenderer({ antialias: true }, (_renderer) => {
  _renderer.outputColorSpace = THREE.sRGBEncoding;
});

// Create the camera
let camera = createCamera(45, 1, 1000, { x: 0, y: 0, z: 80 });

let app = {
  async initScene() {
    // OrbitControls
    this.controls = new OrbitControls(camera, renderer.domElement);
    this.controls.enableDamping = true;

    // adding a virtual sun using directional light
    this.dirLight = new THREE.DirectionalLight(0xffffff, params.sunIntensity);
    this.dirLight.position.set(-100, 100, 100);
    scene.add(this.dirLight);

    // updates the progress bar to 10% on the loading UI
    await updateLoadingProgressBar(0.1);

    // loads earth's color map, the basis of how our earth looks like
    const planetTexture = await loadTexture(worldgen_1);
    planetTexture.encoding = THREE.sRGBEncoding; // Set texture encoding
    await updateLoadingProgressBar(0.2);

    this.group = new THREE.Group();
    this.group.rotation.z = 23.5 / 360 * 2 * Math.PI;

    let earthGeo = new THREE.SphereGeometry(10, 64, 64);
    let earthMat = new THREE.MeshStandardMaterial({
      map: planetTexture,
      color: '#8333FF'
    });
    earthMat.roughness = 1;
    earthMat.metalness = 0.1;
    this.earth = new THREE.Mesh(earthGeo, earthMat);
    this.group.add(this.earth);

    // set initial rotational position of earth to get a good initial angle
    this.earth.rotateY(-0.3);

    scene.add(this.group);

    // GUI controls
    const gui = new dat.GUI();
    this.stats1 = new Stats();
    this.stats1.domElement.style.cssText = "position:absolute;top:0px;left:0px;"

    // Add a button to change the color of the Earth
    const colors = ['#8333FF', '#C80000', '#67D21F', '#1FD1D2', '#D2CA1F'];
    let colorIndex = 1; // Track the current color index

// Add a button to change the color of the Earth
const planetColorButton = {
  ChangeColor: () => {
    // Get the next color from the colors array
    const color = colors[colorIndex];
    // Set the Earth's material color to the next color
    this.earth.material.color.set(color);
    // Update shadow color of quiz container
    updateQuizContainerShadowColor(color);
    // Update background color of submit button
    updateSubmitButtonBackgroundColor(color);
    updateSelectedOptionBackgroundColor(color)
    // Increment the colorIndex or loop back to the beginning
    colorIndex = (colorIndex + 1) % colors.length;
  }
};
gui.add(planetColorButton, 'ChangeColor').name('Change Planet Color');

// Function to update the shadow color of the quiz container
function updateQuizContainerShadowColor(color) {
  const quizContainer = document.getElementById('quiz-container');
  quizContainer.style.boxShadow = `0 0 10px rgba(${getRGBValues(color)}, 0.8)`;
}

function updateSubmitButtonBackgroundColor(color) {
  const submitButton = document.getElementById('submit-btn');
  submitButton.style.backgroundColor = color;
}

function updateSelectedOptionBackgroundColor(color) {
  const selectedOption = document.querySelector('.option.selected');
  if (selectedOption) {
    selectedOption.style.backgroundColor = color;
  }
}

// Function to get RGB values from hex color
function getRGBValues(hex) {
  const hexValue = hex.replace('#', '');
  return `${parseInt(hexValue.substring(0, 2), 16)}, ${parseInt(hexValue.substring(2, 4), 16)}, ${parseInt(hexValue.substring(4, 6), 16)}`;
}

    // Add a button to change the texture of the Earth
    const textures = [worldgen_1, worldgen_2, worldgen_3, worldgen_4, worldgen_5]; // List of texture paths
    let textureIndex = 0; // Track the current texture index

    // Function to change the texture of the Earth in a circular manner
    const changeTexture = async () => {
      textureIndex = (textureIndex + 1) % textures.length;
      const newTexture = await loadTexture(textures[textureIndex]);
      this.earth.material.map = newTexture;
      this.earth.material.needsUpdate = true;
    };
    gui.add({ ChangeTexture: changeTexture }, 'ChangeTexture').name('Change Planet Texture');

    await updateLoadingProgressBar(1.0, 100)
  },

  // @param {number} interval - time elapsed between 2 frames
  // @param {number} elapsed - total time elapsed since app start
  updateScene(interval, elapsed) {
    this.controls.update();
    this.stats1.update();

    // use rotateY instead of rotation.y so as to rotate by axis Y local to each mesh
    this.earth.rotateY(interval * 0.005 * params.speedFactor);
  }
};

// Function to render the quiz
function renderQuiz() {
  const quizContainer = document.getElementById('quiz-container');
  const questionElement = document.getElementById('question');
  const optionsContainer = document.getElementById('options-container');
  const submitButton = document.getElementById('submit-btn');
  const resultElement = document.getElementById('result');

  let currentQuestionIndex = 0;
  let score = 0;

  function showQuestion() {
    const currentQuestion = quizData[currentQuestionIndex];
    questionElement.textContent = currentQuestion.question;

    optionsContainer.innerHTML = '';
    currentQuestion.options.forEach((option, index) => {
      const optionElement = document.createElement('div');
      optionElement.classList.add('option');
      optionElement.textContent = `${index + 1}. ${option}`;
      optionElement.addEventListener('click', () => {
        const selectedAnswer = currentQuestion.options[index];

        // Remove 'selected' class from previously selected options
        document.querySelectorAll('.option').forEach((el) => {
          el.classList.remove('selected');
        });

        // Add 'selected' class to the clicked option
        optionElement.classList.add('selected');

        // Store the selected answer for checking upon submit
        optionElement.dataset.selectedAnswer = selectedAnswer;
      });
      optionsContainer.appendChild(optionElement);
    });
  }

  function showResult() {
    quizContainer.style.display = 'none';
    resultElement.textContent = `You scored ${score} out of ${quizData.length}`;
  }

  submitButton.addEventListener('click', () => {
    // Get the selected answer from the last clicked option
    const selectedAnswer = optionsContainer.querySelector('.option.selected')?.dataset.selectedAnswer;

    if (selectedAnswer && selectedAnswer !== quizData[currentQuestionIndex].correctAnswer) {
      // Animate impact from a random direction only for wrong answers
      animateImpactFromRandomDirection();
    }

    currentQuestionIndex++;
    if (currentQuestionIndex < quizData.length) {
      showQuestion();
    } else {
      showResult();
    }
  });

  showQuestion();
}


// Function to animate the impact on the planet from a random direction
function animateImpactFromRandomDirection() {
  const impactSphere = new THREE.Mesh(
    new THREE.SphereGeometry(1, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
  );

  // Set initial random position outside the view
  const initialDistance = 50; // Distance from the planet
  const randomDirection = new THREE.Vector3(
    Math.random() - 0.5,
    Math.random() - 0.5,
    Math.random() - 0.5
  ).normalize();
  impactSphere.position.copy(randomDirection.multiplyScalar(initialDistance));

  // Animate the sphere's movement towards the planet
  const targetPosition = app.earth.position.clone();
  const animationDuration = 3000; // Animation duration in milliseconds
  const animationStartTime = Date.now();

  function updateAnimation() {
    const currentTime = Date.now();
    const elapsed = currentTime - animationStartTime;
    const progress = Math.min(elapsed / animationDuration, 1); // Cap progress at 1

    const newPosition = new THREE.Vector3().lerpVectors(
      impactSphere.position,
      targetPosition,
      progress
    );
    impactSphere.position.copy(newPosition);

    if (progress < 1) {
      requestAnimationFrame(updateAnimation);
    } else {
      scene.remove(impactSphere); // Remove the sphere after animation completes
    }
  }

  updateAnimation();

  scene.add(impactSphere);
}

// Call the renderQuiz function to initialize the quiz
renderQuiz();

runApp(app, scene, renderer, camera, true, undefined, undefined);
