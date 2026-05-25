/**
 * ================================================================
 *   NEO CALC - PREMIUM DIGITAL CALCULATOR JAVASCRIPT
 *   Features: 
 *   - Glassmorphic reactive keypad animations
 *   - Accurate floating-point arithmetic (prevents 0.1 + 0.2 bugs)
 *   - Clean, safe token-based math parser (no dangerous eval)
 *   - Dual-row real-time formula rendering
 *   - Keyboard shortcuts with glowing visual feedback
 * ================================================================
 */

// --- 1. STATE INITIALIZATION ---
// Track the state of the calculator
let currentInput = "0";          // The number currently being entered
let expressionParts = [];       // Array containing stored numbers and operators (e.g. ["12", "+"])
let isNewCalculation = false;   // Flag to clear display when starting a new calculation after equals (=)

// --- 2. DOM ELEMENT SELECTORS ---
const displayCurrent = document.getElementById("display-current");
const displayExpression = document.getElementById("display-expression");
const keypad = document.querySelector(".keypad");

// --- 3. DISPLAY RENDERING FUNCTIONS ---

/**
 * Updates both rows of the display panel.
 * The upper row shows the full expression with beautiful math operators.
 * The main row shows the current input or result.
 */
function updateDisplay() {
    // 1. Format the expression array for the top display row
    // Replace raw '*' and '/' with stylish mathematical signs
    const formattedExpression = expressionParts.map(part => {
        if (part === "*") return "×";
        if (part === "/") return "÷";
        if (part === "-") return "−";
        return part;
    }).join(" ");
    
    displayExpression.textContent = formattedExpression;

    // 2. Render the current input or intermediate result
    // If currentInput is empty (e.g. after clicking an operator), show 0
    if (currentInput === "") {
        displayCurrent.textContent = "0";
    } else {
        // Replace normal dash with Unicode minus for high visual quality
        displayCurrent.textContent = currentInput.replace(/-/g, "−");
    }

    // Dynamic Font Resizing based on character count for premium user-friendliness
    const textLength = displayCurrent.textContent.length;
    if (textLength <= 8) {
        displayCurrent.style.fontSize = "2.3rem";
    } else if (textLength === 9) {
        displayCurrent.style.fontSize = "2.1rem";
    } else if (textLength === 10) {
        displayCurrent.style.fontSize = "1.9rem";
    } else if (textLength === 11) {
        displayCurrent.style.fontSize = "1.7rem";
    } else if (textLength === 12) {
        displayCurrent.style.fontSize = "1.5rem";
    } else {
        displayCurrent.style.fontSize = "1.3rem";
    }

    // 3. Auto-scroll the main display to the right if numbers are extremely long
    displayCurrent.scrollLeft = displayCurrent.scrollWidth;
}

/**
 * Reset all state variables to their defaults (equivalent to cold boot)
 */
function resetCalculator() {
    currentInput = "0";
    expressionParts = [];
    isNewCalculation = false;
    updateDisplay();
}

// --- 4. SAFE MATHEMATICAL EXPRESSION EVALUATOR ---

/**
 * Parses an array of tokens (numbers and operators) and solves it using mathematical order of operations (MDAS).
 * Avoids the use of eval() for security, stability, and control.
 * 
 * @param {Array} tokens - List of numbers and operator strings (e.g., [12, "+", 4, "*", 2])
 * @returns {number} The evaluated result of the formula
 */
function calculateExpression(tokens) {
    if (tokens.length === 0) return 0;
    
    // Remove any trailing operators if they exist (e.g. user pressed "=" on "5 + 2 *")
    if (typeof tokens[tokens.length - 1] === 'string' && ['+', '-', '*', '/'].includes(tokens[tokens.length - 1])) {
        tokens.pop();
    }
    
    // --- Pass 1: Multiplication and Division ---
    let i = 0;
    while (i < tokens.length) {
        const token = tokens[i];
        if (token === '*' || token === '/') {
            const left = tokens[i - 1];
            const right = tokens[i + 1];
            
            // Check for syntax errors
            if (left === undefined || right === undefined) {
                throw new Error("Syntax Error");
            }
            
            let result;
            if (token === '*') {
                result = left * right;
            } else {
                // Safeguard against division by zero
                if (right === 0) {
                    throw new Error("Cannot divide by 0");
                }
                result = left / right;
            }
            
            // Replace the three tokens (left, operator, right) with the single result
            tokens.splice(i - 1, 3, result);
            
            // Move counter back since the array length shrank
            i--;
        } else {
            i++;
        }
    }
    
    // --- Pass 2: Addition and Subtraction ---
    let total = tokens[0];
    if (typeof total !== 'number') {
        throw new Error("Syntax Error");
    }
    
    i = 1;
    while (i < tokens.length) {
        const operator = tokens[i];
        const right = tokens[i + 1];
        
        if (right === undefined || typeof right !== 'number') {
            throw new Error("Syntax Error");
        }
        
        if (operator === '+') {
            total += right;
        } else if (operator === '-') {
            total -= right;
        } else {
            throw new Error("Syntax Error");
        }
        
        i += 2; // Jump past operator and the processed right hand value
    }
    
    return total;
}

