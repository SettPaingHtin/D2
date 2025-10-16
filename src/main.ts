import "./style.css";

interface Point {
  x: number;
  y: number;
}

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

const displayList: Point[][] = [];

clearButton.addEventListener("click", () => {
  displayList.length = 0;
  canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("drawing-changed", () => {
  context.clearRect(0, 0, canvas.width, canvas.height);
  for (const line of displayList) {
    if (line.length < 2) continue;
    context.beginPath();
    context.moveTo(line[0].x, line[0].y);
    for (let i = 1; i < line.length; i++) {
      context.lineTo(line[i].x, line[i].y);
    }
    context.stroke();
  }
});

let isDrawing = false;

canvas.addEventListener("mousedown", (event) => {
  isDrawing = true;
  const newLine: Point[] = [{ x: event.offsetX, y: event.offsetY }];
  displayList.push(newLine);
  canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mousemove", (event) => {
  if (!isDrawing) return;
  const currentLine = displayList[displayList.length - 1];
  currentLine.push({ x: event.offsetX, y: event.offsetY });
  canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mouseup", () => {
  isDrawing = false;
});

canvas.addEventListener("mouseout", () => {
  isDrawing = false;
});
