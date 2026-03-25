# REVIEW_CONTENT_MODEL.md

# Trellis — Review Content Model

## 1. Purpose

This document defines the content model for reviews, calibration support, succession outputs, and risk outputs in the Trellis Vanilla Build.

It answers:
- what content should be captured from employees
- what content should be captured from managers
- what content should support calibration
- what content should support succession and risk outputs
- how the talent review reference informs Trellis without dictating the product structure

This is a content and prompt model, not a workflow or architecture document.

---

## 2. Design Principles

### 2.1 Use the talent review reference as inspiration, not structure
The uploaded talent review reference is useful for identifying the types of information that matter in talent discussions.

Trellis should borrow the content domains, not the exact document format or presentation style.

### 2.2 Keep the vanilla build focused
The content model should support the Vanilla Build only:
- Goals + Measures
- Self Review
- Manager Review
- 9-Box Calibration
- Succession outputs
- Risk outputs
- PIP support

### 2.3 Separate authored input from confidential talent data
Some information should come directly from the employee.
Some should come from the manager.
Some should only exist in restricted admin workflows such as calibration.

These should not be blended carelessly.

### 2.4 Favor structured-but-flexible inputs
The system should support consistency without making reviews feel robotic.

Use:
- focused questions
- optional structured fields where useful
- narrative responses where judgment matters

Avoid:
- overly rigid questionnaires
- huge open-text dumps with no guidance
- forcing leadership-calibration language into employee-facing forms

---

## 3. Content Domains

Trellis review and talent content should be organized into the following domains:

1. Role and context
2. Goal progress
3. Business results / accomplishments
4. Strengths
5. Development opportunities
6. Leadership behaviors / effectiveness
7. Growth potential
8. Career interests / future direction
9. Calibration support
10. Succession readiness
11. Risk indicators
12. Improvement / intervention context

These domains should be selectively used based on role and workflow.

---

## 4. Employee Self Review Content

The self review should help the employee reflect clearly on their work without forcing them to speculate on confidential talent-management decisions.

## 4.1 Required self-review domains
The employee self review should capture:

### A. Role and context
Purpose:
- anchor the review in the employee’s actual scope of work

Suggested prompt examples:
- What were your main responsibilities or focus areas during this review period?
- Did your role, scope, or priorities change during this cycle? If yes, describe the change.

### B. Goal progress
Purpose:
- connect the review to the employee’s approved goals

Suggested prompt examples:
- How did you progress against your goals during this review period?
- Which goals are on track, at risk, or behind, and why?
- What measurable progress are you most proud of?

### C. Business results / accomplishments
Purpose:
- capture concrete outcomes and contributions

Suggested prompt examples:
- What were your most important accomplishments during this period?
- What impact did your work have on your team, project, or organization?
- Which results best reflect your contribution?

### D. Strengths
Purpose:
- identify what the employee believes they did well

Suggested prompt examples:
- What strengths did you demonstrate most consistently during this period?
- What do you believe had the biggest positive impact on your work?

### E. Development opportunities
Purpose:
- encourage thoughtful self-awareness and growth orientation

Suggested prompt examples:
- What are the most important areas you want to improve?
- What challenges or patterns do you want to work on in the next cycle?

### F. Career interests / future direction
Purpose:
- understand employee aspirations without turning self review into succession planning

Suggested prompt examples:
- What kinds of growth or development are you most interested in next?
- Are there new responsibilities, skills, or areas of work you would like to explore?

## 4.2 Optional self-review domains
These may be included if useful, but should not overload the form:

### G. Support needed
Suggested prompt examples:
- What support would help you perform even more effectively?
- What barriers affected your progress this cycle?

### H. Reflection on changing scope
Suggested prompt examples:
- Were there any major changes in scope, priorities, or responsibilities that affected your review period?

## 4.3 Self-review guardrails
The self review should not ask the employee to:
- place themselves in the 9-box
- assess their own succession readiness formally
- assess retention risk
- predict confidential organizational talent outcomes

Those belong in manager/admin talent workflows.

---

## 5. Manager Review Content

The manager review should combine assessment, evidence, and forward-looking guidance.

## 5.1 Required manager-review domains

### A. Role and context
Purpose:
- establish fair context for the employee’s performance

