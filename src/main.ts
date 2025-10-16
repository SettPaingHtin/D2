import "./style.css";

interface Point {
  x: number;
  y: number;
}

interface DisplayCommand {
  display(context: CanvasRenderingContext2D): void;
}

interface DrawingCommand extends DisplayCommand {
  drag(x: number, y: number): void;
}

function createLineCommand(x: number, y: number, lineWidth: number): DrawingCommand {
  const points: Point[] = [{ x, y }];
  return {
    display(context: CanvasRenderingContext2D): void {
      if (points.length < 2) return;
      context.lineWidth = lineWidth;
      context.beginPath();
      context.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        context.lineTo(points[i].x, points[i].y);
      }
      context.stroke();
    },
    drag(x: number, y: number): void {
      points.push({ x, y });
    },
  };
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

const toolBar = document.createElement("div");
document.body.append(toolBar);

const clearButton: HTMLButtonElement = document.createElement("button");
clearButton.textContent = "Clear";
toolBar.append(clearButton);

const undoButton: HTMLButtonElement = document.createElement("button");
undoButton.textContent = "Undo";
toolBar.append(undoButton);

const redoButton: HTMLButtonElement = document.createElement("button");
redoButton.textContent = "Redo";
toolBar.append(redoButton);

const thinButton: HTMLButtonElement = document.createElement("button");
thinButton.textContent = "Thin";
toolBar.append(thinButton);

const thickButton: HTMLButtonElement = document.createElement("button");
thickButton.textContent = "Thick";
toolBar.append(thickButton);

const displayList: DisplayCommand[] = [];
const redoStack: DisplayCommand[] = [];
let currentCommand: DrawingCommand | null = null;
let currentLineWidth = 3;

function selectTool(selectedButton: HTMLButtonElement) {
  thinButton.classList.remove("selected");
  thickButton.classList.remove("selected");
  selectedButton.classList.add("selected");
}

thinButton.addEventListener("click", () => {
  currentLineWidth = 3;
  selectTool(thinButton);
});

thickButton.addEventListener("click", () => {
  currentLineWidth = 8;
  selectTool(thickButton);
});

selectTool(thinButton); // Select thin by default

clearButton.addEventListener("click", () => {
  displayList.length = 0;
  redoStack.length = 0;
  canvas.dispatchEvent(new Event("drawing-changed"));
});

undoButton.addEventListener("click", () => {
  if (displayList.length > 0) {
    const undoneCommand = displayList.pop()!;
    redoStack.push(undoneCommand);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

redoButton.addEventListener("click", () => {
  if (redoStack.length > 0) {
    const redoneCommand = redoStack.pop()!;
    displayList.push(redoneCommand);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

canvas.addEventListener("drawing-changed", () => {
  context.clearRect(0, 0, canvas.width, canvas.height);
  for (const command of displayList) {
    command.display(context);
  }
});

let isDrawing = false;

canvas.addEventListener("mousedown", (event) => {
  isDrawing = true;
  redoStack.length = 0;
  currentCommand = createLineCommand(event.offsetX, event.offsetY, currentLineWidth);
  displayList.push(currentCommand);
  canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mousemove", (event) => {
  if (!isDrawing || !currentCommand) return;
  currentCommand.drag(event.offsetX, event.offsetY);
  canvas.dispatchEvent(new Event("drawing-changed"));
});

const stopDrawing = () => {
  isDrawing = false;
  currentCommand = null;
};

canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mouseout", stopDrawing);