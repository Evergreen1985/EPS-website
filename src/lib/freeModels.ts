export const FREE_MODELS = [
  { id:"llama-3.3-70b-versatile", provider:"groq", name:"Llama 3.3 70B", badge:"Best Quality",  icon:"🦙", setupUrl:"https://console.groq.com" },
  { id:"llama-3.1-8b-instant",    provider:"groq", name:"Llama 3.1 8B",  badge:"Fastest",       icon:"⚡", setupUrl:"https://console.groq.com" },
  { id:"llama-3.1-70b-versatile", provider:"groq", name:"Llama 3.1 70B", badge:"Long Context",  icon:"🔀", setupUrl:"https://console.groq.com" },
  { id:"llama3-70b-8192",         provider:"groq", name:"Llama 3 70B",   badge:"Balanced",      icon:"💎", setupUrl:"https://console.groq.com" },
  { id:"llama3-8b-8192",          provider:"groq", name:"Llama 3 8B",    badge:"Compact",       icon:"🔥", setupUrl:"https://console.groq.com" },
] as const;

export type FreeModel = typeof FREE_MODELS[number];
