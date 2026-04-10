const mongoose = require('mongoose');
const Roadmap = require('../models/Roadmap');
const UserProgress = require('../models/UserProgress');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const sampleRoadmaps = [
    // --- 1. FULL STACK WEB DEVELOPER (FLOODED WITH BRANCHES) ---
    {
        title: "Expert Full-Stack Developer",
        category: "Career",
        description: "From Semantic HTML to Cloud Deployment. A branched professional curriculum inspired by Roadmap.sh.",
        nodes: [
            // Spine
            { id: "internet", type: "proNode", position: { x: 500, y: 0 }, data: { label: "Internet Fundamentals", description: "How the web works, HTTP, and Browsers.", isSpine: true } },
            
            // Branches from Internet
            { id: "http", type: "proNode", position: { x: 0, y: 0 }, data: { label: "What is HTTP?", description: "Transfer protocols and request-response cycle.", isSpine: false } },
            { id: "dns", type: "proNode", position: { x: 0, y: 0 }, data: { label: "DNS & Domains", description: "How names are resolved to IPs.", isSpine: false } },
            { id: "hosting", type: "proNode", position: { x: 0, y: 0 }, data: { label: "Hosting", description: "Where your websites live.", isSpine: false } },
            
            // Spine continues
            { id: "frontend", type: "proNode", position: { x: 500, y: 300 }, data: { label: "Frontend Basics", description: "HTML, CSS, and basic JavaScript.", isSpine: true } },
            
            // Branches from Frontend
            { id: "html", type: "proNode", position: { x: 0, y: 0 }, data: { label: "Semantic HTML", description: "Accessibility and structure.", isSpine: false } },
            { id: "css_basic", type: "proNode", position: { x: 0, y: 0 }, data: { label: "CSS Foundations", description: "Selectors, Flexbox, and Grid.", isSpine: false } },
            
            // Spine continues
            { id: "js_adv", type: "proNode", position: { x: 500, y: 600 }, data: { label: "Advanced JavaScript", description: "Async, Prototypes, and ESM.", isSpine: true } },
            
            // Branches from JS
            { id: "dom", type: "proNode", position: { x: 0, y: 0 }, data: { label: "DOM Manipulation", description: "Interaction with the browser API.", isSpine: false } },
            { id: "apis", type: "proNode", position: { x: 0, y: 0 }, data: { label: "Fetch & Web APIs", description: "Working with external data.", isSpine: false } },
            
            // Spine continues
            { id: "react_spine", type: "proNode", position: { x: 500, y: 900 }, data: { label: "Modern Frontend (React)", description: "Hooks, State, and Routing.", isSpine: true } },
            
            // Branches from React
            { id: "nextjs", type: "proNode", position: { x: 0, y: 0 }, data: { label: "Next.js & SSR", description: "Full-stack React frameworks.", isSpine: false } },
            { id: "state_mgnt", type: "proNode", position: { x: 0, y: 0 }, data: { label: "State Management", description: "Redux, Zustand, and Context.", isSpine: false } }
        ],
        edges: [
            // Spine Edges
            { id: "e_i_f", source: "internet", target: "frontend", type: "step", style: { stroke: "#0a84ff", strokeWidth: 3 } },
            { id: "e_f_j", source: "frontend", target: "js_adv", type: "step", style: { stroke: "#0a84ff", strokeWidth: 3 } },
            { id: "e_j_r", source: "js_adv", target: "react_spine", type: "step", style: { stroke: "#0a84ff", strokeWidth: 3 } },
            
            // Branch Edges
            { id: "e_i_h", source: "internet", target: "http", type: "step", style: { stroke: "#0a84ff", strokeWidth: 2, strokeDasharray: "5 5" } },
            { id: "e_i_d", source: "internet", target: "dns", type: "step", style: { stroke: "#0a84ff", strokeWidth: 2, strokeDasharray: "5 5" } },
            { id: "e_i_ho", source: "internet", target: "hosting", type: "step", style: { stroke: "#0a84ff", strokeWidth: 2, strokeDasharray: "5 5" } },
            
            { id: "e_f_ht", source: "frontend", target: "html", type: "step", style: { stroke: "#0a84ff", strokeWidth: 2, strokeDasharray: "5 5" } },
            { id: "e_f_cs", source: "frontend", target: "css_basic", type: "step", style: { stroke: "#0a84ff", strokeWidth: 2, strokeDasharray: "5 5" } },
            
            { id: "e_j_do", source: "js_adv", target: "dom", type: "step", style: { stroke: "#0a84ff", strokeWidth: 2, strokeDasharray: "5 5" } },
            { id: "e_j_ap", source: "js_adv", target: "apis", type: "step", style: { stroke: "#0a84ff", strokeWidth: 2, strokeDasharray: "5 5" } },
            
            { id: "e_r_nx", source: "react_spine", target: "nextjs", type: "step", style: { stroke: "#0a84ff", strokeWidth: 2, strokeDasharray: "5 5" } },
            { id: "e_r_st", source: "react_spine", target: "state_mgnt", type: "step", style: { stroke: "#0a84ff", strokeWidth: 2, strokeDasharray: "5 5" } }
        ]
    },
    // --- 2. DEVOPS ENGINEER ---
    {
        title: "DevOps Engineer Professional",
        category: "Career",
        description: "Master Automation and Infrastructure.",
        nodes: [
            { id: "linux", type: "proNode", position: { x: 250, y: 0 }, data: { label: "Linux Administration", isSpine: true } },
            { id: "bash", type: "proNode", position: { x: 0, y: 0 }, data: { label: "Bash Scripting", isSpine: false } },
            { id: "networking", type: "proNode", position: { x: 250, y: 150 }, data: { label: "Networking", isSpine: true } },
            { id: "docker", type: "proNode", position: { x: 250, y: 300 }, data: { label: "Containers (Docker)", isSpine: true } }
        ],
        edges: [
            { id: "d1", source: "linux", target: "networking", type: "step" },
            { id: "d2", source: "linux", target: "bash", type: "step", style: { strokeDasharray: "5 5" } },
            { id: "d3", source: "networking", target: "docker", type: "step" }
        ]
    },
    // --- 3. DATA SCIENCE ---
    {
        title: "Expert Data Scientist",
        category: "Career",
        description: "Master Data Analysis, Machine Learning, and Neural Networks.",
        nodes: [
            { id: "stats", type: "proNode", position: { x: 250, y: 0 }, data: { label: "Probability & Statistics", description: "Distributions, Hypothesis Testing." } },
            { id: "python_ds", type: "proNode", position: { x: 250, y: 100 }, data: { label: "Python for Data Science", description: "NumPy, Pandas, and Matplotlib." } },
            { id: "ml_foundations", type: "proNode", position: { x: 250, y: 200 }, data: { label: "Machine Learning Found.", description: "Regression, Clustering, and SVMs." } },
            { id: "dl", type: "proNode", position: { x: 250, y: 300 }, data: { label: "Deep Learning (NNs)", description: "CNNs, RNNs, and Transformers.", resources: [{ label: "Fast.ai", url: "https://www.fast.ai", type: "article" }] } },
            { id: "deployment", type: "proNode", position: { x: 250, y: 400 }, data: { label: "Model Deployment", description: "Deploying models with FastAPI & AWS." } }
        ],
        edges: [
            { id: "s1", source: "stats", target: "python_ds", animated: true }, { id: "s2", source: "python_ds", target: "ml_foundations", animated: true },
            { id: "s3", source: "ml_foundations", target: "dl", animated: true }, { id: "s4", source: "dl", target: "deployment", animated: true }
        ]
    },
    // --- 4. RUST LANGUAGE ---
    {
        title: "Mastering Rust Programming",
        category: "Language",
        description: "System programming with safety and performance.",
        nodes: [
            { id: "rust_syntax", type: "proNode", position: { x: 500, y: 0 }, data: { label: "Rust Basics & Syntax", description: "Enums, Pattern Matching, and Traits.", isSpine: true } },
            { id: "borrowing", type: "proNode", position: { x: 500, y: 200 }, data: { label: "Ownership & Borrowing", description: "The core heart of Rust development.", isSpine: true } },
            { id: "rust_async", type: "proNode", position: { x: 200, y: 300 }, data: { label: "Asynchronous Rust", description: "Tokio and Futures ecosystem.", isSpine: false } }, // Branch
            { id: "rust_ffi", type: "proNode", position: { x: 500, y: 400 }, data: { label: "Unsafe Rust & FFI", description: "Interfacing with C and low-level optimization.", isSpine: true } }
        ],
        edges: [
            { id: "r1", source: "rust_syntax", target: "borrowing", type: "step", style: { stroke: "#0a84ff", strokeWidth: 3 } },
            { id: "r2", source: "borrowing", target: "rust_async", type: "step", style: { stroke: "#0a84ff", strokeWidth: 2, strokeDasharray: "5 5" } },
            { id: "r3", source: "borrowing", target: "rust_ffi", type: "step", style: { stroke: "#0a84ff", strokeWidth: 3 } }
        ]
    },
    // --- 5. GO LANGUAGE ---
    {
        title: "Go (Golang) Specialist",
        category: "Language",
        description: "Scalable backend development with Go.",
        nodes: [
            { id: "go_basics", type: "proNode", position: { x: 500, y: 0 }, data: { label: "Go Syntax & Fundamentals", description: "Structs, Interfaces, and Packages.", isSpine: true } },
            { id: "goroutines", type: "proNode", position: { x: 750, y: 150 }, data: { label: "Concurrency in Go", description: "Goroutines, Channels, and Select.", isSpine: false } },
            { id: "go_architecture", type: "proNode", position: { x: 500, y: 300 }, data: { label: "Scalable Architecture", description: "Building microservices with Go.", isSpine: true } }
        ],
        edges: [
            { id: "g1", source: "go_basics", target: "goroutines", type: "step", style: { stroke: "#0a84ff", strokeWidth: 2, strokeDasharray: "5 5" } },
            { id: "g2", source: "go_basics", target: "go_architecture", type: "step", style: { stroke: "#0a84ff", strokeWidth: 3 } }
        ]
    },
    // --- 6. BLOCKCHAIN DEVELOPER ---
    {
        title: "Expert Blockchain Developer",
        category: "Career",
        description: "Master Smart Contracts, Ethereum, and Solidity.",
        nodes: [
            { id: "bc_found", type: "proNode", position: { x: 250, y: 0 }, data: { label: "Blockchain Foundations", description: "P2P, Cryptography, and Consesnsus." } },
            { id: "solidity", type: "proNode", position: { x: 250, y: 100 }, data: { label: "Solidity Programming", description: "Writing Ethereum Smart Contracts." } },
            { id: "web3", type: "proNode", position: { x: 250, y: 200 }, data: { label: "Web3 Integration", description: "Ethers.js and React integration." } },
            { id: "defi", type: "proNode", position: { x: 250, y: 300 }, data: { label: "DeFi & DAOs", description: "Building complex decentralised protocols." } }
        ],
        edges: [
            { id: "b1", source: "bc_found", target: "solidity", animated: true }, { id: "b2", source: "solidity", target: "web3", animated: true },
            { id: "b3", source: "web3", target: "defi", animated: true }
        ]
    },
    // --- 7. CYBERSECURITY ---
    {
        title: "CyberSecurity Analyst",
        category: "Career",
        description: "Defending systems and Ethical Hacking.",
        nodes: [
            { id: "security_found", type: "proNode", position: { x: 250, y: 0 }, data: { label: "Security Foundations", description: "Threat modeling and Risk assessment." } },
            { id: "network_security", type: "proNode", position: { x: 250, y: 100 }, data: { label: "Penetration Testing", description: "Firewalls, VPNs, and Network Hardening." } },
            { id: "endpoint", type: "proNode", position: { x: 250, y: 200 }, data: { label: "Ethical Hacking Tools", description: "Metasploit, Nmap, and Wireshark." } }
        ],
        edges: [
            { id: "c1", source: "security_found", target: "network_security", animated: true }, { id: "c2", source: "network_security", target: "endpoint", animated: true }
        ]
    },
    // --- 8. SWIFT (IOS DEVELOPER) ---
    {
        title: "Professional iOS Developer",
        category: "Language",
        description: "Master Swift and SwiftUI for the Apple Ecosystem.",
        nodes: [
            { id: "swift_found", type: "proNode", position: { x: 250, y: 0 }, data: { label: "Swift Fundamentals", description: "Closures, Optionals, and Structs." } },
            { id: "swiftui", type: "proNode", position: { x: 250, y: 100 }, data: { label: "SwiftUI Design", description: "Declarative UI for modern Apple apps." } },
            { id: "ios_arch", type: "proNode", position: { x: 250, y: 200 }, data: { label: "iOS Architecture", description: "MVVM and Clean Architecture in iOS." } }
        ],
        edges: [
            { id: "sw1", source: "swift_found", target: "swiftui", animated: true }, { id: "sw2", source: "swiftui", target: "ios_arch", animated: true }
        ]
    },
    // --- 9. JAVA DEVELOPER ---
    {
        title: "Senior Java Developer",
        category: "Career",
        description: "Enterprise application development with Spring Boot.",
        nodes: [
            { id: "java_core", type: "proNode", position: { x: 250, y: 0 }, data: { label: "Core Java & OOP", description: "Collections, Generics, and Streams." } },
            { id: "spring", type: "proNode", position: { x: 250, y: 100 }, data: { label: "Spring Boot Framework", description: "Dependency Injection and MVC." } },
            { id: "microservices", type: "proNode", position: { x: 250, y: 200 }, data: { label: "Java Microservices", description: "Kafka, Docker, and K8s integration." } }
        ],
        edges: [
            { id: "jv1", source: "java_core", target: "spring", animated: true }, { id: "jv2", source: "spring", target: "microservices", animated: true }
        ]
    },
    // --- 10. FLUTTER DEVELOPER ---
    {
        title: "Flutter & Dart Master",
        category: "Career",
        description: "Build beautiful multi-platform applications.",
        nodes: [
            { id: "dart", type: "proNode", position: { x: 250, y: 0 }, data: { label: "Dart Language Expert", description: "Mixins, Extensions, and Asynchronous Dart." } },
            { id: "flutter_ui", type: "proNode", position: { x: 250, y: 100 }, data: { label: "Advanced Flutter UI", description: "Custom painters and Animations." } },
            { id: "flutter_state", type: "proNode", position: { x: 250, y: 200 }, data: { label: "State Management", description: "Bloc, Riverpod, and Provider." } }
        ],
        edges: [
            { id: "fl1", source: "dart", target: "flutter_ui", animated: true }, { id: "fl2", source: "flutter_ui", target: "flutter_state", animated: true }
        ]
    }
];

const User = require('../models/User');

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Flood: Connected to MongoDB for V2 'Flood' seeding...");
        
        await Roadmap.deleteMany({});
        await UserProgress.deleteMany({});
        await User.deleteMany({}); // Optional: clear users too for a clean V2 start
        
        // 1. Create Default Admin
        const admin = await User.create({
            name: 'System Overlord',
            email: 'admin123@gmail.com',
            password: 'password123',
            role: 'admin',
            isAdmin: true // Forced legacy fallback
        });
        console.log("Default Admin Created: admin123@gmail.com / password123 🛡️ [Role: admin, isAdmin: true]");

        // 2. Insert Roadmaps
        await Roadmap.insertMany(sampleRoadmaps);
        
        console.log("Successfully FLOODED V2 Data with Next-Gen Minimalist Visuals! 🔥");
        process.exit();
    } catch (error) {
        console.error("Error Seeding:", error.message);
        process.exit(1);
    }
};

seedData();
