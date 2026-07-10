const SARANG_CONTEXT = `
You are the official AI Portfolio Assistant of Sarang K. You answer questions strictly, accurately, and professionally based on Sarang's profile, experience, projects, education, and skills. 

Here is Sarang K's verified portfolio information:

1. PERSONAL DETAILS:
- Name: Sarang K
- Role: Software Developer & Full Stack Developer
- Location: Kottayodi, Kerala, India
- Website/Portfolio URL: https://github.com/Sarangk2024 (GitHub)
- LinkedIn: https://www.linkedin.com/in/sarang-k-37073226b
- Resume Download: assets/resume.pdf
- Available for Work: Yes, immediately available.

2. EDUCATION:
- Degree: Bachelor of Technology (B.Tech) in Computer Science and Engineering
- Institution: College Of Engineering Thalassery (Kannur, Kerala, India)
- Batch: 2022 - 2026 Batch
- Grade: 8.88 CGPA

3. WORK EXPERIENCE (INTERNSHIPS):
- AI Developer Intern at Zecser Business LLP (Remote, May 2026 - Present):
  * Building NLP-based document processing pipelines using Python and spaCy.
  * Developing AI-integrated backend modules for internal tools.
  * Collaborating on modular system architecture with REST API endpoints in AWS and Git.
- AI Intern at Infosys Springboard (Remote, Dec 2025 - Mar 2026):
  * Completed structured AI/ML training covering supervised learning, model evaluation, and NLP fundamentals.
  * Built and evaluated classification models using Python and scikit-learn.
  * Worked on 3+ hands-on projects involving data preprocessing and model training.
- Web Developer Intern at Grohub (Remote, Jun 2025 - Oct 2025):
  * Developed and maintained responsive web pages using HTML, CSS, JavaScript, and modern web technologies.
  * Optimized website performance, responsiveness, and cross-browser compatibility.
  * Assisted in building and improving user interfaces for client and internal web projects.
- Web Developer Intern at Eqsoft Business Solutions Pvt Ltd (Thrissur, Kerala, On-site, Jun 2025):
  * Developed and maintained responsive web and mobile application modules using ASP.NET and Flutter.
  * Integrated REST APIs and debugged cross-platform compatibility issues.

4. PROJECTS:
- DocPilot AI (AI Developer Tool):
  * Tech Stack: AI, FastAPI, React, GitHub API.
  * Details: Transforms GitHub repositories into structured documentation, interactive code graphs, API insights, security analysis, and intelligent repo Q&A to help developers understand codebases faster. Live Demo: https://repo-documentation.vercel.app/
- Zecpath AI (AI Recruitment platform - Ongoing):
  * Tech Stack: AI, Python, Recruitment analysis.
  * Details: Platform that uses AI to analyze resumes, match candidates with job requirements, and streamline hiring workflows for faster screening.
- Fake Product Detection (Counterfeit detection system):
  * Tech Stack: Blockchain, NFC tags, Node.js backend.
  * Details: Blockchain-based counterfeit product detection system using NFC technology. Products are registered on-chain and verified via NFC tags to ensure authenticity in real-time. Live Project: https://supply-chain-1-0rut.onrender.com/
- AgriDetect AI (AI Plant Disease Detection):
  * Tech Stack: AI/ML deep learning, Web App.
  * Details: Web-based plant disease detection AI using deep learning to analyze leaf images, identify diseases, and guide farmers on corrective actions. Live Project: https://agridetectai.vercel.app/
- Chat Application (Realtime messaging app):
  * Tech Stack: Firebase, JavaScript, Sockets.
  * Details: Real-time chat application with instant messaging and user authentication.
- Other notable projects: Dubai Trip Assistant (AI planner), Spotify Clone (HTML/CSS player UI), Object Detection (TensorFlow.js), Healthcare Appointment System (Java OOP), Smart Helmet (IoT rider safety).

5. TECHNICAL SKILLS:
- Frontend: HTML5, CSS3, JavaScript, React, Three.js, Flutter
- Backend & Frameworks: Node.js, Express, Django, .NET, REST APIs
- Programming Languages: Python, Java, C++, C#, PHP
- Databases, Cloud & Tools: MySQL, PostgreSQL, AWS, Git, Docker, Linux, Postman
`;

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }

    const { message, history } = req.body;
    if (!message) {
        res.status(400).json({ error: 'Message is required' });
        return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        res.status(500).json({ error: 'Gemini API key is not configured on the server. Please set the GEMINI_API_KEY environment variable.' });
        return;
    }

    try {
        // --- STEP 1: ROUTING NODE (Classifying user intent) ---
        const classificationPrompt = `
You are a routing node in a LangGraph workflow. Your job is to classify the user's message.
User Message: "${message}"

Respond with ONLY one of these three exact words:
- ABOUT_SARANG: If the message asks about Sarang, his experience, projects, skills, education, details, contact info, or is a generic greeting (e.g. "hello", "hi", "hey").
- GENERAL_QA: If the message asks a general technical, programming, coding, engineering, math, or computer science question (e.g. "what is a promise in JS", "explain neural networks", "how to write a binary search").
- OFF_TOPIC: If the message is completely unrelated to Sarang or software engineering (e.g. "who is the president", "tell me a cookie recipe", "what is the weather like", "suggest some movies").
`;

        const classifierResponse = await callGemini(apiKey, classificationPrompt);
        const classification = classifierResponse.trim().toUpperCase();

        // --- STEP 2 & 3: CONDITIONAL EXECUTION NODES ---
        if (classification.includes('OFF_TOPIC')) {
            // Off-Topic Response Node
            res.status(200).json({
                response: "I am Sarang K's portfolio assistant. I can only assist you with questions about Sarang's work, experience, projects, or general software development topics. Please ask me about those fields!"
            });
            return;
        }

        let finalPrompt = "";
        if (classification.includes('GENERAL_QA')) {
            // General QA Response Node
            finalPrompt = `
System Context: You are the AI Assistant of Sarang K, a software developer. Answer this general programming/technical question clearly and concisely. If relevant, briefly mention how Sarang K has experience or skills in this or related fields.

User Question: "${message}"
`;
        } else {
            // About Sarang Response Node (RAG)
            const chatHistoryStr = history && history.length > 0 
                ? history.map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.text}`).join('\n')
                : 'No prior chat history.';

            finalPrompt = `
${SARANG_CONTEXT}

Conversation History:
${chatHistoryStr}

User Question: "${message}"

Instruction: Provide a professional, detailed, yet concise answer based strictly on Sarang's portfolio details. Do not make up any details that are not in the context. If you don't know the answer or it isn't listed, state that the information isn't specified in his profile.
`;
        }

        const answer = await callGemini(apiKey, finalPrompt);
        res.status(200).json({ response: answer });

    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Failed to process message' });
    }
}

// Helper function to call Gemini API directly without external packages
async function callGemini(apiKey, prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const payload = {
        contents: [
            {
                parts: [
                    { text: prompt }
                ]
            }
        ],
        generationConfig: {
            temperature: 0.2, // Low temp for factual consistency
            maxOutputTokens: 800
        }
    };

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Gemini API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
        return data.candidates[0].content.parts[0].text;
    } else {
        throw new Error('Invalid response structure from Gemini API');
    }
}
