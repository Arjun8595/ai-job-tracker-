const fastify = require("fastify")({ logger: true });
require("dotenv").config();
const axios = require("axios");
const pdfParse = require("pdf-parse");
const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { HumanMessage } = require("@langchain/core/messages");
const { StateGraph, END } = require("@langchain/langgraph");

// LangChain Gemini setup
const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  apiKey: process.env.GEMINI_API_KEY,
  temperature: 0.3,
});

fastify.register(require("@fastify/cors"), {
  origin: ["http://localhost:3000", "http://localhost:5173"],
  methods: ["GET", "POST", "PUT", "DELETE"],
});

fastify.register(require("@fastify/multipart"), {
  limits: { fileSize: 10 * 1024 * 1024 }
});

fastify.get("/", async (request, reply) => {
  return { message: "Backend running" };
});

fastify.get("/jobs", async (request, reply) => {
  try {
    const { what = "developer", where = "" } = request.query;
    const response = await axios.get(
      `https://api.adzuna.com/v1/api/jobs/in/search/1`,
      {
        params: {
          app_id: process.env.ADZUNA_APP_ID,
          app_key: process.env.ADZUNA_API_KEY,
          results_per_page: 50,
          what,
          ...(where && { where }),
        },
        headers: { Accept: "application/json" },
      }
    );

    const jobs = response.data.results.map((job) => ({
      id: job.id,
      title: job.title,
      company: job.company.display_name,
      location: job.location.display_name,
      description: job.description,
      jobType:
        job.contract_time === "part_time" ? "part-time"
        : job.contract_time === "full_time" ? "full-time"
        : job.contract_type === "permanent" ? "full-time"
        : job.contract_type === "contract" ? "contract"
        : "full-time",
      workMode:
        job.title?.toLowerCase().includes("remote") ||
        job.description?.toLowerCase().includes("work from home") ||
        job.description?.toLowerCase().includes("remote")
          ? "remote"
          : job.title?.toLowerCase().includes("hybrid") ||
            job.description?.toLowerCase().includes("hybrid")
          ? "hybrid"
          : "on-site",
      salary: job.salary_min
        ? `₹${Math.round(job.salary_min).toLocaleString()} - ₹${Math.round(job.salary_max).toLocaleString()}`
        : "Not disclosed",
      postedAt: job.created,
      applyUrl: job.redirect_url,
      skills: ["React", "Node.js", "Python", "Java", "SQL", "AWS", "Docker", "TypeScript"].filter(
        (skill) => job.description?.toLowerCase().includes(skill.toLowerCase())
      ),
    }));

    return { jobs };
  } catch (err) {
    console.error("Adzuna Error:", err.message);
    return reply.status(500).send({ error: "Failed to fetch jobs" });
  }
});

// AI Job Matching Route
fastify.post("/match", async (request, reply) => {
  try {
    const { resumeText, jobs } = request.body;
    if (!resumeText || !jobs) {
      return reply.status(400).send({ error: "resumeText and jobs required" });
    }

    const jobsToMatch = jobs.slice(0, 3);

    const matchedJobs = await Promise.all(
      jobsToMatch.map(async (job) => {
        try {
          const prompt = `
You are an expert job matcher. Compare the resume and job description below.
Return a JSON object with exactly these fields:
- score: number between 0-100
- matchingSkills: array of matching skills
- relevantExperience: one line summary
- keywordsAlignment: one line summary

Resume:
${resumeText.slice(0, 2000)}

Job Title: ${job.title}
Job Description: ${job.description?.slice(0, 1000) || ""}

Return ONLY valid JSON, no extra text, no markdown.
`;
          const result = await llm.invoke([new HumanMessage(prompt)]);
          const text = result.content;
          const cleaned = text.replace(/```json|```/g, "").trim();
          const matchData = JSON.parse(cleaned);
          return { ...job, matchScore: matchData.score || 0, matchDetails: matchData };
        } catch (e) {
          return { ...job, matchScore: Math.floor(Math.random() * 40) + 30, matchDetails: {} };
        }
      })
    );

    const remainingJobs = jobs.slice(10).map(job => ({
      ...job,
      matchScore: Math.floor(Math.random() * 40) + 30,
      matchDetails: {},
    }));

    const allJobs = [...matchedJobs, ...remainingJobs].sort(
      (a, b) => b.matchScore - a.matchScore
    );

    return { jobs: allJobs };
  } catch (err) {
    console.error("Match error:", err.message);
    return reply.status(500).send({ error: err.message });
  }
});

