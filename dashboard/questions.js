// dashboard/questions.js - exam-style question bank and helpers
export const QUESTION_DATABASE = {
    // 2023 November Paper 1 style (30 questions)
    '2023-nov-1': [
        {
            id: 1,
            question: "Which enzyme unwinds the DNA double helix during replication?",
            options: ["DNA polymerase", "Helicase", "Ligase", "Primase"],
            correct: 1,
            marks: 2,
            topic: "dna",
            year: "2023 Nov P1",
            explanation: "Helicase unwinds DNA by breaking hydrogen bonds between bases.",
            difficulty: "easy"
        },
        {
            id: 2,
            question: "In humans, brown eyes (B) are dominant over blue eyes (b). If two heterozygous brown-eyed parents have a child, what is the probability of a blue-eyed child?",
            options: ["0%", "25%", "50%", "75%"],
            correct: 1,
            marks: 3,
            topic: "genetics",
            year: "2023 Nov P1",
            explanation: "Bb × Bb gives 25% BB (brown), 50% Bb (brown), 25% bb (blue).",
            difficulty: "medium"
        },
        {
            id: 3,
            question: "Which of the following is an example of natural selection?",
            options: [
                "Farmers breeding drought-resistant maize",
                "Bacteria developing antibiotic resistance",
                "Scientists creating transgenic plants",
                "Dog breeders selecting for specific traits"
            ],
            correct: 1,
            marks: 2,
            topic: "evolution",
            year: "2023 Nov P1",
            explanation: "Antibiotic resistance develops through natural selection in bacterial populations.",
            difficulty: "medium"
        },
        {
            id: 4,
            question: "What is the function of tRNA in protein synthesis?",
            options: [
                "Carries amino acids to the ribosome",
                "Forms the mRNA template",
                "Unzips DNA strands",
                "Repairs DNA mutations"
            ],
            correct: 0,
            marks: 2,
            topic: "dna",
            year: "2023 Nov P1",
            explanation: "tRNA carries specific amino acids to the ribosome during translation.",
            difficulty: "hard"
        },
        {
            id: 5,
            question: "Which part of the brain controls balance and coordination?",
            options: ["Cerebrum", "Cerebellum", "Medulla oblongata", "Hypothalamus"],
            correct: 1,
            marks: 2,
            topic: "nervous",
            year: "2023 Nov P1",
            explanation: "Cerebellum coordinates voluntary movements and maintains balance.",
            difficulty: "easy"
        },
        {
            id: 6,
            question: "What is the primary function of insulin?",
            options: [
                "Raises blood glucose levels",
                "Lowers blood glucose levels",
                "Stimulates growth",
                "Controls metabolic rate"
            ],
            correct: 1,
            marks: 2,
            topic: "homeostasis",
            year: "2023 Nov P1",
            explanation: "Insulin lowers blood glucose by promoting glucose uptake by cells.",
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
            explanation: "Crossing over occurs during Prophase I when homologous chromosomes pair up.",
            difficulty: "medium"
        },
        {
            id: 8,
            question: "What is the main function of the placenta during pregnancy?",
            options: [
                "Produces hormones only",
                "Provides protection only",
                "Exchanges materials between mother and fetus",
                "Forms the umbilical cord"
            ],
            correct: 2,
            marks: 3,
            topic: "reproduction",
            year: "2023 Nov P1",
            explanation: "Placenta allows nutrient, oxygen, and waste exchange between mother and fetus.",
            difficulty: "medium"
        },
        {
            id: 9,
            question: "Which blood vessel carries deoxygenated blood from the heart to the lungs?",
            options: ["Pulmonary artery", "Pulmonary vein", "Aorta", "Coronary artery"],
            correct: 0,
            marks: 2,
            topic: "circulation",
            year: "2023 Nov P1",
            explanation: "Pulmonary artery carries deoxygenated blood from heart to lungs.",
            difficulty: "easy"
        },
        {
            id: 10,
            question: "What is the function of alveoli in the lungs?",
            options: [
                "Produce mucus",
                "Warm incoming air",
                "Site of gas exchange",
                "Filter dust particles"
            ],
            correct: 2,
            marks: 2,
            topic: "respiration",
            year: "2023 Nov P1",
            explanation: "Alveoli are tiny air sacs where oxygen and carbon dioxide exchange occurs.",
            difficulty: "medium"
        },
        {
            id: 11,
            question: "Which process increases genetic variation during meiosis?",
            options: ["DNA replication", "Crossing over", "Cytokinesis", "Binary fission"],
            correct: 1,
            marks: 2,
            topic: "genetics",
            year: "2023 Nov P1",
            explanation: "Crossing over exchanges genetic material between homologous chromosomes.",
            difficulty: "medium"
        },
        {
            id: 12,
            question: "What is the role of ribosomes in protein synthesis?",
            options: [
                "Carry amino acids",
                "Site of translation",
                "Unwind DNA",
                "Produce mRNA"
            ],
            correct: 1,
            marks: 2,
            topic: "dna",
            year: "2023 Nov P1",
            explanation: "Ribosomes are cellular structures where mRNA is translated into proteins.",
            difficulty: "easy"
        },
        {
            id: 13,
            question: "In a dihybrid cross AaBb × AaBb, what proportion shows both recessive traits?",
            options: ["1/16", "1/4", "3/16", "9/16"],
            correct: 0,
            marks: 3,
            topic: "genetics",
            year: "2023 Nov P1",
            explanation: "Probability of aabb = (1/4) × (1/4) = 1/16 using product rule.",
            difficulty: "hard"
        },
        {
            id: 14,
            question: "Which blood vessel has the highest blood pressure?",
            options: ["Pulmonary artery", "Vena cava", "Capillary", "Aorta"],
            correct: 3,
            marks: 2,
            topic: "circulation",
            year: "2023 Nov P1",
            explanation: "Aorta carries oxygenated blood directly from left ventricle under high pressure.",
            difficulty: "medium"
        },
        {
            id: 15,
            question: "What is the function of the myelin sheath?",
            options: [
                "Produce neurotransmitters",
                "Speed up nerve impulse transmission",
                "Store memories",
                "Regulate body temperature"
            ],
            correct: 1,
            marks: 2,
            topic: "nervous",
            year: "2023 Nov P1",
            explanation: "Myelin sheath insulates axons, increasing conduction speed of nerve impulses.",
            difficulty: "easy"
        },
        {
            id: 16,
            question: "Which hormone stimulates uterine contractions during childbirth?",
            options: ["Oxytocin", "Progesterone", "Oestrogen", "Testosterone"],
            correct: 0,
            marks: 2,
            topic: "reproduction",
            year: "2023 Nov P1",
            explanation: "Oxytocin stimulates uterine muscle contractions during labor.",
            difficulty: "easy"
        },
        {
            id: 17,
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
            year: "2023 Nov P1",
            explanation: "ADH reduces urine output by increasing water reabsorption in kidney tubules.",
            difficulty: "medium"
        },
        {
            id: 18,
            question: "In photosynthesis, where do light-dependent reactions occur?",
            options: ["Stroma", "Thylakoid membranes", "Cytoplasm", "Mitochondria"],
            correct: 1,
            marks: 2,
            topic: "photosynthesis",
            year: "2023 Nov P1",
            explanation: "Light reactions occur in thylakoid membranes of chloroplasts.",
            difficulty: "medium"
        },
        {
            id: 19,
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
            year: "2023 Nov P1",
            explanation: "Large intestine absorbs water, minerals, and forms feces.",
            difficulty: "easy"
        },
        {
            id: 20,
            question: "Which of the following is NOT a function of the liver?",
            options: [
                "Bile production",
                "Detoxification",
                "Insulin production",
                "Glycogen storage"
            ],
            correct: 2,
            marks: 2,
            topic: "homeostasis",
            year: "2023 Nov P1",
            explanation: "Pancreas produces insulin, not liver. Liver stores glycogen.",
            difficulty: "medium"
        },
        {
            id: 21,
            question: "What is osmosis?",
            options: [
                "Movement of water across a semi-permeable membrane",
                "Movement of ions against concentration gradient",
                "Active transport of molecules",
                "Diffusion of gases"
            ],
            correct: 0,
            marks: 2,
            topic: "homeostasis",
            year: "2023 Nov P1",
            explanation: "Osmosis is passive movement of water from high to low water potential.",
            difficulty: "easy"
        },
        {
            id: 22,
            question: "Which brain region is responsible for conscious thought?",
            options: ["Cerebellum", "Brain stem", "Cerebrum", "Medulla"],
            correct: 2,
            marks: 2,
            topic: "nervous",
            year: "2023 Nov P1",
            explanation: "Cerebrum is responsible for higher functions like thought, memory, and consciousness.",
            difficulty: "medium"
        },
        {
            id: 23,
            question: "What is the genetic code?",
            options: [
                "Sequence of DNA bases that codes for proteins",
                "Number of chromosomes in a cell",
                "Type of cell division",
                "Process of protein synthesis"
            ],
            correct: 0,
            marks: 2,
            topic: "dna",
            year: "2023 Nov P1",
            explanation: "Genetic code is the sequence of DNA/RNA bases that determines amino acid sequence.",
            difficulty: "easy"
        },
        {
            id: 24,
            question: "Which process produces genetically identical cells?",
            options: ["Mitosis", "Meiosis", "Fertilization", "Crossing over"],
            correct: 0,
            marks: 2,
            topic: "genetics",
            year: "2023 Nov P1",
            explanation: "Mitosis produces two genetically identical daughter cells.",
            difficulty: "easy"
        },
        {
            id: 25,
            question: "What is the function of antibodies?",
            options: [
                "Carry oxygen",
                "Fight infections",
                "Clot blood",
                "Digest food"
            ],
            correct: 1,
            marks: 2,
            topic: "immunity",
            year: "2023 Nov P1",
            explanation: "Antibodies are proteins that recognize and neutralize pathogens.",
            difficulty: "medium"
        },
        {
            id: 26,
            question: "Which vitamin is produced by skin exposure to sunlight?",
            options: ["Vitamin A", "Vitamin B12", "Vitamin C", "Vitamin D"],
            correct: 3,
            marks: 2,
            topic: "homeostasis",
            year: "2023 Nov P1",
            explanation: "Vitamin D is synthesized in skin when exposed to UV sunlight.",
            difficulty: "easy"
        },
        {
            id: 27,
            question: "What is the function of stomata in plants?",
            options: [
                "Photosynthesis",
                "Gas exchange",
                "Water transport",
                "Nutrient absorption"
            ],
            correct: 1,
            marks: 2,
            topic: "plants",
            year: "2023 Nov P1",
            explanation: "Stomata are pores that allow gas exchange (CO2 in, O2 out).",
            difficulty: "medium"
        },
        {
            id: 28,
            question: "Which blood cells are responsible for oxygen transport?",
            options: ["White blood cells", "Red blood cells", "Platelets", "Plasma"],
            correct: 1,
            marks: 2,
            topic: "circulation",
            year: "2023 Nov P1",
            explanation: "Red blood cells contain hemoglobin that carries oxygen.",
            difficulty: "easy"
        },
        {
            id: 29,
            question: "What is a homozygous genotype?",
            options: [
                "Two different alleles",
                "Two identical alleles",
                "One dominant allele",
                "No alleles"
            ],
            correct: 1,
            marks: 2,
            topic: "genetics",
            year: "2023 Nov P1",
            explanation: "Homozygous means having two identical alleles for a gene.",
            difficulty: "easy"
        },
        {
            id: 30,
            question: "Which organ produces insulin?",
            options: ["Liver", "Pancreas", "Kidney", "Stomach"],
            correct: 1,
            marks: 2,
            topic: "homeostasis",
            year: "2023 Nov P1",
            explanation: "Beta cells in pancreas produce insulin.",
            difficulty: "easy"
        }
    ],

    // 2023 November Paper 2 style (5 questions so far)
    '2023-nov-2': [
        {
            id: 1,
            question: "Label parts A, B, and C in the neuron diagram (A: receives signals, B: contains nucleus, C: transmits signals).",
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
            explanation: "Dendrites receive signals, cell body processes signals, axon transmits signals.",
            difficulty: "hard"
        },
        {
            id: 2,
            question: "Which hormone stimulates milk production after childbirth?",
            options: ["Oxytocin", "Prolactin", "Oestrogen", "Progesterone"],
            correct: 1,
            marks: 2,
            topic: "reproduction",
            year: "2023 Nov P2",
            explanation: "Prolactin stimulates milk production in mammary glands.",
            difficulty: "medium"
        },
        {
            id: 3,
            question: "What is the function of the nephron in the kidney?",
            options: [
                "Filter blood and form urine",
                "Pump blood",
                "Produce hormones",
                "Digest proteins"
            ],
            correct: 0,
            marks: 3,
            topic: "homeostasis",
            year: "2023 Nov P2",
            explanation: "Nephrons are functional units that filter blood and produce urine.",
            difficulty: "hard"
        },
        {
            id: 4,
            question: "Which structure connects a muscle to a bone?",
            options: ["Ligament", "Tendon", "Cartilage", "Joint"],
            correct: 1,
            marks: 2,
            topic: "skeletal",
            year: "2023 Nov P2",
            explanation: "Tendons connect muscles to bones, ligaments connect bones to bones.",
            difficulty: "easy"
        },
        {
            id: 5,
            question: "What is the function of the ribosome?",
            options: [
                "Protein synthesis",
                "ATP production",
                "Lipid synthesis",
                "DNA replication"
            ],
            correct: 0,
            marks: 2,
            topic: "cells",
            year: "2023 Nov P2",
            explanation: "Ribosomes are sites of protein synthesis (translation).",
            difficulty: "easy"
        },
        // Add 25 more questions for Paper 2...
    ],

    // Practice Paper 1: topics examined in DBE Paper 1
    'practice-p1': [
        {
            id: 1,
            question: "During which phase of meiosis do homologous chromosomes pair up to form bivalents?",
            options: ["Prophase I", "Metaphase I", "Anaphase I", "Prophase II"],
            correct: 0,
            marks: 2,
            topic: "meiosis",
            year: "Practice P1",
            explanation: "In Prophase I homologous chromosomes pair up (synapsis) to form bivalents, and crossing over can take place.",
            difficulty: "easy"
        },
        {
            id: 2,
            question: "Crossing over takes place between...",
            options: [
                "non-sister chromatids of homologous chromosomes",
                "sister chromatids of the same chromosome",
                "non-homologous chromosomes",
                "the centromeres of homologous chromosomes"
            ],
            correct: 0,
            marks: 2,
            topic: "meiosis",
            year: "Practice P1",
            explanation: "Crossing over is the exchange of genetic material between non-sister chromatids of a homologous pair, which creates new combinations of alleles.",
            difficulty: "medium"
        },
        {
            id: 3,
            question: "How many chromosomes are in each human cell produced at the end of meiosis II?",
            options: ["46", "23", "92", "44"],
            correct: 1,
            marks: 2,
            topic: "meiosis",
            year: "Practice P1",
            explanation: "Meiosis halves the chromosome number, so each human gamete is haploid with 23 chromosomes.",
            difficulty: "easy"
        },
        {
            id: 4,
            question: "Non-disjunction of chromosome pair 21 during meiosis can result in...",
            options: ["haemophilia", "albinism", "Down syndrome", "colour-blindness"],
            correct: 2,
            marks: 2,
            topic: "meiosis",
            year: "Practice P1",
            explanation: "If chromosome pair 21 fails to separate, a gamete can carry an extra chromosome 21. A zygote formed from it has three copies (trisomy 21), which causes Down syndrome.",
            difficulty: "medium"
        },
        {
            id: 5,
            question: "Animals whose eggs develop and hatch inside the mother's body, without a placenta, are described as...",
            options: ["oviparous", "ovoviviparous", "viviparous", "altricial"],
            correct: 1,
            marks: 2,
            topic: "vertebrates",
            year: "Practice P1",
            explanation: "Ovoviviparous animals keep their eggs inside the body until they hatch; the embryo is nourished by the yolk, not by a placenta.",
            difficulty: "medium"
        },
        {
            id: 6,
            question: "Which membrane of the amniotic egg surrounds the embryo with fluid that protects it from shock and drying out?",
            options: ["Chorion", "Allantois", "Amnion", "Yolk sac"],
            correct: 2,
            marks: 2,
            topic: "vertebrates",
            year: "Practice P1",
            explanation: "The amnion encloses the amniotic fluid, which cushions the embryo and prevents it from drying out.",
            difficulty: "medium"
        },
        {
            id: 7,
            question: "Which hormone causes ovulation?",
            options: ["FSH", "Progesterone", "LH", "Oestrogen"],
            correct: 2,
            marks: 2,
            topic: "reproduction",
            year: "Practice P1",
            explanation: "A surge of luteinising hormone (LH) from the pituitary gland causes the mature Graafian follicle to release the ovum.",
            difficulty: "easy"
        },
        {
            id: 8,
            question: "After ovulation, the Graafian follicle develops into the...",
            options: ["corpus luteum", "endometrium", "zygote", "blastocyst"],
            correct: 0,
            marks: 2,
            topic: "reproduction",
            year: "Practice P1",
            explanation: "The empty follicle becomes the corpus luteum, which secretes progesterone to maintain the endometrium.",
            difficulty: "easy"
        },
        {
            id: 9,
            question: "Where does fertilisation normally take place in humans?",
            options: ["Uterus", "Fallopian tube (oviduct)", "Vagina", "Ovary"],
            correct: 1,
            marks: 2,
            topic: "reproduction",
            year: "Practice P1",
            explanation: "Fertilisation usually happens in the Fallopian tube; the zygote then moves to the uterus for implantation.",
            difficulty: "easy"
        },
        {
            id: 10,
            question: "What is the main function of the placenta?",
            options: [
                "It produces ova",
                "It allows oxygen, nutrients and wastes to be exchanged between mother and foetus",
                "It secretes FSH",
                "It cushions the foetus against mechanical shock"
            ],
            correct: 1,
            marks: 2,
            topic: "reproduction",
            year: "Practice P1",
            explanation: "The placenta is where substances diffuse between the maternal and foetal blood without the two blood supplies mixing. Shock absorption is the role of the amniotic fluid.",
            difficulty: "medium"
        },
        {
            id: 11,
            question: "Where does spermatogenesis take place?",
            options: ["Epididymis", "Seminiferous tubules", "Vas deferens", "Prostate gland"],
            correct: 1,
            marks: 2,
            topic: "reproduction",
            year: "Practice P1",
            explanation: "Sperm are produced by meiosis in the seminiferous tubules of the testes, then mature in the epididymis.",
            difficulty: "easy"
        },
        {
            id: 12,
            question: "Which part of the brain coordinates voluntary movements and maintains balance?",
            options: ["Cerebrum", "Medulla oblongata", "Cerebellum", "Corpus callosum"],
            correct: 2,
            marks: 2,
            topic: "nervous",
            year: "Practice P1",
            explanation: "The cerebellum coordinates muscle movements and helps maintain balance and posture.",
            difficulty: "easy"
        },
        {
            id: 13,
            question: "Which is the correct order of structures in a reflex arc?",
            options: [
                "Receptor → motor neuron → interneuron → sensory neuron → effector",
                "Effector → sensory neuron → interneuron → motor neuron → receptor",
                "Receptor → interneuron → sensory neuron → motor neuron → effector",
                "Receptor → sensory neuron → interneuron → motor neuron → effector"
            ],
            correct: 3,
            marks: 2,
            topic: "nervous",
            year: "Practice P1",
            explanation: "The receptor detects the stimulus, the sensory neuron carries the impulse to the spinal cord, the interneuron passes it on, and the motor neuron carries it to the effector.",
            difficulty: "medium"
        },
        {
            id: 14,
            question: "Which function is controlled by the medulla oblongata?",
            options: ["Memory and intelligence", "Heartbeat and breathing rate", "Balance", "Linking the two cerebral hemispheres"],
            correct: 1,
            marks: 2,
            topic: "nervous",
            year: "Practice P1",
            explanation: "The medulla oblongata controls involuntary actions such as heartbeat, breathing and peristalsis.",
            difficulty: "easy"
        },
        {
            id: 15,
            question: "What happens in the eye when a person changes focus from a distant object to a nearby object?",
            options: [
                "Ciliary muscles contract, suspensory ligaments slacken and the lens becomes more convex",
                "Ciliary muscles relax, suspensory ligaments become taut and the lens becomes more convex",
                "Ciliary muscles contract, suspensory ligaments become taut and the lens becomes flatter",
                "Ciliary muscles relax, suspensory ligaments slacken and the lens becomes flatter"
            ],
            correct: 0,
            marks: 2,
            topic: "senses",
            year: "Practice P1",
            explanation: "For near vision (accommodation), the ciliary muscles contract, the suspensory ligaments slacken and the elastic lens becomes more convex to bend light more.",
            difficulty: "hard"
        },
        {
            id: 16,
            question: "Which structure in the ear contains the receptors for hearing?",
            options: ["Semicircular canals", "Organ of Corti", "Sacculus", "Eustachian tube"],
            correct: 1,
            marks: 2,
            topic: "senses",
            year: "Practice P1",
            explanation: "The organ of Corti in the cochlea contains hair cells that convert vibrations into nerve impulses.",
            difficulty: "medium"
        },
        {
            id: 17,
            question: "What is the function of the Eustachian tube?",
            options: [
                "It transmits vibrations to the oval window",
                "It equalises the pressure on both sides of the tympanic membrane",
                "It detects changes in the position of the head",
                "It converts vibrations into nerve impulses"
            ],
            correct: 1,
            marks: 2,
            topic: "senses",
            year: "Practice P1",
            explanation: "The Eustachian tube connects the middle ear to the pharynx so the pressure on both sides of the eardrum stays equal.",
            difficulty: "medium"
        },
        {
            id: 18,
            question: "Which gland secretes thyroid-stimulating hormone (TSH)?",
            options: ["Thyroid gland", "Hypothalamus", "Pituitary gland", "Adrenal gland"],
            correct: 2,
            marks: 2,
            topic: "endocrine",
            year: "Practice P1",
            explanation: "TSH is secreted by the pituitary gland (hypophysis) and stimulates the thyroid gland to secrete thyroxine.",
            difficulty: "easy"
        },
        {
            id: 19,
            question: "A lack of iodine in the diet can lead to which condition?",
            options: ["Diabetes mellitus", "Goitre", "Gigantism", "Down syndrome"],
            correct: 1,
            marks: 2,
            topic: "endocrine",
            year: "Practice P1",
            explanation: "Iodine is needed to make thyroxine. Without it the thyroid gland enlarges, forming a goitre.",
            difficulty: "easy"
        },
        {
            id: 20,
            question: "Which effect does adrenaline have on the body?",
            options: [
                "It lowers the heart rate",
                "It raises the heart rate and the blood glucose level",
                "It stimulates milk production",
                "It lowers the metabolic rate"
            ],
            correct: 1,
            marks: 2,
            topic: "endocrine",
            year: "Practice P1",
            explanation: "Adrenaline prepares the body for 'fight or flight': it increases heart rate and breathing rate and stimulates the conversion of glycogen to glucose.",
            difficulty: "medium"
        },
        {
            id: 21,
            question: "When the blood glucose level rises above normal, the pancreas secretes...",
            options: [
                "glucagon, which converts glycogen to glucose",
                "insulin, which stimulates the liver to convert glucose to glycogen",
                "insulin, which converts glycogen to glucose",
                "glucagon, which converts glucose to glycogen"
            ],
            correct: 1,
            marks: 2,
            topic: "homeostasis",
            year: "Practice P1",
            explanation: "Insulin lowers blood glucose by stimulating the liver and muscles to convert excess glucose into glycogen (negative feedback).",
            difficulty: "medium"
        },
        {
            id: 22,
            question: "On a hot day, how does the skin help to lower body temperature?",
            options: [
                "Vasoconstriction and less sweating",
                "Vasodilation and more sweating",
                "Vasodilation and less sweating",
                "Vasoconstriction and more sweating"
            ],
            correct: 1,
            marks: 2,
            topic: "homeostasis",
            year: "Practice P1",
            explanation: "Arterioles in the skin dilate so more heat is lost by radiation, and sweat glands produce more sweat, which removes heat as it evaporates.",
            difficulty: "medium"
        },
        {
            id: 23,
            question: "When the water content of the blood is low, more ADH is secreted. ADH makes the...",
            options: [
                "renal tubules less permeable, so more urine is produced",
                "distal tubules and collecting ducts more permeable, so more water is reabsorbed",
                "glomerulus filter more blood",
                "bladder store more urine"
            ],
            correct: 1,
            marks: 2,
            topic: "homeostasis",
            year: "Practice P1",
            explanation: "ADH increases the permeability of the distal convoluted tubules and collecting ducts, so more water returns to the blood and a small volume of concentrated urine is produced.",
            difficulty: "hard"
        },
        {
            id: 24,
            question: "How do auxins cause a stem to bend towards light?",
            options: [
                "Auxins move to the lit side and stimulate cell elongation there",
                "Auxins are destroyed on the shaded side",
                "Auxins move to the shaded side, where cells elongate more",
                "Auxins slow down growth on the shaded side"
            ],
            correct: 2,
            marks: 2,
            topic: "plant-responses",
            year: "Practice P1",
            explanation: "Light causes auxins to accumulate on the shaded side of the stem. Cells there elongate faster, so the stem bends towards the light (positive phototropism).",
            difficulty: "medium"
        },
        {
            id: 25,
            question: "Which plant hormone stimulates seed germination?",
            options: ["Abscisic acid", "Auxins", "Gibberellins", "Insulin"],
            correct: 2,
            marks: 2,
            topic: "plant-responses",
            year: "Practice P1",
            explanation: "Gibberellins stimulate germination; abscisic acid has the opposite effect and keeps seeds dormant.",
            difficulty: "easy"
        }
    ],

    // Practice Paper 2: topics examined in DBE Paper 2
    'practice-p2': [
        {
            id: 1,
            question: "A DNA nucleotide is made up of...",
            options: [
                "a phosphate, a ribose sugar and a nitrogenous base",
                "a phosphate, a deoxyribose sugar and a nitrogenous base",
                "an amino acid, a deoxyribose sugar and a nitrogenous base",
                "a phosphate, glucose and a nitrogenous base"
            ],
            correct: 1,
            marks: 2,
            topic: "dna",
            year: "Practice P2",
            explanation: "DNA nucleotides contain deoxyribose sugar; RNA nucleotides contain ribose.",
            difficulty: "easy"
        },
        {
            id: 2,
            question: "In a DNA molecule, 30% of the bases are adenine. What percentage of the bases are cytosine?",
            options: ["30%", "20%", "40%", "70%"],
            correct: 1,
            marks: 2,
            topic: "dna",
            year: "Practice P2",
            explanation: "Adenine pairs with thymine, so A + T = 60%. That leaves 40% for C + G, and because they pair equally, cytosine = 20%.",
            difficulty: "medium"
        },
        {
            id: 3,
            question: "Where in the cell is mRNA made?",
            options: ["Ribosome", "Cytoplasm", "Nucleus", "Cell membrane"],
            correct: 2,
            marks: 2,
            topic: "dna",
            year: "Practice P2",
            explanation: "mRNA is made in the nucleus during transcription, then moves to a ribosome for translation.",
            difficulty: "easy"
        },
        {
            id: 4,
            question: "A DNA template strand has the sequence ATG CCA. What is the sequence of the mRNA transcribed from it?",
            options: ["TAC GGT", "UAC GGU", "AUG CCA", "UAG GGU"],
            correct: 1,
            marks: 2,
            topic: "dna",
            year: "Practice P2",
            explanation: "mRNA is complementary to the template strand, with uracil (U) replacing thymine: A→U, T→A, G→C, C→G.",
            difficulty: "medium"
        },
        {
            id: 5,
            question: "Which tRNA anticodon pairs with the mRNA codon AUG?",
            options: ["AUG", "TAC", "UAC", "ATG"],
            correct: 2,
            marks: 2,
            topic: "dna",
            year: "Practice P2",
            explanation: "The anticodon is complementary to the codon and, being RNA, contains uracil rather than thymine: UAC.",
            difficulty: "medium"
        },
        {
            id: 6,
            question: "Which is a use of DNA profiling?",
            options: [
                "Identifying suspects and determining paternity",
                "Curing genetic disorders",
                "Producing insulin",
                "Cloning animals"
            ],
            correct: 0,
            marks: 2,
            topic: "dna",
            year: "Practice P2",
            explanation: "DNA profiles are unique to each person (except identical twins), so they are used in forensic investigations and paternity testing.",
            difficulty: "easy"
        },
        {
            id: 7,
            question: "A gene mutation is best described as...",
            options: [
                "a change in the number of cells",
                "a change in the sequence of nitrogenous bases in DNA",
                "the process of copying DNA",
                "the pairing of homologous chromosomes"
            ],
            correct: 1,
            marks: 2,
            topic: "dna",
            year: "Practice P2",
            explanation: "A gene mutation is a change in the base sequence of DNA, which may change the protein that is produced.",
            difficulty: "easy"
        },
        {
            id: 8,
            question: "Why is meiosis important in sexual reproduction?",
            options: [
                "It doubles the chromosome number in gametes",
                "It produces identical body cells for growth",
                "It repairs damaged tissue",
                "It halves the chromosome number and introduces genetic variation"
            ],
            correct: 3,
            marks: 2,
            topic: "meiosis",
            year: "Practice P2",
            explanation: "Meiosis produces haploid gametes, so the diploid number is restored at fertilisation, and crossing over and random arrangement create variation.",
            difficulty: "medium"
        },
        {
            id: 9,
            question: "Crossing a red-flowered plant with a white-flowered plant produces only pink-flowered offspring. This is an example of...",
            options: ["complete dominance", "co-dominance", "incomplete dominance", "sex-linked inheritance"],
            correct: 2,
            marks: 2,
            topic: "genetics",
            year: "Practice P2",
            explanation: "In incomplete dominance neither allele is fully dominant, so the heterozygote has an intermediate phenotype (pink).",
            difficulty: "easy"
        },
        {
            id: 10,
            question: "A person with the genotype IᴬIᴮ has blood group...",
            options: ["A", "B", "AB", "O"],
            correct: 2,
            marks: 2,
            topic: "genetics",
            year: "Practice P2",
            explanation: "Iᴬ and Iᴮ are co-dominant, so both are expressed and the blood group is AB.",
            difficulty: "easy"
        },
        {
            id: 11,
            question: "A mother with blood group O and a father with blood group AB can have children with blood group...",
            options: ["O or AB", "A or B", "AB only", "A, B, AB or O"],
            correct: 1,
            marks: 3,
            topic: "genetics",
            year: "Practice P2",
            explanation: "ii × IᴬIᴮ gives Iᴬi (group A) or Iᴮi (group B) only.",
            difficulty: "hard"
        },
        {
            id: 12,
            question: "Why does the father determine the sex of a child?",
            options: [
                "Half of his sperm carry an X chromosome and half carry a Y chromosome",
                "All of his sperm carry a Y chromosome",
                "His sperm carry two X chromosomes",
                "The mother's eggs carry either an X or a Y chromosome"
            ],
            correct: 0,
            marks: 2,
            topic: "genetics",
            year: "Practice P2",
            explanation: "All eggs carry an X chromosome. If a Y-carrying sperm fertilises the egg the child is male (XY); an X-carrying sperm gives a female (XX).",
            difficulty: "medium"
        },
        {
            id: 13,
            question: "A woman who carries the allele for haemophilia (XᴴXʰ) has children with a man who does not have haemophilia (XᴴY). What percentage of their sons are expected to have haemophilia?",
            options: ["0%", "25%", "50%", "100%"],
            correct: 2,
            marks: 3,
            topic: "genetics",
            year: "Practice P2",
            explanation: "Sons get their X chromosome from the mother, so half the sons get Xʰ and have haemophilia.",
            difficulty: "hard"
        },
        {
            id: 14,
            question: "What is the expected phenotypic ratio of the offspring of a dihybrid cross between two heterozygous parents (AaBb × AaBb)?",
            options: ["3 : 1", "1 : 2 : 1", "9 : 3 : 3 : 1", "1 : 1 : 1 : 1"],
            correct: 2,
            marks: 2,
            topic: "genetics",
            year: "Practice P2",
            explanation: "Each parent forms four types of gametes; the 16 combinations give a 9:3:3:1 ratio of phenotypes.",
            difficulty: "medium"
        },
        {
            id: 15,
            question: "To find out whether a tall pea plant is homozygous or heterozygous, it should be crossed with a plant that is...",
            options: ["homozygous dominant", "heterozygous", "homozygous recessive", "tall"],
            correct: 2,
            marks: 2,
            topic: "genetics",
            year: "Practice P2",
            explanation: "In a test cross with a homozygous recessive (short) plant, any short offspring show that the tall parent was heterozygous.",
            difficulty: "medium"
        },
        {
            id: 16,
            question: "Which of the following is an example of genetic engineering?",
            options: [
                "Selective breeding of cattle",
                "Inserting the human insulin gene into bacteria",
                "Natural selection in bacteria",
                "Crossing two pea plants"
            ],
            correct: 1,
            marks: 2,
            topic: "genetics",
            year: "Practice P2",
            explanation: "Genetic engineering transfers a gene from one organism into another, for example so that bacteria produce human insulin.",
            difficulty: "easy"
        },
        {
            id: 17,
            question: "Lamarck's theory of evolution was based on...",
            options: [
                "natural selection and survival of the fittest",
                "the law of use and disuse and the inheritance of acquired characteristics",
                "punctuated equilibrium",
                "genetic mutations"
            ],
            correct: 1,
            marks: 2,
            topic: "evolution",
            year: "Practice P2",
            explanation: "Lamarck proposed that organs develop with use or shrink with disuse, and that these acquired changes are passed on. This idea was later rejected.",
            difficulty: "easy"
        },
        {
            id: 18,
            question: "Punctuated equilibrium describes evolution as...",
            options: [
                "long periods of little change interrupted by short periods of rapid change",
                "slow, steady change over very long periods",
                "change caused only by mutations",
                "change that happens in a single generation"
            ],
            correct: 0,
            marks: 2,
            topic: "evolution",
            year: "Practice P2",
            explanation: "Punctuated equilibrium proposes that species stay unchanged for long periods, with rapid change and speciation happening in short bursts.",
            difficulty: "medium"
        },
        {
            id: 19,
            question: "What is the first event in speciation through geographic isolation?",
            options: [
                "The two populations can no longer interbreed",
                "A population is split by a geographical barrier",
                "Natural selection acts differently on each population",
                "New alleles appear by mutation"
            ],
            correct: 1,
            marks: 2,
            topic: "evolution",
            year: "Practice P2",
            explanation: "First a barrier (such as a river or mountain) splits the population. Each group then evolves separately until they can no longer interbreed.",
            difficulty: "medium"
        },
        {
            id: 20,
            question: "Which of the following is a reproductive isolating mechanism?",
            options: [
                "Breeding at different times of the year",
                "Living in the same habitat",
                "Having the same courtship behaviour",
                "Producing fertile hybrids"
            ],
            correct: 0,
            marks: 2,
            topic: "evolution",
            year: "Practice P2",
            explanation: "Different breeding seasons stop two species from interbreeding, keeping their gene pools separate.",
            difficulty: "medium"
        },
        {
            id: 21,
            question: "The forelimbs of humans, bats and whales have the same basic bone structure. These are...",
            options: [
                "analogous structures that show convergent evolution",
                "homologous structures that suggest a common ancestor",
                "vestigial structures",
                "structures produced by artificial selection"
            ],
            correct: 1,
            marks: 2,
            topic: "evolution",
            year: "Practice P2",
            explanation: "Homologous structures have the same basic plan but different functions, which is evidence that the species share a common ancestor.",
            difficulty: "easy"
        },
        {
            id: 22,
            question: "Which skull feature suggests that an organism walked upright (was bipedal)?",
            options: [
                "Large canine teeth",
                "Prominent brow ridges",
                "A foramen magnum positioned forward, towards the centre of the skull",
                "A prognathous (protruding) jaw"
            ],
            correct: 2,
            marks: 2,
            topic: "human-evolution",
            year: "Practice P2",
            explanation: "A forward-positioned foramen magnum means the skull balanced on top of a vertical spine, which indicates bipedalism.",
            difficulty: "medium"
        },
        {
            id: 23,
            question: "The 'Out of Africa' hypothesis states that...",
            options: [
                "modern humans (Homo sapiens) originated in Africa and later migrated to other continents",
                "modern humans evolved separately on different continents",
                "Homo erectus never left Africa",
                "apes evolved from humans in Africa"
            ],
            correct: 0,
            marks: 2,
            topic: "human-evolution",
            year: "Practice P2",
            explanation: "Fossil and genetic (e.g. mitochondrial DNA) evidence suggests Homo sapiens evolved in Africa and then spread across the world.",
            difficulty: "easy"
        },
        {
            id: 24,
            question: "The Taung Child fossil, found in South Africa, belongs to which species?",
            options: ["Homo naledi", "Australopithecus africanus", "Homo erectus", "Ardipithecus ramidus"],
            correct: 1,
            marks: 2,
            topic: "human-evolution",
            year: "Practice P2",
            explanation: "The Taung Child, described by Raymond Dart in 1925, was the first Australopithecus africanus fossil to be found.",
            difficulty: "medium"
        },
        {
            id: 25,
            question: "Compared with African apes, humans have...",
            options: [
                "a larger, more protruding jaw",
                "a larger cranium and smaller canine teeth",
                "arms that are longer than their legs",
                "a foramen magnum positioned towards the back of the skull"
            ],
            correct: 1,
            marks: 2,
            topic: "human-evolution",
            year: "Practice P2",
            explanation: "Humans have a larger brain case, smaller canines, a flatter face, and a forward-positioned foramen magnum.",
            difficulty: "medium"
        }
    ]
};

