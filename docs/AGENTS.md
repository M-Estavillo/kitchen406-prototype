# BPMN authoring and validation

- Supply BPMNDI for every visual level, including the contents of collapsed embedded subprocesses. A collapsed subprocess with internal elements needs its own BPMNDiagram/BPMNPlane referencing the subprocess, with shapes and edges for its contents, so bpmn.io drill-down is not blank.
- Validate recursively: check each process and subprocess, not only the main collaboration plane. Verify references, incoming/outgoing links, diagram coverage, positioning and connection clearance at each level.
- Do not describe XML/geometry checks as a successful bpmn.io import or visual inspection unless that check was actually performed.
- Keep detailed business rules available in the visible subprocess diagram (tasks or annotations), rather than relying solely on XML documentation.

- For detailed catalog BPMNs, show local validation activities and essential failure branches on the main diagram. In particular, permission denial, stale versions, invalid allocations and lock conflicts must be visible in BPMN-12. Do not hide these behind a collapsed local subprocess. Use collapsed references for separately owned catalog workflows when appropriate.

- Minimum detail for future BPMNs: match the revised BPMN-11/12. Show local checks, decisions, essential failure/recovery outcomes and cancellation paths on the main diagram; place readable rule annotations directly beside the relevant task. Do not leave decision criteria only in XML documentation. Reuse separately owned workflows without duplicating their internals. Keep any unresolved business-rule changes separate from readability revisions.
