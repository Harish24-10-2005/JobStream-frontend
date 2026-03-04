const str = (v) => (v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v));
const arr = (v) => (Array.isArray(v) ? v : []);
const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});

function unwrap(val, ...keys) {
    if (Array.isArray(val)) return val.filter(q => q && typeof q === 'object');
    if (val && typeof val === 'object' && !Array.isArray(val)) {
        const o = val;
        for (const k of keys) {
            if (Array.isArray(o[k])) return o[k].filter(q => q && typeof q === 'object');
        }
    }
    return [];
}

const data = {
    "success": true,
    "analysis": {
        "role": "Ai Engineer",
        "company": "Google",
        "is_senior_role": false,
        "technical_focus": [],
        "soft_skills_focus": [
            "Communication",
            "Teamwork"
        ],
        "leadership_focus": [],
        "interview_rounds": [
            "Phone Screen",
            "Technical Round",
            "Coding Round",
            "Behavioral Round",
            "Hiring Manager"
        ],
        "preparation_priority": {
            "technical": 40,
            "behavioral": 30,
            "system_design": 10,
            "company_knowledge": 10
        }
    },
    "resources": {
        "dsa_sheets": [
            {
                "name": "Striver's SDE Sheet",
                "url": "https://takeuforward.org/interviews/strivers-sde-sheet-top-coding-interview-problems/",
                "description": "180 problems covering all DSA topics",
                "difficulty": "Medium-Hard"
            }
        ]
    }
};

const d = obj(data);
const root = d.result ? obj(d.result) : d;

const technicalQs = unwrap(root.technical_questions, 'technical_questions', 'questions');
const behavioralQs = unwrap(root.behavioral_questions, 'questions', 'behavioral_questions');
const systemDesignQs = unwrap(root.system_design_questions, 'questions', 'system_design_questions');
const codingQs = unwrap(root.coding_questions, 'questions', 'coding_questions');
const allQuestions = unwrap(root.questions, 'questions');

const analysis = obj(root.analysis || root.job_analysis);
const resources = obj(root.resources);
const tips = arr(root.tips || root.general_tips || root.interview_tips);

const hasContent = technicalQs.length > 0 || behavioralQs.length > 0 || systemDesignQs.length > 0 ||
    codingQs.length > 0 || allQuestions.length > 0 || Object.keys(analysis).length > 0 ||
    Object.keys(resources).length > 0 || tips.length > 0;

console.log("hasContent:", hasContent);
console.log("analysis keys:", Object.keys(analysis).length);
console.log("resources keys:", Object.keys(resources).length);