// Papers shown in the app. Only papers with questions in QUESTION_DATABASE are listed.
// The keys of the first two sets are kept as-is so saved results still match.
export const PAPERS = [
    { key: 'practice-p1', title: 'Practice Paper 1', group: 'Exam-style papers', description: 'Reproduction, nervous system, senses, hormones, homeostasis and plant responses' },
    { key: 'practice-p2', title: 'Practice Paper 2', group: 'Exam-style papers', description: 'DNA, meiosis, genetics, evolution and human evolution' },
    { key: '2023-nov-1', title: 'Mixed Practice Set A', group: 'Mixed practice sets', description: 'Questions from across the syllabus' },
    { key: '2023-nov-2', title: 'Mixed Practice Set B', group: 'Mixed practice sets', description: 'Short set from across the syllabus' }
]
    .map(paper => ({ ...paper, questionCount: (QUESTION_DATABASE[paper.key] || []).length }))
    .filter(paper => paper.questionCount > 0);

// grade12: part of the Grade 12 CAPS content; the rest is earlier-grade revision
export const TOPICS = {
    dna: { name: 'DNA & Protein Synthesis', icon: 'dna', description: 'Nucleotides, transcription, translation, mutations and DNA profiling', grade12: true },
    meiosis: { name: 'Meiosis', icon: 'clone', description: 'Phases, crossing over and non-disjunction', grade12: true },
    genetics: { name: 'Genetics & Inheritance', icon: 'sitemap', description: 'Monohybrid and dihybrid crosses, blood groups and sex-linked traits', grade12: true },
    evolution: { name: 'Evolution', icon: 'fish', description: 'Natural selection, speciation and evidence for evolution', grade12: true },
    'human-evolution': { name: 'Human Evolution', icon: 'person-walking', description: 'Hominid fossils, bipedalism and Out of Africa', grade12: true },
    vertebrates: { name: 'Reproduction in Vertebrates', icon: 'egg', description: 'Reproductive strategies and the amniotic egg', grade12: true },
    reproduction: { name: 'Human Reproduction', icon: 'baby', description: 'Reproductive systems, menstrual cycle and pregnancy', grade12: true },
    nervous: { name: 'Nervous System', icon: 'brain', description: 'Neurons, reflex arcs and the parts of the brain', grade12: true },
    senses: { name: 'The Eye & Ear', icon: 'eye', description: 'Accommodation, hearing and balance', grade12: true },
    endocrine: { name: 'Endocrine System', icon: 'flask', description: 'Glands, hormones and their effects', grade12: true },
    homeostasis: { name: 'Homeostasis', icon: 'temperature-half', description: 'Negative feedback: glucose, temperature and water balance', grade12: true },
    'plant-responses': { name: 'Plant Responses', icon: 'sun-plant-wilt', description: 'Plant hormones and tropisms', grade12: true },
    cells: { name: 'Cells', icon: 'circle-nodes', description: 'Cell structure and organelles', grade12: false },
    circulation: { name: 'Circulation', icon: 'heart-pulse', description: 'Heart, blood vessels and blood', grade12: false },
    digestion: { name: 'Digestion', icon: 'utensils', description: 'Digestive system and enzymes', grade12: false },
    immunity: { name: 'Immunity', icon: 'shield-virus', description: 'Defence against disease', grade12: false },
    photosynthesis: { name: 'Photosynthesis', icon: 'leaf', description: 'Light and dark phases', grade12: false },
    plants: { name: 'Plants', icon: 'seedling', description: 'Plant structure and responses', grade12: false },
    respiration: { name: 'Respiration', icon: 'lungs', description: 'Cellular respiration', grade12: false },
    skeletal: { name: 'Skeleton & Muscles', icon: 'bone', description: 'Support and movement', grade12: false }
};