/**
 * Clean floating point arithmetic anomalies (e.g. 0.1 + 0.2 => 0.3)
 * Limits precision to 10 decimal digits to eliminate CPU binary round-off errors
 * 
 * @param {number} value - The raw float result
 * @returns {string} Highly formatted, human-readable string
 */
function formatResult(value) {
    if (isNaN(value)) return "Error";
    if (!isFinite(value)) return "Error";
    
    // Round to 10 decimal digits and parse back to float to remove trailing zeroes
    let rounded = parseFloat(value.toFixed(10));
    
    // If output is too massive, format with clean exponential notation
    if (Math.abs(rounded) > 9999999999) {
        return rounded.toExponential(4);
    }
    
    return rounded.toString();
}

// --- 5. COMPONENT-BASED CALCULATOR LOGIC ---

/**
 * Handles numeric digit presses
 * @param {string} digit - Number character clicked
 */
function handleNumber(digit) {
    // If equal key was pressed just before, start a fresh layout
    if (isNewCalculation) {
        currentInput = digit;
        expressionParts = [];
        isNewCalculation = false;
    } else {
        // Prevent stacking leading zeroes
        if (currentInput === "0") {
            currentInput = digit;
        } else {
            currentInput += digit;
        }
    }
    updateDisplay();
}

/**
 * Handles decimal point placement. Prevents multiple decimals in a single number.
 */
function handleDecimal() {
    if (isNewCalculation) {
        currentInput = "0.";
        expressionParts = [];
        isNewCalculation = false;
    } else {
        // Prevent inserting multiple decimals in a single number
        if (!currentInput.includes(".")) {
            // If empty, prepend with a zero (e.g. ".5" becomes "0.5")
            if (currentInput === "") {
                currentInput = "0.";
            } else {
                currentInput += ".";
            }
        }
    }
    updateDisplay();
}

/**
 * Handles backspace (deletes last character typed)
 */
function handleBackspace() {
    // If result was just computed, backspace clears the equation
    if (isNewCalculation) {
        expressionParts = [];
        isNewCalculation = false;
        return;
    }

    if (currentInput.length > 1) {
        currentInput = currentInput.slice(0, -1);
    } else {
        currentInput = "0"; // Default back to zero
    }
    updateDisplay();
}

/**
 * Handles percentage computation
 */
function handlePercent() {
    const value = parseFloat(currentInput);
    if (!isNaN(value)) {
        // Divide the current number on screen by 100
        currentInput = formatResult(value / 100);
        isNewCalculation = false;
        updateDisplay();
    }
}

/**
 * Appends operator and prepares expression stack
 * @param {string} nextOperator - Math symbol string (+, -, *, /)
 */
function handleOperator(nextOperator) {
    // If user clicked = previously, they can continue operations on that result
    if (isNewCalculation) {
        expressionParts = [currentInput, nextOperator];
        currentInput = "";
        isNewCalculation = false;
        updateDisplay();
        return;
    }

    // User is swapping operator without inputting a number (e.g., changing + to *)
    if (currentInput === "" && expressionParts.length > 0) {
        const lastPart = expressionParts[expressionParts.length - 1];
        if (['+', '-', '*', '/'].includes(lastPart)) {
            expressionParts[expressionParts.length - 1] = nextOperator; // Replace last operator
            updateDisplay();
            return;
        }
    }

    // Push the current input number and the clicked operator to the stack
    if (currentInput !== "") {
        expressionParts.push(currentInput);
        expressionParts.push(nextOperator);
        currentInput = ""; // Clear main row to wait for next number
        updateDisplay();
    }
}