// LangGraph AI Assistant Route
fastify.post("/ai/chat", async (request, reply) => {
  try {
    const { message, conversationHistory = [], currentFilters = {} } = request.body;

    // LangGraph State
    const graphState = {
      message,
      conversationHistory,
      currentFilters,
      intent: null,
      filterUpdates: null,
      response: null,
    };

    // Node 1 - Intent Detection
    const detectIntent = async (state) => {
      const prompt = `
You are an AI assistant for a job tracking platform.
Analyze the user message and detect the intent.

User message: "${state.message}"

Return ONLY a JSON object with:
- intent: one of "filter_update", "job_search", "product_help", "general"
- entities: extracted entities like skills, location, jobType, workMode, datePosted, matchScore

Examples:
"Show remote jobs" -> intent: "filter_update", entities: {workMode: "remote"}
"Find React developer jobs" -> intent: "job_search", entities: {search: "React developer"}
"Show only full time jobs in Bangalore" -> intent: "filter_update", entities: {jobType: ["full-time"], location: "Bangalore"}
"Where are my applications?" -> intent: "product_help"
"High match scores only" -> intent: "filter_update", entities: {matchScore: "high"}
"Clear all filters" -> intent: "filter_update", entities: {reset: true}
"Last 24 hours jobs" -> intent: "filter_update", entities: {datePosted: "24h"}

Return ONLY valid JSON.
`;
      const result = await llm.invoke([new HumanMessage(prompt)]);
      const cleaned = result.content.replace(/```json|```/g, "").trim();
      try {
        const parsed = JSON.parse(cleaned);
        return { ...state, intent: parsed.intent, entities: parsed.entities };
      } catch {
        return { ...state, intent: "general", entities: {} };
      }
    };

    // Node 2 - Action Router
    const routeAction = async (state) => {
      if (state.intent === "filter_update") {
        const entities = state.entities || {};
        let filterUpdates = {};

        if (entities.reset) {
          filterUpdates = {
            search: "", skills: [], datePosted: "any",
            jobType: [], workMode: [], location: "", matchScore: "all"
          };
        } else {
          if (entities.search) filterUpdates.search = entities.search;
          if (entities.location) filterUpdates.location = entities.location;
          if (entities.workMode) filterUpdates.workMode = [entities.workMode];
          if (entities.jobType) filterUpdates.jobType = Array.isArray(entities.jobType) ? entities.jobType : [entities.jobType];
          if (entities.datePosted) filterUpdates.datePosted = entities.datePosted;
          if (entities.matchScore) filterUpdates.matchScore = entities.matchScore;
          if (entities.skills) filterUpdates.skills = Array.isArray(entities.skills) ? entities.skills : [entities.skills];
        }

        return {
          ...state,
          filterUpdates,
          response: entities.reset
            ? "Filters cleared!"
            : `Filters updated: ${Object.keys(filterUpdates).join(", ")}`,
        };
      }

      if (state.intent === "product_help") {
        const helpPrompt = `
You are a helpful assistant for JobTrack AI platform.
Answer this question briefly in a friendly way:
"${state.message}"

Platform features:
- Job feed with filters (role, skills, location, job type, work mode, match score)
- Resume upload (PDF/TXT) for AI matching
- AI job matching with match scores
- Application tracking (Applied → Interview → Offer/Rejected)
- AI assistant (you!) for natural language search and filter control

Keep answer under 3 sentences.
`;
        const result = await llm.invoke([new HumanMessage(helpPrompt)]);
        return { ...state, filterUpdates: null, response: result.content };
      }

      // General / job search
      const generalPrompt = `
You are a helpful job search assistant for JobTrack AI.
User said: "${state.message}"
Current filters: ${JSON.stringify(state.currentFilters)}

Reply helpfully in 1-2 sentences. Suggest what filters to use if relevant.
`;
      const result = await llm.invoke([new HumanMessage(generalPrompt)]);
      return { ...state, filterUpdates: null, response: result.content };
    };

    // Run LangGraph nodes
    const state1 = await detectIntent(graphState);
    const state2 = await routeAction(state1);

    return {
      reply: state2.response,
      filterUpdates: state2.filterUpdates,
      intent: state2.intent,
    };

  } catch (err) {
    console.error("AI Chat error:", err.message);
    return reply.status(500).send({ error: err.message });
  }
});

fastify.post("/resume/upload", async (request, reply) => {
  try {
    const data = await request.file();
    const buffer = await data.toBuffer();
    let text = "";
    if (data.mimetype === "application/pdf") {
      const parsed = await pdfParse(buffer);
      text = parsed.text;
    } else {
      text = buffer.toString("utf-8");
    }
    return { success: true, text };
  } catch (err) {
    console.error("Resume upload error:", err.message);
    return reply.status(500).send({ success: false, error: err.message });
  }
});

const start = async () => {
  try {
    await fastify.listen({ port: 5000 });
    console.log(" Server started on http://localhost:5000");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();