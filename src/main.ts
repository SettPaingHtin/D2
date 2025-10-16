import "./style.css";

const appTitle: HTMLHeadingElement = document.createElement("h1");
appTitle.textContent = "Quaint Paint";
document.body.append(appTitle);

const canvas: HTMLCanvasElement = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
document.body.append(canvas);

const context = canvas.getContext("2d")!;
context.lineCap = "round";
context.lineJoin = "round";
context.lineWidth = 3;

const clearButton: HTMLButtonElement = document.createElement("button");
clearButton.textContent = "Clear";
document.body.append(clearButton);

clearButton.addEventListener("click", () => {
  context.clearRect(0, 0, canvas.width, canvas.height);
});

let isDrawing = false;

canvas.addEventListener("mousedown", (event) => {
  isDrawing = true;
  context.beginPath();
  context.moveTo(event.offsetX, event.offsetY);
});

canvas.addEventListener("mousemove", (event) => {
  if (!isDrawing) return;
  context.lineTo(event.offsetX, event.offsetY);
  context.stroke();
});

canvas.addEventListener("mouseup", () => {
  isDrawing = false;
});

canvas.addEventListener("mouseout", () => {
  isDrawing = false;
});
