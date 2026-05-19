export const FREE_MODELS = [
  { id:"llama-3.3-70b-versatile",                    provider:"groq", name:"Llama 3.3 70B",   badge:"Best Quality", icon:"🦙", setupUrl:"https://console.groq.com" },
  { id:"meta-llama/llama-4-scout-17b-16e-instruct",  provider:"groq", name:"Llama 4 Scout",   badge:"Newest",       icon:"🚀", setupUrl:"https://console.groq.com" },
  { id:"llama-3.1-8b-instant",                       provider:"groq", name:"Llama 3.1 8B",    badge:"Fastest",      icon:"⚡", setupUrl:"https://console.groq.com" },
] as const;

export type FreeModel = typeof FREE_MODELS[number];
