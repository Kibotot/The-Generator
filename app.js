/**
 * 1. Global selections
 * 2. Evenet listeners
 * 3. Functions
 */

/** 1. Global selections */
const colorDivs = document.querySelectorAll(".color");
const generateButton = document.querySelector(".generate");
const sliders = document.querySelectorAll('input[type="range"]');
const currentHex = document.querySelectorAll(".color h2");
const popup = document.querySelector(".copy-container");
const adjustButton = document.querySelectorAll(".adjust");
const lockButton = document.querySelectorAll(".lock");
const closeAdjustments = document.querySelectorAll(".close-adjustment");
const sliderContainers = document.querySelectorAll(".sliders");
let initialColors;
//local storage object
let savedPaletts = [];

/** 2. Event listeners */
sliders.forEach(slider => {
  slider.addEventListener("input", hslControls);
});

colorDivs.forEach((div, index) => {
  div.addEventListener("change", () => {
    updateTextUI(index);
  });
});

currentHex.forEach(hex => {
  hex.addEventListener("click", () => {
    copyToClipboard(hex);
  });
});

popup.addEventListener("transitionend", () => {
  const popupBox = popup.children[0];
  popup.classList.remove("active");
  popupBox.classList.remove("active");
});

adjustButton.forEach((button, index) => {
  button.addEventListener("click", () => {
    openAdjustmentPanel(index);
  });
});

closeAdjustments.forEach((button, index) => {
  button.addEventListener("click", () => {
    closeAdjustmentPanel(index);
  });
});

lockButton.forEach((button, index) => {
  button.addEventListener("click", () => {
    lockColor(index);
  });
});

generateButton.addEventListener("click", randomColors);

/** 3. Functions */

//color generator
function generateHex() {
  return chroma.random();
}

function randomColors() {
  initialColors = []; //reseting the inital colors array for new pack of 5 different colors
  colorDivs.forEach((div, index) => {
    const hexText = div.children[0];
    const randomColor = generateHex();
    if (div.classList.contains("locked")) {
      initialColors.push(hexText.innerText);
      return;
    } else {
      initialColors.push(randomColor.hex());
    }

    //add the randomColor to the div's bg
    div.style.backgroundColor = randomColor;
    hexText.innerHTML = randomColor;

    checkTextContrast(randomColor, hexText);

    const color = chroma(randomColor);
    const sliders = div.querySelectorAll('input[type="range"]'); //nodeList[3]
    const hue = sliders[0];
    const brightness = sliders[1];
    const saturation = sliders[2];

    colorizeSliders(color, hue, brightness, saturation);
  });

  //reseting inputs
  resetinputs();
}

// check the contrast between bg and hextext
function checkTextContrast(color, text) {
  const luminance = chroma(color).luminance(); //returns [0, 1] which represents black or white
  const button1 = text.parentElement.querySelector(".controls button");
  const button2 = button1.nextElementSibling;

  if (luminance > 0.5) {
    text.style.color = "black";
    button1.style.color = "black";
    button2.style.color = "black";
  } else {
    text.style.color = "white";
    button1.style.color = "white";
    button2.style.color = "white";
  }
}

function colorizeSliders(color, hue, brightness, saturation) {
  //scale saturation
  const noSaturation = color.set("hsl.s", 0);
  const fullSaturation = color.set("hsl.s", 1);
  const scaleSaturation = chroma.scale([noSaturation, color, fullSaturation]);

  //scale brightness
  const noBrightness = color.set("hsl.l", 0);
  const fullBrightness = color.set("hsl.l", 1);
  const scaleBrightness = chroma.scale([noBrightness, color, fullBrightness]);

  //updating input colors
  saturation.style.backgroundImage = `linear-gradient(to right, ${scaleSaturation(
    0
  )}, ${scaleSaturation(1)})`;
  brightness.style.backgroundImage = `linear-gradient(to right, ${scaleBrightness(
    0
  )}, ${scaleBrightness(0.5)}, ${scaleBrightness(1)})`;
  hue.style.backgroundImage = `linear-gradient(to right, rgb(204,75,75),rgb(204,204,75),rgb(75,204,75),rgb(75,204,204),rgb(75,75,204),rgb(204,75,204),rgb(204,75,75))`;
}

function hslControls(e) {
  const index =
    e.target.getAttribute("data-bright") ||
    e.target.getAttribute("data-sat") ||
    e.target.getAttribute("data-hue");
  //e represents click event, e.target is input itself
  // clicking on any controls returns index of a color div+

  let sliders = e.target.parentElement.querySelectorAll('input[type="range"]');
  const hue = sliders[0];
  const brightness = sliders[1];
  const saturation = sliders[2];

  const bgColor = initialColors[index];

  let color = chroma(bgColor)
    .set("hsl.h", hue.value)
    .set("hsl.s", saturation.value)
    .set("hsl.l", brightness.value);

  colorDivs[index].style.backgroundColor = color;
  colorizeSliders(color, hue, brightness, saturation);
}

function updateTextUI(index) {
  const activeDiv = colorDivs[index];
  const color = chroma(activeDiv.style.backgroundColor);
  const textHex = activeDiv.querySelector("h2");
  const icons = activeDiv.querySelectorAll(".controls button");
  textHex.innerText = color.hex(); //updating hex text

  checkTextContrast(color, textHex);
  for (icon of icons) {
    checkTextContrast(color, icon);
  }
}

