/*
Extra Explanation:

Thanks for the well-organized summary! Here's a structured **consolidation** of your notes into a clean, categorized format you can use as a quick reference or documentation in your project (like for Surveyr).

---

### 🧾 **Page-Level Logic Rules in SurveyJS**

| Property     | Behavior                                                              | Requirement Behavior                      |
| ------------ | --------------------------------------------------------------------- | ----------------------------------------- |
| `visibleIf`  | Entire page is hidden from the user if condition is false             | All questions are treated as not required |
| `enableIf`   | Page is visible, but questions are **disabled** if condition is false | All questions on page become optional     |
| `requiredIf` | Controls if at least **one** question on the page must be answered    | Partial completion is enforced            |

---

### 🔧 **Question-Level Logic Properties**

| Property             | Description                                                                       |
| -------------------- | --------------------------------------------------------------------------------- |
| `visibleIf`          | Shows/hides the question (or panel/page) based on an expression                   |
| `enableIf`           | Disables/enables the input based on condition                                     |
| `requiredIf`         | Makes the field required only if condition is true                                |
| `setValueIf`         | Sets the value automatically when a condition is met                              |
| `setValueExpression` | Uses an expression to compute and assign a value (e.g., `{q1} + {q2}`, `today()`) |

---

### 🧠 **Dynamic Logic Support in SurveyJS**

#### Expression Syntax

* Supports arithmetic (`+ - * / % ^`)
* Comparison (`= != < > <= >=`)
* Boolean logic (`&& || !`)
* String functions (`contains`, `startsWith`, etc.)
* Special functions: `iif()`, `today()`, `sum()`, `age()`

#### Example Expressions

```json
{
  "visibleIf": "{age} >= 18",
  "enableIf": "{employment} = 'Yes'",
  "requiredIf": "{q1} = 'Other'",
  "setValueIf": "{q1} = 'Autofill'",
  "setValueExpression": "sum({q1}, {q2})"
}
```

---

### ✨ **Dynamic Content (Placeholders)**

| Use Case              | Syntax Example                        |
| --------------------- | ------------------------------------- |
| From another question | `{firstName}`                         |
| Array values          | `{questionName[0]}`                   |
| Inside matrix/panel   | `{row.columnName}` or `{panel.child}` |

Used in:

* `title`
* `description`
* `html`
* `placeholders`

---

### ⚡ **Trigger Types (Survey-Level Reactions)**

| Trigger Type    | Purpose                                |
| --------------- | -------------------------------------- |
| `complete`      | Completes the survey                   |
| `setvalue`      | Assigns value to a question            |
| `copyvalue`     | Copies one question's value to another |
| `runexpression` | Executes a logic expression            |
| `skip`          | Skips a question or page (routing)     |

---

### 🛠 **GUI vs Manual Entry**

* Use the **Logic tab (GUI)** for most logic.
* For advanced branching or complex dependencies, use **manual JSON editing**.

---

### ⛓ **Cascading Conditions**

Use logical expressions to avoid rule duplication:

```json
{
  "visibleIf": "{q1} = 'Yes' or {q2} = 'Maybe'"
}
```

*/

// Re-export everything from the modular files
export * from './types';
export * from './constants';
export * from './expressionEvaluator';
export * from './parsers';
export * from './validators';
export * from './surveyState';