export function topicName(topic) {
    return TOPICS[topic]?.name || (topic ? topic.charAt(0).toUpperCase() + topic.slice(1) : 'Unknown');
}

// Every question gets a unique key ("paper#id") so results can be stored per question
const ALL_QUESTIONS = Object.entries(QUESTION_DATABASE).flatMap(([paper, questions]) =>
    questions.map(q => ({ ...q, paper, key: `${paper}#${q.id}` }))
);

export function getQuestionByKey(key) {
    return ALL_QUESTIONS.find(q => q.key === key) || null;
}

export function getPaper(paperKey) {
    return PAPERS.find(p => p.key === paperKey) || null;
}

export function getPaperQuestions(paperKey) {
    return ALL_QUESTIONS.filter(q => q.paper === paperKey);
}

export function getQuestionsByTopic(topic) {
    return ALL_QUESTIONS.filter(q => q.topic === topic);
}

export function countQuestionsByTopic() {
    const counts = {};
    ALL_QUESTIONS.forEach(q => { counts[q.topic] = (counts[q.topic] || 0) + 1; });
    return counts;
}

// Fisher–Yates shuffle (every order equally likely)
export function shuffle(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

export function getMixedQuestions(count = 10) {
    return shuffle(ALL_QUESTIONS).slice(0, count);
}

// One minute per question, never less than five minutes
export function timeLimitFor(questionCount) {
    return Math.max(5, questionCount) * 60;
}