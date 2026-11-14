import { SalesCue } from '../types';

export const SALES_CUES_FRAMEWORK: Omit<SalesCue, 'score' | 'percentage' | 'observation' | 'improvement' | 'evidence' | 'severity' | 'isAssessable'>[] = [
  { id: 1, name: 'Introduction & Rapport', evaluationFocus: 'Did salesperson introduce themselves, establish credibility and build rapport?' },
  { id: 2, name: 'Requirement Discovery', evaluationFocus: 'Did they identify engineering requirements, project scope, constraints and expectations?' },
  { id: 3, name: 'Questioning Skills', evaluationFocus: 'Did they ask relevant open-ended and probing questions to uncover needs, priorities and decision criteria?' },
  { id: 4, name: 'Active Listening', evaluationFocus: 'Did they listen carefully, acknowledge concerns and avoid unnecessary interruptions or assumptions?' },
  { id: 5, name: 'Technical Understanding', evaluationFocus: 'Did they demonstrate relevant understanding of engineering, CNC machining, fabrication, materials and manufacturing feasibility?' },
  { id: 6, name: 'Solution Presentation', evaluationFocus: 'Did they recommend relevant services and explain how the solution addresses requirements?' },
  { id: 7, name: 'Value Proposition', evaluationFocus: 'Did they communicate differentiators such as capabilities, quality, cost efficiency and delivery benefits?' },
  { id: 8, name: 'Commercial Awareness', evaluationFocus: 'Did they explore/address budget, pricing, production volumes, timelines and purchasing requirements?' },
  { id: 9, name: 'Objection Handling', evaluationFocus: 'Did they respond effectively to pricing, quality, delivery, technical feasibility or supplier reliability concerns?' },
  { id: 10, name: 'Trust & Confidence', evaluationFocus: 'Did they communicate professionally, provide credible information and build confidence without unsupported claims?' },
  { id: 11, name: 'Closing & Next Steps', evaluationFocus: 'Did they move toward a clear next action such as RFQ, drawing submission, quotation, technical review or order?' },
  { id: 12, name: 'Follow-up Commitment', evaluationFocus: 'Did they agree clear responsibilities, deliverables and follow-up timelines?' }
];
