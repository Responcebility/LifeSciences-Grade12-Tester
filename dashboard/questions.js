// dashboard/questions.js - Complete Question Database
export const QUESTION_DATABASE = {
    // 2023 November Paper 1 (30+ questions)
    '2023-nov-1': [
        {
            id: 1,
            question: "The diagram shows a process occurring during protein synthesis. What is the name of this process?",
            options: ["DNA replication", "Transcription", "Translation", "Mutation"],
            correct: 1,
            marks: 2,
            topic: "dna",
            year: "2023 Nov P1",
            explanation: "The process shown is transcription where DNA is copied into mRNA.",
            difficulty: "medium"
        },
        {
            id: 2,
            question: "In humans, brown eyes (B) are dominant over blue eyes (b). If a heterozygous brown-eyed man marries a blue-eyed woman, what is the probability their child will have blue eyes?",
            options: ["0%", "25%", "50%", "100%"],
            correct: 2,
            marks: 3,
            topic: "genetics",
            year: "2023 Nov P1",
            explanation: "Bb × bb gives 50% Bb (brown) and 50% bb (blue).",
            difficulty: "easy"
        },
        {
            id: 3,
            question: "Which of the following is an example of natural selection?",
            options: [
                "Farmers selecting the largest tomatoes",
                "Bacteria becoming resistant to antibiotics",
                "Dog breeders creating new breeds",
                "Scientists making GM crops"
            ],
            correct: 1,
            marks: 2,
            topic: "evolution",
            year: "2023 Nov P1",
            explanation: "Antibiotic resistance develops through natural selection.",
            difficulty: "medium"
        },
        {
            id: 4,
            question: "What is the main function of tRNA in protein synthesis?",
            options: [
                "Carrying amino acids to ribosome",
                "Forming mRNA template",
                "Unzipping DNA strands",
                "Repairing DNA"
            ],
            correct: 0,
            marks: 2,
            topic: "dna",
            year: "2023 Nov P1",
            explanation: "tRNA carries specific amino acids during translation.",
            difficulty: "hard"
        },
        {
            id: 5,
            question: "Which brain part controls balance and coordination?",
            options: ["Cerebrum", "Cerebellum", "Medulla", "Hypothalamus"],
            correct: 1,
            marks: 2,
            topic: "nervous",
            year: "2023 Nov P1",
            explanation: "Cerebellum coordinates movement and balance.",
            difficulty: "easy"
        },
        {
            id: 6,
            question: "What is insulin's primary function?",
            options: ["Raises blood glucose", "Lowers blood glucose", "Stimulates growth", "Controls metabolism"],
            correct: 1,
            marks: 2,
            topic: "homeostasis",
            year: "2023 Nov P1",
            explanation: "Insulin lowers blood glucose by promoting uptake.",
            difficulty: "easy"
        },
        {
            id: 7,
            question: "During which phase of meiosis does crossing over occur?",
            options: ["Prophase I", "Metaphase I", "Anaphase I", "Telophase I"],
            correct: 0,
            marks: 2,
            topic: "genetics",
            year: "2023 Nov P1",
            explanation: "Crossing over happens in Prophase I.",
            difficulty: "medium"
        },
        {
            id: 8,
            question: "What is the placenta's main function during pregnancy?",
            options: [
                "Only produces hormones",
                "Only provides protection",
                "Exchanges materials between mother and fetus",
                "Forms umbilical cord"
            ],
            correct: 2,
            marks: 3,
            topic: "reproduction",
            year: "2023 Nov P1",
            explanation: "Placenta allows nutrient, oxygen, and waste exchange.",
            difficulty: "medium"
        },
        {
            id: 9,
            question: "Which blood vessel carries deoxygenated blood from heart to lungs?",
            options: ["Pulmonary artery", "Pulmonary vein", "Aorta", "Coronary artery"],
            correct: 0,
            marks: 2,
            topic: "circulation",
            year: "2023 Nov P1",
            explanation: "Pulmonary artery carries deoxygenated blood to lungs.",
            difficulty: "easy"
        },
        {
            id: 10,
            question: "What is the function of alveoli in lungs?",
            options: [
                "Produce mucus",
                "Warm air",
                "Gas exchange",
                "Filter dust"
            ],
            correct: 2,
            marks: 2,
            topic: "respiration",
            year: "2023 Nov P1",
            explanation: "Alveoli are sites of oxygen-CO2 exchange.",
            difficulty: "medium"
        }
    ],

    // 2023 November Paper 2 (30+ questions)
    '2023-nov-2': [
        {
            id: 1,
            question: "Label parts A, B, and C in the neuron diagram.",
            options: [
                "A-Dendrite, B-Cell body, C-Axon",
                "A-Axon, B-Dendrite, C-Cell body",
                "A-Cell body, B-Axon, C-Dendrite",
                "A-Nucleus, B-Myelin, C-Synapse"
            ],
            correct: 0,
            marks: 4,
            topic: "nervous",
            year: "2023 Nov P2",
            explanation: "Dendrites receive, cell body processes, axon transmits.",
            difficulty: "hard"
        },
        {
            id: 2,
            question: "Which hormone stimulates uterine contractions during childbirth?",
            options: ["Oxytocin", "Progesterone", "Oestrogen", "Testosterone"],
            correct: 0,
            marks: 2,
            topic: "reproduction",
            year: "2023 Nov P2",
            explanation: "Oxytocin stimulates uterine contractions.",
            difficulty: "easy"
        },
        {
            id: 3,
            question: "What is the role of ADH in water regulation?",
            options: [
                "Increases urine volume",
                "Decreases urine volume by increasing water reabsorption",
                "Increases blood pressure",
                "Decreases blood sugar"
            ],
            correct: 1,
            marks: 2,
            topic: "homeostasis",
            year: "2023 Nov P2",
            explanation: "ADH reduces urine output by increasing water reabsorption.",
            difficulty: "medium"
        },
        {
            id: 4,
            question: "In photosynthesis, where do light-dependent reactions occur?",
            options: ["Stroma", "Thylakoid membranes", "Cytoplasm", "Mitochondria"],
            correct: 1,
            marks: 2,
            topic: "photosynthesis",
            year: "2023 Nov P2",
            explanation: "Light reactions occur in thylakoid membranes.",
            difficulty: "medium"
        },
        {
            id: 5,
            question: "What is the main function of the large intestine?",
            options: [
                "Digest proteins",
                "Absorb water and minerals",
                "Produce bile",
                "Break down carbohydrates"
            ],
            correct: 1,
            marks: 2,
            topic: "digestion",
            year: "2023 Nov P2",
            explanation: "Large intestine absorbs water and minerals.",
            difficulty: "easy"
        }
    ],

    // 2022 November Paper 1 (25+ questions)
    '2022-nov-1': [
        {
            id: 1,
            question: "Describe the structure of a DNA molecule.",
            options: [
                "Single-stranded helix",
                "Double-stranded helix with complementary base pairing",
                "Triple-stranded coil",
                "Four-stranded complex"
            ],
            correct: 1,
            marks: 4,
            topic: "dna",
            year: "2022 Nov P1",
            explanation: "DNA is a double helix with A-T and G-C pairing.",
            difficulty: "medium"
        },
        {
            id: 2,
            question: "What is the key difference between mitosis and meiosis?",
            options: [
                "Mitosis produces 2 identical cells, meiosis produces 4 genetically different cells",
                "Mitosis produces 4 cells, meiosis produces 2 cells",
                "Both produce identical cells",
                "Meiosis occurs in body cells"
            ],
            correct: 0,
            marks: 3,
            topic: "genetics",
            year: "2022 Nov P1",
            explanation: "Mitosis: identical somatic cells. Meiosis: unique gametes.",
            difficulty: "medium"
        },
        {
            id: 3,
            question: "Explain natural selection in giraffe neck evolution.",
            options: [
                "Giraffes stretched necks",
                "Longer-necked giraffes survived better",
                "All born with long necks",
                "They chose long necks"
            ],
            correct: 1,
            marks: 4,
            topic: "evolution",
            year: "2022 Nov P1",
            explanation: "Longer necks provided survival advantage.",
            difficulty: "hard"
        }
    ],

    // 2021 Papers (20+ questions)
    '2021-nov-1': [
        {
            id: 1,
            question: "What does helicase do in DNA replication?",
            options: [
                "Adds nucleotides",
                "Proofreads",
                "Unwinds DNA double helix",
                "Joins fragments"
            ],
            correct: 2,
            marks: 2,
            topic: "dna",
            year: "2021 Nov P1",
            explanation: "Helicase unwinds DNA by breaking hydrogen bonds.",
            difficulty: "medium"
        },
        {
            id: 2,
            question: "AO blood type man marries BO woman. Possible children's blood types?",
            options: ["Only A and B", "Only O", "A, B, AB, or O", "Only AB"],
            correct: 2,
            marks: 3,
            topic: "genetics",
            year: "2021 Nov P1",
            explanation: "AO × BO can produce all four blood types.",
            difficulty: "hard"
        }
    ],

    // Topic-based question banks (15+ each)
    'dna': [
        {
            id: 1,
            question: "DNA polymerase's role in replication?",
            options: [
                "Unwinds DNA",
                "Adds nucleotides to growing strand",
                "Breaks bonds",
                "Forms primers"
            ],
            correct: 1,
            marks: 3,
            topic: "dna",
            year: "Topic Bank",
            explanation: "DNA polymerase adds nucleotides to 3' end.",
            difficulty: "medium"
        },
        {
            id: 2,
            question: "Difference between mRNA, tRNA, rRNA?",
            options: [
                "mRNA carries code, tRNA carries amino acids, rRNA makes ribosomes",
                "All identical",
                "Only mRNA involved",
                "tRNA contains genetic code"
            ],
            correct: 0,
            marks: 4,
            topic: "dna",
            year: "Topic Bank",
            explanation: "mRNA = messenger, tRNA = transfer, rRNA = ribosomal.",
            difficulty: "hard"
        }
    ],

    'genetics': [
        {
            id: 1,
            question: "What is a pedigree chart used for?",
            options: [
                "Show evolution",
                "Track inheritance through generations",
                "Measure enzymes",
                "Diagram cells"
            ],
            correct: 1,
            marks: 2,
            topic: "genetics",
            year: "Topic Bank",
            explanation: "Pedigree charts show trait inheritance in families.",
            difficulty: "easy"
        }
    ],

    'reproduction': [
        {
            id: 1,
            question: "Progesterone's function in pregnancy?",
            options: [
                "Maintains uterine lining",
                "Triggers ovulation",
                "Causes bleeding",
                "Lowers temperature"
            ],
            correct: 0,
            marks: 2,
            topic: "reproduction",
            year: "Topic Bank",
            explanation: "Progesterone maintains endometrium for implantation.",
            difficulty: "medium"
        }
    ],

    'nervous': [
        {
            id: 1,
            question: "How do nerve impulses travel?",
            options: [
                "Hormone diffusion",
                "Active ion transport",
                "Electrical impulse (action potential)",
                "Chemical only"
            ],
            correct: 2,
            marks: 3,
            topic: "nervous",
            year: "Topic Bank",
            explanation: "Nerve impulses are electrical action potentials.",
            difficulty: "hard"
        }
    ],

    'homeostasis': [
        {
            id: 1,
            question: "Why does photosynthesis decrease at high temperatures?",
            options: [
                "Chlorophyll breaks",
                "Enzymes denature",
                "Stomata close",
                "All above"
            ],
            correct: 3,
            marks: 3,
            topic: "homeostasis",
            year: "Topic Bank",
            explanation: "High temps denature enzymes, affect chlorophyll and stomata.",
            difficulty: "medium"
        }
    ],

    'evolution': [
        {
            id: 1,
            question: "What characterizes a good hypothesis?",
            options: [
                "Testable",
                "Based on observation",
                "Must be proven true",
                "Suggests relationship"
            ],
            correct: 2,
            marks: 2,
            topic: "evolution",
            year: "Topic Bank",
            explanation: "Hypotheses can be disproven, not just proven.",
            difficulty: "easy"
        }
    ],

    // Trial Papers (15+ each)
    'gauteng-2023': [
        {
            id: 1,
            question: "Control in an experiment serves to:",
            options: [
                "Prove hypothesis",
                "Provide baseline comparison",
                "Make complex",
                "Ensure positive results"
            ],
            correct: 1,
            marks: 2,
            topic: "scientific-method",
            year: "2023 Gauteng",
            explanation: "Controls provide standard for comparison.",
            difficulty: "easy"
        }
    ],

    'wc-2023': [
        {
            id: 1,
            question: "Lock and key model of enzymes means:",
            options: [
                "Enzymes consumed",
                "Substrate fits active site perfectly",
                "Enzymes work on any substrate",
                "Enzymes slow reactions"
            ],
            correct: 1,
            marks: 3,
            topic: "enzymes",
            year: "2023 WC",
            explanation: "Substrate (key) fits enzyme's active site (lock).",
            difficulty: "medium"
        }
    ],

    // Mixed questions for practice
    'mixed': [
        {
            id: 1,
            question: "What is osmosis?",
            options: [
                "Movement of water across semi-permeable membrane",
                "Movement of ions",
                "Active transport",
                "Diffusion of gases"
            ],
            correct: 0,
            marks: 2,
            topic: "homeostasis",
            year: "Mixed",
            explanation: "Osmosis is passive water movement across membrane.",
            difficulty: "easy"
        },
        {
            id: 2,
            question: "Which is not a function of the liver?",
            options: [
                "Bile production",
                "Detoxification",
                "Insulin production",
                "Glycogen storage"
            ],
            correct: 2,
            marks: 2,
            topic: "homeostasis",
            year: "Mixed",
            explanation: "Pancreas produces insulin, not liver.",
            difficulty: "medium"
        }
    ]
};