Suggested prompt examples:
- What was the employee’s role context during this period?
- Were there changes in scope, assignments, or expectations that affected performance?

### B. Goal progress assessment
Purpose:
- evaluate execution against approved goals

Suggested prompt examples:
- How effectively did the employee progress against their goals?
- Which goals were achieved, progressing, or missed?
- What evidence best supports your assessment?

### C. Business results / performance impact
Purpose:
- assess outcomes, not just effort

Suggested prompt examples:
- What were the employee’s most meaningful contributions during this period?
- What business or team outcomes were positively or negatively affected by their work?

### D. Strengths
Purpose:
- identify reliable strengths and positive patterns

Suggested prompt examples:
- What strengths did the employee demonstrate most clearly?
- What should the employee continue doing?

### E. Development opportunities
Purpose:
- identify concrete, useful improvement areas

Suggested prompt examples:
- What are the most important areas for development?
- What behaviors, capabilities, or patterns should improve next?

### F. Leadership behaviors / effectiveness
Purpose:
- support more consistent talent discussions, especially for calibration

Suggested prompt examples:
- How effectively does the employee demonstrate the behaviors expected in their role?
- Where do they show strong ownership, collaboration, judgment, or leadership?
- Where do they need stronger consistency or maturity?

### G. Growth potential
Purpose:
- support forward-looking talent evaluation without fully collapsing into succession language

Suggested prompt examples:
- Where do you see potential for broader scope or increased responsibility?
- What would the employee need to demonstrate to grow further?

### H. Career growth perspective
Purpose:
- connect development conversation to realistic future opportunities

Suggested prompt examples:
- What kinds of growth opportunities seem most appropriate for this employee?
- What development focus would help prepare them for future responsibility?

## 5.2 Optional manager-review domains

### I. Support / environment factors
Suggested prompt examples:
- What organizational or team conditions helped or hindered the employee’s performance?

### J. Retention concern signal
Suggested prompt examples:
- Are there concerns that this employee may be at elevated retention risk?
- If yes, what factors contribute to that concern?

This should remain optional and careful. It should not become a broad employee-visible field.

## 5.3 Manager-review guardrails
The manager review should not directly expose:
- formal 9-box placement decisions
- confidential succession ranking
- broad leadership talent deliberation language meant only for calibration rooms

Manager review can support those downstream conversations, but should not replace them.

---

## 6. Suggested Review Form Structure

Trellis does not need to mimic a legacy talent review template.

A clean review form structure can be:

### Self Review
1. Role context
2. Goal progress
3. Accomplishments
4. Strengths
5. Development areas
6. Future growth interests
7. Support needed (optional)

### Manager Review
1. Role context
2. Goal progress assessment
3. Business results
4. Strengths
5. Development areas
6. Leadership behaviors / effectiveness
7. Growth potential
8. Career growth perspective
9. Retention concern signal (optional / restricted)

This keeps the forms manageable while preserving rich content.

---

## 7. Calibration Support Content

Calibration should use review content as input, but it also needs its own structured support content.

## 7.1 Calibration support domains
Calibration discussions should be informed by:

- role and scope context
- goal progress summary
- performance/results summary
- strengths summary
- development themes
- growth potential indicators
- leadership effectiveness indicators
- manager rationale
- prior-cycle context where available

## 7.2 Calibration discussion fields
Suggested structured fields to support calibration:

- current performance summary
- potential / future scope summary
- key strengths
- key development concerns
- manager rationale for talent discussion
- placement rationale
- special context or constraints
- recommended follow-up

## 7.3 9-box language guidance
The talent review reference can inform internal calibration language, including concepts such as:
- emerging potential
- high potential
- solid performer
- seasoned contributor
- growth concerns
- mismatch / role-fit concerns
- appropriately placed

These labels do not need to appear exactly as written in the UI, but they can inform calibration criteria and rationale prompts.

---

## 8. Succession Output Content

Succession in the Vanilla Build is an output of calibration, not a fully separate talent platform.

## 8.1 Succession output fields
Suggested fields:

- target role
- incumbent
- successor candidate
- emergency backup status
- ready now status
- ready future status
- estimated readiness timeframe
- development needs before readiness
- notes / rationale