function resetinputs() {
  const sliders = document.querySelectorAll(".sliders input");
  sliders.forEach(slider => {
    if (slider.name === "hue") {
      const hueColor = initialColors[slider.getAttribute("data-hue")]; //returns current color's hex code
      const hueValue = chroma(hueColor).hsl()[0];
      slider.value = Math.floor(hueValue);
    }
    if (slider.name === "saturation") {
      const saturationColor = initialColors[slider.getAttribute("data-sat")]; //returns current color's hex code
      const satValue = chroma(saturationColor).hsl()[1];
      slider.value = Math.floor(satValue * 100) / 100;
    }
    if (slider.name === "brightness") {
      const brightnessColor = initialColors[slider.getAttribute("data-bright")]; //returns current color's hex code
      const brightValue = chroma(brightnessColor).hsl()[2];
      slider.value = Math.floor(brightValue * 100) / 100;
    }
  });
}

function copyToClipboard(hex) {
  //"hacking" for copying the text.
  const el = document.createElement("textarea");
  el.value = hex.innerText; //text area now contains color's hex
  document.body.appendChild(el);
  el.select(); //selecting the textarea
  document.execCommand("copy"); //method from Clipboard API (copy, cut, paste)
  document.body.removeChild(el); //destroying, removing textarea

  //pop up animation
  const popupBox = popup.children[0];
  popup.classList.add("active");
  popupBox.classList.add("active");
}

function openAdjustmentPanel(index) {
  sliderContainers[index].classList.toggle("active");
  // const panel = colorDivs[index].children[2];
  // if (panel.classList.contains("active")) {
  //   panel.classList.remove("active");
  // } else {
  //   panel.classList.add("active");
  // }
}
function closeAdjustmentPanel(index) {
  sliderContainers[index].classList.remove("active");
}

function lockColor(index) {
  colorDivs[index].classList.toggle("locked");
  lockButton[index].children[0].classList.toggle("fa-lock-open");
  lockButton[index].children[0].classList.toggle("fa-lock");
}

//implement save palette to local storage

const saveButton = document.querySelector(".save");
const submitSave = document.querySelector(".submit-save");
const closeSave = document.querySelector(".close-save");
const saveContainer = document.querySelector(".save-container");
const saveInput = document.querySelector(".save-container input");
const libraryContainer = document.querySelector(".library-container");
const libraryBtn = document.querySelector(".library");
const closeLibraryBtn = document.querySelector(".close-library");

//event listeners
saveButton.addEventListener("click", openPalette);
closeSave.addEventListener("click", closePalette);
submitSave.addEventListener("click", savePalette);
libraryBtn.addEventListener("click", openLibrary);
closeLibraryBtn.addEventListener("click", closeLibrary);

function openPalette(e) {
  const popup = saveContainer.children[0];
  saveContainer.classList.add("active");
  popup.classList.add("active");
}

function closePalette(e) {
  const popup = saveContainer.children[0];
  saveContainer.classList.remove("active");
  popup.classList.remove("active");
}

function savePalette(e) {
  saveContainer.classList.remove("active");
  popup.classList.remove("active");
  const name = saveInput.value;
  const colors = [];
  currentHex.forEach(hex => {
    colors.push(hex.innerText);
  });

  //Generate Object
  let paletteNum = savedPaletts.length;
  const paletteObj = {
    name, //same as name: name
    colors,
    num: paletteNum
  };
  savedPaletts.push(paletteObj);

  //save to local storage
  saveToLocal(paletteObj);
  saveInput.value = "";

  //generate the palette element for library
  const palette = document.createElement("div");
  palette.classList.add("custom-palette");

  const title = document.createElement("h4");
  title.innerText = paletteObj.name;

  const preview = document.createElement("div");
  preview.classList.add("small-preview");
  paletteObj.colors.forEach(smallColor => {
    const smallDiv = document.createElement("div");
    smallDiv.style.backgroundColor = smallColor;
    preview.appendChild(smallDiv);
  });

  const paletteButton = document.createElement("button");
  paletteButton.classList.add("pick-palette-btn");
  paletteButton.classList.add(paletteObj.num);
  paletteButton.innerText = "Select";

  //attach event to the btn

  paletteButton.addEventListener("click", e => {
    closeLibrary();
    const paletteIndex = e.target.classList[1];
    initialColors = [];
  });
  //appending palette
  palette.appendChild(title);
  palette.appendChild(preview);
  palette.appendChild(paletteButton);
  libraryContainer.children[0].appendChild(palette);
}

function saveToLocal(paletteObj) {
  let localPalette;
  if (localStorage.getItem("palettes") === null) {
    localPalette = [];
  } else {
    localPalette = JSON.parse(localStorage.getItem("palettes"));
  }
  localPalette.push(paletteObj);
  localStorage.setItem("palettes", JSON.stringify(localPalette));
}

function openLibrary() {
  const popup = libraryContainer.children[0];
  libraryContainer.classList.add("active");
  popup.classList.add("active");
}

function closeLibrary() {
  const popup = libraryContainer.children[0];
  libraryContainer.classList.remove("active");
  popup.classList.remove("active");
}

randomColors();
