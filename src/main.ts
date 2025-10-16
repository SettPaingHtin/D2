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

type Tool =
  | { type: "line"; lineWidth: number }
  | { type: "sticker"; emoji: string };

function createLineCommand(
  x: number,
  y: number,
  lineWidth: number,
): DrawingCommand {
  const points: Point[] = [{ x, y }];
  return {
    display(context: CanvasRenderingContext2D): void {
      if (points.length < 2) return;
      context.lineWidth = lineWidth;
      context.strokeStyle = "black";
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

function createStickerCommand(
  x: number,
  y: number,
  emoji: string,
): DrawingCommand {
  let position: Point = { x, y };
  return {
    display(context: CanvasRenderingContext2D): void {
      context.font = "24px sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(emoji, position.x, position.y);
    },
    drag(x: number, y: number): void {
      position = { x, y };
    },
  };
}

function createToolPreviewCommand(
  x: number,
  y: number,
  tool: Tool,
): DisplayCommand {
  return {
    display(context: CanvasRenderingContext2D): void {
      if (tool.type === "line") {
        context.lineWidth = 1;
        context.strokeStyle = "gray";
        context.beginPath();
        context.arc(x, y, tool.lineWidth / 2, 0, 2 * Math.PI);
        context.stroke();
      } else if (tool.type === "sticker") {
        context.globalAlpha = 0.5;
        context.font = "24px sans-serif";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(tool.emoji, x, y);
        context.globalAlpha = 1.0;
      }
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

const lineButtons: HTMLButtonElement[] = [];
const stickerButtons: HTMLButtonElement[] = [];

const thinButton: HTMLButtonElement = document.createElement("button");
thinButton.textContent = "Thin";
toolBar.append(thinButton);
lineButtons.push(thinButton);

const thickButton: HTMLButtonElement = document.createElement("button");
thickButton.textContent = "Thick";
toolBar.append(thickButton);
lineButtons.push(thickButton);

const stickerEmojis = ["🎨", "✨", "🚀"];
stickerEmojis.forEach((emoji) => {
  const button = document.createElement("button");
  button.textContent = emoji;
  toolBar.append(button);
  stickerButtons.push(button);
  button.addEventListener("click", () => {
    currentTool = { type: "sticker", emoji: emoji };
    selectTool(button);
    canvas.dispatchEvent(new Event("tool-moved"));
  });
});

const displayList: DisplayCommand[] = [];
const redoStack: DisplayCommand[] = [];
let currentCommand: DrawingCommand | null = null;
let currentTool: Tool = { type: "line", lineWidth: 3 };
let toolPreview: DisplayCommand | null = null;

function selectTool(selectedButton: HTMLButtonElement) {
  [...lineButtons, ...stickerButtons].forEach((b) =>
    b.classList.remove("selected")
  );
  selectedButton.classList.add("selected");
}

thinButton.addEventListener("click", () => {
  currentTool = { type: "line", lineWidth: 3 };
  selectTool(thinButton);
});

thickButton.addEventListener("click", () => {
  currentTool = { type: "line", lineWidth: 8 };
  selectTool(thickButton);
});

selectTool(thinButton);

clearButton.addEventListener("click", () => {
  displayList.length = 0;
  redoStack.length = 0;
  canvas.dispatchEvent(new Event("drawing-changed"));
});

undoButton.addEventListener("click", () => {
  if (displayList.length > 0) {
    redoStack.push(displayList.pop()!);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

redoButton.addEventListener("click", () => {
  if (redoStack.length > 0) {
    displayList.push(redoStack.pop()!);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

function redraw() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  for (const command of displayList) {
    command.display(context);
  }
  if (toolPreview) {
    toolPreview.display(context);
  }
}

canvas.addEventListener("drawing-changed", redraw);
canvas.addEventListener("tool-moved", redraw);

let isDrawing = false;

canvas.addEventListener("mousedown", (event) => {
  isDrawing = true;
  toolPreview = null;
  redoStack.length = 0;

  if (currentTool.type === "line") {
    currentCommand = createLineCommand(
      event.offsetX,
      event.offsetY,
      currentTool.lineWidth,
    );
  } else if (currentTool.type === "sticker") {
    currentCommand = createStickerCommand(
      event.offsetX,
      event.offsetY,
      currentTool.emoji,
    );
  }

  if (currentCommand) {
    displayList.push(currentCommand);
  }
  canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mousemove", (event) => {
  if (isDrawing && currentCommand) {
    currentCommand.drag(event.offsetX, event.offsetY);
    canvas.dispatchEvent(new Event("drawing-changed"));
  } else {
    toolPreview = createToolPreviewCommand(
      event.offsetX,
      event.offsetY,
      currentTool,
    );
    canvas.dispatchEvent(new Event("tool-moved"));
  }
});

const stopDrawing = () => {
  isDrawing = false;
  currentCommand = null;
};

canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mouseout", () => {
  stopDrawing();
  toolPreview = null;
  canvas.dispatchEvent(new Event("tool-moved"));
});