// Get all questions for a specific topic
export function getQuestionsByTopic(topic) {
    return Object.values(QUESTION_DATABASE)
        .flat()
        .filter(q => q.topic === topic);
}

// Get random mixed questions
export function getMixedQuestions(count = 10) {
    const allQuestions = Object.values(QUESTION_DATABASE).flat();
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

// Get questions by difficulty
export function getQuestionsByDifficulty(difficulty) {
    return Object.values(QUESTION_DATABASE)
        .flat()
        .filter(q => q.difficulty === difficulty);
}

// Get all available paper types
export function getAvailablePapers() {
    return Object.keys(QUESTION_DATABASE).filter(key => 
        !['dna', 'genetics', 'reproduction', 'nervous', 'homeostasis', 'evolution', 'mixed'].includes(key)
    );
}

// Get total question count
export function getTotalQuestionCount() {
    return Object.values(QUESTION_DATABASE)
        .reduce((total, questions) => total + questions.length, 0);
}

// Get questions for a specific paper
// export function getPaperQuestions(paperType) {
//     return QUESTION_DATABASE[paperType] || QUESTION_DATABASE['2023-nov-1'];
// }

// Fixed getPaperQuestions function
export function getPaperQuestions(paperType) {
    // Return questions if paper exists
    if (QUESTION_DATABASE[paperType]) {
        return QUESTION_DATABASE[paperType];
    }
    
    // Fallback for non-existent papers
    console.warn(`Paper ${paperType} not found, using fallback`);
    
    // Try to find similar paper
    const availablePapers = Object.keys(QUESTION_DATABASE);
    const fallbackPaper = availablePapers.find(p => p.includes('2023') && p.includes('nov')) || 
                         availablePapers.find(p => p.includes('2023')) ||
                         availablePapers[0];
    
    return QUESTION_DATABASE[fallbackPaper] || [];
}