/**
 * Completes mathematical evaluation and updates displays
 */
function handleCalculate() {
    // Prevent calculations if we have no operands
    if (expressionParts.length === 0 && currentInput === "0") return;

    // Append the last active input to our expression before final solving
    if (currentInput !== "") {
        expressionParts.push(currentInput);
    }

    // Safe mathematical array conversion (Convert string numbers to JS numbers)
    const tokenizedExpression = expressionParts.map((token, index) => {
        if (index % 2 === 0) {
            return parseFloat(token); // Odd indexes represent values (0, 2, 4, ...)
        }
        return token; // Even indexes represent operators (+, -, *, /)
    });

    try {
        // Calculate result using order of operation
        const result = calculateExpression(tokenizedExpression);
        const formatted = formatResult(result);
        
        // Render upper display with final equation summary (e.g. "12 + 3 =")
        displayExpression.textContent = expressionParts.map(part => {
            if (part === "*") return "×";
            if (part === "/") return "÷";
            if (part === "-") return "−";
            return part;
        }).join(" ") + " =";
        
        // Update values for display
        currentInput = formatted;
        expressionParts = [];
        isNewCalculation = true;
        
        // Show outcome on main display
        displayCurrent.textContent = formatted.replace(/-/g, "−");
    } catch (error) {
        // Gracefully capture division by zero or structural errors
        displayExpression.textContent = expressionParts.map(part => {
            if (part === "*") return "×";
            if (part === "/") return "÷";
            if (part === "-") return "−";
            return part;
        }).join(" ");
        
        displayCurrent.textContent = error.message || "Error";
        
        // Clear state to allow user to retry
        currentInput = "0";
        expressionParts = [];
        isNewCalculation = true;
    }
}

// --- 6. EVENT DELEGATION LISTENER ---
keypad.addEventListener("click", (event) => {
    const btn = event.target;
    
    // Ignore clicks that didn't land directly on keypad button nodes
    if (!btn.classList.contains("btn")) return;

    // Route event according to button dataset settings
    if (btn.classList.contains("btn-number") && !btn.dataset.action) {
        handleNumber(btn.dataset.value);
    } else if (btn.dataset.action === "operator") {
        handleOperator(btn.dataset.value);
    } else if (btn.dataset.action === "clear") {
        resetCalculator();
    } else if (btn.dataset.action === "backspace") {
        handleBackspace();
    } else if (btn.dataset.action === "percent") {
        handlePercent();
    } else if (btn.dataset.action === "calculate") {
        handleCalculate();
    } else if (btn.id === "btn-decimal") {
        handleDecimal();
    }
});

// --- 7. ACCESSIBLE PHYSICAL KEYBOARD BINDINGS ---

/**
 * Triggers a click event and visually highlights the matching button component
 * @param {string} id - The ID of the matching HTML button element
 */
function simulateButtonPress(id) {
    const button = document.getElementById(id);
    if (button) {
        button.focus();
        // Inject keyboard-active animation and pop
        button.classList.add("keyboard-active");
        button.click();
        
        // Remove glow layout after milliseconds
        setTimeout(() => {
            button.classList.remove("keyboard-active");
            button.blur();
        }, 120);
    }
}

// Global document keyboard interceptor
document.addEventListener("keydown", (event) => {
    // Numbers 0-9
    if (event.key >= "0" && event.key <= "9") {
        simulateButtonPress(`btn-${event.key}`);
        event.preventDefault();
    }
    
    // Operators
    switch (event.key) {
        case "+":
            simulateButtonPress("btn-add");
            event.preventDefault();
            break;
        case "-":
            simulateButtonPress("btn-subtract");
            event.preventDefault();
            break;
        case "*":
            simulateButtonPress("btn-multiply");
            event.preventDefault();
            break;
        case "/":
            simulateButtonPress("btn-divide");
            event.preventDefault();
            break;
        case ".":
            simulateButtonPress("btn-decimal");
            event.preventDefault();
            break;
        case "%":
            simulateButtonPress("btn-percent");
            event.preventDefault();
            break;
        case "Enter":
        case "=":
            simulateButtonPress("btn-equals");
            event.preventDefault();
            break;
        case "Backspace":
            simulateButtonPress("btn-backspace");
            event.preventDefault();
            break;
        case "Escape":
            simulateButtonPress("btn-clear");
            event.preventDefault();
            break;
    }
});
