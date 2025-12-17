import { Experience, Project, Skill } from './types';

export const CV_DATA = {
  name: "Krzysztof Wende",
  title: "Software Engineer & Distributed Systems Architect",
  contact: {
    phone: "+48 533-30-20-90",
    email: "wende@hey.com",
    linkedin: "krzysztofwende",
    github: "wende",
    location: "Kraków, Poland"
  },
  tldr: [
    "Functional programming enthusiast with 10 years of commercial experience. Four of which in executive roles and six in developer roles.",
    "Creator of Elchemy – a type-safe programming language for Erlang VM, heavily inspired by Elm and Haskell.",
    "Forbes 25 under 25 awardee in New Technology category.",
    "Founder of CloudCab LLC, Man La Mode LLC and Neon Tree LTD software house."
  ],
  experience: [
    {
      role: "AI Infrastructure & Elixir Developer",
      company: "Thenvoi",
      location: "Remote",
      period: "2025-2026",
      description: "Worked on core infrastructure for the agentic mesh platform - a secure communication layer enabling AI agents to dynamically discover, collaborate, and orchestrate tasks across teams and systems.",
      responsibilities: [
        "Contributed to AI orchestration and inter-agent communication infrastructure",
        "Worked on centralized agent management and human-agent collaboration features"
      ]
    },
    {
      role: "Elixir Developer",
      company: "Software Mansion",
      location: "Poland (Remote)",
      period: "2024-2025",
      description: "Contributed to Membrane Framework, an open-source multimedia streaming framework for Elixir, enabling real-time audio and video processing with support for WebRTC, HLS, RTMP, and various codecs.",
      responsibilities: [
        "Developed observability tooling for the Membrane multimedia processing framework"
      ]
    },
    {
      role: "Elixir Developer",
      company: "Confly z o.o",
      location: "Poland (Remote)",
      period: "2021-2023",
      description: "Designed and built a telecom platform with VoIP and SMS support, enabling instantaneous acquisition of new numbers while ensuring compliance with Polish telecommunication regulations.",
      responsibilities: [
        "Designed and developed an in-house Event Sourcing system",
        "Designed and developed a telecommunication protocol responsible for handling VoIP calls"
      ]
    },
    {
      role: "Elixir Developer",
      company: "Inflowmatix Ltd",
      location: "Southampton, UK (Remote)",
      period: "2016-2021",
      description: "One of the first three developers to lay the foundation for the InflowNet system, which is now used in over 20 countries by major water companies to deliver real-time telemetry data, preventing outages, bursts, and leakages.",
      responsibilities: [
        "Designed a fully distributed architecture in Elixir capable of processing gigabytes of data per second with 99.999% annual availability and consistency.",
        "Managed databases including InfluxDB, Mnesia, Timescale, and PostgresDB.",
        "Implemented event-sourced architecture.",
        "Designed a cluster of over 20 machines in the AWS Cloud."
      ]
    },
    {
      role: "CEO",
      company: "Neon Tree Solutions Ltd",
      location: "Kraków, London",
      period: "2014-2021",
      description: "Led a team of 3-5 in a software house responsible for developing cutting-edge proofs of concept for contractors. Responsible for the first prototype of the Erlang Performance Lab project.",
      responsibilities: [
        "Technologies used: Erlang/Elixir, Scala, React.js, ReasonML"
      ]
    },
    {
      role: "CTO / Co-founder",
      company: "Man La Mode LLC",
      location: "Kraków & Ann Arbor, MI",
      period: "2015-2016",
      description: "Developed and oversaw a novel affiliate network allowing users to purchase fashion goods directly from the source at significant discounts.",
      responsibilities: [
        "Developed the back-end in Elixir.",
        "Oversaw front-end development in React.js.",
        "Engaged with investors."
      ]
    },
    {
      role: "CTO / Co-founder",
      company: "CloudCab LLC",
      location: "New York (Remote)",
      period: "2013-2015",
      description: "Developed a modern dispatch system for a variety of companies, including ride-hailing, medical material, and cargo transportation.",
      responsibilities: [
        "Developed and oversaw both customer and driver apps in Java for Android.",
        "Developed the back-end in Node.js.",
        "Oversaw the front-end fleet dispatch administrative panel.",
        "Led a team of four."
      ]
    }
  ] as Experience[],
  portfolio: [
    {
      name: "Cicada",
      description: "Code Intelligence for AI Assistants. Token-efficient code indexing via MCP for Elixir, Python, and more.",
      stats: "50% faster AI responses, 70% fewer tokens",
      link: "https://github.com/wende/cicada"
    },
    {
      name: "Elchemy",
      description: "Strongly typed Erlang VM Language. Heavily inspired by Elm and Haskell.",
      stats: "Over 1000 Stars on Github",
      link: "https://github.com/wende/elchemy"
    },
    {
      name: "Autocomplete Elixir",
      description: "#1 Most popular Elixir and Erlang plugin for Atom Editor.",
      stats: "Over 60,000 downloads"
    },
    {
      name: "Forbes 25 under 25",
      description: "Awardee in New Technology Category",
      stats: "Forbes 2020"
    },
    {
      name: "Stack Overflow",
      description: "11 years active contribution.",
      stats: "Visited on 1500+ days"
    },
    {
      name: "Quora",
      description: "Active knowledge sharing.",
      stats: "Over 350,000 answer reads"
    }
  ] as Project[],
  skills: [
    {
      category: "AI & Agents",
      items: ["Agentic Architectures", "AI-Assisted Development", "Code Intelligence Tooling", "LLM Integration", "Prompt Engineering", "Local Model Deployment"]
    },
    {
      category: "AI Infrastructure",
      items: ["Model Training", "Data Scraping & Sanitization", "ComfyUI Pipelines", "Automatic1111", "N8n Automation", "MCP Servers"]
    },
    {
      category: "Core Technologies",
      items: ["Elixir", "Erlang", "TypeScript", "Distributed Systems", "Event-Sourcing"]
    }
  ] as Skill[],
  hobbies: ["Fusion Jazz", "Percussion/Drums", "Nutrition", "Psychology", "Coffee", "Indie Games", "Traveling"]
};
