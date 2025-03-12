const { useState, useEffect, useRef } = React;

const SkipCountingGame = () => {
  const rows = 15;
  const cols = 10;
  const BASE_POINTS = 10;
  const SPEED_BONUS = 20;
  const MIN_BONUS = 0;

  const initialGrid = Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) =>
      col === 0 || col === cols - 1 ? (row + 1) * (col === 0 ? 1 : 10) : ""
    )
  );

  const [grid, setGrid] = useState(initialGrid);
  const [selected, setSelected] = useState([0, 1]);
  const [highlightedCells, setHighlightedCells] = useState([]);
  const [highlightedRows, setHighlightedRows] = useState(new Set());
  const [timer, setTimer] = useState(0);
  const [started, setStarted] = useState(false);
  const [correctCells, setCorrectCells] = useState(new Set());
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [activeMode, setActiveMode] = useState(null);
  const [showRules, setShowRules] = useState(false);
  const [selectedFractionCells, setSelectedFractionCells] = useState([]);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [discoColors, setDiscoColors] = useState({});

  const inputRefs = useRef({});
  const timestamps = useRef({});

  useEffect(() => {
    const handleKeyDown = (e) => {
      const arrowKeys = ["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", "Enter", "Tab"];
      if (document.activeElement.tagName === "INPUT" && !arrowKeys.includes(e.key)) return;

      if (activeMode === "fraction" && selectedFractionCells.length === 2) {
        setSelectedFractionCells((prev) => {
          let newSelection = [...prev];
          if ((e.key === "ArrowRight" || e.key === "Tab") && prev[0][1] < cols - 1) {
            newSelection = prev.map(([r, c]) => [r, c + 1]);
          } else if (e.key === "ArrowLeft" && prev[0][1] > 0) {
            newSelection = prev.map(([r, c]) => [r, c - 1]);
          }
          return newSelection;
        });
      } else if (selected) {
        let [row, col] = selected;

        if (e.key === "ArrowRight" || e.key === "Tab") {
          e.preventDefault();
          if (col < cols - 1) col++;
          else if (row < rows - 1) {
            row++;
            col = 1;
          }
        }
        if (e.key === "ArrowLeft" && col > 0) col--;
        if (e.key === "ArrowDown" && row < rows - 1) row++;
        if (e.key === "ArrowUp" && row > 0) row--;

        if (e.key === "Enter") {
          if ((col === 8 || col === 9) && row < rows - 1) {
            row++;
            col = 1;
          }
        }

        const newSelected = [row, col];
        setSelected(newSelected);

        const input = inputRefs.current[`${row}-${col}`];
        if (input) {
          input.focus();
          setTimeout(() => input.select(), 0);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedFractionCells, selected, activeMode]);

  useEffect(() => {
    let interval;
    if (started) {
      interval = setInterval(() => setTimer((t) => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [started]);

  useEffect(() => {
    if (selected && inputRefs.current[`${selected[0]}-${selected[1]}`]) {
      const input = inputRefs.current[`${selected[0]}-${selected[1]}`];
      input.focus();
      setTimeout(() => input.select(), 0);
    }
  }, [selected]);

  const toggleMode = (mode) => {
    setActiveMode((prev) => (prev === mode ? null : mode));
    setHighlightedCells([]);
    setSelectedFractionCells([]);
    setHighlightedRows(new Set());
  };

  const handleCellDoubleClick = (row, col) => {
    setSelected([row, col]);
    if (activeMode === "division") {
      setHighlightedCells([[row, 0], [0, col]]);
    } else if (activeMode === "fraction") {
      setSelectedFractionCells((prev) => {
        if (prev.length === 0) {
          setHighlightedRows((prevRows) => new Set([...prevRows, row]));
          return [[row, col]];
        } else if (prev.length === 1 && prev[0][1] === col) {
          setHighlightedRows((prevRows) => new Set([...prevRows, row]));
          return [...prev, [row, col]];
        } else {
          setHighlightedRows(new Set([row]));
          return [[row, col]];
        }
      });
    }
  };

  const handleBoardCompletion = () => {
    let completionBonus = Math.max(5000 - timer * 10, 500);
    setScore((prevScore) => prevScore + completionBonus);
    setStarted(false);
    setIsCelebrating(true);

    const discoInterval = setInterval(() => {
      const newColors = {};
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          newColors[`${row}-${col}`] = getRandomColor();
        }
      }
      setDiscoColors(newColors);
    }, 1000);

    setTimeout(() => {
      clearInterval(discoInterval);
      setIsCelebrating(false);
      setDiscoColors({});
    }, 7000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getRandomColor = () => {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) color += letters[Math.floor(Math.random() * 16)];
    return color;
  };

  return (
    <div className="game-container">
      <h1 style={{ fontWeight: "bold", fontSize: "1.75rem" }}>Skip Counting Game</h1>

      <div style={{ marginBottom: "10px" }}><strong>Timer:</strong> {formatTime(timer)}</div>
      <div style={{ marginBottom: "10px" }}><strong>Score:</strong> {score}</div>

      <button onClick={() => toggleMode("division")} style={{ padding: "10px 20px", fontSize: "16px", marginBottom: "10px", backgroundColor: activeMode === "division" ? "orange" : "white" }}>
        Division Button
      </button>

      <button onClick={() => toggleMode("fraction")} style={{ padding: "10px 20px", fontSize: "16px", marginBottom: "10px", backgroundColor: activeMode === "fraction" ? "yellow" : "white" }}>
        Equivalent Fraction Button
      </button>

      <div className="grid">
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const isHighlighted = highlightedCells.some(([r, c]) => r === rowIndex && c === colIndex);
            const isRowHighlighted = highlightedRows.has(rowIndex) && colIndex === 0;
            const isFractionSelected = selectedFractionCells.some(([r, c]) => r === rowIndex && c === colIndex);
            const isSelected = selected && selected[0] === rowIndex && selected[1] === colIndex;
            const isCorrect = correctCells.has(`${rowIndex}-${colIndex}`);
            const isIncorrect = cell !== "" && !isCorrect && colIndex !== 0 && colIndex !== cols - 1;
            const discoColor = discoColors[`${rowIndex}-${colIndex}`];

            return (
              <input
                key={`${rowIndex}-${colIndex}`}
                ref={(el) => { if (el) inputRefs.current[`${rowIndex}-${colIndex}`] = el; }}
                value={cell}
                onChange={(e) => {
                  const newValue = e.target.value;
                  if (!/^\d{0,3}$/.test(newValue)) return;

                  if (!started && grid[rowIndex][colIndex] === "") setStarted(true);

                  setGrid((prev) => {
                    const newGrid = [...prev];
                    newGrid[rowIndex] = [...newGrid[rowIndex]];
                    newGrid[rowIndex][colIndex] = newValue;
                    return newGrid;
                  });

                  if (colIndex !== 0 && colIndex !== cols - 1) {
                    const expectedValue = (rowIndex + 1) * (colIndex + 1);
                    const cellKey = `${rowIndex}-${colIndex}`;
                    const isAlreadyCorrect = correctCells.has(cellKey);

                    if (parseInt(newValue) === expectedValue) {
                      if (!isAlreadyCorrect) {
                        const timeTaken = timer - (timestamps.current[cellKey] || timer);
                        timestamps.current[cellKey] = timer;

                        const speedBonus = Math.max(SPEED_BONUS - timeTaken, MIN_BONUS);
                        let pointsEarned = BASE_POINTS + speedBonus;

                        let newStreak = streak + 1;
                        let streakBonus = 0;

                        if (newStreak === 3) streakBonus = 50;
                        if (newStreak === 5) streakBonus = 150;
                        if (newStreak === 10) streakBonus = 500;

                        setScore(prev => prev + pointsEarned + streakBonus);
                        setStreak(newStreak);
                      }
                      setCorrectCells(prev => new Set(prev).add(cellKey));

                      if (correctCells.size + 1 === rows * (cols - 2)) {
                        handleBoardCompletion();
                      }
                    } else {
                      setStreak(0);
                      setCorrectCells(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(cellKey);
                        return newSet;
                      });
                    }
                  }
                }}
                onClick={() => setSelected([rowIndex, colIndex])}
                onDoubleClick={() => handleCellDoubleClick(rowIndex, colIndex)}
                style={{
                  width: "50px",
                  height: "30px",
                  textAlign: "center",
                  backgroundColor: discoColor || (isHighlighted ? "orange" : isRowHighlighted ? "yellow" : isCorrect ? "lightgreen" : isIncorrect ? "lightcoral" : "white"),
                  border: isFractionSelected ? "4px solid blue" : isSelected ? "2px solid blue" : "1px solid black"
                }}
                readOnly={colIndex === 0 || colIndex === cols - 1}
              />
            );
          })
        )}
      </div>

      <div className="footer">a Parks 🌳 & 💻 Education creation</div>

      <button onClick={() => window.open("https://venmo.com/u/ToddParks", "_blank")} style={{ marginTop: "10px", padding: "10px 20px", fontSize: "16px", backgroundColor: "#4CAF50", color: "white", border: "none", borderRadius: "5px" }}>
        Donate to Parks and Education
      </button>

      <button onClick={() => setShowRules(true)} style={{ marginTop: "10px", padding: "10px 20px", fontSize: "16px", backgroundColor: "#2196F3", color: "white", border: "none", borderRadius: "5px" }}>
        Rules
      </button>

      {showRules && (
        <div style={{ marginTop: "20px", maxWidth: "600px", textAlign: "left", backgroundColor: "#f9f9f9", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
          <h3>Game Rules</h3>
          <p><strong>Objective:</strong> Fill in the blank cells with the correct products by skip counting.</p>
          <p><strong>Scoring:</strong><br />- 10 points for each correct answer.<br />- Speed bonus of up to 20 extra points.<br />- Streak bonuses: 50 points for 3 in a row, 150 points for 5, 500 points for 10.<br />- Completion bonuses based on how fast you finish.</p>
          <p><strong>Timer:</strong> Starts when you begin typing and stops when you complete the board correctly.</p>
          <p><strong>Division Mode:</strong> Highlights the first number in the row and the first number in the column of the selected cell. These numbers represent the factors that multiply to give the product. Use them to practice division (e.g., 42 ÷ 7 = 6).</p>
          <p><strong>Equivalent Fraction Mode:</strong> Lets you select two cells in the same column to compare fractions. Each cell represents a numerator, while the column number represents the denominator. Moving both cells together helps you compare ratios and identify equivalent fractions (e.g., 2/4 and 3/6 both simplify to 1/2).</p>
          <button onClick={() => setShowRules(false)} style={{ marginTop: "10px", padding: "5px 10px", backgroundColor: "#f44336", color: "white", border: "none", borderRadius: "5px" }}>
            Close
          </button>
        </div>
      )}
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<SkipCountingGame />);
