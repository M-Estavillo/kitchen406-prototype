# BPMN authoring and validation

- Supply BPMNDI for every visual level, including the contents of collapsed embedded subprocesses. A collapsed subprocess with internal elements needs its own BPMNDiagram/BPMNPlane referencing the subprocess, with shapes and edges for its contents, so bpmn.io drill-down is not blank.
- Validate recursively: check each process and subprocess, not only the main collaboration plane. Verify references, incoming/outgoing links, diagram coverage, positioning and connection clearance at each level.
- Do not describe XML/geometry checks as a successful bpmn.io import or visual inspection unless that check was actually performed.
- Keep detailed business rules available in the visible subprocess diagram (tasks or annotations), rather than relying solely on XML documentation.

- For detailed catalog BPMNs, show local validation activities and essential failure branches on the main diagram. In particular, permission denial, stale versions, invalid allocations and lock conflicts must be visible in BPMN-16. Do not hide these behind a collapsed local subprocess. Use collapsed references for separately owned catalog workflows when appropriate.

- Minimum detail for future BPMNs: match the revised BPMN-15/16. Show local checks, decisions, essential failure/recovery outcomes and cancellation paths on the main diagram; place readable rule annotations directly beside the relevant task. Do not leave decision criteria only in XML documentation. Reuse separately owned workflows without duplicating their internals. Keep any unresolved business-rule changes separate from readability revisions.

- Recoverable validation, upload and save failures must visibly offer review/correction, safe retry and stop/cancel within the same user workflow. Do not end an attempt with a retry instruction but no return path. Refresh stale records before resubmission, preserve drafts separately, reuse successful uploads/known saved results, and revalidate permissions/current versions before writing. Update older diagrams only when the user requests that work.

- Model the proposed system with the SRS as the main authority. Review the website for context, but do not limit proposed workflows or recovery paths to its current implementation: the website will be revised. Show explicit correction, safe retry and cancellation for recoverable failures, including necessary reliability safeguards, without adding unsupported business functionality. Proposed recovery activities express process behavior, not a claim that particular screens/buttons or backend mechanisms already exist. Keep implementation-gap explanations in BPMN documentation or the delivery summary when useful.