## 8.2 Readiness framing
Use the talent review reference as inspiration for readiness framing:

- Emergency backup
- Ready now
- Ready future

A practical readiness timeframe field may include:
- Now
- 0–12 months
- 12–24 months
- 24–36 months
- Longer-term / not currently in path

## 8.3 Succession guardrails
Succession outputs should not be:
- employee-facing
- mixed into self review
- casually exposed to managers outside the intended process

---

## 9. Risk Output Content

Risk outputs should be captured carefully and only in restricted workflows.

## 9.1 Risk domains
Suggested domains:

### A. Retention risk
- low / medium / high
- rationale
- contributing factors
- suggested mitigation

### B. Performance risk
- low / medium / high
- rationale
- contributing factors
- suggested mitigation

### C. Organizational dependency risk
- low / medium / high
- rationale
- succession / backup concern
- suggested mitigation

## 9.2 Suggested risk fields
- risk type
- risk level
- issue summary
- rationale
- action recommendation
- owner
- follow-up note

## 9.3 Risk guardrails
Risk content should remain:
- restricted
- concise
- action-oriented
- professional in tone

It should not turn into vague or emotionally loaded commentary.

---

## 10. PIP Support Content

PIP is not a review form, but review/calibration content often leads into it.

## 10.1 Relevant input domains for PIP
The review/calibration system should provide enough context to support:
- specific performance concerns
- behavior or capability gaps
- impact on role expectations
- expected improvement areas

## 10.2 PIP content categories
Suggested categories:
- core concern areas
- expected change
- measurable improvement criteria
- manager support actions
- HR oversight notes
- checkpoint observations

This content should remain operational and improvement-focused.

---

## 11. Structured vs Narrative Input Guidance

Trellis should strike a balance between structured and narrative data.

## 11.1 Use structured fields for
- goal progress state
- readiness category
- risk level
- role context flags
- status / visibility / workflow state

## 11.2 Use narrative fields for
- accomplishments
- strengths
- development areas
- leadership rationale
- placement rationale
- mitigation notes

## 11.3 Avoid over-structuring
Do not reduce all talent evaluation into dropdowns and ratings.

Important judgment-based areas should retain room for narrative explanation.

---

## 12. Employee-Facing vs Restricted Content

## 12.1 Employee-facing content
May include:
- self review questions
- goal progress reflections
- manager review content if packet release policy allows
- development guidance
- next-step feedback

## 12.2 Restricted manager/admin content
May include:
- leadership effectiveness evaluation
- calibration rationale
- succession readiness
- retention risk
- organizational risk
- restricted talent notes

## 12.3 Strictly restricted content
Should be limited to appropriate admin/super-admin contexts:
- 9-box placement reasoning
- restricted leadership-team talent notes
- succession outputs
- formal risk outputs
- sensitive talent-planning commentary

---

## 13. Recommended Vanilla Build Prompt Set

This is a practical starting set for Trellis v0.

## 13.1 Employee Self Review
1. What were your main responsibilities or focus areas during this review period?
2. How did you progress against your goals during this period?
3. What accomplishments or results are you most proud of?
4. What strengths did you demonstrate most consistently?
5. What are the most important areas you want to improve?
6. What kinds of growth or development are you most interested in next?
7. What support would help you be more effective? (optional)

## 13.2 Manager Review
1. What was the employee’s role context during this review period?
2. How effectively did the employee progress against their goals?
3. What were the employee’s most meaningful contributions or results?
4. What strengths did the employee demonstrate most clearly?
5. What are the most important development areas for this employee?
6. How effectively did the employee demonstrate the behaviors expected in their role?
7. Where do you see growth potential or readiness for broader responsibility?
8. What development focus would most help this employee grow next?
9. Are there retention concerns or notable risks to be aware of? (optional / restricted)

---

## 14. Content Decisions Locked for Vanilla Build

The following decisions are active unless explicitly changed:

- The talent review reference is used as inspiration, not copied structurally
- Self review and manager review are the only active review types
- Employee-facing content is separated from restricted talent content
- Calibration uses review content plus additional restricted rationale
- Succession is a calibration output
- Risk is a calibration output
- PIP is supported by review/calibration context but remains a separate workflow
- Narrative input is preserved in areas where judgment matters