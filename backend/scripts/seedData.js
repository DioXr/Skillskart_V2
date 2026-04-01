const mongoose = require('mongoose');
const Roadmap = require('../models/Roadmap');
const UserProgress = require('../models/UserProgress');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const sampleRoadmaps = [
    // --- 1. FULL STACK WEB DEVELOPER (FLOODED) ---
    {
        title: "Expert Full-Stack Developer",
        category: "Career",
        description: "From Semantic HTML to Cloud Deployment. A 18-node professional curriculum.",
        nodes: [
            { id: "html", type: "proNode", position: { x: 250, y: 0 }, data: { label: "HTML5 & Accessibility", description: "Semantic tags and ARIA standards.", resources: [{ label: "MDN Docs", url: "https://developer.mozilla.org", type: "docs" }] } },
            { id: "css", type: "proNode", position: { x: 250, y: 100 }, data: { label: "Advanced CSS Layouts", description: "Flexbox, Grid, and Animations.", resources: [{ label: "CSS Tricks", url: "https://css-tricks.com", type: "article" }] } },
            { id: "js", type: "proNode", position: { x: 250, y: 200 }, data: { label: "JavaScript Deep Dive", description: "Closures, Async, and Event Loop.", resources: [{ label: "JS Info", url: "https://javascript.info", type: "docs" }] } },
            { id: "react", type: "proNode", position: { x: 250, y: 300 }, data: { label: "React JS: Senior Level", description: "Context API, Hooks, and Optimization.", resources: [{ label: "React.dev", url: "https://react.dev", type: "docs" }] } },
            { id: "node", type: "proNode", position: { x: 250, y: 400 }, data: { label: "Node.js Backend", description: "File systems and non-blocking I/O.", resources: [{ label: "Node.js Best Practices", url: "https://github.com/goldbergyoni/nodebestpractices", type: "docs" }] } },
            { id: "docker", type: "proNode", position: { x: 250, y: 500 }, data: { label: "Docker & Containers", description: "Deploying anywhere with confidence.", codeSnippet: "docker-compose up --build" } }
        ],
        edges: [
            { id: "e1", source: "html", target: "css", animated: true }, { id: "e2", source: "css", target: "js", animated: true },
            { id: "e3", source: "js", target: "react", animated: true }, { id: "e4", source: "react", target: "node", animated: true },
            { id: "e5", source: "node", target: "docker", animated: true }
        ]
    },
    // --- 2. DEVOPS ENGINEER ---
    {
        title: "DevOps Engineer Professional",
        category: "Career",
        description: "Focus on Master Automation, CI/CD, and Cloud Infrastructure.",
        nodes: [
            { id: "linux", type: "proNode", position: { x: 250, y: 0 }, data: { label: "Linux Administration", description: "Kernel, Shell Scripting, and Syscalls." } },
            { id: "networking", type: "proNode", position: { x: 250, y: 100 }, data: { label: "Networking Fundamentals", description: "TCP/IP, DNS, and HTTP/S." } },
            { id: "git", type: "proNode", position: { x: 250, y: 200 }, data: { label: "Advanced Git", description: "Hooks, Branching, and Multi-Repo management." } },
            { id: "cicd", type: "proNode", position: { x: 250, y: 300 }, data: { label: "CI/CD (Jenkins/GitHub Actions)", description: "Automated pipelines and testing." } },
            { id: "k8s", type: "proNode", position: { x: 250, y: 400 }, data: { label: "Kubernetes (K8s)", description: "Pods, Services, and Deployments." } },
            { id: "terraform", type: "proNode", position: { x: 250, y: 500 }, data: { label: "Infrastructure as Code (IaC)", description: "Terraform and Ansible." } }
        ],
        edges: [
            { id: "d1", source: "linux", target: "networking", animated: true }, { id: "d2", source: "networking", target: "git", animated: true },
            { id: "d3", source: "git", target: "cicd", animated: true }, { id: "d4", source: "cicd", target: "k8s", animated: true },
            { id: "d5", source: "k8s", target: "terraform", animated: true }
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
            { id: "rust_syntax", type: "proNode", position: { x: 250, y: 0 }, data: { label: "Rust Basics & Syntax", description: "Enums, Pattern Matching, and Traits." } },
            { id: "borrowing", type: "proNode", position: { x: 250, y: 100 }, data: { label: "Ownership & Borrowing", description: "The core heart of Rust development." } },
            { id: "rust_async", type: "proNode", position: { x: 250, y: 200 }, data: { label: "Asynchronous Rust", description: "Tokio and Futures ecosystem." } },
            { id: "rust_ffi", type: "proNode", position: { x: 250, y: 300 }, data: { label: "Unsafe Rust & FFI", description: "Interfacing with C and low-level optimization." } }
        ],
        edges: [
            { id: "r1", source: "rust_syntax", target: "borrowing", animated: true }, { id: "r2", source: "borrowing", target: "rust_async", animated: true },
            { id: "r3", source: "rust_async", target: "rust_ffi", animated: true }
        ]
    },
    // --- 5. GO LANGUAGE ---
    {
        title: "Go (Golang) Specialist",
        category: "Language",
        description: "Scalable backend development with Go.",
        nodes: [
            { id: "go_basics", type: "proNode", position: { x: 250, y: 0 }, data: { label: "Go Syntax & Fundamentals", description: "Structs, Interfaces, and Packages." } },
            { id: "goroutines", type: "proNode", position: { x: 250, y: 100 }, data: { label: "Concurrency in Go", description: "Goroutines, Channels, and Select." } },
            { id: "go_architecture", type: "proNode", position: { x: 250, y: 200 }, data: { label: "Scalable Architecture", description: "Building microservices with Go." } }
        ],
        edges: [
            { id: "g1", source: "go_basics", target: "goroutines", animated: true }, { id: "g2", source: "goroutines", target: "go_architecture", animated: true }
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
